// faceLandmarker.ts - V4 FINAL (6 FORMATOS)

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
};

// ═══════════════════════════════════════════════════════════════════════════════
// TIPOS - APENAS 6 FORMATOS
// ═══════════════════════════════════════════════════════════════════════════════

interface Ponto { x: number; y: number; z: number; }

type FormatoRosto = 'OVAL' | 'REDONDO' | 'QUADRADO' | 'RETANGULAR' | 'CORACAO' | 'DIAMANTE';

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
// CLASSIFICAÇÃO DE MANDÍBULA
// ═══════════════════════════════════════════════════════════════════════════════

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
    
    const anguloEsq = angulo(pt(LM.ZIGOMA_ESQ), pt(LM.GONION_ESQ), pt(LM.QUEIXO));
    const anguloDir = angulo(pt(LM.ZIGOMA_DIR), pt(LM.GONION_DIR), pt(LM.QUEIXO));
    const anguloGonion = (anguloEsq + anguloDir) / 2;
    
    const alturaLargura = altura / largZigomas;
    const testaZigomas = largTesta / largZigomas;
    const mandibulaZigomas = largMandibula / largZigomas;
    const queixoZigomas = largQueixo / largZigomas;
    
    const larguras = [testaZigomas, largTemporal/largZigomas, 1.0, mandibulaZigomas];
    const media = larguras.reduce((a,b) => a+b, 0) / larguras.length;
    const variancia = larguras.reduce((s,v) => s + Math.pow(v-media, 2), 0) / larguras.length;
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
// DESCRIÇÕES DOS 6 FORMATOS
// ═══════════════════════════════════════════════════════════════════════════════

const DESCRICOES: Record<FormatoRosto, string> = {
    OVAL: "Rosto equilibrado e harmônico, contornos suaves, proporção clássica ideal.",
    REDONDO: "Largura e altura similares, bochechas cheias, sem ângulos definidos.",
    QUADRADO: "Mandíbula forte e angular, largura uniforme entre testa, zigomas e mandíbula.",
    RETANGULAR: "Como quadrado, mas mais alongado. Mandíbula angular com rosto comprido.",
    CORACAO: "Testa larga com queixo pontudo, afilamento gradual até o queixo.",
    DIAMANTE: "Zigomas proeminentes, testa e mandíbula significativamente mais estreitas.",
};

// ═══════════════════════════════════════════════════════════════════════════════
// CLASSIFICAÇÃO V4 - 6 FORMATOS
// ═══════════════════════════════════════════════════════════════════════════════

interface Resultado {
    formato: FormatoRosto;
    confianca: number;
    segundaOpcao: FormatoRosto;
    confiancaSegunda: number;
    descricao: string;
    medidas: Medidas;
    debug: { regras: string[]; pontos: Record<FormatoRosto, number>; };
}

