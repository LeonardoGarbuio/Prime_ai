"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { UploadZone } from "@/components/ui/UploadZone";
import { Button } from "@/components/ui/Button";
import { ArrowRight, AlertCircle, ScanFace, User, Crown, Sparkles } from "lucide-react";
import { useApiLimiter } from "@/lib/hooks/useApiLimiter";
import Link from "next/link";

export default function ScanPage() {
    const router = useRouter();
    const [faceFile, setFaceFile] = useState<File | null>(null);
    const [bodyFile, setBodyFile] = useState<File | null>(null);

    const { getRemainingUses, isPro, maxFreeUses, isLoaded, canUseApi } = useApiLimiter();
    const remainingUses = getRemainingUses();

    const handleAnalyze = async () => {
        if (!faceFile) return;

        const resizeImage = (file: File) => new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement("canvas");
                    let width = img.width;
                    let height = img.height;
                    const MAX_SIZE = 1024;

                    if (width > height) {
                        if (width > MAX_SIZE) {
                            height *= MAX_SIZE / width;
                            width = MAX_SIZE;
                        }
                    } else {
                        if (height > MAX_SIZE) {
                            width *= MAX_SIZE / height;
                            height = MAX_SIZE;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext("2d");
                    ctx?.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL("image/jpeg", 0.8));
                };
                img.onerror = (error) => reject(error);
            };
            reader.onerror = (error) => reject(error);
        });

        try {
            const faceBase64 = await resizeImage(faceFile);
            localStorage.setItem("faceImage", faceBase64);

            if (bodyFile) {
                const bodyBase64 = await resizeImage(bodyFile);
                localStorage.setItem("bodyImage", bodyBase64);
            } else {
                localStorage.removeItem("bodyImage");
            }

            router.push("/analyzing");
        } catch (error) {
            console.error("Error processing images:", error);
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

                    {/* ===== INDICADOR DE ANÁLISES RESTANTES ===== */}
                    {isLoaded && (
                        <div className="flex justify-center pt-2">
                            {isPro ? (
                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-sm font-bold">
                                    <Crown className="w-4 h-4" />
                                    VIP • Análises Ilimitadas
                                </div>
                            ) : (
                                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-mono ${remainingUses > 2
                                        ? "bg-primary/10 border border-primary/30 text-primary"
                                        : remainingUses > 0
                                            ? "bg-orange-500/10 border border-orange-500/30 text-orange-400"
                                            : "bg-red-500/10 border border-red-500/30 text-red-400"
                                    }`}>
                                    <Sparkles className="w-4 h-4" />
                                    {remainingUses > 0
                                        ? `${remainingUses}/${maxFreeUses} análises grátis restantes`
                                        : "Limite grátis atingido"
                                    }
                                </div>
                            )}
                        </div>
                    )}
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

                <div className="flex flex-col items-center gap-4">
                    {/* Botão principal ou aviso de limite */}
                    {!isLoaded || canUseApi() ? (
                        <Button
                            size="lg"
                            className="w-full md:w-auto min-w-[200px]"
                            disabled={!faceFile}
                            onClick={handleAnalyze}
                        >
                            INICIAR ANÁLISE
                            <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                    ) : (
                        <div className="text-center space-y-4">
                            <p className="text-red-400 text-sm">
                                Você atingiu o limite de {maxFreeUses} análises grátis.
                            </p>
                            <Link href="/vip-scanner">
                                <Button
                                    size="lg"
                                    className="bg-gradient-to-r from-yellow-500 to-amber-600 text-black font-bold"
                                >
                                    <Crown className="w-5 h-5 mr-2" />
                                    DESBLOQUEAR VIP
                                </Button>
                            </Link>
                        </div>
                    )}

                    {/* Link para VIP se ainda tem análises */}
                    {isLoaded && !isPro && remainingUses > 0 && remainingUses <= 3 && (
                        <Link href="/vip-scanner" className="text-xs text-gray-500 hover:text-yellow-400 transition-colors">
                            <span className="flex items-center gap-1">
                                <Crown className="w-3 h-3" />
                                Quer análises ilimitadas? Seja VIP
                            </span>
                        </Link>
                    )}
                </div>
            </div>
            <Footer />
        </main>
    );
}
