import {type FormEvent, useState} from "react";
import Navbar from "~/components/Navbar";
import FileUploader from "~/components/FileUploader";
import {usePuterStore} from "~/lib/puter";
import {useNavigate} from "react-router";
import {convertPdfToImage} from "~/lib/pdf2img";
import {generateUUID} from "~/lib/utils";
import {normalizeFeedback} from "~/lib/feedback";
import {prepareInstructions} from "../../constants";

const ANALYZE_TIMEOUT_MS = 45000;

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

const isAllZeroFeedback = (feedback: Feedback): boolean => {
    return (
        feedback.overallScore === 0 &&
        feedback.ATS.score === 0 &&
        feedback.toneAndStyle.score === 0 &&
        feedback.content.score === 0 &&
        feedback.structure.score === 0 &&
        feedback.skills.score === 0
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

            const baseInstructions = `${prepareInstructions({jobTitle, jobDescription})}
Use realistic ATS-style scoring based on resume quality.
Do not return all scores as zero unless the uploaded file is unreadable or blank.`;

            setStatusText("Analyzing...");
            const response = await withTimeout(
                ai.feedback(uploadedFile.path, baseInstructions),
                ANALYZE_TIMEOUT_MS
            );
            if (!response) throw new Error("Failed to analyze resume.");

            const parsedFeedback = parseFeedbackFromResponse(response);
            let normalizedFeedback = normalizeFeedback(parsedFeedback);

            if (!normalizedFeedback || isAllZeroFeedback(normalizedFeedback)) {
                setStatusText("Re-analyzing...");
                const retryResponse = await withTimeout(
                    ai.feedback(
                        uploadedFile.path,
                        `${baseInstructions}
Return meaningful section scores even when the resume is weak.`
                    ),
                    ANALYZE_TIMEOUT_MS
                );
                if (!retryResponse) throw new Error("Failed to analyze resume.");

                const retryParsedFeedback = parseFeedbackFromResponse(retryResponse);
                normalizedFeedback = normalizeFeedback(retryParsedFeedback);
            }

            if (!normalizedFeedback || isAllZeroFeedback(normalizedFeedback)) {
                throw new Error("AI returned invalid or all-zero feedback.");
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
                feedback: normalizedFeedback,
            };

            await kv.set(`resume:${uuid}`, JSON.stringify(data));
            setStatusText("Analysis complete, redirecting...");
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
        <main className="app-bg">
            <Navbar />
            <section className="main-section">
                <div className="page-heading py-12">
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
