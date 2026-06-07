import { useLocale } from "@/contexts/useLocale";
import { useTheme } from "@/contexts/useTheme";
import { Moon, Sun } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function ThemeToggle() {
    const { theme, toggleTheme, switchable } = useTheme();
    const { t } = useLocale();
    const [animating, setAnimating] = useState(false);
    const prevTheme = useRef(theme);

    useEffect(() => {
        if (prevTheme.current !== theme) {
            prevTheme.current = theme;
            setAnimating(true);
            const id = setTimeout(() => setAnimating(false), 280);
            return () => clearTimeout(id);
        }
    }, [theme]);

    if (!switchable || !toggleTheme) return null;

    const isDark = theme === "dark";
    const nextLabel = isDark ? t("theme.light", "Light") : t("theme.dark", "Dark");

    return (
        <button
            type="button"
            onClick={toggleTheme}
            aria-label={`${t("theme.switchTo", "Switch to")} ${nextLabel}`}
            title={`${t("theme.switchTo", "Switch to")} ${nextLabel}`}
            className={
                "relative inline-flex h-9 w-9 items-center justify-center rounded-full " +
                "border border-border/60 bg-background shadow-sm " +
                "hover:bg-accent hover:border-border " +
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 " +
                "overflow-hidden"
            }
        >
            {/* Sun icon — visible in dark mode, click will go to light */}
            <span
                className={
                    "absolute inset-0 flex items-center justify-center " +
                    (isDark
                        ? (animating ? "djac-theme-icon-enter" : "")
                        : "pointer-events-none select-none opacity-0")
                }
                aria-hidden={!isDark}
            >
                <Sun className="h-[18px] w-[18px] text-amber-400" strokeWidth={1.75} />
            </span>

            {/* Moon icon — visible in light mode, click will go to dark */}
            <span
                className={
                    "absolute inset-0 flex items-center justify-center " +
                    (!isDark
                        ? (animating ? "djac-theme-icon-enter" : "")
                        : "pointer-events-none select-none opacity-0")
                }
                aria-hidden={isDark}
            >
                <Moon className="h-[18px] w-[18px] text-primary" strokeWidth={1.75} />
            </span>
        </button>
    );
}
