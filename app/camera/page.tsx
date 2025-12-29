"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import {
    Camera, ScanFace, Zap, ArrowRight,
    RefreshCw, X, CheckCircle2, AlertCircle,
    Video, VideoOff
} from "lucide-react";

export default function CameraPage() {
    const router = useRouter();
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const [stream, setStream] = useState<MediaStream | null>(null);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [isCapturing, setIsCapturing] = useState(false);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
    const [cameraReady, setCameraReady] = useState(false);

    // Iniciar câmera
    const startCamera = useCallback(async () => {
        try {
            setCameraError(null);
            setCameraReady(false);

            // Parar stream anterior se existir
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }

            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: facingMode,
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: false
            });

            setStream(mediaStream);

            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
                videoRef.current.onloadedmetadata = () => {
                    videoRef.current?.play();
                    setCameraReady(true);
                };
            }
        } catch (err: any) {
            console.error("Erro ao acessar câmera:", err);
            if (err.name === "NotAllowedError") {
                setCameraError("Acesso à câmera negado. Permita o acesso nas configurações do navegador.");
            } else if (err.name === "NotFoundError") {
                setCameraError("Nenhuma câmera encontrada no dispositivo.");
            } else {
                setCameraError("Erro ao acessar câmera: " + err.message);
            }
        }
    }, [facingMode, stream]);

    // Parar câmera
    const stopCamera = useCallback(() => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
            setCameraReady(false);
        }
    }, [stream]);

    // Trocar câmera (frontal/traseira)
    const toggleCamera = useCallback(() => {
        setFacingMode(prev => prev === "user" ? "environment" : "user");
    }, []);

    // Capturar foto
    const capturePhoto = useCallback(() => {
        if (!videoRef.current || !canvasRef.current || !cameraReady) return;

        setIsCapturing(true);

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

        if (!ctx) return;

        // Definir tamanho do canvas
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Espelhar se câmera frontal
        if (facingMode === "user") {
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
        }

        // Desenhar frame do vídeo
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Converter para base64
        const imageData = canvas.toDataURL("image/jpeg", 0.9);
        setCapturedImage(imageData);
        setIsCapturing(false);

        // Parar câmera após captura
        stopCamera();
    }, [cameraReady, facingMode, stopCamera]);

    // Recapturar
    const retakePhoto = useCallback(() => {
        setCapturedImage(null);
        startCamera();
    }, [startCamera]);

    // Enviar para análise
    const sendToAnalysis = useCallback(() => {
        if (!capturedImage) return;

        // Salvar imagem no localStorage
        localStorage.setItem("faceImage", capturedImage);

        // Redirecionar para análise
        router.push("/analyzing");
    }, [capturedImage, router]);

    // Iniciar câmera ao montar
    useEffect(() => {
        startCamera();

        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [facingMode]);

    return (
        <main className="min-h-screen bg-black text-white">
            <Navbar />

            <section className="pt-24 pb-20 px-4">
                <div className="max-w-2xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono mb-4">
                            <Video className="w-3 h-3" /> CÂMERA AO VIVO
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                            CAPTURA <span className="text-primary">INSTANTÂNEA</span>
                        </h1>
                        <p className="text-gray-400">
                            Tire uma foto agora e receba sua análise facial em segundos
                        </p>
                    </div>

                    {/* Camera Container */}
                    <div className="relative aspect-[3/4] bg-black rounded-3xl overflow-hidden border border-white/10 mb-6">
                        {/* Error State */}
                        {cameraError && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 bg-red-500/10">
                                <AlertCircle className="w-16 h-16 text-red-400 mb-4" />
                                <p className="text-red-400 text-center mb-6">{cameraError}</p>
                                <Button onClick={startCamera} className="bg-white/10 hover:bg-white/20">
                                    <RefreshCw className="w-4 h-4 mr-2" />
                                    Tentar Novamente
                                </Button>
                            </div>
                        )}

                        {/* Captured Image */}
                        {capturedImage && (
                            <img
                                src={capturedImage}
                                alt="Foto capturada"
                                className="w-full h-full object-cover"
                            />
                        )}

                        {/* Video Stream */}
                        {!capturedImage && !cameraError && (
                            <>
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className={`w-full h-full object-cover ${facingMode === "user" ? "scale-x-[-1]" : ""}`}
                                />

                                {/* Overlay Guide */}
                                <div className="absolute inset-0 pointer-events-none">
                                    {/* Face guide */}
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-80 border-2 border-primary/40 rounded-[40%] border-dashed" />

                                    {/* Corner guides */}
                                    <div className="absolute top-8 left-8 w-12 h-12 border-t-2 border-l-2 border-primary/60 rounded-tl-xl" />
                                    <div className="absolute top-8 right-8 w-12 h-12 border-t-2 border-r-2 border-primary/60 rounded-tr-xl" />
                                    <div className="absolute bottom-8 left-8 w-12 h-12 border-b-2 border-l-2 border-primary/60 rounded-bl-xl" />
                                    <div className="absolute bottom-8 right-8 w-12 h-12 border-b-2 border-r-2 border-primary/60 rounded-br-xl" />
                                </div>

                                {/* Loading overlay */}
                                {!cameraReady && (
                                    <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                                        <div className="text-center">
                                            <Camera className="w-12 h-12 text-primary animate-pulse mx-auto mb-3" />
                                            <p className="text-gray-400 text-sm">Iniciando câmera...</p>
                                        </div>
                                    </div>
                                )}

                                {/* Flip camera button */}
                                <button
                                    onClick={toggleCamera}
                                    className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition-colors"
                                >
                                    <RefreshCw className="w-5 h-5 text-white" />
                                </button>
                            </>
                        )}

                        {/* Hidden canvas for capture */}
                        <canvas ref={canvasRef} className="hidden" />
                    </div>

                    {/* Capture Instructions */}
                    {!capturedImage && !cameraError && cameraReady && (
                        <div className="grid grid-cols-3 gap-4 mb-6 text-center text-xs text-gray-500">
                            <div className="p-3 rounded-xl bg-white/5">
                                <CheckCircle2 className="w-4 h-4 text-primary mx-auto mb-1" />
                                Boa iluminação
                            </div>
                            <div className="p-3 rounded-xl bg-white/5">
                                <CheckCircle2 className="w-4 h-4 text-primary mx-auto mb-1" />
                                Rosto centralizado
                            </div>
                            <div className="p-3 rounded-xl bg-white/5">
                                <CheckCircle2 className="w-4 h-4 text-primary mx-auto mb-1" />
                                Expressão neutra
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="space-y-4">
                        {!capturedImage && !cameraError && (
                            <Button
                                onClick={capturePhoto}
                                disabled={!cameraReady || isCapturing}
                                size="lg"
                                className="w-full h-16 text-lg font-bold disabled:opacity-50"
                            >
                                {isCapturing ? (
                                    <>Capturando...</>
                                ) : (
                                    <>
                                        <Camera className="w-5 h-5 mr-2" />
                                        CAPTURAR FOTO
                                    </>
                                )}
                            </Button>
                        )}

                        {capturedImage && (
                            <div className="grid grid-cols-2 gap-4">
                                <Button
                                    onClick={retakePhoto}
                                    size="lg"
                                    className="h-14 bg-white/10 hover:bg-white/20 text-white"
                                >
                                    <X className="w-5 h-5 mr-2" />
                                    REFAZER
                                </Button>
                                <Button
                                    onClick={sendToAnalysis}
                                    size="lg"
                                    className="h-14 font-bold"
                                >
                                    ANALISAR
                                    <ArrowRight className="w-5 h-5 ml-2" />
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Tips */}
                    <div className="mt-12 p-6 rounded-2xl bg-white/5 border border-white/10">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <Zap className="w-5 h-5 text-primary" />
                            Dicas para melhor resultado
                        </h3>
                        <ul className="space-y-3 text-sm text-gray-400">
                            <li className="flex items-start gap-2">
                                <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                                Use luz natural ou ambiente bem iluminado
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                                Mantenha o rosto centralizado dentro do guia
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                                Retire óculos e puxe o cabelo para trás se possível
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                                Mantenha expressão neutra, sem sorrir
                            </li>
                        </ul>
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    );
}
