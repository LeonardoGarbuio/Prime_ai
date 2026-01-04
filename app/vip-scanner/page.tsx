'use client';

import { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import { UploadZone } from '@/components/ui/UploadZone';
import { Button } from '@/components/ui/Button';
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import {
    Lock, Crown, Sparkles, AlertTriangle, CheckCircle2, Zap,
    ScanFace, User, ArrowUp, ArrowDown, Star, XCircle,
    Palette, Shirt, ShoppingBag, Ban, Glasses, ChevronDown, Download,
    Share2, MessageCircle
} from 'lucide-react';
import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ResponsiveContainer
} from 'recharts';
import { detectFaceLandmarks, calculateFaceMetrics, initializeFaceLandmarker, calculateBeautyScore } from "@/utils/faceLandmarker";
import { generateVIPReport } from "@/utils/generatePDF";

// Format face shape for display (fix Portuguese characters)
const formatFaceShape = (shape: string) => {
    const shapeMap: { [key: string]: string } = {
        'CORACAO': 'CORAÇÃO',
        'TRIANGULAR_INVERTIDO': 'TRIÂNGULO INVERTIDO',
        'RETANGULAR': 'RETANGULAR',
        'QUADRADO': 'QUADRADO',
        'DIAMANTE': 'DIAMANTE',
        'TRIANGULAR': 'TRIANGULAR',
        'REDONDO': 'REDONDO',
        'OBLONGO': 'OBLONGO',
        'OVAL': 'OVAL'
    };
    return shapeMap[shape?.toUpperCase()] || shape;
};

