"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { BrainCircuit, ScanFace, Activity, CheckCircle2, Crown, Lock } from "lucide-react";
import { detectFaceLandmarks, calculateFaceMetrics, initializeFaceLandmarker, calculateBeautyScore } from "@/utils/faceLandmarker";
import { saveAnalysisToFingerprint, getCachedAnalysisFromFingerprint } from "@/utils/faceFingerprint";
import { useApiLimiter } from "@/lib/hooks/useApiLimiter";
import { Button } from "@/components/ui/Button";

const STEPS = [
    { label: "Mapeando 120 pontos faciais...", duration: 1500, icon: ScanFace },
    { label: "Calculando Proporção Áurea...", duration: 1500, icon: BrainCircuit },
    { label: "Analisando textura da pele...", duration: 1500, icon: Activity },
    { label: "Detectando assimetria mandibular...", duration: 1500, icon: ScanFace },
    { label: "Gerando Dossiê Prime AI...", duration: 1000, icon: CheckCircle2 },
];

// Passos quando resultado vem do cache (mesma animação completa)
const CACHE_STEPS = [
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
    const [limitReached, setLimitReached] = useState(false);
    const [isFromCache, setIsFromCache] = useState(false);

    const analyzingRef = useRef(false);

    // Hook de limites e cache
    const {
        checkCache,
        saveToCache,
        canUseApi,
        incrementUsage,
        getRemainingUses,
        isLoaded,
        isPro
    } = useApiLimiter();

    // Initialize MediaPipe on mount
    useEffect(() => {
        initializeFaceLandmarker();
    }, []);

    useEffect(() => {
        // Aguardar hook carregar
        if (!isLoaded) return;

        const analyzeImages = async () => {
            if (analyzingRef.current) return;
            analyzingRef.current = true;

            const faceImage = localStorage.getItem("faceImage");
            const bodyImage = localStorage.getItem("bodyImage");

            if (!faceImage) {
                router.push("/scan");
                return;
            }

            setUserImage(faceImage);

            // ===== 1. VERIFICAR CACHE PRIMEIRO =====
            const cachedResult = await checkCache(faceImage);

            if (cachedResult) {
                console.log("🚀 Usando resultado do CACHE!");
                setIsFromCache(true);

                // Animação rápida para cache
                for (let i = 0; i < CACHE_STEPS.length; i++) {
                    setCurrentStep(i);
                    setProgress(Math.round(((i + 1) / CACHE_STEPS.length) * 100));
                    await new Promise(r => setTimeout(r, CACHE_STEPS[i].duration));
                }

                localStorage.setItem("analysisResult", JSON.stringify(cachedResult));
                router.push("/results");
                return;
            }

            // ===== 2. VERIFICAR LIMITE DE USO =====
            if (!canUseApi()) {
                console.log("🚫 Limite de uso atingido!");
                setLimitReached(true);
                return;
            }

            // ===== 3. ANÁLISE NORMAL =====
            // Animation promise
            const animationPromise = new Promise<void>(async (resolve) => {
                for (let i = 0; i < STEPS.length; i++) {
                    setCurrentStep(i);
                    setProgress(Math.round(((i + 1) / STEPS.length) * 90));
                    await new Promise(r => setTimeout(r, STEPS[i].duration));
                }
                resolve();
            });

            // MediaPipe Analysis
            let metrics = null;
            let faceDetected = false;
            let detectedLandmarks: any[] | null = null; // Guardar para usar no fingerprint
            try {
                console.log("🔍 Starting MediaPipe Analysis...");
                const img = new Image();
                img.src = faceImage;
                await new Promise((resolve, reject) => {
                    img.onload = () => resolve(null);
                    img.onerror = () => reject(new Error("Failed to load image"));
                });

                const landmarks = await detectFaceLandmarks(img);
                if (landmarks) {
                    faceDetected = true;
                    detectedLandmarks = landmarks; // Guardar para fingerprint
                    metrics = calculateFaceMetrics(landmarks);
                    const beautyScore = calculateBeautyScore(landmarks);
                    metrics = { ...metrics, beauty_score: beautyScore };
                    console.log("✅ MediaPipe Metrics:", metrics);
                } else {
                    console.warn("⚠️ No landmarks detected by MediaPipe");
                }
            } catch (e: any) {
                console.error("❌ MediaPipe Error:", e);
                if (e.message && e.message.includes("rosto")) {
                    alert("⚠️ Nenhum rosto humano detectado!\n\nPor favor, envie uma foto real do seu rosto.");
                    router.push("/scan");
                    return;
                }
            }

            if (!faceDetected) {
                alert("⚠️ Nenhum rosto humano detectado!\n\nPor favor, envie uma foto real do seu rosto.");
                router.push("/scan");
                return;
            }

            // API Call Promise
            const apiPromise = fetch("/api/analyze", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ faceImage, bodyImage, metrics }),
            })
                .then(async (res) => {
                    // Tratamento específico para erro 429 (Quota Exceeded)
                    if (res.status === 429) {
                        throw new Error("QUOTA_EXCEEDED");
                    }

                    if (!res.ok) {
                        const errorText = await res.text();
                        console.error("API Error Response:", errorText);
                        throw new Error(`Analysis failed: ${res.status} ${res.statusText}`);
                    }
                    return res.json();
                })
                .then(async (data) => {
                    console.log("API Response Data:", data);

                    if (data.error === "face_not_detected") {
                        throw new Error("FACE_NOT_DETECTED");
                    }

                    // ===== VERIFICAR CACHE DO FINGERPRINT SE FOR FALLBACK =====
                    if (data.is_fallback && detectedLandmarks) {
                        const cachedAnalysis = getCachedAnalysisFromFingerprint(detectedLandmarks);
                        if (cachedAnalysis && cachedAnalysis.pontos_fortes?.length) {
                            console.log("🧠 Usando análise cacheada do fingerprint!");
                            // Mesclar análise cacheada com resultado atual
                            data.rosto.pontos_fortes = cachedAnalysis.pontos_fortes;
                            if (cachedAnalysis.pontos_de_atencao?.length) {
                                data.rosto.pontos_de_atencao = cachedAnalysis.pontos_de_atencao;
                            }
                            if (cachedAnalysis.analise_pele) {
                                data.rosto.analise_pele = cachedAnalysis.analise_pele;
                            }
                            data.ai_provider = 'CACHED';
                        }
                    }

                    // ===== SALVAR NO FINGERPRINT SEMPRE =====
                    // Mesmo fallback usa métricas reais do MediaPipe, então vale cachear!
                    if (detectedLandmarks) {
                        const faceShape = data.rosto?.formato_rosto || metrics?.formato_rosto || 'OVAL';
                        saveAnalysisToFingerprint(detectedLandmarks, faceShape, data);
                    }

                    // ===== SALVAR NO CACHE =====
                    await saveToCache(faceImage, data);

                    // ===== INCREMENTAR USO =====
                    incrementUsage();

                    localStorage.setItem("analysisResult", JSON.stringify(data));
                    return data;
                });

            try {
                await Promise.all([animationPromise, apiPromise]);
                setProgress(100);
                setTimeout(() => router.push("/results"), 500);
            } catch (error: any) {
                console.error(error);

                if (error.message === "FACE_NOT_DETECTED") {
                    alert("⚠️ Nenhum rosto humano detectado!\n\nPor favor, envie uma foto real do seu rosto.");
                } else if (error.message === "QUOTA_EXCEEDED") {
                    alert("🚦 Muita gente usando agora!\n\nEspere 10 segundos e tente de novo.\n\nOu torne-se VIP para análises ilimitadas!");
                } else {
                    alert("Erro na análise. Verifique sua conexão ou tente outra foto.");
                }

                router.push("/scan");
            } finally {
                analyzingRef.current = false;
            }
        };

        analyzeImages();
    }, [router, isLoaded, checkCache, saveToCache, canUseApi, incrementUsage]);

    const activeSteps = isFromCache ? CACHE_STEPS : STEPS;
    const CurrentIcon = activeSteps[currentStep]?.icon || CheckCircle2;

    // ===== TELA DE LIMITE ATINGIDO =====
    if (limitReached) {
        return (
            <main className="min-h-screen bg-black text-white flex flex-col relative overflow-hidden">
                <Navbar />

                <div className="flex-1 flex flex-col items-center justify-center px-4 relative z-10">
                    <div className="w-full max-w-md space-y-8 text-center">

                        {/* Lock Icon */}
                        <div className="relative w-32 h-32 mx-auto rounded-full overflow-hidden border-4 border-yellow-500/30 bg-yellow-500/10 flex items-center justify-center">
                            <Lock className="w-16 h-16 text-yellow-500" />
                        </div>

                        <div className="space-y-4 bg-black/80 backdrop-blur-sm p-8 rounded-2xl border border-yellow-500/20">
                            <h2 className="text-2xl font-bold text-yellow-400">
                                Limite Gratuito Atingido!
                            </h2>
                            <p className="text-gray-400">
                                Você já usou suas <strong className="text-white">5 análises grátis</strong>.
                                Torne-se <span className="text-yellow-400 font-bold">VIP</span> para análises ilimitadas!
                            </p>

                            <div className="space-y-3 pt-4">
                                <Link href="/vip-scanner">
                                    <Button
                                        size="lg"
                                        className="w-full h-14 text-lg font-bold bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-black shadow-[0_0_30px_rgba(234,179,8,0.3)]"
                                    >
                                        <Crown className="w-5 h-5 mr-2" />
                                        DESBLOQUEAR VIP
                                    </Button>
                                </Link>

                                <Link href="/">
                                    <Button variant="outline" className="w-full border-white/10 text-gray-400">
                                        Voltar ao Início
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-black text-white flex flex-col relative overflow-hidden">
            <Navbar />

            {/* Background Grid */}
            <div className="fixed inset-0 bg-[linear-gradient(rgba(57,255,20,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(57,255,20,0.05)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

            <div className="flex-1 flex flex-col items-center justify-center px-4 relative z-10">
                <div className="w-full max-w-md space-y-8 text-center">

                    {/* Cache indicator removido para melhor UX - usuário não precisa saber */}

                    {/* Biometric Scanner Overlay */}
                    <div className="relative w-64 h-64 mx-auto rounded-full overflow-hidden border-4 border-primary/30 shadow-[0_0_50px_rgba(57,255,20,0.2)]">
                        {userImage && (
                            <img
                                src={userImage}
                                alt="User Scan"
                                className="w-full h-full object-cover grayscale contrast-[1.2] brightness-90"
                            />
                        )}

                        {/* Scanning Grid Overlay */}
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(57,255,20,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(57,255,20,0.2)_1px,transparent_1px)] bg-[size:20px_20px]" />

                        {/* Radar Scan Line */}
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#39FF14]/50 to-transparent h-[15%] w-full animate-[scan_2s_linear_infinite] opacity-80" />

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
                                {activeSteps[currentStep]?.label || "Processando..."}
                            </h2>
                        </div>

                        <ProgressBar progress={progress} />

                        <div className="space-y-2 text-left">
                            {activeSteps.map((step, i) => (
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
