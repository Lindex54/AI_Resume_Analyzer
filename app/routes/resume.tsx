import React, {useEffect, useState} from 'react'
import {Link, useNavigate, useParams} from "react-router";
import {usePuterStore} from "~/lib/puter";
import {normalizeFeedback} from "~/lib/feedback";
import Summary from "~/components/Summary";
import ATS from "~/components/ATS";
import Details from "~/components/Details";
import ThemeToggle from "~/components/ThemeToggle";

export const meta = () => (
    [
        {title: 'Resumind | Review'},
        {name: 'description', content: 'Detailed overview of your resume'}
    ])


const Resume = () => {
    const {auth, isLoading, fs, kv} = usePuterStore();
    const {id} = useParams();
    const [imageUrl, setImageUrl] = useState('');
    const [resumeUrl, setResumeUrl] = useState('');
    const [feedback, setFeedback] = useState<Feedback | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        if(!isLoading && !auth.isAuthenticated) navigate(`/auth?next=/resume/${id}`)
    }, [auth.isAuthenticated, id, isLoading, navigate]);


    useEffect(() => {
        const loadResume = async () => {
            try {
                const resume = await kv.get(`resume:${id}`);

                if(!resume) {
                    setLoadError("Resume analysis not found.");
                    return;
                }
                const data = JSON.parse(resume);

                const resumeBlob = await fs.read(data.resumePath);
                if(!resumeBlob) {
                    setLoadError("Could not load the resume file.");
                    return;
                }

                const pdfBlob = new Blob([resumeBlob], { type: 'application/pdf' });
                const resumeUrl = URL.createObjectURL(pdfBlob);
                setResumeUrl(resumeUrl);

                const imageBlob = await fs.read(data.imagePath);
                if(!imageBlob) {
                    setLoadError("Could not load the preview image.");
                    return;
                }

                const imageUrl = URL.createObjectURL(imageBlob);
                setImageUrl(imageUrl);

                const normalizedFeedback = normalizeFeedback(data.feedback);
                if (!normalizedFeedback) {
                    setLoadError("Analysis data is missing or invalid.");
                    return;
                }

                setFeedback(normalizedFeedback);
                setLoadError(null);
                console.log({resumeUrl, imageUrl, feedback: normalizedFeedback});
            } catch {
                setLoadError("Failed to load resume analysis.");
            }
        }

        loadResume();
    }, [id]);

    return (
        <main className="!pt-0 app-bg">
            <nav className="resume-nav">
                <Link to="/" className="back-button">
                    <img src="/icons/back.svg" alt="logo" className="w-2.5 h-2.5"/>
                    <span className="text-sm font-semibold">Back to Homepage</span>
                </Link>
                <ThemeToggle />
            </nav>
            <div className="flex flex-row w-full max-lg:flex-col-reverse">
                <section className="feedback-section gradient-border min-h-[60vh] lg:!w-[56%] lg:min-h-[calc(100vh-73px)] lg:sticky lg:top-[73px] items-center justify-start">
                    {imageUrl && resumeUrl && (
                        <div className="animate-in fade-in duration-500 gradient-border max-sm:m-0 w-full max-w-[1120px] lg:max-h-[calc(100vh-145px)] overflow-auto">
                            <a href={resumeUrl} target="_blank" rel="noopener noreferrer">
                                <img src={imageUrl} className="mx-auto w-full object-contain object-top rounded-2xl"
                                title="resume"
                                />
                            </a>
                        </div>
                    )}

                </section>
                <section className="feedback-section lg:!w-[44%]">
                    <h2 className="text-4xl font-bold text-[var(--text)]">Resume Review</h2>
                    {loadError ? (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mt-4">
                            <p className="text-lg text-red-700">{loadError}</p>
                        </div>
                    ) : feedback ? (
                        <div className="flex flex-col gap-8 animate-in fade-in duration-500">
                            <Summary feedback={feedback} />
                            <ATS score={feedback.ATS.score || 0} suggestions={feedback.ATS.tips || []} />
                            <Details feedback={feedback} />
                        </div>
                    ): (
                        <img src="/images/resume-scan-2.gif" className="w-full max-w-[220px]"/>
                    )}
                </section>
            </div>

        </main>
    )
}
export default Resume
