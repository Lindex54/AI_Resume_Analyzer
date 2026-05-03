import { cn } from "~/lib/utils";

const ATS = ({
                 score,
                 suggestions,
             }: {
    score: number;
    suggestions: { type: "good" | "improve"; tip: string }[];
}) => {
    return (
        <div
            className={cn(
                "rounded-2xl w-full p-8 flex flex-col gap-4 border shadow-sm",
                score > 69
                    ? "bg-green-50 border-green-300"
                    : score > 49
                        ? "bg-yellow-50 border-yellow-300"
                        : "bg-red-50 border-red-300"
            )}
        >
            <div className="flex flex-row gap-4 items-center">
                <img
                    src={
                        score > 69
                            ? "/icons/ats-good.svg"
                            : score > 49
                                ? "/icons/ats-warning.svg"
                                : "/icons/ats-bad.svg"
                    }
                    alt="ATS"
                    className="w-10 h-10"
                />
                <p className="text-2xl font-semibold text-slate-950">ATS Score - {score}/100</p>
            </div>
            <div className="flex flex-col gap-2">
                <p className="font-medium text-xl text-slate-900">
                    How well does your resume pass through Applicant Tracking Systems?
                </p>
                <p className="text-lg text-slate-700">
                    Your resume was scanned like an employer would. Here's how it
                    performed:
                </p>
                {suggestions.map((suggestion, index) => (
                    <div className="flex flex-row gap-3 items-start" key={index}>
                        <img
                            src={
                                suggestion.type === "good"
                                    ? "/icons/check.svg"
                                    : "/icons/warning.svg"
                            }
                            alt="ATS"
                            className="w-4 h-4 mt-1.5 shrink-0"
                        />
                        <p className="text-lg text-slate-700">{suggestion.tip}</p>
                    </div>
                ))}
                <p className="text-lg text-slate-700">
                    Want a better score? Improve your resume by applying the suggestions
                    listed below.
                </p>
            </div>
        </div>
    );
};

export default ATS;
