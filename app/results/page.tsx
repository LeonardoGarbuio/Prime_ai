"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import html2canvas from "html2canvas";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import { BadgeGrid, NewBadgePopup } from "@/components/ui/BadgeCard";
import { useBadges, Badge } from "@/lib/hooks/useBadges";
import {
    Star,
    ScanFace,
    User,
    ShieldCheck,
    Lock,
    CheckCircle2,
    XCircle,
    CreditCard,
    Zap,
    ArrowDown,
    ArrowUp,
    ChevronDown,
    Sparkles,
    AlertTriangle,
    Info,
    Trophy,
    History
} from "lucide-react";
import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ResponsiveContainer
} from 'recharts';

// Score color helper
const getScoreColor = (score: number) => {
    if (score >= 80) return { text: "text-[#39FF14]", bg: "bg-[#39FF14]", label: "Good" };
    if (score >= 50) return { text: "text-[#FFD60A]", bg: "bg-[#FFD60A]", label: "Moderate" };
    return { text: "text-[#FF453A]", bg: "bg-[#FF453A]", label: "Poor" };
};

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

export default function ResultsPage() {
    const [result, setResult] = useState<any>(null);
    const [expandedSection, setExpandedSection] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [newBadge, setNewBadge] = useState<Badge | null>(null);
    const [hasSaved, setHasSaved] = useState(false);
    const shareCardRef = useRef<HTMLDivElement>(null);

    const { badges, checkAndUnlockBadges, getUnlockedBadges, getBadgeStats } = useBadges();

    // Function to save share card as image
    const saveShareCard = async () => {
        if (!shareCardRef.current || isSaving) return;

        setIsSaving(true);
        try {
            const canvas = await html2canvas(shareCardRef.current, {
                backgroundColor: '#000000',
                scale: 2, // Higher quality
                useCORS: true,
                allowTaint: true,
            });

            // Convert to blob
            canvas.toBlob(async (blob) => {
                if (!blob) return;

                // Try native share/save on mobile
                if (navigator.share && navigator.canShare && navigator.canShare({ files: [new File([blob], 'prime-ai-result.png', { type: 'image/png' })] })) {
                    try {
                        await navigator.share({
                            files: [new File([blob], 'prime-ai-result.png', { type: 'image/png' })],
                            title: 'Meu Resultado Prime AI',
                        });
                    } catch (e) {
                        // User cancelled or share failed, fall back to download
                        downloadImage(canvas);
                    }
                } else {
                    // Fallback: download the image
                    downloadImage(canvas);
                }
            }, 'image/png', 1.0);
        } catch (e) {
            console.error('Error saving image:', e);
            alert('Erro ao salvar imagem. Tire um print manual.');
        } finally {
            setIsSaving(false);
        }
    };

    const downloadImage = (canvas: HTMLCanvasElement) => {
        const link = document.createElement('a');
        link.download = `prime-ai-resultado-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png', 1.0);
        link.click();
    };

    useEffect(() => {
        const data = localStorage.getItem("analysisResult");
        if (data) {
            const parsed = JSON.parse(data);
            console.log("Loaded Analysis Result:", parsed);
            setResult(parsed);
        }
    }, []);

    // Verificar badges quando resultado carrega
    useEffect(() => {
        if (result && !hasSaved) {
            setHasSaved(true);
            // Verificar badges
            setTimeout(() => {
                const newBadges = checkAndUnlockBadges([], result);
                if (newBadges.length > 0) {
                    const badge = badges.find(b => b.id === newBadges[0]);
                    if (badge) {
                        setNewBadge({ ...badge, unlocked: true });
                    }
                }
            }, 500);
        }
    }, [result, hasSaved, checkAndUnlockBadges, badges]);

    // Link único do produto Prime AI VIP
    const VIP_CHECKOUT_LINK = "https://pay.kiwify.com.br/7tVLmhI";

    const handleCheckout = () => {
        window.location.href = VIP_CHECKOUT_LINK;
    };

    if (!result) {
        return (
            <main className="min-h-screen bg-black text-white flex items-center justify-center">
                <div className="animate-pulse text-primary font-mono">Carregando analise...</div>
            </main>
        );
    }

    // Data extraction - use AI values from the analysis
    console.log("📊 Result data:", result);

    const currentScore = parseFloat(String(result.analise_geral?.nota_final || "7.5"));
    const potentialScore = Math.min(10.0, parseFloat(String(result.analise_geral?.nota_potencial || (currentScore + 1.0).toFixed(1))));
    const gap = (potentialScore - currentScore).toFixed(1);

    // Real data from AI analysis
    const symmetryScore = result.grafico_radar?.simetria ?? result.grafico_radar?.Simetria ?? 75;
    const skinScore = result.grafico_radar?.qualidade_pele ?? result.grafico_radar?.pele ?? result.grafico_radar?.Pele ?? 80;
    const faceShape = result.rosto?.formato_rosto || "Oval";

    // Count real errors from pontos_de_atencao
    const errorsCount = result.rosto?.pontos_de_atencao?.length || 0;

    const radarData = [
        { subject: 'SIMETRIA', A: result.grafico_radar?.simetria ?? result.grafico_radar?.Simetria ?? 65, B: 95, fullMark: 100 },
        { subject: 'PELE', A: result.grafico_radar?.qualidade_pele ?? result.grafico_radar?.pele ?? 70, B: 90, fullMark: 100 },
        { subject: 'ESTRUTURA', A: result.grafico_radar?.estrutura_ossea ?? 60, B: 98, fullMark: 100 },
        { subject: 'HARMONIA', A: result.grafico_radar?.harmonia_facial ?? result.grafico_radar?.terco_medio ?? 55, B: 92, fullMark: 100 },
        { subject: 'PROPORCAO', A: result.grafico_radar?.proporcao_aurea ?? 50, B: 96, fullMark: 100 },
    ];

    const getArchetype = () => {
        if (result.analise_geral?.arquetipo) return result.analise_geral.arquetipo;
        const shape = faceShape.toLowerCase();
        if (shape.includes('quadrado')) return "THE RULER";
        if (shape.includes('diamante')) return "THE HUNTER";
        if (shape.includes('oval')) return "THE NOBLE";
        if (shape.includes('triangulo')) return "THE CREATOR";
        if (shape.includes('coracao')) return "THE CHARMER";
        if (shape.includes('redondo')) return "THE MYSTIC";
        return "THE MAVERICK";
    };

    const symmetryColor = getScoreColor(symmetryScore);
    const skinColor = getScoreColor(skinScore);

    const badgeStats = getBadgeStats();
    const unlockedBadges = getUnlockedBadges();

    return (
        <main className="min-h-screen bg-[#050505] text-white relative overflow-x-hidden font-sans selection:bg-primary selection:text-black">
            {/* Badge Popup */}
            {newBadge && (
                <NewBadgePopup badge={newBadge} onClose={() => setNewBadge(null)} />
            )}

            {/* Background */}
            <div className="fixed inset-0 bg-[linear-gradient(rgba(57,255,20,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(57,255,20,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
            <div className="fixed inset-0 bg-gradient-to-b from-black via-transparent to-black pointer-events-none" />

            <Navbar />

            <div className="max-w-6xl mx-auto px-4 pt-28 pb-20 space-y-10 relative z-10">

                {/* === 1. SEU ARQUÉTIPO - EGO/WOW EFFECT (First Thing User Sees) === */}
                <section className="space-y-6 mb-8">
                    <div ref={shareCardRef} className="relative max-w-sm mx-auto group cursor-pointer" onClick={saveShareCard}>
                        <div className="relative overflow-hidden rounded-3xl bg-black border border-white/10 shadow-[0_0_40px_rgba(57,255,20,0.15)] aspect-[9/16]">
                            {localStorage.getItem("faceImage") && (
                                <div className="absolute inset-0 z-0">
                                    <img src={localStorage.getItem("faceImage")!} alt="User Background" className="w-full h-full object-cover opacity-40 blur-xl scale-110" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                                </div>
                            )}

                            <div className="relative z-10 h-full flex flex-col justify-between p-8">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                                            <span className="text-xs font-mono text-primary tracking-widest">PRIME AI ANALYTICS</span>
                                        </div>
                                        <h3 className="text-3xl font-black text-white italic uppercase leading-none">{getArchetype()}</h3>
                                    </div>
                                    <ScanFace className="w-8 h-8 text-white/50" />
                                </div>

                                <div className="flex-1 flex items-center justify-center">
                                    <div className="relative w-48 h-48">
                                        <div className="absolute inset-0 bg-primary/20 blur-[60px] rounded-full animate-pulse" />
                                        {localStorage.getItem("faceImage") ? (
                                            <img src={localStorage.getItem("faceImage")!} className="w-full h-full object-cover rounded-full grayscale contrast-150 border-4 border-white/10" style={{ filter: 'brightness(0.7) contrast(1.5) grayscale(1)' }} />
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
                                        <div className="bg-primary/10 p-3 rounded-xl border border-primary/30">
                                            <p className="text-[10px] text-primary/80 uppercase">Pode Atingir</p>
                                            <p className="text-xl font-bold text-primary">{potentialScore}</p>
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-[10px] text-gray-500 font-mono">prime-ai.com</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="absolute -bottom-10 left-0 right-0 text-center">
                            <p className={`text-sm flex items-center justify-center gap-2 ${isSaving ? 'text-primary' : 'text-gray-400 animate-bounce'}`}>
                                {isSaving ? (
                                    <>Salvando imagem...</>
                                ) : (
                                    <><ArrowUp className="w-4 h-4" /> Toque para salvar imagem</>
                                )}
                            </p>
                        </div>
                    </div>
                </section>

                {/* === 2. QUICK STATS - 4 Cards Grid === */}
                <section className="grid grid-cols-2 gap-4 mb-8 mt-16">
                    {/* Simetria */}
                    <div className="bg-[#1C1C1E] rounded-2xl p-4 border border-white/5">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-gray-400 text-xs">Simetria</span>
                            <Info className="w-3.5 h-3.5 text-gray-600" />
                        </div>
                        <div className="flex items-baseline gap-2 mb-2">
                            <span className={`text-3xl font-bold ${symmetryColor.text}`}>{symmetryScore}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${symmetryColor.text} bg-white/5`}>{symmetryColor.label}</span>
                        </div>
                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div className={`h-full ${symmetryColor.bg} rounded-full`} style={{ width: `${symmetryScore}%` }} />
                        </div>
                    </div>

                    {/* Pele */}
                    <div className="bg-[#1C1C1E] rounded-2xl p-4 border border-white/5">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-gray-400 text-xs">Qualidade Pele</span>
                            <Sparkles className="w-3.5 h-3.5 text-gray-600" />
                        </div>
                        <div className="flex items-baseline gap-2 mb-2">
                            <span className={`text-3xl font-bold ${skinColor.text}`}>{skinScore}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${skinColor.text} bg-white/5`}>{skinColor.label}</span>
                        </div>
                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div className={`h-full ${skinColor.bg} rounded-full`} style={{ width: `${skinScore}%` }} />
                        </div>
                    </div>

                    {/* Erros - PAIN POINT */}
                    <div className="bg-[#1C1C1E] rounded-2xl p-4 border border-rose-500/20">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-rose-400 text-xs font-medium">Pontos de Atencao</span>
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-rose-500">{errorsCount}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded text-rose-400 bg-rose-500/10">{errorsCount > 0 ? 'Detectados' : 'Nenhum'}</span>
                        </div>
                    </div>

                    {/* Formato */}
                    <div className="bg-[#1C1C1E] rounded-2xl p-4 border border-white/5">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-gray-400 text-xs">Formato Rosto</span>
                            <ScanFace className="w-3.5 h-3.5 text-gray-600" />
                        </div>
                        <span className="text-2xl font-bold text-white">{formatFaceShape(faceShape)}</span>
                    </div>
                </section>

                {/* === RADAR CHART (Pontos Cegos) === */}
                <section className="space-y-6">
                    <h2 className="text-2xl md:text-3xl font-bold text-center text-white tracking-wider">
                        ONDE ESTAO SEUS <span className="text-primary">PONTOS CEGOS</span>
                    </h2>

                    <div className="w-full bg-black/40 border border-white/5 rounded-3xl p-4 relative" style={{ minHeight: '350px' }}>
                        <ResponsiveContainer width="100%" height={350}>
                            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: 11, fontWeight: 'bold' }} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                <Radar name="Atual" dataKey="A" stroke="#ffffff" strokeWidth={2} fill="#ffffff" fillOpacity={0.1} />
                                <Radar name="Potencial" dataKey="B" stroke="#39FF14" strokeWidth={3} strokeDasharray="4 4" fill="#39FF14" fillOpacity={0.2} />
                            </RadarChart>
                        </ResponsiveContainer>

                        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-6 text-sm font-mono">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-white/20 border border-white rounded-full" />
                                <span className="text-gray-400">Atual</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-primary/20 border border-primary border-dashed rounded-full" />
                                <span className="text-primary font-bold">Potencial</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* === INSIGHTS (Expandable Boxes) === */}
                <section className="space-y-4">
                    <h2 className="text-xl font-bold text-white tracking-wider border-l-4 border-primary pl-4">
                        INSIGHTS
                    </h2>

                    {/* Positivos - Expandable */}
                    <div className="bg-[#1C1C1E] rounded-2xl border border-white/5 overflow-hidden">
                        <button
                            onClick={() => setExpandedSection(expandedSection === 'positives' ? null : 'positives')}
                            className="w-full p-4 flex items-center justify-between"
                        >
                            <span className="text-white font-medium">Positivos</span>
                            <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${expandedSection === 'positives' ? 'rotate-180' : ''}`} />
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
                                    <>
                                        <div className="flex items-start gap-2">
                                            <div className="w-2 h-2 rounded-full bg-[#39FF14] mt-1.5 flex-shrink-0" />
                                            <span className="text-gray-300 text-sm">Estrutura óssea bem definida para formato {formatFaceShape(faceShape)}</span>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <div className="w-2 h-2 rounded-full bg-[#39FF14] mt-1.5 flex-shrink-0" />
                                            <span className="text-gray-300 text-sm">
                                                {symmetryScore >= 80
                                                    ? `Excelente simetria facial (${symmetryScore}%) - acima da média`
                                                    : `Boa simetria facial (${symmetryScore}%) - dentro da norma`}
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

                    {/* Pontos de Atencao - Locked */}
                    <div className="bg-[#1C1C1E] rounded-2xl border border-white/5 overflow-hidden opacity-70">
                        <button
                            onClick={() => setExpandedSection(expandedSection === 'negatives' ? null : 'negatives')}
                            className="w-full p-4 flex items-center justify-between"
                        >
                            <div className="flex items-center gap-2">
                                <Lock className="w-4 h-4 text-gray-600" />
                                <span className="text-gray-400 font-medium">Pontos de Atencao</span>
                            </div>
                            <ChevronDown className={`w-5 h-5 text-gray-600 transition-transform ${expandedSection === 'negatives' ? 'rotate-180' : ''}`} />
                        </button>
                        {expandedSection === 'negatives' && (
                            <div className="px-4 pb-4 border-t border-white/5 pt-3">
                                <div className="text-center py-2">
                                    <span className="text-gray-500 text-sm">Conteudo bloqueado - Acesso VIP</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Corte de Cabelo - Locked */}
                    <div className="bg-[#1C1C1E] rounded-2xl border border-white/5 overflow-hidden opacity-70">
                        <button
                            onClick={() => setExpandedSection(expandedSection === 'haircut' ? null : 'haircut')}
                            className="w-full p-4 flex items-center justify-between"
                        >
                            <div className="flex items-center gap-2">
                                <Lock className="w-4 h-4 text-gray-600" />
                                <span className="text-gray-400 font-medium">Corte de Cabelo Ideal</span>
                            </div>
                            <ChevronDown className={`w-5 h-5 text-gray-600 transition-transform ${expandedSection === 'haircut' ? 'rotate-180' : ''}`} />
                        </button>
                        {expandedSection === 'haircut' && (
                            <div className="px-4 pb-4 border-t border-white/5 pt-3">
                                <div className="text-center py-2">
                                    <span className="text-gray-500 text-sm">Conteudo bloqueado - Acesso VIP</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sugestoes de Estilo - Locked */}
                    <div className="bg-[#1C1C1E] rounded-2xl border border-white/5 overflow-hidden opacity-70">
                        <button
                            onClick={() => setExpandedSection(expandedSection === 'style' ? null : 'style')}
                            className="w-full p-4 flex items-center justify-between"
                        >
                            <div className="flex items-center gap-2">
                                <Lock className="w-4 h-4 text-gray-600" />
                                <span className="text-gray-400 font-medium">Sugestoes de Estilo</span>
                            </div>
                            <ChevronDown className={`w-5 h-5 text-gray-600 transition-transform ${expandedSection === 'style' ? 'rotate-180' : ''}`} />
                        </button>
                        {expandedSection === 'style' && (
                            <div className="px-4 pb-4 border-t border-white/5 pt-3">
                                <div className="text-center py-2">
                                    <span className="text-gray-500 text-sm">Conteudo bloqueado - Acesso VIP</span>
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                {/* === VIP SECTION (Original) === */}
                <div className="p-10 rounded-3xl bg-gradient-to-b from-gray-900 to-black border border-primary/30 text-center space-y-8 relative overflow-hidden group shadow-[0_0_50px_rgba(57,255,20,0.1)]">
                    <div className="absolute inset-0 opacity-5 mix-blend-overlay" />

                    <div className="space-y-4 relative z-10">
                        <h2 className="text-4xl md:text-6xl font-black text-white leading-none tracking-tighter italic transform -skew-x-6">
                            CHEGA DE SEGREDOS. <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-yellow-400 to-primary animate-pulse">VOCE E VIP!</span>
                        </h2>

                        <div className="bg-white/5 p-6 rounded-xl border border-white/10 max-w-lg mx-auto text-left space-y-3">
                            <h3 className="text-gray-400 text-sm font-mono uppercase tracking-widest mb-4">O que esta incluso:</h3>
                            <ul className="space-y-2">
                                <li className="flex items-center gap-2 text-gray-300">
                                    <CheckCircle2 className="w-4 h-4 text-primary" />
                                    Relatorio Completo de Simetria
                                </li>
                                <li className="flex items-center gap-2 text-gray-300">
                                    <CheckCircle2 className="w-4 h-4 text-primary" />
                                    Guia Glow Up (Cabelo e Maquiagem)
                                </li>
                                <li className="flex items-center gap-2 text-gray-300">
                                    <CheckCircle2 className="w-4 h-4 text-primary" />
                                    Tutorial de Angulos para Fotos
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="flex flex-col items-center gap-6 relative z-10">
                        <Button
                            type="button"
                            size="lg"
                            className="w-full md:w-auto px-12 h-24 text-xl md:text-2xl font-black uppercase tracking-widest animate-pulse shadow-[0_0_60px_rgba(57,255,20,0.4)] hover:shadow-[0_0_100px_rgba(57,255,20,0.6)] hover:scale-105 transition-all duration-300 border-2 border-primary bg-black text-primary hover:bg-primary hover:text-black"
                            onClick={handleCheckout}
                        >
                            DESBLOQUEAR MEU DOSSIE E ACESSO VIP AGORA
                            <Zap className="ml-3 w-8 h-8 fill-current" />
                        </Button>
                        <div className="flex flex-col items-center gap-1">
                            <span className="text-lg font-bold text-white">
                                De <span className="text-red-500 line-through decoration-2">R$ 97,00</span> por <span className="text-primary text-2xl">R$ 19,90</span>
                            </span>
                            <span className="text-xs text-gray-500 font-mono">(Oferta de Lancamento por Tempo Limitado)</span>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-center gap-6 text-gray-500 text-sm">
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-primary" />
                            <span>Garantia de 7 dias ou seu dinheiro de volta</span>
                        </div>
                        <div className="flex items-center gap-4 opacity-70">
                            <div className="flex items-center gap-1">
                                <Lock className="w-3 h-3" /> Pagamento Seguro
                            </div>
                            <span>-</span>
                            <div className="flex gap-2">
                                <CreditCard className="w-4 h-4" />
                                <span className="font-bold">PIX</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </main >
    );
}

