import { Loader2Icon } from "lucide-react";

import { cn } from "@/lib/utils";
import { useLocale } from "@/contexts/useLocale";

function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
  const { t } = useLocale();
  return (
    <Loader2Icon
      role="status"
      aria-label={t("common.loading", "Loading")}
      className={cn("size-4 animate-spin", className)}
      {...props}
    />
  );
}

export { Spinner };
