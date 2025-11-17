import React from 'react'
import {Link} from 'react-router'

const ResumeCard = ({resume: {id, companyName, jobTitle, feedback}}: {resume: Resume}) => {
    return (
        <Link to={`/resume/${id}`} className="resume-card animate-in fade-in duration-1000">
        <div className="flex flex-col gap-2">
            <h2 className="!text-black font-bold break-words">{companyName}</h2>
            <h3 className="text-lg break-words text-gray-500">{jobTitle}</h3>
        </div>
        </Link>
    )
}
export default ResumeCard
