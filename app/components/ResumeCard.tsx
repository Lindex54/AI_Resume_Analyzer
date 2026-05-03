import React, {useEffect, useState} from 'react'
import {Link} from 'react-router'
import ScoreCircle from "~/components/ScoreCircle";
import {usePuterStore} from "~/lib/puter";

const ResumeCard = ({resume: {id, companyName, jobTitle, feedback, imagePath}}: {resume: Resume}) => {
    const {auth, fs} = usePuterStore();
    const [resumeUrl, setResumeUrl] = useState('');

    useEffect(() => {
        const loadResume = async () => {
            const blob = await fs.read(imagePath);
            if(!blob) return;
            let url = URL.createObjectURL(blob);
            setResumeUrl(url);
        }

        loadResume();
    }, [imagePath]);

    return (
        <Link to={`/resume/${id}`} className="resume-card animate-in fade-in duration-500">
            <div className="resume-card-header">
                <div className="flex flex-col gap-2">
                    {companyName && <h2 className="font-bold break-words">{companyName}</h2>}
                    { jobTitle && <h3 className="text-lg break-words text-muted">{jobTitle}</h3>}
                    {!companyName && !jobTitle && <h2 className="font-bold">Resume</h2>}
                </div>
                <div className="flex-shrink-0">
                    <ScoreCircle score={feedback.overallScore} />
                </div>
            </div>
            { resumeUrl && (
            <div className="gradient-border animate-in fade-in duration-500">
                <div className="w-full h-full">
                    <img
                        src={resumeUrl}
                        alt="resume"
                        className="w-full h-[280px] sm:h-[320px] object-cover object-top rounded-xl"/>
                </div>
            </div> )}

        </Link>
    )
}
export default ResumeCard
