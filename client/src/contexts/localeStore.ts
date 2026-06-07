import { createContext } from "react";
import type { LocaleContextValue } from "./localeTypes";

export const LocaleContext = createContext<LocaleContextValue | null>(null);
