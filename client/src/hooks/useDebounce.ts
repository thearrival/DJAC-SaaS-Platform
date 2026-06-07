import { useEffect, useRef, useState } from "react";

/**
 * Debounce a rapidly-changing value so downstream consumers (search queries,
 * tRPC calls, etc.) only see the stabilised value after `delay` ms of inactivity.
 *
 * @example
 * const [query, setQuery] = useState("");
 * const debouncedQuery = useDebounce(query, 300);
 * // debouncedQuery only updates 300ms after the user stops typing
 */
export function useDebounce<T>(value: T, delay = 300): T {
    const [debounced, setDebounced] = useState<T>(value);

    useEffect(() => {
        const id = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(id);
    }, [value, delay]);

    return debounced;
}

/**
 * Debounced callback — returns a stable function reference that only fires
 * `delay` ms after the last invocation.
 */
export function useDebouncedCallback<Args extends unknown[]>(
    fn: (...args: Args) => void,
    delay = 300,
): (...args: Args) => void {
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const fnRef = useRef(fn);
    fnRef.current = fn;

    return (...args: Args) => {
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => fnRef.current(...args), delay);
    };
}
