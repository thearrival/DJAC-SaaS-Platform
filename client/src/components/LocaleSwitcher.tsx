import { useLocale } from "@/contexts/useLocale";
import { useIsMobile } from "@/hooks/useMobile";
import { Check, Languages } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const LOCALES = [
    { value: "en", flag: "🇬🇧", short: "EN", label: "English" },
    { value: "ar", flag: "🇸🇦", short: "AR", label: "العربية" },
    { value: "zh", flag: "🇨🇳", short: "ZH", label: "中文" },
] as const;

export function LocaleSwitcher() {
    const { locale, setLocale } = useLocale();
    const isMobile = useIsMobile();
    const activeLocale = LOCALES.find((item) => item.value === locale) ?? LOCALES[0];

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    type="button"
                    className="djac-locale-switcher inline-flex h-9 max-w-full items-center gap-2 rounded-md border border-border bg-card px-2.5 text-xs font-medium text-foreground shadow-sm transition-colors hover:bg-accent"
                    aria-label={`Selected language: ${activeLocale.label}`}
                    title={activeLocale.label}
                >
                    <Languages className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-sm leading-none">{activeLocale.flag}</span>
                    <span className="max-w-[7rem] truncate">{isMobile ? activeLocale.short : activeLocale.label}</span>
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[11rem]">
                {LOCALES.map((item) => (
                    <DropdownMenuItem
                        key={item.value}
                        onClick={() => setLocale(item.value)}
                        className="flex cursor-pointer items-center justify-between gap-3"
                    >
                        <span className="flex min-w-0 items-center gap-2">
                            <span className="text-sm leading-none">{item.flag}</span>
                            <span className="truncate text-sm">{item.label}</span>
                        </span>
                        {locale === item.value ? <Check className="h-4 w-4 text-primary" /> : null}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
