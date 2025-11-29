"use client";

import { useState, useRef } from "react";
import { Upload, X, CheckCircle } from "lucide-react";
import { clsx } from "clsx";

interface UploadZoneProps {
    label: string;
    onFileSelect: (file: File) => void;
    accept?: string;
    icon?: React.ReactNode;
}

export function UploadZone({ label, onFileSelect, accept = "image/*", icon }: UploadZoneProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    };

    const handleFile = (file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
        onFileSelect(file);
    };

    const clearFile = (e: React.MouseEvent) => {
        e.stopPropagation();
        setPreview(null);
        if (inputRef.current) inputRef.current.value = "";
    };

    return (
        <div
            onClick={() => inputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={clsx(
                "relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer transition-all overflow-hidden group",
                isDragging
                    ? "border-primary bg-primary/10"
                    : "border-secondary hover:border-primary/50 hover:bg-secondary/50",
                preview ? "border-solid border-primary" : ""
            )}
        >
            <input
                ref={inputRef}
                type="file"
                className="hidden"
                accept={accept}
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />

            {/* Background Icon */}
            {!preview && icon && (
                <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none group-hover:opacity-[0.05] transition-opacity">
                    {icon}
                </div>
            )}

            {preview ? (
                <>
                    <img
                        src={preview}
                        alt="Preview"
                        className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-30 transition-opacity"
                    />
                    <div className="z-10 flex flex-col items-center">
                        <CheckCircle className="w-12 h-12 text-primary mb-2 drop-shadow-[0_0_10px_rgba(57,255,20,0.8)]" />
                        <p className="text-primary font-mono font-bold">Image Loaded</p>
                    </div>
                    <button
                        onClick={clearFile}
                        className="absolute top-2 right-2 p-1 bg-black/50 rounded-full hover:bg-accent hover:text-white transition-colors z-20"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </>
            ) : (
                <div className="flex flex-col items-center justify-center pt-5 pb-6 relative z-10">
                    <Upload className={clsx("w-10 h-10 mb-3 transition-colors", isDragging ? "text-primary" : "text-gray-400 group-hover:text-primary")} />
                    <p className="mb-2 text-sm text-gray-400 group-hover:text-gray-200 font-mono">
                        <span className="font-semibold text-primary">{label}</span>
                    </p>
                    <p className="text-xs text-gray-500">Drag & Drop or Click</p>
                </div>
            )}
        </div>
    );
}