export default function VipScannerPage() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [emailInput, setEmailInput] = useState("");
    const [passwordInput, setPasswordInput] = useState("");
    const [loginLoading, setLoginLoading] = useState(false);
    const [loginError, setLoginError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [termsAccepted, setTermsAccepted] = useState(false);

    // Estados para recuperação de acesso
    const [showRecovery, setShowRecovery] = useState(false);
    const [recoveryEmail, setRecoveryEmail] = useState("");
    const [recoveryLoading, setRecoveryLoading] = useState(false);
    const [recoveryMessage, setRecoveryMessage] = useState("");

    const [faceImage, setFaceImage] = useState<string | null>(null);
    const [context, setContext] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [previousResult, setPreviousResult] = useState<any>(null);
    const [expandedSection, setExpandedSection] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Ref para captura de tela do card
    const shareCardRef = useRef<HTMLDivElement>(null);

    // Initialize MediaPipe and Load Existing Data on mount
    useEffect(() => {
        initializeFaceLandmarker();

        // Load existing analysis from Free Scan to ensure consistency
        const savedData = localStorage.getItem("analysisResult");
        if (savedData) {
            try {
                const parsed = JSON.parse(savedData);
                console.log("🔄 Hydrating VIP Scanner with existing data:", parsed);
                setPreviousResult(parsed); // Store for consistency, but don't show result yet
                if (parsed.faceImage) {
                    setFaceImage(parsed.faceImage);
                }
            } catch (e) {
                console.error("Failed to load saved analysis:", e);
            }
        }

        // Check if already logged in (localStorage ou cookie)
        const savedAuth = localStorage.getItem("vip_auth");
        if (savedAuth) {
            setIsAuthenticated(true);
        }

        // Verificar cookie de sessão (magic link)
        const cookies = document.cookie.split(';');
        const vipEmailCookie = cookies.find(c => c.trim().startsWith('vip_email='));
        if (vipEmailCookie) {
            const email = vipEmailCookie.split('=')[1]?.trim();
            if (email) {
                setIsAuthenticated(true);
                localStorage.setItem("vip_auth", email);
            }
        }

        // Verificar parâmetros de URL (auth=success ou error)
        const params = new URLSearchParams(window.location.search);
        if (params.get('auth') === 'success') {
            setSuccessMessage('✅ Acesso liberado!');
            // Limpar URL
            window.history.replaceState({}, '', '/vip-scanner');
        }
        const errorParam = params.get('error');
        if (errorParam) {
            setLoginError(errorParam);
            window.history.replaceState({}, '', '/vip-scanner');
        }
    }, []);

    const handleLogin = async () => {
        if (!emailInput.trim() && !passwordInput.trim()) {
            setLoginError("Digite seu email ou senha");
            return;
        }

        setLoginLoading(true);
        setLoginError("");

        try {
            const response = await fetch("/api/auth/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: emailInput.trim().toLowerCase(),
                    senha: passwordInput.trim()
                }),
            });

            const data = await response.json();

            if (data.ativo) {
                setIsAuthenticated(true);
                localStorage.setItem("vip_auth", emailInput || "admin");
                console.log("✅ Login VIP bem-sucedido:", data.message);
            } else {
                setLoginError(data.message || "Acesso não autorizado. Verifique sua assinatura.");
            }
        } catch (error: any) {
            console.error("Erro no login:", error);
            setLoginError("Erro de conexão. Tente novamente.");
        } finally {
            setLoginLoading(false);
        }
    };

    // Handler para recuperação de acesso
    const handleRecovery = async () => {
        if (!recoveryEmail.trim()) {
            setRecoveryMessage("Digite seu email");
            return;
        }

        setRecoveryLoading(true);
        setRecoveryMessage("");

        try {
            const response = await fetch("/api/auth/recover", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: recoveryEmail.trim().toLowerCase() }),
            });

            const data = await response.json();
            setRecoveryMessage(data.message || "Verifique seu email!");

            if (data.success) {
                // Fecha modal após 3 segundos
                setTimeout(() => {
                    setShowRecovery(false);
                    setRecoveryEmail("");
                    setRecoveryMessage("");
                }, 3000);
            }
        } catch (error) {
            setRecoveryMessage("Erro de conexão. Tente novamente.");
        } finally {
            setRecoveryLoading(false);
        }
    };

    const handleFileSelect = (file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            setFaceImage(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleAnalyze = async () => {
        if (!faceImage) return;
        setLoading(true);

        try {
            // 1. Run MediaPipe Analysis (Client-Side)
            console.log("🔍 Starting MediaPipe Analysis (VIP Mode)...");
            let metrics = null;

            try {
                const img = new Image();
                img.src = faceImage;
                await new Promise((resolve, reject) => {
                    img.onload = () => resolve(null);
                    img.onerror = () => reject(new Error("Failed to load image"));
                });

                const landmarks = await detectFaceLandmarks(img);
                if (landmarks) {
                    metrics = calculateFaceMetrics(landmarks);
                    const beautyScore = calculateBeautyScore(landmarks);
                    metrics = { ...metrics, beauty_score: beautyScore }; // Inject score
                    console.log("✅ MediaPipe Metrics (VIP):", metrics);
                } else {
                    console.warn("⚠️ No landmarks detected by MediaPipe");
                }
            } catch (e) {
                console.error("❌ MediaPipe Error:", e);
                // Continue anyway, maybe it's a full body shot
            }

            // 2. Send to API with Metrics
            const response = await fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    faceImage,
                    mode: 'stylist',
                    userContext: context,
                    metrics // INJECTING THE BRAIN 🧠
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error("❌ API Error:", response.status, errorText);
                throw new Error(`Erro na API (${response.status}): ${errorText.slice(0, 100)}`);
            }

            const data = await response.json();
            console.log("VIP Analysis Data:", data);

            // VIP faz análise INDEPENDENTE - não puxa dados do normal
            // Apenas mantém consistência do SCORE se for a mesma foto (baseado no beauty_score do MediaPipe)

            // Checar se é a mesma imagem comparando o faceImage
            const savedImage = localStorage.getItem("faceImage");
            const isSameImage = savedImage === faceImage;

            let finalResult = data;

            // Se for a mesma imagem, usar o mesmo beauty_score para consistência
            if (isSameImage && previousResult?.analise_geral?.nota_final) {
                console.log("🔄 Mesma foto detectada - mantendo score consistente");
                if (finalResult.analise_geral) {
                    finalResult.analise_geral.nota_final = previousResult.analise_geral.nota_final;
                    finalResult.analise_geral.nota_potencial = previousResult.analise_geral.nota_potencial;
                }
            } else {
                console.log("⚡ Nova foto ou primeira análise - usando dados VIP completos");
            }

            console.log("✨ VIP Result:", finalResult);
            setResult(finalResult);
        } catch (error) {
            console.error(error);
            alert('Erro na análise. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    // Data for Radar Chart (Safe Access)
    const radarData = result ? [
        { subject: 'SIMETRIA', A: result.grafico_radar?.simetria || 65, B: 95, fullMark: 100 },
        { subject: 'PELE', A: result.grafico_radar?.qualidade_pele || result.grafico_radar?.pele || 70, B: 90, fullMark: 100 },
        { subject: 'ESTRUTURA ÓSSEA', A: result.grafico_radar?.estrutura_ossea || 60, B: 98, fullMark: 100 },
        { subject: 'HARMONIA', A: result.grafico_radar?.harmonia_facial || result.grafico_radar?.terco_medio || 55, B: 92, fullMark: 100 },
        { subject: 'PROPORÇÃO ÁUREA', A: result.grafico_radar?.proporcao_aurea || 50, B: 96, fullMark: 100 },
    ] : [];

    const currentScore = parseFloat(String(result?.analise_geral?.nota_final || "7.5"));
    const potentialScore = Math.min(10.0, parseFloat(String(result?.analise_geral?.nota_potencial || (currentScore + 1.0).toFixed(1))));
    const gap = (potentialScore - currentScore).toFixed(1);

    // Compartilhar no WhatsApp
    const handleShareWhatsApp = () => {
        const score = result?.analise_geral?.nota_final || "7.5";
        const text = `Fiz uma análise facial com IA e tirei *${score}/10*! Testa a sua: https://useprime.ia.br/`;
        const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
    };

    // Compartilhar genérico
    const handleShare = async () => {
        const score = result?.analise_geral?.nota_final || "7.5";

        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Minha Análise Prime AI VIP',
                    text: `Minha nota: ${score}/10`,
                    url: 'https://useprime.ia.br/',
                });
            } catch (err) {
                console.log('Erro ao compartilhar:', err);
            }
        } else {
            const text = `Minha nota Prime AI: ${score}/10\n\nDescubra a sua: https://useprime.ia.br/`;
            navigator.clipboard.writeText(text);
            alert('Link copiado para compartilhar!');
        }
    };

    // Função para salvar imagem do card ao clicar
    const saveShareCard = async () => {
        if (!shareCardRef.current || isSaving) return;

        setIsSaving(true);
        try {
            const canvas = await html2canvas(shareCardRef.current, {
                backgroundColor: '#000000',
                scale: 1.5,
                logging: false,
                useCORS: true,
            });

            // Download direto
            const link = document.createElement('a');
            link.download = `PrimeAI_VIP_${Date.now()}.png`;
            link.href = canvas.toDataURL('image/png');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

        } catch (error) {
            console.error('Erro ao salvar imagem:', error);
            // Fallback: tentar copiar para clipboard ou abrir em nova aba
            try {
                const canvas = await html2canvas(shareCardRef.current!, {
                    backgroundColor: '#000000',
                    scale: 1,
                    logging: false,
                });

                canvas.toBlob(async (blob) => {
                    if (blob && navigator.clipboard && window.ClipboardItem) {
                        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
                        alert('✅ Imagem copiada! Cole em qualquer app.');
                    } else {
                        const dataUrl = canvas.toDataURL('image/png');
                        const newTab = window.open();
                        if (newTab) {
                            newTab.document.write(`<img src="${dataUrl}" style="max-width:100%"/><p>Segure na imagem para salvar</p>`);
                        }
                    }
                });
            } catch (e2) {
                alert('Use o print do celular (botões de poder + volume).');
            }
        } finally {
            setTimeout(() => setIsSaving(false), 1000);
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center p-6 relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-yellow-500/10 blur-[120px] rounded-full pointer-events-none" />

                <div className="max-w-5xl w-full grid md:grid-cols-2 gap-0 relative z-10 bg-[#0a0a0a] border border-white/10 backdrop-blur-xl shadow-2xl rounded-3xl overflow-hidden">

                    {/* Lado Esquerdo: Venda */}
                    <div className="p-10 flex flex-col justify-center space-y-8 border-r border-white/5 bg-gradient-to-br from-white/5 to-transparent relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-500 to-amber-600" />

                        <div className="space-y-4 relative z-10">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs font-bold tracking-wider uppercase">
                                <Crown className="w-3 h-3" /> Oferta Exclusiva
                            </div>
                            <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight">
                                Desbloqueie sua <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-400 to-amber-600">Melhor Versão</span>
                            </h1>
                            <p className="text-gray-400 text-sm leading-relaxed max-w-sm">
                                Tenha acesso ao scanner facial completo e receba nosso guia definitivo de estilo e atratividade.
                            </p>
                        </div>

                        <ul className="space-y-4 relative z-10">
                            {[
                                "Análise Facial Completa (Forensic + Stylist)",
                                "Guia de Estilo Personalizado (PDF)",
                                "Dicas de Cabelo, Barba e Óculos",
                                "Acesso Mensal à Área VIP (Enquanto assinar)"
                            ].map((item, i) => (
                                <li key={i} className="flex items-center gap-3 text-sm text-gray-300">
                                    <div className="w-5 h-5 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                                        <CheckCircle2 className="w-3 h-3 text-yellow-400" />
                                    </div>
                                    {item}
                                </li>
                            ))}
                        </ul>

                        <div className="pt-2 relative z-10">
                            <div className="flex items-end gap-3 mb-6">
                                <span className="text-4xl font-bold text-white">R$ 19,90</span>
                                <div className="flex flex-col mb-1">
                                    <span className="text-gray-500 line-through text-xs">R$ 97,00</span>
                                    <span className="text-green-400 text-xs font-bold">80% OFF</span>
                                </div>
                            </div>
                            <Button
                                className="w-full bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-black font-bold py-7 text-lg shadow-[0_0_30px_rgba(234,179,8,0.2)] hover:shadow-[0_0_40px_rgba(234,179,8,0.4)] transition-all transform hover:-translate-y-1"
                                onClick={() => window.open('https://pay.kiwify.com.br/Smq4FoG', '_blank')}
                            >
                                QUERO ACESSO VIP
                            </Button>
                            <div className="flex items-center justify-center gap-4 mt-4 text-[10px] text-gray-500 uppercase tracking-wider">
                                <span className="flex items-center gap-1"><Lock className="w-3 h-3" /> Compra Segura</span>
                                <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> Acesso Imediato</span>
                            </div>
                        </div>
                    </div>

                    {/* Lado Direito: Login */}
                    <div className="p-10 flex flex-col justify-center items-center bg-black/40 relative">
                        <div className="w-full max-w-xs space-y-8 text-center relative z-10">
                            <div className="flex justify-center">
                                <div className="p-5 bg-white/5 rounded-2xl border border-white/10 shadow-inner">
                                    <Lock className="w-8 h-8 text-gray-400" />
                                </div>
                            </div>

                            <div>
                                <h2 className="text-xl font-bold text-white">Área de Membros</h2>
                                <p className="text-gray-500 text-xs mt-2 leading-relaxed">
                                    Digite o email usado na compra. Ou use a senha VIP.
                                </p>
                            </div>

                            {loginError && (
                                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-xs">
                                    {loginError}
                                </div>
                            )}

                            <div className="space-y-4">
                                <div className="space-y-2 text-left">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-1">Email de Compra</label>
                                    <input
                                        type="email"
                                        placeholder="seu@email.com"
                                        value={emailInput}
                                        onChange={(e) => setEmailInput(e.target.value)}
                                        className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white placeholder-gray-600 focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500/50 focus:outline-none text-center text-sm transition-all"
                                    />
                                </div>
                                <div className="space-y-2 text-left">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-1">Ou Senha VIP</label>
                                    <input
                                        type="password"
                                        placeholder="SENHA VIP"
                                        value={passwordInput}
                                        onChange={(e) => setPasswordInput(e.target.value)}
                                        className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white placeholder-gray-600 focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500/50 focus:outline-none text-center text-sm tracking-widest uppercase font-mono transition-all"
                                        onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                                    />
                                </div>

                                {/* Checkbox de Termos */}
                                <label className="flex items-start gap-2 cursor-pointer group text-left">
                                    <input
                                        type="checkbox"
                                        checked={termsAccepted}
                                        onChange={(e) => setTermsAccepted(e.target.checked)}
                                        className="mt-1 w-4 h-4 rounded border-gray-600 bg-black/50 text-yellow-500 focus:ring-yellow-500/50 focus:ring-offset-0 cursor-pointer"
                                    />
                                    <span className="text-[10px] text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors">
                                        Li e concordo com os <a href="/terms" target="_blank" className="text-yellow-400 hover:underline">Termos de Uso</a> e <a href="/privacy" target="_blank" className="text-yellow-400 hover:underline">Política de Privacidade</a>
                                    </span>
                                </label>

                                <button
                                    onClick={handleLogin}
                                    disabled={loginLoading || !termsAccepted}
                                    className="w-full py-4 bg-white/5 hover:bg-white/10 text-white text-sm font-bold rounded-xl transition-all border border-white/10 hover:border-white/20 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    ACESSAR
                                    <ArrowUp className="w-4 h-4 rotate-90 group-hover:translate-x-1 transition-transform" />
                                </button>

                                {/* Link Esqueci meu acesso */}
                                <button
                                    onClick={() => setShowRecovery(true)}
                                    className="w-full text-center text-xs text-gray-500 hover:text-yellow-400 transition-colors py-2"
                                >
                                    Esqueci meu acesso →
                                </button>
                            </div>

                            {/* Mensagem de sucesso */}
                            {successMessage && (
                                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 text-green-400 text-xs text-center">
                                    {successMessage}
                                </div>
                            )}
                        </div>

                        {/* Modal de Recuperação */}
                        {showRecovery && (
                            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                                <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 w-full max-w-xs space-y-4">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-white font-bold">Recuperar Acesso</h3>
                                        <button
                                            onClick={() => { setShowRecovery(false); setRecoveryMessage(""); }}
                                            className="text-gray-500 hover:text-white"
                                        >
                                            ✕
                                        </button>
                                    </div>

                                    <p className="text-gray-400 text-xs">
                                        Digite o email usado na compra. Enviaremos um link de acesso.
                                    </p>

                                    <input
                                        type="email"
                                        placeholder="seu@email.com"
                                        value={recoveryEmail}
                                        onChange={(e) => setRecoveryEmail(e.target.value)}
                                        className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white placeholder-gray-600 focus:ring-2 focus:ring-yellow-500/50 focus:outline-none text-center text-sm"
                                        onKeyDown={(e) => e.key === 'Enter' && handleRecovery()}
                                    />

                                    {recoveryMessage && (
                                        <p className={`text-xs text-center ${recoveryMessage.includes('sucesso') || recoveryMessage.includes('receberá') ? 'text-green-400' : 'text-yellow-400'}`}>
                                            {recoveryMessage}
                                        </p>
                                    )}

                                    <button
                                        onClick={handleRecovery}
                                        disabled={recoveryLoading}
                                        className="w-full py-3 bg-gradient-to-r from-yellow-500 to-amber-600 text-black text-sm font-bold rounded-xl disabled:opacity-50"
                                    >
                                        {recoveryLoading ? 'Enviando...' : 'ENVIAR LINK'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Decorative elements */}
                        <div className="absolute bottom-0 right-0 w-64 h-64 bg-yellow-500/5 blur-[80px] rounded-full pointer-events-none" />
                    </div>

                </div>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-[#050505] text-white relative overflow-x-hidden font-sans selection:bg-yellow-500 selection:text-black">
            {/* Background Effects */}
            <div className="fixed inset-0 bg-[linear-gradient(rgba(234,179,8,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(234,179,8,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
            <div className="fixed inset-0 bg-gradient-to-b from-black via-transparent to-black pointer-events-none" />

            <Navbar />

            <div className="max-w-6xl mx-auto px-4 pt-28 pb-20 space-y-16 relative z-10">

                {/* HEADER */}
                <header className="text-center space-y-4 mb-12">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(234,179,8,0.1)]">
                        <Crown className="w-3 h-3" /> Membro VIP Ativo
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold mt-4 bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-400">
                        Scanner de Estilo <span className="text-yellow-400">PRO</span>
                    </h1>
                    <p className="text-gray-400 max-w-lg mx-auto text-sm md:text-base">
                        Análise Forense Completa + Consultoria de Estilo Instantânea.
                    </p>
                </header>

                {/* INPUT SECTION (PREMIUM GLASS CARD) */}
                {!result && (
                    <div className="max-w-5xl mx-auto animate-fade-in">
                        <div className="relative bg-[#0A0A0A]/80 border border-white/10 rounded-3xl p-8 md:p-12 overflow-hidden backdrop-blur-xl shadow-2xl">
                            {/* Decorative Background Elements */}
                            <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-500/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                            <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2 pointer-events-none" />

                            <div className="grid gap-12 md:grid-cols-2 relative z-10">
                                {/* Coluna 1: Upload Visual */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center shadow-lg shadow-yellow-500/20">
                                            <ScanFace className="w-5 h-5 text-black" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-white">Sua Foto</h3>
                                            <p className="text-xs text-gray-400">Rosto visível ou look completo</p>
                                        </div>
                                    </div>

                                    <div className="group relative border border-yellow-500/30 shadow-[0_0_15px_rgba(234,179,8,0.1)] rounded-2xl bg-black/40 hover:bg-black/60 transition-all duration-300 hover:border-yellow-500/60 hover:shadow-[0_0_25px_rgba(234,179,8,0.3)] overflow-hidden min-h-[300px] flex flex-col">
                                        {faceImage ? (
                                            <div className="relative h-full flex-1 min-h-[300px]">
                                                <img
                                                    src={faceImage}
                                                    alt="Preview"
                                                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                                />
                                                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />
                                                <div className="absolute bottom-4 right-4">
                                                    <button
                                                        onClick={() => setFaceImage(null)}
                                                        className="bg-red-500/80 hover:bg-red-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold backdrop-blur-md transition-colors flex items-center gap-2"
                                                    >
                                                        <XCircle className="w-4 h-4" /> Trocar Foto
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center relative">
                                                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 border border-white/10">
                                                    <ArrowUp className="w-6 h-6 text-gray-400 group-hover:text-yellow-400 transition-colors" />
                                                </div>
                                                <p className="text-gray-300 font-medium mb-2">Clique para carregar</p>
                                                <p className="text-xs text-gray-500 max-w-[200px]">
                                                    Suportamos JPG, PNG e WebP. Máximo 5MB.
                                                </p>
                                                {/* Hidden Upload Zone Trigger */}
                                                <div className="absolute inset-0 opacity-0 cursor-pointer z-20">
                                                    <UploadZone
                                                        label=""
                                                        onFileSelect={handleFileSelect}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Coluna 2: Contexto & Ação */}
                                <div className="flex flex-col h-full space-y-6">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-10 h-10 rounded-full bg-gray-800 border border-white/10 flex items-center justify-center">
                                            <Sparkles className="w-5 h-5 text-yellow-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-white">Onde você vai?</h3>
                                            <p className="text-xs text-gray-400">Dê contexto para a IA (Opcional)</p>
                                        </div>
                                    </div>

                                    <div className="flex-1 relative group">
                                        <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-500/20 to-primary/20 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition duration-500" />
                                        <textarea
                                            value={context}
                                            onChange={(e) => setContext(e.target.value)}
                                            placeholder="Ex: Tenho um encontro romântico num restaurante italiano à noite. Quero parecer elegante mas não muito formal. Meu cabelo está preso..."
                                            className="relative w-full h-full min-h-[200px] bg-[#111] border border-white/10 rounded-2xl p-6 text-gray-200 placeholder-gray-600 focus:outline-none focus:bg-[#151515] transition-all resize-none text-base leading-relaxed"
                                        />
                                    </div>

                                    <div className="pt-4">
                                        <Button
                                            onClick={handleAnalyze}
                                            disabled={!faceImage || loading}
                                            className={`w-full py-6 text-lg font-bold tracking-wide uppercase transition-all duration-500 rounded-xl ${loading
                                                ? 'bg-gray-800 text-gray-500 cursor-not-allowed border border-white/5'
                                                : 'bg-gradient-to-r from-yellow-500 via-amber-500 to-yellow-600 text-black hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(234,179,8,0.4)] border border-yellow-400/50'
                                                }`}
                                        >
                                            {loading ? (
                                                <span className="flex items-center justify-center gap-3">
                                                    <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                                    Processando...
                                                </span>
                                            ) : (
                                                <span className="flex items-center justify-center gap-2">
                                                    <Zap className="w-5 h-5 fill-current" />
                                                    Consultar Stylist IA
                                                </span>
                                            )}
                                        </Button>
                                        <p className="text-center text-[10px] text-gray-500 mt-3 font-mono">
                                            *Análise processada em tempo real por IA Generativa.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* RESULT DASHBOARD */}
                {result && (
                    <div className="space-y-10 animate-fade-in">

                        {/* === 1. SEU ARQUÉTIPO - EGO/WOW EFFECT (First Thing User Sees) === */}
                        <section className="space-y-6 mb-8">
                            <div ref={shareCardRef} className="relative max-w-sm mx-auto group cursor-pointer" onClick={saveShareCard}>
                                <div className="relative overflow-hidden rounded-3xl bg-black border border-white/10 shadow-[0_0_40px_rgba(234,179,8,0.15)] aspect-[9/16]">
                                    {faceImage && (
                                        <div className="absolute inset-0 z-0">
                                            <img src={faceImage} alt="User Background" className="w-full h-full object-cover opacity-40 blur-xl scale-110" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                                        </div>
                                    )}

                                    <div className="relative z-10 h-full flex flex-col justify-between p-8">
                                        <div className="flex justify-between items-start">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                                                    <span className="text-xs font-mono text-yellow-400 tracking-widest">PRIME AI VIP</span>
                                                </div>
                                                <h3 className="text-3xl font-black text-white italic uppercase leading-none">{result.analise_geral?.arquetipo || 'THE MAVERICK'}</h3>
                                            </div>
                                            <ScanFace className="w-8 h-8 text-white/50" />
                                        </div>

                                        <div className="flex-1 flex items-center justify-center">
                                            <div className="relative w-48 h-48">
                                                <div className="absolute inset-0 bg-yellow-500/20 blur-[60px] rounded-full animate-pulse" />
                                                {faceImage ? (
                                                    <img src={faceImage} className="w-full h-full object-cover rounded-full grayscale contrast-150 border-4 border-white/10" style={{ filter: 'brightness(0.7) contrast(1.5) grayscale(1)' }} />
                                                ) : (
                                                    <User className="w-full h-full text-white/20" />
                                                )}
                                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                    <span className="text-[10px] text-gray-400 uppercase tracking-wider">Nota Atual</span>
                                                    <span className="text-6xl font-black text-white drop-shadow-[0_0_10px_rgba(0,0,0,0.8)]">{currentScore}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                                                    <p className="text-[10px] text-gray-400 uppercase">Sua Nota</p>
                                                    <p className="text-xl font-bold text-white">{currentScore}</p>
                                                </div>
                                                <div className="bg-yellow-500/10 p-3 rounded-xl border border-yellow-500/30">
                                                    <p className="text-[10px] text-yellow-400/80 uppercase">Pode Atingir</p>
                                                    <p className="text-xl font-bold text-yellow-400">{potentialScore}</p>
                                                </div>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-[10px] text-gray-500 font-mono">prime-ai.com</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Texto de feedback - FORA do card */}
                        <div className="text-center mb-4 -mt-2">
                            <p className={`text-sm flex items-center justify-center gap-2 ${isSaving ? 'text-yellow-400' : 'text-gray-400'}`}>
                                {isSaving ? (
                                    <>Salvando imagem...</>
                                ) : (
                                    <><ArrowUp className="w-4 h-4" /> Toque no card para salvar imagem</>
                                )}
                            </p>
                        </div>

                        {/* === SHARE SECTION === */}
                        <section className="flex justify-center gap-3 mb-8">
                            <button
                                onClick={handleShareWhatsApp}
                                className="flex items-center gap-2 px-4 py-2.5 bg-[#25D366]/20 hover:bg-[#25D366]/30 border border-[#25D366]/30 rounded-full text-[#25D366] text-sm font-medium transition-all"
                            >
                                <MessageCircle className="w-4 h-4" />
                                WhatsApp
                            </button>
                            <button
                                onClick={handleShare}
                                className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-white text-sm font-medium transition-all"
                            >
                                <Share2 className="w-4 h-4" />
                                Compartilhar
                            </button>
                        </section>

                        {/* === 2. QUICK STATS - 4 Cards Grid === */}
                        <section className="grid grid-cols-2 gap-4 mb-8">
                            {/* Simetria */}
                            <div className="bg-[#1C1C1E] rounded-2xl p-4 border border-white/5">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-gray-400 text-xs">Simetria</span>
                                    <Sparkles className="w-3.5 h-3.5 text-gray-600" />
                                </div>
                                <div className="flex items-baseline gap-2 mb-2">
                                    <span className={`text-3xl font-bold ${(result.grafico_radar?.simetria || 75) >= 80 ? 'text-[#39FF14]' : (result.grafico_radar?.simetria || 75) >= 50 ? 'text-[#FFD60A]' : 'text-[#FF453A]'}`}>
                                        {result.grafico_radar?.simetria || 75}
                                    </span>
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded bg-white/5 ${(result.grafico_radar?.simetria || 75) >= 80 ? 'text-[#39FF14]' : (result.grafico_radar?.simetria || 75) >= 50 ? 'text-[#FFD60A]' : 'text-[#FF453A]'}`}>
                                        {(result.grafico_radar?.simetria || 75) >= 80 ? 'Good' : (result.grafico_radar?.simetria || 75) >= 50 ? 'Moderate' : 'Poor'}
                                    </span>
                                </div>
                                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full ${(result.grafico_radar?.simetria || 75) >= 80 ? 'bg-[#39FF14]' : (result.grafico_radar?.simetria || 75) >= 50 ? 'bg-[#FFD60A]' : 'bg-[#FF453A]'}`} style={{ width: `${result.grafico_radar?.simetria || 75}%` }} />
                                </div>
                            </div>

                            {/* Pele */}
                            <div className="bg-[#1C1C1E] rounded-2xl p-4 border border-white/5">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-gray-400 text-xs">Qualidade Pele</span>
                                    <Sparkles className="w-3.5 h-3.5 text-gray-600" />
                                </div>
                                <div className="flex items-baseline gap-2 mb-2">
                                    <span className={`text-3xl font-bold ${(result.grafico_radar?.qualidade_pele || result.grafico_radar?.pele || 80) >= 80 ? 'text-[#39FF14]' : (result.grafico_radar?.qualidade_pele || result.grafico_radar?.pele || 80) >= 50 ? 'text-[#FFD60A]' : 'text-[#FF453A]'}`}>
                                        {result.grafico_radar?.qualidade_pele || result.grafico_radar?.pele || 80}
                                    </span>
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded bg-white/5 ${(result.grafico_radar?.qualidade_pele || result.grafico_radar?.pele || 80) >= 80 ? 'text-[#39FF14]' : (result.grafico_radar?.qualidade_pele || result.grafico_radar?.pele || 80) >= 50 ? 'text-[#FFD60A]' : 'text-[#FF453A]'}`}>
                                        {(result.grafico_radar?.qualidade_pele || result.grafico_radar?.pele || 80) >= 80 ? 'Good' : (result.grafico_radar?.qualidade_pele || result.grafico_radar?.pele || 80) >= 50 ? 'Moderate' : 'Poor'}
                                    </span>
                                </div>
                                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full ${(result.grafico_radar?.qualidade_pele || result.grafico_radar?.pele || 80) >= 80 ? 'bg-[#39FF14]' : (result.grafico_radar?.qualidade_pele || result.grafico_radar?.pele || 80) >= 50 ? 'bg-[#FFD60A]' : 'bg-[#FF453A]'}`} style={{ width: `${result.grafico_radar?.qualidade_pele || result.grafico_radar?.pele || 80}%` }} />
                                </div>
                            </div>

                            {/* Erros - PAIN POINT */}
                            <div className="bg-[#1C1C1E] rounded-2xl p-4 border border-rose-500/20">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-rose-400 text-xs font-medium">Pontos de Atenção</span>
                                    <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-3xl font-bold text-rose-500">{result.rosto?.pontos_de_atencao?.length || 0}</span>
                                    <span className="text-[10px] px-1.5 py-0.5 rounded text-rose-400 bg-rose-500/10">
                                        {(result.rosto?.pontos_de_atencao?.length || 0) > 0 ? 'Detectados' : 'Nenhum'}
                                    </span>
                                </div>
                            </div>

                            {/* Formato */}
                            <div className="bg-[#1C1C1E] rounded-2xl p-4 border border-white/5">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-gray-400 text-xs">Formato Rosto</span>
                                    <ScanFace className="w-3.5 h-3.5 text-gray-600" />
                                </div>
                                <span className="text-2xl font-bold text-white">{formatFaceShape(result.rosto?.formato_rosto || 'Oval')}</span>
                            </div>
                        </section>

                        {/* === 3. RADAR CHART (Pontos Cegos) === */}
                        <section className="space-y-6">
                            <h2 className="text-2xl md:text-3xl font-bold text-center text-white tracking-wider">
                                ONDE ESTÃO SEUS PONTOS CEGOS
                            </h2>

                            <div className="w-full bg-black/40 border border-white/5 rounded-3xl p-4 relative" style={{ minHeight: '350px' }}>
                                {radarData && radarData.length > 0 && (
                                    <ResponsiveContainer width="100%" height={350}>
                                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                                            <PolarGrid stroke="rgba(255,255,255,0.1)" />
                                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: 11, fontWeight: 'bold' }} />
                                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                            <Radar name="Atual" dataKey="A" stroke="#ffffff" strokeWidth={2} fill="#ffffff" fillOpacity={0.1} />
                                            <Radar name="Potencial" dataKey="B" stroke="#FACC15" strokeWidth={3} strokeDasharray="4 4" fill="#FACC15" fillOpacity={0.2} />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                )}

                                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-6 text-sm font-mono">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-white/20 border border-white rounded-full" />
                                        <span className="text-gray-400">Atual</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-[#FACC15]/20 border border-[#FACC15] shadow-[0_0_10px_rgba(250,204,21,0.4)] rounded-full" />
                                        <span className="text-[#FACC15] font-bold">Potencial</span>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* === 4. INSIGHTS (Expandable Boxes - DESBLOQUEADOS) === */}
                        <section className="space-y-4">
                            <h2 className="text-xl font-bold text-white tracking-wider border-l-4 border-yellow-500 pl-4">
                                INSIGHTS <span className="text-yellow-400">(VIP)</span>
                            </h2>

                            {/* Positivos - Expandable */}
                            <div className="bg-[#1C1C1E] rounded-2xl border border-yellow-500/30 overflow-hidden">
                                <button
                                    onClick={() => setExpandedSection(expandedSection === 'positives' ? null : 'positives')}
                                    className="w-full p-4 flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-yellow-400" />
                                        <span className="text-white font-medium">Positivos</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-mono bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded">VIP</span>
                                        <ChevronDown className={`w-5 h-5 text-yellow-400 transition-transform ${expandedSection === 'positives' ? 'rotate-180' : ''}`} />
                                    </div>
                                </button>
                                {expandedSection === 'positives' && (
                                    <div className="px-4 pb-4 space-y-2 border-t border-white/5 pt-3">
                                        {/* Pontos fortes da análise da IA */}
                                        {result.rosto?.pontos_fortes?.length > 0 ? (
                                            result.rosto.pontos_fortes.map((ponto: string, i: number) => (
                                                <div key={i} className="flex items-start gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-[#39FF14] mt-1.5 flex-shrink-0" />
                                                    <span className="text-gray-300 text-sm">{ponto}</span>
                                                </div>
                                            ))
                                        ) : (
                                            /* Fallback com dados específicos */
                                            <>
                                                <div className="flex items-start gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-[#39FF14] mt-1.5 flex-shrink-0" />
                                                    <span className="text-gray-300 text-sm">Estrutura ósssea bem definida para formato {formatFaceShape(result?.rosto?.formato_rosto || 'Oval')}</span>
                                                </div>
                                                <div className="flex items-start gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-[#39FF14] mt-1.5 flex-shrink-0" />
                                                    <span className="text-gray-300 text-sm">
                                                        {(result.grafico_radar?.simetria || 75) >= 80
                                                            ? `Excelente simetria facial (${result.grafico_radar?.simetria || 75}%) - acima da média`
                                                            : `Boa simetria facial (${result.grafico_radar?.simetria || 75}%) - dentro da norma`}
                                                    </span>
                                                </div>
                                                <div className="flex items-start gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-[#39FF14] mt-1.5 flex-shrink-0" />
                                                    <span className="text-gray-300 text-sm">
                                                        {parseFloat(gap) > 1
                                                            ? `Alto potencial de evolução com visagismo (+${gap} pontos possíveis)`
                                                            : `Já próximo do seu potencial máximo - foco em manutenção`}
                                                    </span>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Pontos de Atenção - Expandable UNLOCKED */}
                            <div className="bg-[#1C1C1E] rounded-2xl border border-red-500/30 overflow-hidden">
                                <button
                                    onClick={() => setExpandedSection(expandedSection === 'negatives' ? null : 'negatives')}
                                    className="w-full p-4 flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4 text-red-400" />
                                        <span className="text-white font-medium">Pontos de Atenção</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-mono bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded">VIP</span>
                                        <ChevronDown className={`w-5 h-5 text-red-400 transition-transform ${expandedSection === 'negatives' ? 'rotate-180' : ''}`} />
                                    </div>
                                </button>
                                {expandedSection === 'negatives' && (
                                    <div className="px-4 pb-4 space-y-2 border-t border-white/5 pt-3">
                                        {result.rosto?.pontos_de_atencao?.map((ponto: string, i: number) => (
                                            <div key={i} className="flex items-start gap-2">
                                                <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                                                <span className="text-gray-300 text-sm">{ponto}</span>
                                            </div>
                                        )) || (
                                                <div className="flex items-start gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                                                    <span className="text-gray-300 text-sm">Nenhum ponto crítico detectado</span>
                                                </div>
                                            )}
                                    </div>
                                )}
                            </div>

                            {/* Corte de Cabelo Ideal - Expandable UNLOCKED */}
                            <div className="bg-[#1C1C1E] rounded-2xl border border-yellow-500/30 overflow-hidden">
                                <button
                                    onClick={() => setExpandedSection(expandedSection === 'haircut' ? null : 'haircut')}
                                    className="w-full p-4 flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-2">
                                        <Sparkles className="w-4 h-4 text-yellow-400" />
                                        <span className="text-white font-medium">Corte de Cabelo Ideal</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-mono bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded">VIP</span>
                                        <ChevronDown className={`w-5 h-5 text-yellow-400 transition-transform ${expandedSection === 'haircut' ? 'rotate-180' : ''}`} />
                                    </div>
                                </button>
                                {expandedSection === 'haircut' && (
                                    <div className="px-4 pb-4 space-y-2 border-t border-white/5 pt-3">
                                        <div className="flex items-start gap-2">
                                            <div className="w-2 h-2 rounded-full bg-yellow-500 mt-1.5 flex-shrink-0" />
                                            <span className="text-gray-300 text-sm">{result.sugestao_imediata?.corte_ideal || result.plano_harmonizacao?.passo_1_imediato || 'Corte que valorize seu formato de rosto'}</span>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <div className="w-2 h-2 rounded-full bg-yellow-500 mt-1.5 flex-shrink-0" />
                                            <span className="text-gray-300 text-sm">{result.sugestao_imediata?.produto_chave || 'Produtos para volume e textura'}</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Sugestões de Estilo - Expandable UNLOCKED */}
                            <div className="bg-[#1C1C1E] rounded-2xl border border-yellow-500/30 overflow-hidden">
                                <button
                                    onClick={() => setExpandedSection(expandedSection === 'style' ? null : 'style')}
                                    className="w-full p-4 flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-2">
                                        <Star className="w-4 h-4 text-yellow-400" />
                                        <span className="text-white font-medium">Sugestões de Estilo</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-mono bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded">VIP</span>
                                        <ChevronDown className={`w-5 h-5 text-yellow-400 transition-transform ${expandedSection === 'style' ? 'rotate-180' : ''}`} />
                                    </div>
                                </button>
                                {expandedSection === 'style' && (
                                    <div className="px-4 pb-4 space-y-2 border-t border-white/5 pt-3">
                                        <div className="flex items-start gap-2">
                                            <div className="w-2 h-2 rounded-full bg-yellow-500 mt-1.5 flex-shrink-0" />
                                            <span className="text-gray-300 text-sm">{result.plano_harmonizacao?.passo_2_medio_prazo || 'Investir em peças que destaquem seus pontos fortes'}</span>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <div className="w-2 h-2 rounded-full bg-yellow-500 mt-1.5 flex-shrink-0" />
                                            <span className="text-gray-300 text-sm">{result.plano_harmonizacao?.passo_3_longo_prazo || 'Manter rotina de cuidados com a pele'}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* === 5. STYLIST SECTION (PREMIUM) === */}
                        <section className="space-y-8">
                            <h2 className="text-2xl md:text-3xl font-bold text-white tracking-wider border-l-4 border-yellow-500 pl-4">
                                CONSULTORIA DE ESTILO <span className="text-yellow-500 text-base align-middle ml-2 border border-yellow-500/30 bg-yellow-500/10 px-2 py-0.5 rounded-full">PREMIUM</span>
                            </h2>

                            {/* SCORE & VIBE CARD */}
                            <div className="relative p-8 rounded-3xl bg-gray-900/80 border border-yellow-500/30 backdrop-blur-xl overflow-hidden transition-all hover:bg-gray-900/90 hover:shadow-[0_0_50px_rgba(234,179,8,0.15)]">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/10 blur-[80px] rounded-full pointer-events-none" />

                                <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 border-b border-white/10 pb-8 mb-8">
                                    <div className="text-center group cursor-default">
                                        <p className="text-gray-400 text-xs uppercase tracking-[0.2em] mb-2 group-hover:text-yellow-500 transition-colors">Nota do Look</p>
                                        <div className="text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-yellow-300 to-yellow-600 drop-shadow-[0_0_15px_rgba(234,179,8,0.3)]">
                                            {typeof result.analise_geral?.nota_final === 'number'
                                                ? result.analise_geral.nota_final.toFixed(1)
                                                : result.analise_geral?.nota_final || "8.5"}
                                        </div>
                                    </div>
                                    <div className="flex-1 text-center md:text-left">
                                        <h3 className="text-2xl font-bold text-white mb-2">Vibe: <span className="text-yellow-100">{result.feedback_rapido?.vibe_transmitida}</span></h3>
                                        <p className="text-gray-400 text-sm">{result.analise_geral?.resumo_brutal}</p>
                                    </div>
                                </div>

                                <div className="grid gap-6 md:grid-cols-2">
                                    <div className="p-5 rounded-2xl bg-green-500/5 border border-green-500/20 hover:bg-green-500/10 transition-colors">
                                        <h3 className="flex items-center gap-2 text-green-400 font-bold mb-2 uppercase text-xs tracking-wider">
                                            <CheckCircle2 className="w-5 h-5" /> O que funcionou
                                        </h3>
                                        <p className="text-gray-300 text-sm leading-relaxed">{result.feedback_rapido?.o_que_funcionou}</p>
                                    </div>
                                    <div className="p-5 rounded-2xl bg-red-500/5 border border-red-500/20 hover:bg-red-500/10 transition-colors">
                                        <h3 className="flex items-center gap-2 text-red-400 font-bold mb-2 uppercase text-xs tracking-wider">
                                            <AlertTriangle className="w-5 h-5" /> Atenção aos detalhes
                                        </h3>
                                        <p className="text-gray-300 text-sm leading-relaxed">{result.feedback_rapido?.o_que_matou_o_look}</p>
                                    </div>
                                </div>
                            </div>

                            {/* NEW: COLOR ANALYSIS & WARDROBE */}
                            <div className="grid md:grid-cols-2 gap-8">
                                {/* CARTELA DE CORES */}
                                <div className="bg-[#0A0A0A] border border-white/10 rounded-3xl p-8 relative overflow-hidden group hover:border-white/20 transition-all">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-[50px] rounded-full pointer-events-none" />

                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
                                            <Palette className="w-5 h-5 text-purple-400" />
                                        </div>
                                        <div>
                                            <h3 className="tex-lg font-bold text-white">Análise Cromática</h3>
                                            <p className="text-xs text-purple-300/70">Sua paleta ideal</p>
                                        </div>
                                    </div>

                                    {result.analise_cromatica ? (
                                        <div className="space-y-6">
                                            <div>
                                                <h4 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-300 to-indigo-400">
                                                    {result.analise_cromatica.estacao}
                                                </h4>
                                                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                                                    {result.analise_cromatica.descricao}
                                                </p>
                                            </div>

                                            <div className="space-y-2">
                                                <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Cores Poderosas</span>
                                                <div className="flex gap-2">
                                                    {result.analise_cromatica.paleta_ideal?.map((color: string, i: number) => (
                                                        <div key={i} className="group/color relative">
                                                            <div
                                                                className="w-10 h-10 rounded-full border border-white/10 shadow-lg cursor-pointer hover:scale-110 transition-transform"
                                                                style={{ backgroundColor: color }}
                                                            />
                                                            <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[8px] bg-black px-1 rounded opacity-0 group-hover/color:opacity-100 transition-opacity whitespace-nowrap text-gray-400">
                                                                {color}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="h-32 flex items-center justify-center text-gray-600 text-sm italic">
                                            Execute uma nova análise para liberar...
                                        </div>
                                    )}
                                </div>

                                {/* GUIA DE VESTUÁRIO */}
                                <div className="bg-[#0A0A0A] border border-white/10 rounded-3xl p-8 relative overflow-hidden hover:border-white/20 transition-all">
                                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/10 blur-[50px] rounded-full pointer-events-none" />

                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                                            <Shirt className="w-5 h-5 text-blue-400" />
                                        </div>
                                        <div>
                                            <h3 className="tex-lg font-bold text-white">Guia de Estilo</h3>
                                            <p className="text-xs text-blue-300/70">O que vestir agora</p>
                                        </div>
                                    </div>

                                    {result.guia_vestuario ? (
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2 text-blue-300/80 text-xs font-bold uppercase tracking-wider">
                                                    <ShoppingBag className="w-3 h-3" /> Peças Chave
                                                </div>
                                                <ul className="text-sm text-gray-300 space-y-1 ml-1">
                                                    {result.guia_vestuario.pecas_chave?.map((item: string, i: number) => (
                                                        <li key={i} className="flex items-start gap-2">
                                                            <span className="text-blue-500 mt-1.5">•</span> {item}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>

                                            {result.guia_vestuario.acessorios && (
                                                <div className="pt-2 border-t border-white/5">
                                                    <div className="flex items-center gap-2 text-amber-300/80 text-xs font-bold uppercase tracking-wider mb-1">
                                                        <Glasses className="w-3 h-3" /> Acessórios
                                                    </div>
                                                    <p className="text-sm text-gray-300 leading-relaxed">
                                                        {result.guia_vestuario.acessorios}
                                                    </p>
                                                </div>
                                            )}

                                            {result.guia_vestuario.evitar && (
                                                <div className="pt-2 border-t border-white/5">
                                                    <div className="flex items-center gap-2 text-red-400/80 text-xs font-bold uppercase tracking-wider mb-1">
                                                        <Ban className="w-3 h-3" /> Evitar
                                                    </div>
                                                    <p className="text-xs text-gray-400 leading-relaxed">
                                                        {result.guia_vestuario.evitar.join(", ")}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="h-32 flex items-center justify-center text-gray-600 text-sm italic">
                                            Execute uma nova análise para liberar...
                                        </div>
                                    )}
                                </div>
                            </div>
                        </section>

                        {/* LEGAL DISCLAIMER */}
                        <div className="text-center pb-8 opacity-40 hover:opacity-100 transition-opacity">
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">
                                Nota Legal: Análise baseada em visagismo e geometria. Não substitui aconselhamento médico.
                            </p>
                        </div>

                    </div>
                )}
            </div>
            <Footer />
        </main>
    );
}
