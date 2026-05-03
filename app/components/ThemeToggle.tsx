import { useEffect, useState } from "react";

const STORAGE_KEY = "resumind-theme";

type ThemeMode = "light" | "dark";

const getPreferredTheme = (): ThemeMode => {
    if (typeof window === "undefined") return "light";

    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "light" || saved === "dark") return saved;

    return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
};

const ThemeToggle = () => {
    const [theme, setTheme] = useState<ThemeMode>("light");

    useEffect(() => {
        const initial = getPreferredTheme();
        setTheme(initial);
        document.documentElement.classList.toggle("dark", initial === "dark");
    }, []);

    const toggleTheme = () => {
        const nextTheme: ThemeMode = theme === "light" ? "dark" : "light";
        setTheme(nextTheme);
        document.documentElement.classList.toggle("dark", nextTheme === "dark");
        window.localStorage.setItem(STORAGE_KEY, nextTheme);
    };

    const isDark = theme === "dark";

    return (
        <button
            type="button"
            onClick={toggleTheme}
            className="theme-toggle"
            aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
            title={`Switch to ${isDark ? "light" : "dark"} mode`}
        >
            <span className="theme-icon" aria-hidden>
                {isDark ? "SUN" : "MOON"}
            </span>
            <span>{isDark ? "Light" : "Dark"}</span>
        </button>
    );
};

export default ThemeToggle;
