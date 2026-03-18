import {type FormEvent, useState} from "react";
import Navbar from "~/components/Navbar";
import FileUploader from "~/components/FileUploader";
import {usePuterStore} from "~/lib/puter";
import {useNavigate} from "react-router";
import {convertPdfToImage} from "~/lib/pdf2img";
import {generateUUID} from "~/lib/utils";
import {prepareInstructions} from "../../constants";

const ANALYZE_TIMEOUT_MS = 120000;

const withTimeout = async <T,>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
    return Promise.race([
        promise,
        new Promise<T>((_, reject) =>
            setTimeout(() => reject(new Error(`Analysis timed out after ${timeoutMs / 1000}s`)), timeoutMs)
        ),
    ]);
};

const extractTextContent = (content: unknown): string => {
    if (typeof content === "string") return content;
    if (!Array.isArray(content)) return "";

    return content
        .map((part) => {
            if (typeof part === "string") return part;
            if (part && typeof part === "object" && "text" in part) {
                const text = (part as {text?: unknown}).text;
                return typeof text === "string" ? text : "";
            }
            return "";
        })
        .join("\n")
        .trim();
};

const parseFeedbackFromResponse = (response: AIResponse): Feedback => {
    const rawText = extractTextContent(response?.message?.content).trim();
    if (!rawText) throw new Error("AI returned an empty response.");

    const cleaned = rawText
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();

    try {
        return JSON.parse(cleaned) as Feedback;
    } catch {
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("AI response was not valid JSON.");
        return JSON.parse(jsonMatch[0]) as Feedback;
    }
};

const isValidFeedback = (feedback: unknown): feedback is Feedback => {
    if (!feedback || typeof feedback !== "object") return false;
    const value = feedback as Partial<Feedback>;
    return (
        typeof value.overallScore === "number" &&
        !!value.ATS &&
        typeof value.ATS.score === "number" &&
        !!value.toneAndStyle &&
        typeof value.toneAndStyle.score === "number" &&
        !!value.content &&
        typeof value.content.score === "number" &&
        !!value.structure &&
        typeof value.structure.score === "number" &&
        !!value.skills &&
        typeof value.skills.score === "number"
    );
};

const Upload = () => {
    const {isLoading, auth, fs, kv, ai} = usePuterStore();
    const navigate = useNavigate();
    const [isProcessing, setIsProcessing] = useState(false);
    const [statusText, setStatusText] = useState("");
    const [file, setFile] = useState<File | null>(null);


    const handleFileSelect = (file: File | null) => {
        // console.log("File Selected",file);
        setFile(file);

    }

    const handleAnalyze = async ({companyName, jobTitle, jobDescription, file} : {companyName: string, jobTitle: string, jobDescription: string, file: File}) => {
        setIsProcessing(true);
        try {
            setStatusText("Uploading file...");
            const uploadedFile = await fs.upload([file]);
            if(!uploadedFile) throw new Error('Failed to upload file');

            setStatusText('Converting to image...');
            const imageFile = await convertPdfToImage(file);
            if(!imageFile.file) throw new Error('Failed to convert PDF to image');

            setStatusText('Uploading the image...');
            const uploadedImage = await fs.upload([imageFile.file]);
            if(!uploadedImage) throw new Error('Failed to upload image');

            setStatusText('Analyzing...');
            const response = await withTimeout(
                ai.feedback(
                    uploadedFile.path,
                    prepareInstructions({jobTitle, jobDescription})
                ),
                ANALYZE_TIMEOUT_MS
            );

            if (!response) throw new Error('Failed to analyze resume');
            const parsedFeedback = parseFeedbackFromResponse(response);
            if (!isValidFeedback(parsedFeedback)) {
                throw new Error("AI returned an invalid feedback structure.");
            }

            setStatusText('Saving analysis...');
            const uuid = generateUUID();
            const data = {
                id: uuid,
                resumePath: uploadedFile.path,
                imagePath: uploadedImage.path,
                companyName,
                jobTitle,
                jobDescription,
                feedback: parsedFeedback,
            };

            await kv.set(`resume:${uuid}`, JSON.stringify(data));
            setStatusText('Analyzing complete, redirecting...');
            navigate(`/resume/${uuid}`);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Resume analysis failed.";
            setStatusText(`Error: ${errorMessage}`);
            setIsProcessing(false);
        }
    }

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget.closest("form");
        if(!form) return;
        const formData = new FormData(form);

        const companyName = formData.get("company-name") as string;
        const jobTitle = formData.get("job-title") as string;
        const jobDescription = formData.get("job-description") as string;

        if(!file) return;

        handleAnalyze({companyName, jobTitle, jobDescription, file})

    }

    return (
        <main className="bg-[url('/images/bg-main.svg')] bg-cover ">
            <Navbar />
            <section className="main-section">
                <div className="page-heading py-16">
                    <h1>Smart feedback for your dream job</h1>
                    {isProcessing?(
                            <>
                                <h2>{statusText}</h2>
                                <img src="/images/resume-scan.gif" className="w-full" />
                            </>
                        ): (
                            <h2>Drop your resume for an ATS score and improvement tips</h2>
                    )}
                    {!isProcessing && statusText.startsWith("Error:") && (
                        <p className="text-red-600 text-lg font-semibold mt-4">{statusText}</p>
                    )}
                    {!isProcessing && (
                        <form id ="upload-form" onSubmit={handleSubmit} className="flex flex-col gap-4 mt-8">
                            <div className="form-div">
                                <label htmlFor="company-name">Company Name</label>
                                <input type="text" name="company-name" placeholder="Company Name" id="company-name" />
                            </div>
                            <div className="form-div">
                                <label htmlFor="job-title">Job Title</label>
                                <input type="text" name="job-title" placeholder="Job Title" id="job-title" />
                            </div>
                            <div className="form-div">
                                <label htmlFor="job-description">Job Description</label>
                                <textarea rows={5} name="job-description" placeholder="Job Description" id="job-description" />
                            </div>
                            <div className="form-div">
                                <label htmlFor="uploader">Upload Resume</label>
                                <FileUploader onFileSelect={handleFileSelect} />
                            </div>
                            <button className="primary-button" type="submit">Analyze Resume</button>
                        </form>
                    )}
                </div>
            </section>
        </main>
    )
}
export default Upload
