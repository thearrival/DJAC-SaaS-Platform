import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type QueryErrorPanelProps = {
    message: string;
    onRetry?: () => void;
    retryLabel?: string;
    className?: string;
    contentClassName?: string;
    messageClassName?: string;
    buttonClassName?: string;
    centered?: boolean;
};

export function QueryErrorPanel({
    message,
    onRetry,
    retryLabel = "Retry",
    className,
    contentClassName,
    messageClassName,
    buttonClassName,
    centered = false,
}: QueryErrorPanelProps) {
    return (
        <div className={cn("rounded-lg border border-destructive/40 bg-destructive/5 p-4", className)}>
            <div
                className={cn(
                    "flex flex-col gap-3",
                    centered ? "items-center text-center" : "sm:flex-row sm:items-center sm:justify-between",
                    contentClassName
                )}
            >
                <p className={cn("text-sm text-muted-foreground", messageClassName)}>{message}</p>
                {onRetry ? (
                    <Button
                        variant="outline"
                        size="sm"
                        className={cn("h-7 text-xs", buttonClassName)}
                        onClick={onRetry}
                    >
                        {retryLabel}
                    </Button>
                ) : null}
            </div>
        </div>
    );
}
