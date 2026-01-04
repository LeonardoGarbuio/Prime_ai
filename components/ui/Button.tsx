import { ButtonHTMLAttributes, forwardRef } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "outline" | "ghost" | "danger";
    size?: "sm" | "md" | "lg";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = "primary", size = "md", ...props }, ref) => {
        return (
            <button
                ref={ref}
                className={cn(
                    "inline-flex items-center justify-center rounded-md font-mono font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50",
                    {
                        "bg-gradient-to-br from-[#4338CA] to-[#7C3AED] text-white/90 border-0 shadow-[0px_4px_15px_rgba(124,58,237,0.5)] hover:shadow-[0px_4px_25px_rgba(124,58,237,0.7)] hover:brightness-110":
                            variant === "primary",
                        "border-2 border-primary text-primary hover:bg-primary hover:text-black":
                            variant === "outline",
                        "hover:bg-secondary text-foreground": variant === "ghost",
                        "bg-accent text-white hover:bg-accent/90 shadow-[0_0_15px_rgba(255,0,0,0.5)]":
                            variant === "danger",
                        "h-9 px-4 text-sm": size === "sm",
                        "h-11 px-8 text-base": size === "md",
                        "h-14 px-10 text-lg": size === "lg",
                    },
                    className
                )}
                {...props}
            />
        );
    }
);
Button.displayName = "Button";

export { Button };
