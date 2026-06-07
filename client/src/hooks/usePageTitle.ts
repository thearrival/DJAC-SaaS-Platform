import { useEffect } from "react";

const BASE_TITLE = "DJAC";

/**
 * Sets the browser tab title for the current page.
 * Format: "Page Name | DJAC"  (or just "DJAC" when title is empty)
 */
export function usePageTitle(title: string): void {
    useEffect(() => {
        document.title = title ? `${title} | ${BASE_TITLE}` : BASE_TITLE;
        return () => {
            document.title = BASE_TITLE;
        };
    }, [title]);
}
