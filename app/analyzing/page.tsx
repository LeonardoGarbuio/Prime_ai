"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { BrainCircuit, ScanFace, Activity, CheckCircle2 } from "lucide-react";

const STEPS = [
    { label: "Mapeando 120 pontos faciais...", duration: 1500, icon: ScanFace },
    { label: "Calculando Proporção Áurea...", duration: 1500, icon: BrainCircuit },
    { label: "Analisando textura da pele...", duration: 1500, icon: Activity },
    { label: "Detectando assimetria mandibular...", duration: 1500, icon: ScanFace },
    { label: "Gerando Dossiê Prime AI...", duration: 1000, icon: CheckCircle2 },
];

export default function AnalyzingPage() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(0);
    const [progress, setProgress] = useState(0);
    const [userImage, setUserImage] = useState<string | null>(null);

    useEffect(() => {
        const analyzeImages = async () => {
            const faceImage = localStorage.getItem("faceImage");
            const bodyImage = localStorage.getItem("bodyImage");

            if (!faceImage) {
                router.push("/scan");
                return;
            }

            setUserImage(faceImage);

            // Create a promise that resolves when the animation is done
            const animationPromise = new Promise<void>(async (resolve) => {
                for (let i = 0; i < STEPS.length; i++) {
                    setCurrentStep(i);
                    // Update progress based on step index
                    setProgress(Math.round(((i + 1) / STEPS.length) * 90));
                    await new Promise(r => setTimeout(r, STEPS[i].duration));
                }
                resolve();
            });

            // API Call Promise
            const apiPromise = fetch("/api/analyze", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ faceImage, bodyImage }),
            })
                .then(async (res) => {
                    if (!res.ok) {
                        const errorText = await res.text();
                        console.error("API Error Response:", errorText); // DEBUG
                        throw new Error(`Analysis failed: ${res.status} ${res.statusText} - ${errorText}`);
                    }
                    return res.json();
                })
                .then((data) => {
                    console.log("API Response Data:", data); // DEBUG
                    localStorage.setItem("analysisResult", JSON.stringify(data));
                    return data;
                });

            try {
                // Wait for BOTH to finish
                await Promise.all([animationPromise, apiPromise]);

                setProgress(100);
                setTimeout(() => router.push("/results"), 500);
            } catch (error) {
                console.error(error);
                alert("Erro na análise. Verifique sua conexão ou tente outra foto.");
                router.push("/scan");
            }
        };

        analyzeImages();
    }, [router]);

    const CurrentIcon = STEPS[currentStep]?.icon || CheckCircle2;

    return (
        <main className="min-h-screen bg-black text-white flex flex-col relative overflow-hidden">
            <Navbar />

            {/* Background Grid */}
            <div className="fixed inset-0 bg-[linear-gradient(rgba(57,255,20,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(57,255,20,0.05)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

            <div className="flex-1 flex flex-col items-center justify-center px-4 relative z-10">
                <div className="w-full max-w-md space-y-8 text-center">

                    {/* Biometric Scanner Overlay */}
                    <div className="relative w-64 h-64 mx-auto rounded-full overflow-hidden border-4 border-primary/30 shadow-[0_0_50px_rgba(57,255,20,0.2)]">
                        {/* User Image */}
                        {userImage && (
                            <img
                                src={userImage}
                                alt="User Scan"
                                className="w-full h-full object-cover opacity-50 grayscale contrast-125"
                            />
                        )}

                        {/* Scanning Grid Overlay */}
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(57,255,20,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(57,255,20,0.2)_1px,transparent_1px)] bg-[size:20px_20px]" />

                        {/* Radar Scan Line */}
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/50 to-transparent h-1/2 w-full animate-[scan_2s_linear_infinite]" />

                        {/* Rotating Rings */}
                        <div className="absolute inset-0 border-2 border-primary/30 rounded-full animate-[spin_4s_linear_infinite]" />
                        <div className="absolute inset-4 border border-primary/20 rounded-full animate-[spin_3s_linear_infinite_reverse]" />

                        {/* Center Target */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-4 h-4 bg-primary rounded-full animate-ping" />
                        </div>
                    </div>

                    <div className="space-y-6 bg-black/80 backdrop-blur-sm p-6 rounded-2xl border border-white/10">
                        <div className="flex items-center justify-center gap-3">
                            <CurrentIcon className="w-6 h-6 text-primary animate-pulse" />
                            <h2 className="text-xl font-bold font-mono text-primary">
                                {STEPS[currentStep]?.label || "Processando..."}
                            </h2>
                        </div>

                        <ProgressBar progress={progress} />

                        <div className="space-y-2 text-left">
                            {STEPS.map((step, i) => (
                                <div
                                    key={i}
                                    className={`flex items-center gap-3 text-xs md:text-sm transition-colors duration-500 ${i < currentStep ? "text-primary" :
                                        i === currentStep ? "text-white font-bold" : "text-gray-600"
                                        }`}
                                >
                                    <div className={`w-1.5 h-1.5 rounded-full ${i < currentStep ? "bg-primary" :
                                        i === currentStep ? "bg-white animate-pulse" : "bg-gray-800"
                                        }`} />
                                    <span className="font-mono uppercase">{step.label}</span>
                                    {i < currentStep && <CheckCircle2 className="w-3 h-3 ml-auto" />}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
