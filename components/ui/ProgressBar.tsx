"use client";

import { motion } from "framer-motion";

interface ProgressBarProps {
    progress: number;
    label?: string;
}

export function ProgressBar({ progress, label }: ProgressBarProps) {
    return (
        <div className="w-full max-w-md space-y-2">
            {label && (
                <div className="flex justify-between text-xs font-mono uppercase tracking-widest text-gray-400">
                    <span>{label}</span>
                    <span>{Math.round(progress)}%</span>
                </div>
            )}
            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                <motion.div
                    className="h-full bg-primary shadow-[0_0_10px_rgba(57,255,20,0.8)]"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5 }}
                />
            </div>
        </div>
    );
}
