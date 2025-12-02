import ScoreGauge from "~/components/ScoreGauge";

const Category = ({title, score}: {title: string, score : number}) => {
    return (
        <div className="resume-summary">
            {title} - {score}
        </div>
    )
}

const Summary = ({feedback} : {feedback : Feedback} ) => {
    return (
        <div className="bg-white rounded-2xl shadow-md w-full">
            <div className="flex flex-row items-center p-4 gap-8">
                <ScoreGauge score={feedback.overallScore} />

                <div className="flex flex-col gap-2">
                    <h2 className="text-2xl font-bold">Your Resume Score</h2>
                    <p className="text-smtext-gray-500">
                        This score is calculated based on the variables listed below
                    </p>
                </div>
            </div>

        <Category title="Tone & Style" score={feedback.toneAndStyle.score}/>
        <Category title="Content" score={feedback.content.score}/>
        <Category title="Structure" score={feedback.structure.score}/>
        <Category title="Skills" score={feedback.skills.score}/>
        </div>
    )
}
export default Summary
