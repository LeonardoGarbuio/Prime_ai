"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { UploadZone } from "@/components/ui/UploadZone";
import { Button } from "@/components/ui/Button";
import { ArrowRight, AlertCircle, ScanFace, User } from "lucide-react";

export default function ScanPage() {
    const router = useRouter();
    const [faceFile, setFaceFile] = useState<File | null>(null);
    const [bodyFile, setBodyFile] = useState<File | null>(null);

    const handleAnalyze = async () => {
        if (!faceFile) return;

        const toBase64 = (file: File) => new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
        });

        try {
            const faceBase64 = await toBase64(faceFile);
            localStorage.setItem("faceImage", faceBase64);

            if (bodyFile) {
                const bodyBase64 = await toBase64(bodyFile);
                localStorage.setItem("bodyImage", bodyBase64);
            } else {
                localStorage.removeItem("bodyImage");
            }

            router.push("/analyzing");
        } catch (error) {
            console.error("Error converting images:", error);
            alert("Erro ao processar imagens. Tente novamente.");
        }
    };

    return (
        <main className="min-h-screen bg-black text-white">
            <Navbar />

            <div className="max-w-3xl mx-auto px-4 pt-32 pb-20">
                <div className="text-center mb-12 space-y-4">
                    <h1 className="text-3xl md:text-5xl font-bold">
                        UPLOAD DE <span className="text-primary">DADOS</span>
                    </h1>
                    <p className="text-gray-400 max-w-lg mx-auto">
                        Para uma análise precisa, precisamos de uma foto do rosto (sem óculos) e uma do corpo (opcional para análise postural).
                    </p>
                </div>

                <div className="grid gap-8 md:grid-cols-2 mb-12">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between text-sm font-mono text-gray-400">
                            <span>01. ROSTO (OBRIGATÓRIO)</span>
                        </div>
                        <UploadZone
                            label="Upload Selfie"
                            onFileSelect={setFaceFile}
                            icon={<ScanFace className="w-32 h-32 text-white" />}
                        />
                        <p className="text-xs text-gray-500 flex items-center gap-2">
                            <AlertCircle className="w-3 h-3" />
                            Boa iluminação, fundo neutro.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between text-sm font-mono text-gray-400">
                            <span>02. CORPO (OPCIONAL)</span>
                        </div>
                        <UploadZone
                            label="Upload Mirror Selfie"
                            onFileSelect={setBodyFile}
                            icon={<User className="w-32 h-32 text-white" />}
                        />
                        <p className="text-xs text-gray-500 flex items-center gap-2">
                            <AlertCircle className="w-3 h-3" />
                            Use roupas justas ou roupa de banho.
                        </p>
                    </div>
                </div>

                <div className="flex justify-center">
                    <Button
                        size="lg"
                        className="w-full md:w-auto min-w-[200px]"
                        disabled={!faceFile}
                        onClick={handleAnalyze}
                    >
                        INICIAR ANÁLISE
                        <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                </div>
            </div>
        </main>
    );
}
