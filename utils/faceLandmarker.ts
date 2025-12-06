// faceLandmarker.ts - VERSÃO CORRIGIDA V4

import { FilesetResolver, FaceLandmarker } from "@mediapipe/tasks-vision";

let faceLandmarker: FaceLandmarker | null = null;

export async function initializeFaceLandmarker() {
    if (faceLandmarker) return faceLandmarker;

    const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
    );

    faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
            delegate: "GPU"
        },
        outputFaceBlendshapes: true,
        runningMode: "IMAGE",
        numFaces: 1
    });

    return faceLandmarker;
}

export async function detectFaceLandmarks(imageElement: HTMLImageElement): Promise<any[]> {
    if (!faceLandmarker) await initializeFaceLandmarker();
    if (!faceLandmarker) throw new Error("Falha ao inicializar MediaPipe");

    return new Promise((resolve, reject) => {
        const process = () => {
            try {
                const result = faceLandmarker!.detect(imageElement);
                if (!result.faceLandmarks || result.faceLandmarks.length === 0) {
                    reject(new Error("Nenhum rosto detectado"));
                } else {
                    resolve(result.faceLandmarks[0]);
                }
            } catch (e) {
                reject(e);
            }
        };

        if (imageElement.complete && imageElement.naturalHeight !== 0) {
            process();
        } else {
            imageElement.onload = process;
            imageElement.onerror = () => reject(new Error("Erro ao carregar imagem"));
        }
    });
}

// ═══════════════════════════════════════════════════════════════════════════════
// LANDMARKS
// ═══════════════════════════════════════════════════════════════════════════════

const LM = {
    TOPO: 10,
    QUEIXO: 152,
    TESTA_ESQ: 70,
    TESTA_DIR: 300,
    TEMPORAL_ESQ: 127,
    TEMPORAL_DIR: 356,
    ZIGOMA_ESQ: 234,
    ZIGOMA_DIR: 454,
    GONION_ESQ: 172,
    GONION_DIR: 397,
    QUEIXO_ESQ: 176,
    QUEIXO_DIR: 400,
    GLABELA: 9,
    BASE_NARIZ: 2,
};

// ═══════════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════════

interface Ponto { x: number; y: number; z: number; }

type FormatoRosto =
    'OVAL' | 'REDONDO' | 'QUADRADO' | 'RETANGULAR' |
    'CORACAO' | 'TRIANGULAR' | 'TRIANGULAR_INVERTIDO' |
    'DIAMANTE' | 'OBLONGO';

type TipoMandibula = 'MUITO_ANGULAR' | 'ANGULAR' | 'MODERADO' | 'SUAVE' | 'MUITO_SUAVE';

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITÁRIOS SEGUROS
// ═══════════════════════════════════════════════════════════════════════════════

const safe = (v: any, fallback = 0): number =>
    (v === undefined || v === null || Number.isNaN(v)) ? fallback : Number(v);

const safeFixed = (v: any, d = 2): string => safe(v).toFixed(d);

const dist = (p1?: Ponto, p2?: Ponto): number => {
    if (!p1 || !p2) return 0;
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
};

const angulo = (p1?: Ponto, vertex?: Ponto, p2?: Ponto): number => {
    if (!p1 || !vertex || !p2) return 135;

    const v1 = { x: p1.x - vertex.x, y: p1.y - vertex.y };
    const v2 = { x: p2.x - vertex.x, y: p2.y - vertex.y };

    const dot = v1.x * v2.x + v1.y * v2.y;
    const m1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
    const m2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);

    if (m1 === 0 || m2 === 0) return 135;

    return Math.acos(Math.max(-1, Math.min(1, dot / (m1 * m2)))) * (180 / Math.PI);
};

// ═══════════════════════════════════════════════════════════════════════════════
// CLASSIFICAÇÃO DE MANDÍBULA CORRIGIDA
// ═══════════════════════════════════════════════════════════════════════════════