export function classificarFormatoRosto(landmarks: Ponto[]): Resultado {
    const m = calcularMedidas(landmarks);
    const regras: string[] = [];
    
    // APENAS 6 FORMATOS
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
    
    const ehAngular = m.tipoMandibula === 'MUITO_ANGULAR' || m.tipoMandibula === 'ANGULAR';
    const ehSuave = m.tipoMandibula === 'SUAVE' || m.tipoMandibula === 'MUITO_SUAVE';
    const mandibulaPertoDosZigomas = m.mandibulaZigomas >= 0.82;
    const ehCompacto = m.alturaLargura >= 0.95 && m.alturaLargura <= 1.30;
    const ehAlongado = m.alturaLargura > 1.30;
    const testaEstreita = m.testaZigomas < 0.80;
    const mandibulaEstreita = m.mandibulaZigomas < 0.80;
    const testaLarga = m.testaZigomas > 1.0;
    const queixoPontudo = m.afilamento > 50;
    
    // ═══════════════════════════════════════════════════════════════════════════
    // 1. QUADRADO
    // Critérios: Angular + Mandíbula larga + Compacto
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
        regras.push(`QUADRADO: uniformidade alta → +15`);
    }
    
    // BONUS: Combinação perfeita
    if (ehAngular && mandibulaPertoDosZigomas && ehCompacto) {
        p.QUADRADO += 30;
        regras.push(`QUADRADO: COMBINAÇÃO PERFEITA → +30`);
    }
    
    // Penalidade se alongado (seria RETANGULAR)
    if (ehAlongado) {
        p.QUADRADO -= 30;
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // 2. RETANGULAR
    // Critérios: Angular + Mandíbula larga + Alongado
    // ═══════════════════════════════════════════════════════════════════════════
    
    if (ehAlongado) {
        p.RETANGULAR += 30;
        regras.push(`RETANGULAR: alongado (${safeFixed(m.alturaLargura)}) → +30`);
    }
    
    if (ehAngular && ehAlongado) {
        p.RETANGULAR += 35;
        regras.push(`RETANGULAR: angular + alongado → +35`);
    }
    
    if (mandibulaPertoDosZigomas && ehAlongado) {
        p.RETANGULAR += 25;
        regras.push(`RETANGULAR: mandíbula larga + alongado → +25`);
    }
    
    // Penalidade se compacto (seria QUADRADO)
    if (ehCompacto) {
        p.RETANGULAR -= 40;
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // 3. REDONDO
    // Critérios: Suave + Proporção circular + Uniforme
    // ═══════════════════════════════════════════════════════════════════════════
    
    if (m.alturaLargura >= 0.92 && m.alturaLargura <= 1.15) {
        p.REDONDO += 35;
        regras.push(`REDONDO: proporção circular → +35`);
    }
    
    if (ehSuave) {
        p.REDONDO += 40;
        regras.push(`REDONDO: mandíbula suave → +40`);
    }
    
    if (m.uniformidade < 8) {
        p.REDONDO += 20;
        regras.push(`REDONDO: muito uniforme → +20`);
    }
    
    // Penalidade se angular
    if (ehAngular) {
        p.REDONDO -= 50;
        regras.push(`REDONDO: mandíbula angular → -50`);
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // 4. OVAL
    // Critérios: Proporção média + Moderado + Equilibrado
    // ═══════════════════════════════════════════════════════════════════════════
    
    if (m.alturaLargura >= 1.20 && m.alturaLargura <= 1.50) {
        p.OVAL += 35;
        regras.push(`OVAL: proporção ideal → +35`);
    }
    
    if (m.mandibulaZigomas >= 0.75 && m.mandibulaZigomas <= 0.90) {
        p.OVAL += 25;
        regras.push(`OVAL: mandíbula moderada → +25`);
    }
    
    if (m.tipoMandibula === 'MODERADO') {
        p.OVAL += 25;
        regras.push(`OVAL: ângulo moderado → +25`);
    }
    
    // Penalidade se muito angular ou muito suave
    if (ehAngular) {
        p.OVAL -= 30;
    }
    if (ehSuave && m.alturaLargura < 1.15) {
        p.OVAL -= 20; // Provavelmente é REDONDO
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // 5. CORAÇÃO
    // Critérios: Testa larga + Queixo pontudo + Mandíbula estreita
    // ═══════════════════════════════════════════════════════════════════════════
    
    if (testaLarga) {
        p.CORACAO += 40;
        regras.push(`CORAÇÃO: testa larga (${safeFixed(m.testaZigomas * 100, 0)}%) → +40`);
    }
    
    if (m.testaZigomas > m.mandibulaZigomas + 0.15) {
        p.CORACAO += 30;
        regras.push(`CORAÇÃO: testa >> mandíbula → +30`);
    }
    
    if (queixoPontudo) {
        p.CORACAO += 30;
        regras.push(`CORAÇÃO: queixo pontudo → +30`);
    }
    
    if (mandibulaEstreita) {
        p.CORACAO += 20;
        regras.push(`CORAÇÃO: mandíbula estreita → +20`);
    }
    
    // Penalidade se mandíbula larga
    if (mandibulaPertoDosZigomas) {
        p.CORACAO -= 40;
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // 6. DIAMANTE
    // Critérios: Zigomas proeminentes (testa E mandíbula < 80%)
    // ═══════════════════════════════════════════════════════════════════════════
    
    if (testaEstreita && mandibulaEstreita) {
        p.DIAMANTE += 70;
        regras.push(`DIAMANTE: testa (${safeFixed(m.testaZigomas * 100, 0)}%) E mandíbula (${safeFixed(m.mandibulaZigomas * 100, 0)}%) < 80% → +70`);
    } else {
        p.DIAMANTE -= 40;
        regras.push(`DIAMANTE: critério não atendido → -40`);
    }
    
    // Penalidade se angular (diamante tem contornos suaves)
    if (ehAngular) {
        p.DIAMANTE -= 25;
        regras.push(`DIAMANTE: mandíbula angular incompatível → -25`);
    }
    
    // Penalidade se testa larga (seria CORAÇÃO)
    if (testaLarga) {
        p.DIAMANTE -= 30;
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // RESULTADO FINAL
    // ═══════════════════════════════════════════════════════════════════════════
    
    const ordenado = Object.entries(p)
        .sort(([, a], [, b]) => b - a) as [FormatoRosto, number][];
    
    const [melhor, scoreMelhor] = ordenado[0];
    const [segundo, scoreSegundo] = ordenado[1];
    
    const maxScore = 120;
    const confianca = Math.min(95, Math.max(25, (scoreMelhor / maxScore) * 100));
    const confiancaSegunda = Math.min(85, Math.max(10, (scoreSegundo / maxScore) * 100));
    
    // ═══════════════════════════════════════════════════════════════════════════
    // LOG
    // ═══════════════════════════════════════════════════════════════════════════
    
    console.log("\n╔═══════════════════════════════════════════════════════════════╗");
    console.log("║        🔬 ANÁLISE FACIAL V4 FINAL (6 FORMATOS)                ║");
    console.log("╚═══════════════════════════════════════════════════════════════╝\n");
    
    console.log("📏 PROPORÇÕES:");
    console.log(`   Altura/Largura:       ${safeFixed(m.alturaLargura, 3)}`);
    console.log(`   Testa/Zigomas:        ${safeFixed(m.testaZigomas * 100, 0)}%`);
    console.log(`   Mandíbula/Zigomas:    ${safeFixed(m.mandibulaZigomas * 100, 0)}%`);
    console.log(`   Queixo/Zigomas:       ${safeFixed(m.queixoZigomas * 100, 0)}%`);
    
    console.log("\n📐 MANDÍBULA:");
    console.log(`   Ângulo Gonion:        ${safeFixed(m.anguloGonion, 1)}°`);
    console.log(`   Tipo:                 ${m.tipoMandibula}`);
    
    console.log("\n📊 ÍNDICES:");
    console.log(`   Uniformidade:         ${safeFixed(m.uniformidade, 1)}%`);
    console.log(`   Afilamento:           ${safeFixed(m.afilamento, 1)}%`);
    
    console.log("\n🔍 CARACTERÍSTICAS:");
    console.log(`   Angular:              ${ehAngular ? '✓ SIM' : '✗ NÃO'}`);
    console.log(`   Suave:                ${ehSuave ? '✓ SIM' : '✗ NÃO'}`);
    console.log(`   Mandíbula ≥82%:       ${mandibulaPertoDosZigomas ? '✓ SIM' : '✗ NÃO'}`);
    console.log(`   Compacto:             ${ehCompacto ? '✓ SIM' : '✗ NÃO'}`);
    console.log(`   Alongado:             ${ehAlongado ? '✓ SIM' : '✗ NÃO'}`);
    
    console.log("\n📋 REGRAS APLICADAS:");
    regras.forEach(r => console.log(`   • ${r}`));
    
    console.log("\n─────────────────────────────────────────────────────────────────");
    console.log("🎯 PONTUAÇÃO FINAL:\n");
    
    for (const [formato, score] of ordenado) {
        const barra = "█".repeat(Math.max(0, Math.floor(Math.max(0, score + 50) / 5)));
        const marcador = formato === melhor ? " 👑" : "";
        console.log(`   ${formato.padEnd(15)} ${String(score).padStart(4)} pts ${barra}${marcador}`);
    }
    
    console.log("\n═══════════════════════════════════════════════════════════════");
    console.log(`🏆 RESULTADO: ${melhor}`);
    console.log(`📊 Confiança: ${safeFixed(confianca, 0)}%`);
    console.log(`🥈 Segunda opção: ${segundo} (${safeFixed(confiancaSegunda, 0)}%)`);
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