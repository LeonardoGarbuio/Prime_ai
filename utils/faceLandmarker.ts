// faceLandmarker.ts - V8 BALANCEADA

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
    GLABELA: 9,
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
};

// ═══════════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════════

interface Ponto { x: number; y: number; z: number; }

type FormatoRosto = 'OVAL' | 'REDONDO' | 'QUADRADO' | 'RETANGULAR' | 'CORACAO' | 'DIAMANTE';

type TipoMandibula = 'MUITO_ANGULAR' | 'ANGULAR' | 'MODERADO' | 'SUAVE' | 'MUITO_SUAVE';

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITÁRIOS
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

function classificarMandibula(anguloMedio: number): TipoMandibula {
    if (anguloMedio < 110) return 'MUITO_ANGULAR';
    if (anguloMedio < 125) return 'ANGULAR';
    if (anguloMedio < 138) return 'MODERADO';
    if (anguloMedio < 150) return 'SUAVE';
    return 'MUITO_SUAVE';
}

// ═══════════════════════════════════════════════════════════════════════════════
// MEDIDAS FACIAIS
// ═══════════════════════════════════════════════════════════════════════════════

interface Medidas {
    alturaLargura: number;
    alturaFacial: number;
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

    const alturaTotal = dist(pt(LM.TOPO), pt(LM.QUEIXO));
    const alturaFacialDist = dist(pt(LM.GLABELA), pt(LM.QUEIXO));

    const largTesta = dist(pt(LM.TESTA_ESQ), pt(LM.TESTA_DIR));
    const largTemporal = dist(pt(LM.TEMPORAL_ESQ), pt(LM.TEMPORAL_DIR));
    const largZigomas = dist(pt(LM.ZIGOMA_ESQ), pt(LM.ZIGOMA_DIR)) || 1;
    const largMandibula = dist(pt(LM.GONION_ESQ), pt(LM.GONION_DIR));
    const largQueixo = dist(pt(LM.QUEIXO_ESQ), pt(LM.QUEIXO_DIR));

    const anguloEsq = angulo(pt(LM.ZIGOMA_ESQ), pt(LM.GONION_ESQ), pt(LM.QUEIXO));
    const anguloDir = angulo(pt(LM.ZIGOMA_DIR), pt(LM.GONION_DIR), pt(LM.QUEIXO));
    const anguloGonion = (anguloEsq + anguloDir) / 2;

    const alturaLargura = alturaTotal / largZigomas;
    const alturaFacial = alturaFacialDist / largZigomas;
    const testaZigomas = largTesta / largZigomas;
    const mandibulaZigomas = largMandibula / largZigomas;
    const queixoZigomas = largQueixo / largZigomas;

    const larguras = [testaZigomas, largTemporal / largZigomas, 1.0, mandibulaZigomas];
    const media = larguras.reduce((a, b) => a + b, 0) / larguras.length;
    const variancia = larguras.reduce((s, v) => s + Math.pow(v - media, 2), 0) / larguras.length;
    const uniformidade = Math.sqrt(variancia) * 100;

    const afilamento = ((largZigomas - largQueixo) / largZigomas) * 100;

