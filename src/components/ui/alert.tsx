import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const alertVariants = cva("relative w-full rounded-xl border px-4 py-3 text-sm font-medium", {
  variants: {
    variant: {
      default: "bg-background text-foreground",
      destructive: "border-rose-200 bg-rose-50 text-rose-700",
      success: "border-emerald-200 bg-emerald-50 text-emerald-700",
      warning: "border-amber-200 bg-amber-50 text-amber-800",
      info: "border-blue-100 bg-blue-50 text-blue-800",
    },
  },
  defaultVariants: { variant: "default" },
});

const Alert = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>>(
  ({ className, variant, ...props }, ref) => (
    <div ref={ref} role={variant === "destructive" ? "alert" : "status"} className={cn(alertVariants({ variant }), className)} {...props} />
  )
);
Alert.displayName = "Alert";

export { Alert };
