const clampScore = (value: number): number => {
    if (!Number.isFinite(value)) return 0;
    if (value < 0) return 0;
    if (value > 100) return 100;
    return Math.round(value);
};

const parseScore = (value: unknown): number | null => {
    if (typeof value === "number" && Number.isFinite(value)) {
        return value <= 10 ? value * 10 : value;
    }

    if (typeof value === "string") {
        const match = value.match(/-?\d+(\.\d+)?/);
        if (!match) return null;
        const parsed = Number(match[0]);
        if (!Number.isFinite(parsed)) return null;
        return parsed <= 10 ? parsed * 10 : parsed;
    }

    return null;
};

const pick = (obj: Record<string, unknown>, keys: string[]): unknown => {
    for (const key of keys) {
        if (key in obj && obj[key] !== undefined && obj[key] !== null) {
            return obj[key];
        }
    }
    return undefined;
};

const toTipType = (value: unknown): "good" | "improve" => {
    if (typeof value !== "string") return "improve";
    const lower = value.toLowerCase();
    if (lower.includes("good") || lower.includes("strength") || lower.includes("positive")) {
        return "good";
    }
    return "improve";
};

const normalizeAtsTips = (raw: unknown): { type: "good" | "improve"; tip: string }[] => {
    if (!Array.isArray(raw)) return [];

    return raw
        .map((tip) => {
            if (typeof tip === "string") {
                return { type: "improve" as const, tip: tip.trim() };
            }
            if (!tip || typeof tip !== "object") return null;

            const tipObj = tip as Record<string, unknown>;
            const tipText = String(
                pick(tipObj, ["tip", "title", "text", "suggestion", "message"]) ?? ""
            ).trim();
            if (!tipText) return null;

            return {
                type: toTipType(pick(tipObj, ["type", "kind", "sentiment"])),
                tip: tipText,
            };
        })
        .filter((item): item is { type: "good" | "improve"; tip: string } => !!item);
};

const normalizeDetailedTips = (
    raw: unknown
): { type: "good" | "improve"; tip: string; explanation: string }[] => {
    if (!Array.isArray(raw)) return [];

    return raw
        .map((tip) => {
            if (typeof tip === "string") {
                const text = tip.trim();
                if (!text) return null;
                return { type: "improve" as const, tip: text, explanation: text };
            }
            if (!tip || typeof tip !== "object") return null;

            const tipObj = tip as Record<string, unknown>;
            const title = String(
                pick(tipObj, ["tip", "title", "text", "suggestion", "message"]) ?? ""
            ).trim();
            const explanation = String(
                pick(tipObj, ["explanation", "details", "reason", "description"]) ?? title
            ).trim();

            if (!title) return null;

            return {
                type: toTipType(pick(tipObj, ["type", "kind", "sentiment"])),
                tip: title,
                explanation: explanation || title,
            };
        })
        .filter((item): item is { type: "good" | "improve"; tip: string; explanation: string } => !!item);
};

const normalizeCategory = (
    root: Record<string, unknown>,
    keys: string[]
): { score: number; tips: unknown[] } | null => {
    const rawCategory = pick(root, keys);
    if (!rawCategory || typeof rawCategory !== "object") return null;

    const categoryObj = rawCategory as Record<string, unknown>;
    const scoreRaw = pick(categoryObj, ["score", "rating", "value"]);
    const score = parseScore(scoreRaw);

    if (score === null) return null;

    const tipsRaw = pick(categoryObj, ["tips", "suggestions", "feedback", "items"]);
    const tips = Array.isArray(tipsRaw) ? tipsRaw : [];

    return {
        score: clampScore(score),
        tips,
    };
};

export const normalizeFeedback = (input: unknown): Feedback | null => {
    if (!input || typeof input !== "object") return null;

    const root = input as Record<string, unknown>;
    const feedbackRoot = (pick(root, ["feedback", "analysis", "result"]) ??
        root) as Record<string, unknown>;

    const ats = normalizeCategory(feedbackRoot, ["ATS", "ats", "atsScore"]);
    const tone = normalizeCategory(feedbackRoot, ["toneAndStyle", "tone_style", "toneStyle", "tone"]);
    const content = normalizeCategory(feedbackRoot, ["content", "contentQuality"]);
    const structure = normalizeCategory(feedbackRoot, ["structure", "format", "formatting"]);
    const skills = normalizeCategory(feedbackRoot, ["skills", "skillMatch", "technicalSkills"]);

    if (!ats || !tone || !content || !structure || !skills) {
        return null;
    }

    const overallRaw = pick(feedbackRoot, ["overallScore", "overall_score", "overall", "totalScore"]);
    const calculatedOverall = Math.round(
        (ats.score + tone.score + content.score + structure.score + skills.score) / 5
    );
    const overallParsed = parseScore(overallRaw);
    const overallScore = clampScore(overallParsed === null ? calculatedOverall : overallParsed);

    return {
        overallScore,
        ATS: {
            score: ats.score,
            tips: normalizeAtsTips(ats.tips),
        },
        toneAndStyle: {
            score: tone.score,
            tips: normalizeDetailedTips(tone.tips),
        },
        content: {
            score: content.score,
            tips: normalizeDetailedTips(content.tips),
        },
        structure: {
            score: structure.score,
            tips: normalizeDetailedTips(structure.tips),
        },
        skills: {
            score: skills.score,
            tips: normalizeDetailedTips(skills.tips),
        },
    };
};