function classificarMandibula(anguloMedio: number): TipoMandibula {
    // CORRIGIDO: Os ranges estavam causando classificação errada
    if (anguloMedio < 110) return 'MUITO_ANGULAR';
    if (anguloMedio < 125) return 'ANGULAR';      // 121° = ANGULAR ✓
    if (anguloMedio < 138) return 'MODERADO';
    if (anguloMedio < 150) return 'SUAVE';
    return 'MUITO_SUAVE';
}

// ═══════════════════════════════════════════════════════════════════════════════
// MEDIDAS FACIAIS
// ═══════════════════════════════════════════════════════════════════════════════

interface Medidas {
    alturaLargura: number;
    testaZigomas: number;
    mandibulaZigomas: number;
    queixoZigomas: number;
    anguloGonion: number;
    tipoMandibula: TipoMandibula;
    uniformidade: number;
    afilamento: number;
}

function calcularMedidas(landmarks: Ponto[]): Medidas {
    const pt = (i: number) => landmarks[i];

    const altura = dist(pt(LM.TOPO), pt(LM.QUEIXO));
    const largTesta = dist(pt(LM.TESTA_ESQ), pt(LM.TESTA_DIR));
    const largTemporal = dist(pt(LM.TEMPORAL_ESQ), pt(LM.TEMPORAL_DIR));
    const largZigomas = dist(pt(LM.ZIGOMA_ESQ), pt(LM.ZIGOMA_DIR)) || 1;
    const largMandibula = dist(pt(LM.GONION_ESQ), pt(LM.GONION_DIR));
    const largQueixo = dist(pt(LM.QUEIXO_ESQ), pt(LM.QUEIXO_DIR));

    // Ângulos no gonion
    const anguloEsq = angulo(pt(LM.ZIGOMA_ESQ), pt(LM.GONION_ESQ), pt(LM.QUEIXO));
    const anguloDir = angulo(pt(LM.ZIGOMA_DIR), pt(LM.GONION_DIR), pt(LM.QUEIXO));
    const anguloGonion = (anguloEsq + anguloDir) / 2;

    const alturaLargura = altura / largZigomas;
    const testaZigomas = largTesta / largZigomas;
    const mandibulaZigomas = largMandibula / largZigomas;
    const queixoZigomas = largQueixo / largZigomas;

    // Uniformidade
    const larguras = [testaZigomas, largTemporal / largZigomas, 1.0, mandibulaZigomas];
    const media = larguras.reduce((a, b) => a + b, 0) / larguras.length;
    const variancia = larguras.reduce((s, v) => s + Math.pow(v - media, 2), 0) / larguras.length;
    const uniformidade = Math.sqrt(variancia) * 100;

    const afilamento = ((largZigomas - largQueixo) / largZigomas) * 100;

    return {
        alturaLargura,
        testaZigomas,
        mandibulaZigomas,
        queixoZigomas,
        anguloGonion,
        tipoMandibula: classificarMandibula(anguloGonion),
        uniformidade,
        afilamento,
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// CLASSIFICAÇÃO V4 - CORRIGIDA
// ═══════════════════════════════════════════════════════════════════════════════

const DESCRICOES: Record<FormatoRosto, string> = {
    OVAL: "Rosto equilibrado, contornos suaves, proporção harmônica.",
    REDONDO: "Largura e altura similares, bochechas cheias, contornos suaves.",
    QUADRADO: "Mandíbula forte e angular. Testa, zigomas e mandíbula com larguras similares.",
    RETANGULAR: "Como quadrado, mas mais alongado. Mandíbula angular.",
    OBLONGO: "Rosto alongado com contornos suaves.",
    CORACAO: "Testa larga, queixo pontudo, afilamento gradual.",
    TRIANGULAR_INVERTIDO: "Testa mais larga que mandíbula, ângulos definidos.",
    TRIANGULAR: "Mandíbula mais larga que testa.",
    DIAMANTE: "Zigomas proeminentes, testa E mandíbula significativamente mais estreitas.",
};

interface Resultado {
    formato: FormatoRosto;
    confianca: number;
    segundaOpcao: FormatoRosto;
    confiancaSegunda: number;
    descricao: string;
    medidas: Medidas;
    debug: { regras: string[]; pontos: Record<FormatoRosto, number>; };
}

export function calculateBeautyScore(landmarks: Ponto[]): number {
    const m = calcularMedidas(landmarks);
    const pt = (i: number) => landmarks[i];

    // 1. Simetria Real (Comparando Lado Esquerdo vs Direito)
    // Distância do centro (Glabela/Queixo) até as extremidades
    const centro = pt(LM.GLABELA);
    const zigomaEsq = dist(pt(LM.ZIGOMA_ESQ), centro);
    const zigomaDir = dist(pt(LM.ZIGOMA_DIR), centro);
    const mandEsq = dist(pt(LM.GONION_ESQ), centro);
    const mandDir = dist(pt(LM.GONION_DIR), centro);

    const difZigoma = Math.abs(zigomaEsq - zigomaDir);
    const difMand = Math.abs(mandEsq - mandDir);
    const assimetriaTotal = (difZigoma + difMand) / ((zigomaEsq + mandEsq) / 2); // % de erro

    // Score Simetria (0 a 10) - Assimetria > 10% é punida
    // CALIBRAÇÃO V2: Reduzido punição de 50x para 25x (mais tolerante)
    const scoreSimetria = Math.max(0, 10 - (assimetriaTotal * 25));

    // 2. Proporção Áurea (1.618)
    const goldenRatio = 1.618;
    const deviation = Math.abs(m.alturaLargura - goldenRatio);
    // CALIBRAÇÃO V2: Reduzido punição de 8x para 4x (mais tolerante com rostos largos/estreitos)
    const scoreProporcao = Math.max(0, 10 - (deviation * 4));

    // 3. Estrutura Mandibular
    // CALIBRAÇÃO V2: Aumentado base scores para valorizar definição
    let scoreMandibula = 7.0;
    if (m.tipoMandibula === 'MUITO_ANGULAR') scoreMandibula = 10.0; // Chris Hemsworth tier
    else if (m.tipoMandibula === 'ANGULAR') scoreMandibula = 9.5;
    else if (m.tipoMandibula === 'MODERADO') scoreMandibula = 8.5;
    else if (m.tipoMandibula === 'SUAVE') scoreMandibula = 7.5;

    // 4. Terços Faciais (Equilíbrio)
    // Testa (Trichion-Glabela) vs Médio (Glabela-Subnasale) vs Inferior (Subnasale-Menton)
    // Simplificado usando proporções já calculadas
    // CALIBRAÇÃO V2: Reduzido punição de 10x para 5x
    const scoreTerços = Math.max(0, 10 - (Math.abs(m.testaZigomas - 0.8) * 5));

    // Média Ponderada
    // Simetria: 30%, Proporção: 30%, Mandíbula: 25%, Terços: 15%
    let finalScore = (
        (scoreSimetria * 0.30) +
        (scoreProporcao * 0.30) +
        (scoreMandibula * 0.25) +
        (scoreTerços * 0.15)
    );

    // Normalização para escala "Humana" (7.2 a 9.9)
    // CALIBRAÇÃO V2: Subiu piso de 6.5 para 7.2 (ninguém quer ser um 6)
    finalScore = Math.min(9.9, Math.max(7.2, finalScore));

    // Bônus para "High Tier" (Se for muito simétrico e angular, empurra para 9.5+)
    if (scoreSimetria > 9.0 && scoreMandibula > 9.0) {
        finalScore += 0.3;
    }

    return Number(Math.min(9.9, finalScore).toFixed(1));
}

export function classificarFormatoRosto(landmarks: Ponto[]): Resultado {
    const m = calcularMedidas(landmarks);
    const regras: string[] = [];

    let p: Record<FormatoRosto, number> = {
        OVAL: 0, REDONDO: 0, QUADRADO: 0, RETANGULAR: 0,
        OBLONGO: 0, CORACAO: 0, TRIANGULAR_INVERTIDO: 0,
        TRIANGULAR: 0, DIAMANTE: 0,
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // REGRAS CORRIGIDAS
    // ═══════════════════════════════════════════════════════════════════════════

    const ehAngular = m.tipoMandibula === 'MUITO_ANGULAR' || m.tipoMandibula === 'ANGULAR';
    const ehSuave = m.tipoMandibula === 'SUAVE' || m.tipoMandibula === 'MUITO_SUAVE';
    const mandibulaPertoDosZigomas = m.mandibulaZigomas >= 0.82;  // 82%+ = próximo
    const testaPertoDosZigomas = m.testaZigomas >= 0.85;
    const ehCompacto = m.alturaLargura >= 0.95 && m.alturaLargura <= 1.25;
    const ehAlongado = m.alturaLargura > 1.30;

    // ═══════════════════════════════════════════════════════════════════════════
    // QUADRADO - PRIORIDADE ALTA SE:
    // - Mandíbula angular (< 125°)
    // - Mandíbula próxima dos zigomas (≥ 82%)
    // - Proporção compacta
    // ═══════════════════════════════════════════════════════════════════════════

    if (ehAngular) {
        p.QUADRADO += 40;
        regras.push(`QUADRADO: mandíbula ${m.tipoMandibula} (${safeFixed(m.anguloGonion, 0)}°) → +40`);
    }

    if (mandibulaPertoDosZigomas) {
        const bonus = Math.round((m.mandibulaZigomas - 0.80) * 150);
        p.QUADRADO += bonus;
        regras.push(`QUADRADO: mandíbula ${safeFixed(m.mandibulaZigomas * 100, 0)}% dos zigomas → +${bonus}`);
    }

    if (ehCompacto) {
        p.QUADRADO += 20;
        regras.push(`QUADRADO: proporção compacta (${safeFixed(m.alturaLargura)}) → +20`);
    }

    if (m.uniformidade < 12) {
        p.QUADRADO += 15;
        regras.push(`QUADRADO: uniformidade alta (${safeFixed(m.uniformidade, 1)}%) → +15`);
    }

    // Combinação fatal: angular + mandíbula larga + compacto = QUADRADO CERTO
    if (ehAngular && mandibulaPertoDosZigomas && ehCompacto) {
        p.QUADRADO += 30;
        regras.push(`QUADRADO: COMBINAÇÃO PERFEITA → +30 BONUS`);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // RETANGULAR - Quadrado + Alongado
    // ═══════════════════════════════════════════════════════════════════════════

    if (ehAlongado && ehAngular && mandibulaPertoDosZigomas) {
        p.RETANGULAR += 60;
        regras.push(`RETANGULAR: alongado + angular + mandíbula larga → +60`);
    }

    // Penalidade se não for alongado
    if (!ehAlongado) {
        p.RETANGULAR -= 40;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // DIAMANTE - MUITO RESTRITIVO AGORA
    // Precisa: testa E mandíbula SIGNIFICATIVAMENTE menores que zigomas (< 80%)
    // ═══════════════════════════════════════════════════════════════════════════

    const testaEstreita = m.testaZigomas < 0.80;
    const mandibulaEstreita = m.mandibulaZigomas < 0.80;

    if (testaEstreita && mandibulaEstreita) {
        p.DIAMANTE += 60;
        regras.push(`DIAMANTE: testa (${safeFixed(m.testaZigomas * 100, 0)}%) E mandíbula (${safeFixed(m.mandibulaZigomas * 100, 0)}%) < 80% → +60`);
    } else {
        // PENALIDADE FORTE se não atender ao critério
        p.DIAMANTE -= 30;
        regras.push(`DIAMANTE: não atende critério (testa ou mandíbula ≥ 80%) → -30`);
    }

    // Se mandíbula é angular, provavelmente não é diamante (diamante tem contornos suaves)
    if (ehAngular) {
        p.DIAMANTE -= 20;
        regras.push(`DIAMANTE: mandíbula angular incompatível → -20`);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // REDONDO
    // ═══════════════════════════════════════════════════════════════════════════

    if (m.alturaLargura >= 0.92 && m.alturaLargura <= 1.12) {
        p.REDONDO += 30;
        regras.push(`REDONDO: proporção circular → +30`);
    }

    if (ehSuave) {
        p.REDONDO += 35;
        regras.push(`REDONDO: mandíbula suave → +35`);
    }

    if (m.uniformidade < 8) {
        p.REDONDO += 20;
        regras.push(`REDONDO: muito uniforme → +20`);
    }

    // Penalidade se angular
    if (ehAngular) {
        p.REDONDO -= 40;
        regras.push(`REDONDO: mandíbula angular incompatível → -40`);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // OVAL
    // ═══════════════════════════════════════════════════════════════════════════

    if (m.alturaLargura >= 1.25 && m.alturaLargura <= 1.50) {
        p.OVAL += 30;
        regras.push(`OVAL: proporção ideal → +30`);
    }

    if (m.mandibulaZigomas >= 0.75 && m.mandibulaZigomas <= 0.88) {
        p.OVAL += 25;
        regras.push(`OVAL: mandíbula moderada → +25`);
    }

    if (m.tipoMandibula === 'MODERADO') {
        p.OVAL += 20;
        regras.push(`OVAL: ângulo moderado → +20`);
    }

    // Penalidade se angular demais
    if (ehAngular) {
        p.OVAL -= 25;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // OBLONGO
    // ═══════════════════════════════════════════════════════════════════════════

    if (m.alturaLargura > 1.50) {
        p.OBLONGO += 50;
        regras.push(`OBLONGO: muito alongado → +50`);
    }

    if (!ehAlongado) {
        p.OBLONGO -= 50;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // CORAÇÃO / TRIANGULAR INVERTIDO
    // ═══════════════════════════════════════════════════════════════════════════

    if (m.testaZigomas > 1.0) {
        p.CORACAO += 35;
        p.TRIANGULAR_INVERTIDO += 40;
        regras.push(`CORAÇÃO/TRIANG_INV: testa larga → +35/+40`);
    }

    if (m.afilamento > 50) {
        p.CORACAO += 25;
        regras.push(`CORAÇÃO: queixo pontudo → +25`);
    }

    if (m.mandibulaZigomas < 0.80) {
        p.CORACAO += 20;
        p.TRIANGULAR_INVERTIDO += 25;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // TRIANGULAR
    // ═══════════════════════════════════════════════════════════════════════════

    if (m.mandibulaZigomas > 1.0) {
        p.TRIANGULAR += 50;
        regras.push(`TRIANGULAR: mandíbula maior que zigomas → +50`);
    }

    if (m.testaZigomas < 0.85) {
        p.TRIANGULAR += 25;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // RESULTADO FINAL
    // ═══════════════════════════════════════════════════════════════════════════

    const ordenado = Object.entries(p)
        .sort(([, a], [, b]) => b - a) as [FormatoRosto, number][];

    const [melhor, scoreMelhor] = ordenado[0];
    const [segundo, scoreSegundo] = ordenado[1];

    const maxScore = 130;
    const confianca = Math.min(95, Math.max(20, (scoreMelhor / maxScore) * 100));
    const confiancaSegunda = Math.min(90, Math.max(10, (scoreSegundo / maxScore) * 100));

    // ═══════════════════════════════════════════════════════════════════════════
    // LOG
    // ═══════════════════════════════════════════════════════════════════════════

    console.log("\n╔═══════════════════════════════════════════════════════════════╗");
    console.log("║           🔬 ANÁLISE FACIAL V4 (CORRIGIDA)                    ║");
    console.log("╚═══════════════════════════════════════════════════════════════╝\n");

    console.log("📏 PROPORÇÕES:");
    console.log(`   Altura/Largura:       ${safeFixed(m.alturaLargura, 3)}`);
    console.log(`   Testa/Zigomas:        ${safeFixed(m.testaZigomas * 100, 0)}%`);
    console.log(`   Mandíbula/Zigomas:    ${safeFixed(m.mandibulaZigomas * 100, 0)}%`);
    console.log(`   Queixo/Zigomas:       ${safeFixed(m.queixoZigomas * 100, 0)}%`);

    console.log("\n📐 ÂNGULOS:");
    console.log(`   Ângulo Gonion:        ${safeFixed(m.anguloGonion, 1)}°`);
    console.log(`   Tipo Mandíbula:       ${m.tipoMandibula}`);

    console.log("\n📊 ÍNDICES:");
    console.log(`   Uniformidade:         ${safeFixed(m.uniformidade, 1)}%`);
    console.log(`   Afilamento:           ${safeFixed(m.afilamento, 1)}%`);

    console.log("\n🔍 CLASSIFICAÇÕES:");
    console.log(`   Angular:              ${ehAngular ? 'SIM ✓' : 'NÃO'}`);
    console.log(`   Mandíbula ≥82%:       ${mandibulaPertoDosZigomas ? 'SIM ✓' : 'NÃO'}`);
    console.log(`   Compacto:             ${ehCompacto ? 'SIM ✓' : 'NÃO'}`);

    console.log("\n📋 REGRAS APLICADAS:");
    regras.forEach(r => console.log(`   • ${r}`));

    console.log("\n─────────────────────────────────────────────────────────────────");
    console.log("🎯 PONTUAÇÃO FINAL:\n");

    for (const [formato, score] of ordenado) {
        const barra = "█".repeat(Math.max(0, Math.floor(Math.max(0, score + 50) / 5)));
        const marcador = formato === melhor ? " 👑" : "";
        console.log(`   ${formato.padEnd(22)} ${String(score).padStart(4)} pts ${barra}${marcador}`);
    }

    console.log("\n═══════════════════════════════════════════════════════════════");
    console.log(`🏆 RESULTADO: ${melhor}`);
    console.log(`📊 Confiança: ${safeFixed(confianca, 0)}%`);
    console.log(`🥈 Segunda: ${segundo} (${safeFixed(confiancaSegunda, 0)}%)`);
    console.log("═══════════════════════════════════════════════════════════════\n");

    return {
        formato: melhor,
        confianca: Math.round(confianca),
        segundaOpcao: segundo,
        confiancaSegunda: Math.round(confiancaSegunda),
        descricao: DESCRICOES[melhor],
        medidas: m,
        debug: { regras, pontos: p },
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// FUNÇÃO DE CONVENIÊNCIA
// ═══════════════════════════════════════════════════════════════════════════════

export function calculateFaceMetrics(landmarks: any[]): any {
    if (!landmarks || landmarks.length === 0) return null;

    try {
        const resultado = classificarFormatoRosto(landmarks);
        const m = resultado.medidas;

        return {
            prop_altura_largura: safe(m.alturaLargura),
            prop_testa_zigomas: safe(m.testaZigomas),
            prop_mandibula_zigomas: safe(m.mandibulaZigomas),
            prop_queixo_zigomas: safe(m.queixoZigomas),
            largura_testa_media: safe(m.testaZigomas),
            largura_zigomas: 1.0,
            largura_mandibula_media: safe(m.mandibulaZigomas),
            largura_queixo: safe(m.queixoZigomas),
            angulo_mandibula_medio: safe(m.anguloGonion),
            angulo_queixo: safe(m.anguloGonion),
            indice_uniformidade: safe(m.uniformidade),
            indice_afilamento_inferior: safe(m.afilamento),
            indice_angularidade: safe(150 - m.anguloGonion),
            indice_circularidade: safe(100 - Math.abs(m.alturaLargura - 1.0) * 100),
            contorno_tipo_mandibula: m.tipoMandibula,
            formato_rosto: resultado.formato,
            confianca: resultado.confianca,
            segunda_opcao: resultado.segundaOpcao,
            confianca_segunda: resultado.confiancaSegunda,
            descricao: resultado.descricao,
            regras_aplicadas: resultado.debug.regras,
        };
    } catch (error) {
        console.error("Erro:", error);
        return {
            formato_rosto: "OVAL",
            confianca: 50,
            erro: true,
        };
    }
}