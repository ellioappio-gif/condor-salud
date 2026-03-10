import { type HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

/* ─── Card Container ──────────────────────────────────────── */
const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("bg-white rounded-[4px] border border-border shadow-sm", className)}
      {...props}
    />
  ),
);
Card.displayName = "Card";

/* ─── Card Header ─────────────────────────────────────────── */
const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("px-5 py-4 border-b border-border", className)} {...props} />
  ),
);
CardHeader.displayName = "CardHeader";

/* ─── Card Title ──────────────────────────────────────────── */
const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn("text-sm font-bold text-ink", className)} {...props} />
  ),
);
CardTitle.displayName = "CardTitle";

/* ─── Card Content ────────────────────────────────────────── */
const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("px-5 py-4", className)} {...props} />
  ),
);
CardContent.displayName = "CardContent";

/* ─── Card Footer ─────────────────────────────────────────── */
const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("px-5 py-3 border-t border-border bg-surface/50", className)}
      {...props}
    />
  ),
);
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardTitle, CardContent, CardFooter };