    return {
        alturaLargura,
        alturaFacial,
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
// DESCRIÇÕES
// ═══════════════════════════════════════════════════════════════════════════════

const DESCRICOES: Record<FormatoRosto, string> = {
    OVAL: "Rosto equilibrado e harmônico, contornos suaves, proporção clássica ideal.",
    REDONDO: "Largura e altura similares, bochechas cheias, sem ângulos definidos.",
    QUADRADO: "Mandíbula forte e angular, largura uniforme entre testa, zigomas e mandíbula.",
    RETANGULAR: "Rosto alongado com mandíbula angular. Altura maior que largura.",
    CORACAO: "Testa larga com queixo pontudo, afilamento gradual até o queixo.",
    DIAMANTE: "Zigomas proeminentes, testa e mandíbula significativamente mais estreitas.",
};

// ═══════════════════════════════════════════════════════════════════════════════
// CLASSIFICAÇÃO V8 - BALANCEADA
// ═══════════════════════════════════════════════════════════════════════════════

interface Resultado {
    formato: FormatoRosto;
    confianca: number;
    segunda_opcao: FormatoRosto;
    confianca_segunda: number;
    descricao: string;
    medidas: Medidas;
    debug: { regras: string[]; pontos: Record<FormatoRosto, number>; };
}

export function classificarFormatoRosto(landmarks: Ponto[]): Resultado {
    const m = calcularMedidas(landmarks);
    const regras: string[] = [];

    let p: Record<FormatoRosto, number> = {
        OVAL: 0,
        REDONDO: 0,
        QUADRADO: 0,
        RETANGULAR: 0,
        CORACAO: 0,
        DIAMANTE: 0,
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // FATORES CHAVE
    // ═══════════════════════════════════════════════════════════════════════════

    const ehMuitoAngular = m.tipoMandibula === 'MUITO_ANGULAR';
    const ehAngular = m.tipoMandibula === 'ANGULAR' || ehMuitoAngular;
    const ehModerado = m.tipoMandibula === 'MODERADO';
    const ehSuave = m.tipoMandibula === 'SUAVE' || m.tipoMandibula === 'MUITO_SUAVE';

    const mandibulaLarga = m.mandibulaZigomas >= 0.85;
    const mandibulaMedia = m.mandibulaZigomas >= 0.78 && m.mandibulaZigomas < 0.85;
    const mandibulaEstreita = m.mandibulaZigomas < 0.75;

    const testaLarga = m.testaZigomas > 1.0;
    const testaEstreita = m.testaZigomas < 0.78;
    const testaNormal = !testaLarga && !testaEstreita;

    const queixoPontudo = m.afilamento > 55;
    const queixoArredondado = m.afilamento < 40;

    const uniformidadeAlta = m.uniformidade < 10;
    const uniformidadeMedia = m.uniformidade >= 10 && m.uniformidade < 15;

    // Proporção usando altura facial (glabela-queixo)
    const ratio = m.alturaFacial;

    // ═══════════════════════════════════════════════════════════════════════════
    // 1. QUADRADO - Precisa de COMBINAÇÃO de fatores
    // ═══════════════════════════════════════════════════════════════════════════

    let pontosQuadrado = 0;
    let criteriosQuadrado = 0;

    // Critério 1: Mandíbula angular
    if (ehMuitoAngular) {
        pontosQuadrado += 30;
        criteriosQuadrado++;
        regras.push(`QUADRADO: mandíbula muito angular (${safeFixed(m.anguloGonion, 0)}°) → +30`);
    } else if (ehAngular) {
        pontosQuadrado += 25;
        criteriosQuadrado++;
        regras.push(`QUADRADO: mandíbula angular (${safeFixed(m.anguloGonion, 0)}°) → +25`);
    }

    // Critério 2: Mandíbula larga
    if (mandibulaLarga) {
        pontosQuadrado += 25;
        criteriosQuadrado++;
        regras.push(`QUADRADO: mandíbula larga (${safeFixed(m.mandibulaZigomas * 100, 0)}%) → +25`);
    }

    // Critério 3: Uniformidade alta
    if (uniformidadeAlta) {
        pontosQuadrado += 20;
        criteriosQuadrado++;
        regras.push(`QUADRADO: uniformidade alta (${safeFixed(m.uniformidade, 1)}%) → +20`);
    }

    // Critério 4: Proporção adequada (não muito alongado)
    if (ratio <= 1.35) {
        pontosQuadrado += 15;
        criteriosQuadrado++;
        regras.push(`QUADRADO: proporção adequada (${safeFixed(ratio, 2)}) → +15`);
    }

    // BÔNUS: Se atende 3+ critérios = combinação forte
    if (criteriosQuadrado >= 3) {
        pontosQuadrado += 25;
        regras.push(`QUADRADO: combinação forte (${criteriosQuadrado}/4 critérios) → +25`);
    }

    // PENALIDADES para Quadrado
    if (ehSuave) {
        pontosQuadrado -= 40;
        regras.push(`QUADRADO: mandíbula suave → -40`);
    }
    if (ratio > 1.45) {
        pontosQuadrado -= 30;
        regras.push(`QUADRADO: muito alongado → -30`);
    }
    if (mandibulaEstreita) {
        pontosQuadrado -= 35;
        regras.push(`QUADRADO: mandíbula estreita → -35`);
    }

    p.QUADRADO = pontosQuadrado;

    // ═══════════════════════════════════════════════════════════════════════════
    // 2. RETANGULAR - Alongado + Angular + Mandíbula média/larga
    // ═══════════════════════════════════════════════════════════════════════════

    let pontosRetangular = 0;

    // Critério principal: Proporção alongada
    if (ratio > 1.45) {
        pontosRetangular += 40;
        regras.push(`RETANGULAR: muito alongado (${safeFixed(ratio, 2)}) → +40`);
    } else if (ratio > 1.35) {
        pontosRetangular += 25;
        regras.push(`RETANGULAR: alongado (${safeFixed(ratio, 2)}) → +25`);
    }

    // Bônus por mandíbula angular
    if (ehAngular && ratio > 1.35) {
        pontosRetangular += 20;
        regras.push(`RETANGULAR: angular + alongado → +20`);
    }

    // Bônus por mandíbula larga
    if (mandibulaLarga && ratio > 1.35) {
        pontosRetangular += 15;
        regras.push(`RETANGULAR: mandíbula larga → +15`);
    }

    // PENALIDADES
    if (ratio <= 1.25) {
        pontosRetangular -= 50;
        regras.push(`RETANGULAR: não é alongado → -50`);
    }
    if (ehSuave) {
        pontosRetangular -= 25;
        regras.push(`RETANGULAR: mandíbula suave → -25`);
    }

    p.RETANGULAR = pontosRetangular;

    // ═══════════════════════════════════════════════════════════════════════════
    // 3. OVAL - Proporção média + Mandíbula moderada + Contornos suaves
    // ═══════════════════════════════════════════════════════════════════════════

    let pontosOval = 0;

    // Critério: Proporção ideal
    if (ratio >= 1.25 && ratio <= 1.45) {
        pontosOval += 35;
        regras.push(`OVAL: proporção ideal (${safeFixed(ratio, 2)}) → +35`);
    }

    // Critério: Mandíbula moderada
    if (ehModerado) {
        pontosOval += 30;
        regras.push(`OVAL: mandíbula moderada → +30`);
    }

    // Critério: Mandíbula média (não larga, não estreita)
    if (mandibulaMedia) {
        pontosOval += 25;
        regras.push(`OVAL: mandíbula média (${safeFixed(m.mandibulaZigomas * 100, 0)}%) → +25`);
    }

    // Critério: Afilamento moderado
    if (m.afilamento >= 40 && m.afilamento <= 55) {
        pontosOval += 15;
        regras.push(`OVAL: afilamento moderado → +15`);
    }

    // PENALIDADES
    if (ehMuitoAngular) {
        pontosOval -= 35;
        regras.push(`OVAL: mandíbula muito angular → -35`);
    } else if (ehAngular) {
        pontosOval -= 20;
        regras.push(`OVAL: mandíbula angular → -20`);
    }
    if (mandibulaLarga) {
        pontosOval -= 25;
        regras.push(`OVAL: mandíbula muito larga → -25`);
    }

    p.OVAL = pontosOval;

    // ═══════════════════════════════════════════════════════════════════════════
    // 4. REDONDO - Proporção circular + Mandíbula suave + Uniforme
    // ═══════════════════════════════════════════════════════════════════════════

    let pontosRedondo = 0;

    // Critério: Proporção circular
    if (ratio >= 0.90 && ratio <= 1.20) {
        pontosRedondo += 35;
        regras.push(`REDONDO: proporção circular (${safeFixed(ratio, 2)}) → +35`);
    }

    // Critério: Mandíbula suave
    if (ehSuave) {
        pontosRedondo += 40;
        regras.push(`REDONDO: mandíbula suave → +40`);
    }

    // Critério: Queixo arredondado
    if (queixoArredondado) {
        pontosRedondo += 20;
        regras.push(`REDONDO: queixo arredondado → +20`);
    }

    // Critério: Uniformidade
    if (uniformidadeAlta) {
        pontosRedondo += 15;
        regras.push(`REDONDO: uniforme → +15`);
    }

    // PENALIDADES
    if (ehAngular) {
        pontosRedondo -= 50;
        regras.push(`REDONDO: mandíbula angular → -50`);
    }
    if (ratio > 1.35) {
        pontosRedondo -= 40;
        regras.push(`REDONDO: muito alongado → -40`);
    }

    p.REDONDO = pontosRedondo;

    // ═══════════════════════════════════════════════════════════════════════════
    // 5. CORAÇÃO - Testa larga + Queixo pontudo + Mandíbula estreita
    // ═══════════════════════════════════════════════════════════════════════════

    let pontosCoracao = 0;
    let criteriosCoracao = 0;

    // Critério 1: Testa larga
    if (testaLarga) {
        pontosCoracao += 35;
        criteriosCoracao++;
        regras.push(`CORAÇÃO: testa larga (${safeFixed(m.testaZigomas * 100, 0)}%) → +35`);
    }

    // Critério 2: Diferença testa/mandíbula
    if (m.testaZigomas > m.mandibulaZigomas + 0.15) {
        pontosCoracao += 30;
        criteriosCoracao++;
        regras.push(`CORAÇÃO: testa >> mandíbula → +30`);
    }

    // Critério 3: Queixo pontudo
    if (queixoPontudo) {
        pontosCoracao += 25;
        criteriosCoracao++;
        regras.push(`CORAÇÃO: queixo pontudo → +25`);
    }

    // Critério 4: Mandíbula estreita
    if (mandibulaEstreita) {
        pontosCoracao += 20;
        criteriosCoracao++;
        regras.push(`CORAÇÃO: mandíbula estreita → +20`);
    }

    // Bônus combinação
    if (criteriosCoracao >= 3) {
        pontosCoracao += 20;
        regras.push(`CORAÇÃO: combinação forte → +20`);
    }

    // PENALIDADES
    if (mandibulaLarga) {
        pontosCoracao -= 45;
        regras.push(`CORAÇÃO: mandíbula larga → -45`);
    }
    if (testaEstreita) {
        pontosCoracao -= 35;
        regras.push(`CORAÇÃO: testa estreita → -35`);
    }

    p.CORACAO = pontosCoracao;

    // ═══════════════════════════════════════════════════════════════════════════
    // 6. DIAMANTE - Zigomas proeminentes (testa E mandíbula estreitas)
    // ═══════════════════════════════════════════════════════════════════════════

    let pontosDiamante = 0;

    // Critério principal: AMBOS testa e mandíbula estreitas
    if (testaEstreita && mandibulaEstreita) {
        pontosDiamante += 60;
        regras.push(`DIAMANTE: testa E mandíbula estreitas → +60`);

        // Bônus se muito estreitas
        if (m.testaZigomas < 0.72 && m.mandibulaZigomas < 0.70) {
            pontosDiamante += 25;
            regras.push(`DIAMANTE: muito pronunciado → +25`);
        }
    } else {
        pontosDiamante -= 50;
        regras.push(`DIAMANTE: critério não atendido → -50`);
    }

    // Bônus por queixo pontudo
    if (queixoPontudo && testaEstreita) {
        pontosDiamante += 15;
        regras.push(`DIAMANTE: queixo pontudo → +15`);
    }

    // PENALIDADES
    if (mandibulaLarga) {
        pontosDiamante -= 40;
        regras.push(`DIAMANTE: mandíbula larga → -40`);
    }
    if (testaLarga) {
        pontosDiamante -= 40;
        regras.push(`DIAMANTE: testa larga → -40`);
    }

    p.DIAMANTE = pontosDiamante;

    // ═══════════════════════════════════════════════════════════════════════════
    // RESULTADO FINAL
    // ═══════════════════════════════════════════════════════════════════════════

    const ordenado = Object.entries(p)
        .sort(([, a], [, b]) => b - a) as [FormatoRosto, number][];

    const [melhor, scoreMelhor] = ordenado[0];
    const [segundo, scoreSegundo] = ordenado[1];

    const maxScore = 115; // Ajustado para nova escala
    const confianca = Math.min(95, Math.max(30, (scoreMelhor / maxScore) * 100));
    const confiancaSegunda = Math.min(85, Math.max(15, (scoreSegundo / maxScore) * 100));

    // ═══════════════════════════════════════════════════════════════════════════
    // LOG
    // ═══════════════════════════════════════════════════════════════════════════

    console.log("\n╔═══════════════════════════════════════════════════════════════╗");
    console.log("║            🔬 ANÁLISE FACIAL V8 - BALANCEADA                  ║");
    console.log("╚═══════════════════════════════════════════════════════════════╝\n");

    console.log("📏 PROPORÇÕES:");
    console.log(`   Altura/Largura (total):   ${safeFixed(m.alturaLargura, 3)}`);
    console.log(`   Altura/Largura (facial):  ${safeFixed(ratio, 3)} ← USADA`);
    console.log(`   Testa/Zigomas:            ${safeFixed(m.testaZigomas * 100, 0)}%`);
    console.log(`   Mandíbula/Zigomas:        ${safeFixed(m.mandibulaZigomas * 100, 0)}%`);

    console.log("\n📐 MANDÍBULA:");
    console.log(`   Ângulo Gonion:            ${safeFixed(m.anguloGonion, 1)}°`);
    console.log(`   Tipo:                     ${m.tipoMandibula}`);

    console.log("\n📊 ÍNDICES:");
    console.log(`   Uniformidade:             ${safeFixed(m.uniformidade, 1)}%`);
    console.log(`   Afilamento:               ${safeFixed(m.afilamento, 1)}%`);

    console.log("\n🔍 CARACTERÍSTICAS:");
    console.log(`   Mandíbula:  ${ehMuitoAngular ? 'MUITO ANGULAR' : ehAngular ? 'ANGULAR' : ehModerado ? 'MODERADA' : 'SUAVE'}`);
    console.log(`   Largura:    ${mandibulaLarga ? 'LARGA' : mandibulaMedia ? 'MÉDIA' : 'ESTREITA'}`);
    console.log(`   Testa:      ${testaLarga ? 'LARGA' : testaEstreita ? 'ESTREITA' : 'NORMAL'}`);

    console.log("\n📋 REGRAS APLICADAS:");
    regras.forEach(r => console.log(`   • ${r}`));

    console.log("\n─────────────────────────────────────────────────────────────────");
    console.log("🎯 PONTUAÇÃO FINAL:\n");

    for (const [formato, score] of ordenado) {
        const barra = "█".repeat(Math.max(0, Math.floor(Math.max(0, score + 50) / 5)));
        const marcador = formato === melhor ? " 👑" : "";
        console.log(`   ${formato.padEnd(12)} ${String(score).padStart(4)} pts ${barra}${marcador}`);
    }

    console.log("\n═══════════════════════════════════════════════════════════════");
    console.log(`🏆 RESULTADO: ${melhor}`);
    console.log(`📊 Confiança: ${safeFixed(confianca, 0)}%`);
    console.log(`🥈 Segunda opção: ${segundo} (${safeFixed(confiancaSegunda, 0)}%)`);
    console.log("═══════════════════════════════════════════════════════════════\n");

    return {
        formato: melhor,
        confianca: Math.round(confianca),
        segunda_opcao: segundo,
        confianca_segunda: Math.round(confiancaSegunda),
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
            prop_altura_largura_facial: safe(m.alturaFacial),
            prop_testa_zigomas: safe(m.testaZigomas),
            prop_mandibula_zigomas: safe(m.mandibulaZigomas),
            prop_queixo_zigomas: safe(m.queixoZigomas),
            angulo_mandibula_medio: safe(m.anguloGonion),
            indice_uniformidade: safe(m.uniformidade),
            indice_afilamento: safe(m.afilamento),
            contorno_tipo_mandibula: m.tipoMandibula,
            formato_rosto: resultado.formato,
            confianca: resultado.confianca,
            segunda_opcao: resultado.segunda_opcao,
            confianca_segunda: resultado.confianca_segunda,
            descricao: resultado.descricao,
            regras_aplicadas: resultado.debug.regras,
        };
    } catch (error) {
        console.error("Erro:", error);
        return { formato_rosto: "OVAL", confianca: 50, erro: true };
    }
}