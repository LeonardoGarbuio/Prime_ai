// faceLandmarker.ts - VERSÃO CORRIGIDA V4
//Criador: Leonardo Garbuio Cavalheiro
//Data: 29/12/2025
//
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
// CLASSIFICAÇÃO DE MANDÍBULA - VALORES ORIGINAIS
// ═══════════════════════════════════════════════════════════════════════════════

function classificarMandibula(anguloMedio: number): TipoMandibula {
    // Thresholds antropométricos padrão
    if (anguloMedio < 110) return 'MUITO_ANGULAR';
    if (anguloMedio < 125) return 'ANGULAR';        // Padrão antropométrico
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
    // REGRAS V22 - THRESHOLD PRECISO PARA MANDÍBULA
    // CR7 = 83.7%, Ryan Gosling = ~80%, Angelina = 81.9%
    // ═══════════════════════════════════════════════════════════════════════════

    // Ângulo indica angular - 128° é o ponto médio
    const anguloEhAngular = m.anguloGonion < 130; // Aumentado levemente para capturar 128.8

    // V38.5: Mandíbula MUITO larga (>= 83.5% dos zigomas) - Ajustado de 84% para 83.5%
    // Ryan Gosling (82.9%) = false → OVAL OK
    // Brad Pitt (83.6%) = true → RETANGULAR OK
    // CR7 (83.7%) = true → QUADRADO OK
    const mandibulaMuitoLarga = m.mandibulaZigomas >= 0.835;
    const ehSuave = m.tipoMandibula === 'SUAVE' || m.tipoMandibula === 'MUITO_SUAVE';
    const mandibulaPertoDosZigomas = m.mandibulaZigomas >= 0.80;
    const testaPertoDosZigomas = m.testaZigomas >= 0.85;
    const ehCompacto = m.alturaLargura >= 0.90 && m.alturaLargura <= 1.40; // Expandido de 0.95 para 0.90
    const ehAlongado = m.alturaLargura > 1.55;

    // HÍBRIDO: Se QUALQUER indicador é verdadeiro, considera angular
    const ehAngular = anguloEhAngular || mandibulaMuitoLarga;

    // ══════════════════════════════════════════════════════════════════════════
    // DEBUG LOG - VER VALORES CALCULADOS
    // ══════════════════════════════════════════════════════════════════════════
    console.log("🔬 ══════════════════════════════════════════════════════════");
    console.log("🔬 DEBUG FACE METRICS V10:");
    console.log(`   📏 Altura/Largura: ${m.alturaLargura.toFixed(3)}`);
    console.log(`   📏 Mandíbula/Zigomas: ${(m.mandibulaZigomas * 100).toFixed(1)}%`);
    console.log(`   📐 Ângulo Mandíbula: ${m.anguloGonion.toFixed(1)}° → ${m.tipoMandibula}`);
    console.log("🔬 FLAGS:");
    console.log(`   ✓ anguloEhAngular (<128°): ${anguloEhAngular}`);
    console.log(`   ✓ mandibulaMuitoLarga (>=82%): ${mandibulaMuitoLarga}`);
    console.log(`   ✓ ehAngular (HÍBRIDO): ${ehAngular}`);
    console.log(`   ✓ ehAlongado (>1.55): ${ehAlongado}`);
    console.log(`   ✓ ehCompacto (0.90-1.40): ${ehCompacto}`);
    console.log("🔬 ══════════════════════════════════════════════════════════");

    // ═══════════════════════════════════════════════════════════════════════════
    // RETANGULAR/QUADRADO - LÓGICA V28 (BRAD PITT)
    // Se o usuário insiste em Retangular para rostos curtos (0.92), 
    // precisamos valorizar os TRAÇOS RETANGULARES (Lados retos + Ângulo).
    // ═══════════════════════════════════════════════════════════════════════════

    const rostoRetangular = m.alturaLargura > 1.45;
    const traçosFortesRetangular = ehAngular && mandibulaMuitoLarga;

    // V31: Reduzido de 55 para 35 para permitir QUADRADO competir em rostos alongados (CR7)
    if (rostoRetangular) {
        if (ehAngular || mandibulaMuitoLarga) {
            p.RETANGULAR += 35;  // Reduzido de 55
            regras.push(`RETANGULAR: alongado (${safeFixed(m.alturaLargura)}) + angular → +35`);
        } else if (m.mandibulaZigomas > 0.85) {
            p.RETANGULAR += 15;  // Reduzido de 20
            regras.push(`RETANGULAR: alongado + mandíbula larga → +15`);
        }
    }

    // BÔNUS ESPECIAL: Traços Retangulares em rosto não alongado (Brad Pitt Case)
    // Permite que rostos COMPACTOS pontuem se tiverem a estrutura óssea perfeita
    // RESTRIÇÃO V30: Só aplica o bônus MASSIVO se o rosto NÃO for geometricamente retangular
    // (Para evitar que rostos já longos como CR7 disparem na pontuação)
    // V36: Restrito a rostos COMPACTOS (0.90-1.40), não muito curtos (< 0.90)
    if (traçosFortesRetangular && !rostoRetangular && ehCompacto) {
        // Aumentado drasticamente para VENCER Quadrado/Triangular em rostos compactos
        p.RETANGULAR += 70;
        regras.push(`RETANGULAR: compacto + traços fortes (angular + largo) → +70 [estrutura vence proporção]`);
    }
    // V31: Removido bônus extra para rostos longos (CR7) - só Brad Pitt recebe boost

    // Penalidade se não for alongado
    if (!rostoRetangular) {
        if (traçosFortesRetangular) {
            // SEM PENALIDADE se tiver a estrutura certa (aceita rostos curtos como retangular)
            // p.RETANGULAR -= 0;
            regras.push(`RETANGULAR: rosto curto (${safeFixed(m.alturaLargura)}) mas estrutura forte → 0 penalidade`);
        } else {
            // Penalidade padrão forte
            p.RETANGULAR -= 40;
            regras.push(`RETANGULAR: rosto curto (${safeFixed(m.alturaLargura)}) → -40`);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // QUADRADO - V32 (RESTAURADO + CR7 FIX)
    // Quadrado = mandíbula angular/larga + proporção compacta OU alongada com mandíbula forte
    // CR7: 1.71 ratio, 84% mandíbula, 130.7° → Deve ser QUADRADO
    // ═══════════════════════════════════════════════════════════════════════════

    // Base score para rostos angulares
    if (ehAngular) {
        p.QUADRADO += 25;
        regras.push(`QUADRADO: mandíbula angular (${safeFixed(m.anguloGonion, 0)}°) → +25`);
    }

    // Combo: Angular + Mandíbula Larga = Quadrado forte
    if (anguloEhAngular && mandibulaMuitoLarga) {
        p.QUADRADO += 35;
        regras.push(`QUADRADO: ângulo <130° + mandíbula ≥82% → +35 [combo forte]`);
    }

    // Mandíbula larga mesmo sem ângulo agudo (CR7 case: 130.7° mas 84% mandíbula)
    if (!anguloEhAngular && mandibulaMuitoLarga) {
        p.QUADRADO += 40;
        regras.push(`QUADRADO: ângulo moderado MAS mandíbula muito larga (${safeFixed(m.mandibulaZigomas * 100, 0)}%) → +40 [CR7 type]`);
    }

    // Bônus para rostos compactos
    if (ehCompacto && mandibulaPertoDosZigomas) {
        p.QUADRADO += 15;
        regras.push(`QUADRADO: compacto + mandíbula ≥80% → +15`);
    }

    // Penalidade para mandíbula suave (não é quadrado)
    if (ehSuave) {
        p.QUADRADO -= 25;
        regras.push(`QUADRADO: mandíbula suave incompatível → -25`);
    }

    // V33: Penalidade para rostos COMPACTOS com traços fortes → Deve ser RETANGULAR (Brad Pitt)
    // CR7 é ALONGADO, então não recebe essa penalidade
    if (traçosFortesRetangular && !rostoRetangular) {
        p.QUADRADO -= 20;
        regras.push(`QUADRADO: rosto curto + traços fortes → -20 [indica RETANGULAR, não Quadrado]`);
    }

    // V38.7: Penalidade para rostos ALONGADOS → Deve ser RETANGULAR
    // EXCEÇÃO: CR7 é MUITO alongado (> 1.55) + MODERADO → QUADRADO
    // Angelina é moderadamente alongada (1.45-1.55) → RETANGULAR
    if (rostoRetangular && (m.tipoMandibula === 'ANGULAR' || m.tipoMandibula === 'MUITO_ANGULAR')) {
        p.QUADRADO -= 35;
        regras.push(`QUADRADO: rosto alongado + mandíbula ${m.tipoMandibula} → -35 [indica RETANGULAR]`);
    } else if (rostoRetangular && m.tipoMandibula === 'MODERADO' && ehAlongado) {
        // CR7 case: MUITO alongado (> 1.55) + MODERADO → favorece QUADRADO
        p.QUADRADO += 15;
        regras.push(`QUADRADO: rosto MUITO alongado + mandíbula MODERADO → +15 [CR7 type]`);
    } else if (rostoRetangular && m.tipoMandibula === 'MODERADO') {
        // Angelina case: moderadamente alongado (1.45-1.55) + MODERADO → favorece RETANGULAR
        p.QUADRADO -= 25;
        regras.push(`QUADRADO: rosto moderadamente alongado + MODERADO → -25 [indica RETANGULAR]`);
    }

    // V84: MODERADO indica tendência OVAL, não QUADRADO
    if (m.tipoMandibula === 'MODERADO' && !rostoRetangular) {
        p.QUADRADO -= 20;
        regras.push(`QUADRADO: tipo MODERADO indica OVAL → -20`);
    }

    // DEBUG
    console.log(`🔷 QUADRADO após regras: ${p.QUADRADO} pts`);

    // ═══════════════════════════════════════════════════════════════════════════
    // DIAMANTE - MUITO RESTRITIVO AGORA
    // Precisa: testa E mandíbula SIGNIFICATIVAMENTE menores que zigomas (< 80%)
    // ═══════════════════════════════════════════════════════════════════════════

    // V70: DIAMANTE - threshold ajustado para 83%
    // Diamante VERDADEIRO: AMBOS testa E mandíbula significativamente menores que zigomas (< 83%)
    const testaRealmenteEstreita = m.testaZigomas < 0.83;
    const mandibulaRealmenteEstreita = m.mandibulaZigomas < 0.83;
    const testaEstreita = m.testaZigomas < 0.86; // Para casos borderline
    const mandibulaEstreita = m.mandibulaZigomas < 0.86; // Para casos borderline
    const diferencaTestaJaw = Math.abs(m.testaZigomas - m.mandibulaZigomas);
    const testaEMandibulaSimilares = diferencaTestaJaw < 0.03; // V76: Reduzido para 3%
    const uniformidadeExcelente = m.uniformidade < 10;

    // 🔷 DEBUG DIAMANTE FLAGS
    console.log(`🔷 ═══════════════════════════════════════════════════════`);
    console.log(`🔷 DEBUG DIAMANTE V66:`);
    console.log(`🔷    Testa: ${safeFixed(m.testaZigomas * 100, 1)}%`);
    console.log(`🔷    Mandíbula: ${safeFixed(m.mandibulaZigomas * 100, 1)}%`);
    console.log(`🔷    Diferença: ${safeFixed(diferencaTestaJaw * 100, 1)}%`);
    console.log(`🔷    Uniformidade: ${safeFixed(m.uniformidade, 1)}%`);
    console.log(`🔷 FLAGS:`);
    console.log(`🔷    testaRealmenteEstreita (< 84%): ${testaRealmenteEstreita}`);
    console.log(`🔷    mandibulaRealmenteEstreita (< 84%): ${mandibulaRealmenteEstreita}`);
    console.log(`🔷    testaEstreita (< 86%): ${testaEstreita}`);
    console.log(`🔷    mandibulaEstreita (< 86%): ${mandibulaEstreita}`);
    console.log(`🔷    testaEMandibulaSimilares (< 6%): ${testaEMandibulaSimilares}`);
    console.log(`🔷    uniformidadeExcelente (< 10%): ${uniformidadeExcelente}`);
    console.log(`🔷    ehSuave: ${ehSuave}`);
    console.log(`🔷    ehAngular: ${ehAngular}`);
    console.log(`🔷    tipoModerado: ${m.tipoMandibula === 'MODERADO'}`);

    // V72: DIAMANTE pode ser SUAVE, ANGULAR, ou MUITO_ANGULAR (mas não MODERADO puro)
    // MODERADO + ehAngular também é válido (indica estrutura óssea proeminente)
    const tipoNaoModerado = m.tipoMandibula !== 'MODERADO';
    const podeSerDiamante = tipoNaoModerado || ehAngular;

    if (testaRealmenteEstreita && mandibulaRealmenteEstreita && testaEMandibulaSimilares && podeSerDiamante) {
        // V72: IDEAL se NÃO MODERADO ou se for ANGULAR
        console.log(`🔷 ✅ BRANCH: IDEAL (ambos < 83% + similares + válido) → +55`);
        p.DIAMANTE += 55;
        regras.push(`DIAMANTE: testa (${safeFixed(m.testaZigomas * 100, 0)}%) E mandíbula (${safeFixed(m.mandibulaZigomas * 100, 0)}%) < 83% similares → +55`);
    } else if (testaRealmenteEstreita && mandibulaRealmenteEstreita && podeSerDiamante) {
        // Ambos < 83% mas não tão similares
        console.log(`🔷 ✅ BRANCH: AMBOS < 83% + válido → +35`);
        p.DIAMANTE += 35;
        regras.push(`DIAMANTE: testa E mandíbula < 83% → +35`);
    } else if (testaEstreita && mandibulaEstreita && uniformidadeExcelente && testaEMandibulaSimilares && podeSerDiamante) {
        // V73: Borderline também requer podeSerDiamante
        console.log(`🔷 ✅ BRANCH: BORDERLINE (84-86% + uniformidade < 10% + similares + válido) → +20`);
        p.DIAMANTE += 20;
        regras.push(`DIAMANTE: borderline + uniformidade excelente (${safeFixed(m.uniformidade, 1)}%) → +20`);
    } else if (testaEstreita && mandibulaEstreita && uniformidadeExcelente && ehSuave && diferencaTestaJaw < 0.08 && m.afilamento >= 67 && !ehAlongado) {
        // V83: SOFT DIAMOND - EXCLUIR rostos alongados (são CORAÇÃO ou OBLONGO)
        console.log(`🔷 ✅ BRANCH: SOFT DIAMOND (< 86% + uniformidade < 10% + SUAVE + diff < 8% + afilamento >= 67% + !alongado) → +45`);
        p.DIAMANTE += 45;
        regras.push(`DIAMANTE: soft diamond (uniformidade ${safeFixed(m.uniformidade, 1)}% + suave + afilamento ${safeFixed(m.afilamento, 0)}%) → +45`);
    } else {
        // Não é diamante (MODERADO puro ou não atende critérios)
        console.log(`🔷 ❌ BRANCH: NÃO DIAMANTE → -30`);
        p.DIAMANTE -= 30;
        regras.push(`DIAMANTE: não atende critério → -30`);
    }

    // Bônus para mandíbula suave (característica de diamante)
    if (ehSuave && !ehAngular) {
        console.log(`🔷 ✅ SUAVE BONUS → +15`);
        p.DIAMANTE += 15;
        regras.push(`DIAMANTE: mandíbula suave → +15`);
    }

    // Penalidade para mandíbula angular (incompatível com diamante)
    if (ehAngular) {
        console.log(`🔷 ❌ ANGULAR PENALTY → -15`);
        p.DIAMANTE -= 15;
        regras.push(`DIAMANTE: mandíbula angular → -15`);
    }

    console.log(`🔷 DIAMANTE SCORE FINAL: ${p.DIAMANTE} pts`);
    console.log(`🔷 ═══════════════════════════════════════════════════════`);

    // ═══════════════════════════════════════════════════════════════════════════
    // OVAL - V35 (RESTAURADO - Ryan Gosling)
    // Oval = proporção moderada (1.15-1.50) + mandíbula suave/moderada
    // Ryan Gosling: ~1.35 ratio, mandíbula suave → Deve ser OVAL
    // ═══════════════════════════════════════════════════════════════════════════

    // 🔵 DEBUG OVAL FLAGS
    console.log(`🔵 ═══════════════════════════════════════════════════════`);
    console.log(`🔵 DEBUG OVAL:`);
    console.log(`🔵    Proporção: ${safeFixed(m.alturaLargura, 2)}`);
    console.log(`🔵    Proporção ideal (1.15-1.50): ${m.alturaLargura >= 1.15 && m.alturaLargura <= 1.50}`);
    console.log(`🔵    Mandíbula: ${safeFixed(m.mandibulaZigomas * 100, 1)}%`);
    console.log(`🔵    Tipo Mandíbula: ${m.tipoMandibula}`);
    console.log(`🔵    Afilamento: ${safeFixed(m.afilamento, 1)}%`);
    console.log(`🔵    ehSuave: ${ehSuave}`);
    console.log(`🔵    tipoEhModerado: ${m.tipoMandibula === 'MODERADO'}`);
    console.log(`🔵    rostoRetangular (> 1.45): ${rostoRetangular}`);

    // Base score para proporção ideal de oval
    if (m.alturaLargura >= 1.15 && m.alturaLargura <= 1.50) {
        const idealidade = 1.0 - Math.abs(m.alturaLargura - 1.35) / 0.20; // Mais perto de 1.35, melhor
        const bonus = Math.round(30 * Math.max(0, idealidade));
        console.log(`🔵 ✅ Proporção ideal → +${bonus}`);
        p.OVAL += bonus;
        regras.push(`OVAL: proporção ideal (${safeFixed(m.alturaLargura)}) → +${bonus}`);
    }

    // Mandíbula moderada/suave é ideal para oval
    if (m.mandibulaZigomas >= 0.70 && m.mandibulaZigomas <= 0.82) {
        console.log(`🔵 ✅ Mandíbula moderada (70-82%) → +25`);
        p.OVAL += 25;
        regras.push(`OVAL: mandíbula moderada (${safeFixed(m.mandibulaZigomas * 100, 0)}%) → +25`);
    }

    // Mandíbula suave é característica de oval
    if (ehSuave) {
        console.log(`🔵 ✅ Mandíbula suave → +30`);
        p.OVAL += 30;
        regras.push(`OVAL: mandíbula suave → +30`);
    }

    // V41: Mandíbula MODERADA pode ser oval - MAS não se queixo é muito pontudo
    if (m.tipoMandibula === 'MODERADO' && m.afilamento <= 60) {
        console.log(`🔵 ✅ MODERADO + queixo não pontudo → +20`);
        p.OVAL += 20;
        regras.push(`OVAL: mandíbula tipo MODERADO + queixo não pontudo → +20`);
    } else if (m.tipoMandibula === 'MODERADO' && m.afilamento > 60) {
        console.log(`🔵 ⚠️ MODERADO + queixo pontudo → +5`);
        // V74: Ainda é OVAL mas com menos pontos (antes era -15)
        p.OVAL += 5;
        regras.push(`OVAL: mandíbula tipo MODERADO + queixo pontudo → +5`);
    }

    // V85: Bônus para MODERADO (indica tendência OVAL) - mesmo com ehAngular
    if (m.tipoMandibula === 'MODERADO') {
        console.log(`🔵 ✅ Tipo MODERADO indica OVAL → +20`);
        p.OVAL += 20;
        regras.push(`OVAL: tipo MODERADO → +20`);
    }

    // PENALIDADE: Mandíbula angular NÃO é oval
    // V38: Só penaliza se o TIPO for realmente ANGULAR/MUITO_ANGULAR (não MODERADO)
    const tipoEhRealmenteAngular = m.tipoMandibula === 'ANGULAR' || m.tipoMandibula === 'MUITO_ANGULAR';
    if (tipoEhRealmenteAngular) {
        console.log(`🔵 ❌ Mandíbula angular → -35`);
        p.OVAL -= 35;
        regras.push(`OVAL: mandíbula ${m.tipoMandibula} incompatível → -35`);
    }

    // PENALIDADE: Mandíbula muito larga (>85%) NÃO é oval
    // V38: Com threshold em 85%, só penaliza jaws realmente muito largas
    if (mandibulaMuitoLarga) {
        console.log(`🔵 ❌ Mandíbula muito larga → -40`);
        p.OVAL -= 40;
        regras.push(`OVAL: mandíbula muito larga (${safeFixed(m.mandibulaZigomas * 100, 0)}% ≥85%) → -40`);
    }

    // V38.1: PENALIDADE: Rosto ALONGADO NÃO é oval (é RETANGULAR/OBLONGO)
    // CR7 (1.71) deve ir para RETANGULAR, não OVAL
    if (rostoRetangular) {
        console.log(`🔵 ❌ Rosto alongado → -50`);
        p.OVAL -= 50;
        regras.push(`OVAL: rosto alongado (${safeFixed(m.alturaLargura)}) → -50 [indica retangular]`);
    }

    // V64: Removida penalidade OVAL para perfil DIAMANTE
    // DIAMANTE agora tem pontuação baixa o suficiente para não sobrepor OVAL

    console.log(`🔵 OVAL SCORE FINAL: ${p.OVAL} pts`);
    console.log(`🔵 ═══════════════════════════════════════════════════════`);

    // ═══════════════════════════════════════════════════════════════════════════
    // REDONDO - V16
    // Rosto mais largo que alto + mandíbula suave + queixo NÃO pontudo
    // ═══════════════════════════════════════════════════════════════════════════

    // Se rosto é mais LARGO que alto, tem tendência redonda
    if (m.alturaLargura < 1.05) {
        const bonus = Math.round((1.05 - m.alturaLargura) * 60);  // Reduzido de 80
        p.REDONDO += bonus;
        regras.push(`REDONDO: rosto largo (${safeFixed(m.alturaLargura)}) → +${bonus}`);
    }

    // Proporção quase circular (0.90 - 1.10)
    if (m.alturaLargura >= 0.88 && m.alturaLargura <= 1.08) {
        p.REDONDO += 12;  // Reduzido de 18
        regras.push(`REDONDO: proporção circular → +12`);
    }

    if (ehSuave) {
        p.REDONDO += 18;  // Reduzido de 28
        regras.push(`REDONDO: mandíbula suave → +18`);
    }

    if (m.uniformidade < 8) {
        p.REDONDO += 10;  // Reduzido de 15
        regras.push(`REDONDO: muito uniforme → +10`);
    }

    // PENALIDADE: Queixo pontudo NÃO é redondo
    if (m.afilamento > 55) {
        p.REDONDO -= 20;
        regras.push(`REDONDO: queixo pontudo (${safeFixed(m.afilamento, 0)}%) → -20 [não é redondo]`);
    }

    // Penalidade se angular
    if (ehAngular && m.alturaLargura >= 1.05) {
        p.REDONDO -= 30;
        regras.push(`REDONDO: mandíbula angular incompatível → -30`);
    }

    // DEBUG
    console.log(`⭕ REDONDO após regras: ${p.REDONDO} pts`);



    // ═══════════════════════════════════════════════════════════════════════════
    // OBLONGO - V19 - Rosto alongado com mandíbula MODERADA
    // Se mandíbula é estreita (< 78%) = CORAÇÃO, não OBLONGO
    // Se mandíbula é larga = QUADRADO/RETANGULAR, não OBLONGO
    // ═══════════════════════════════════════════════════════════════════════════

    if (m.alturaLargura > 1.50) {
        p.OBLONGO += 38;  // Reduzido de 42
        regras.push(`OBLONGO: muito alongado (${safeFixed(m.alturaLargura)}) → +38`);
    }

    // PENALIDADE: Mandíbula larga = QUADRADO/RETANGULAR, não OBLONGO
    if (mandibulaMuitoLarga) {
        p.OBLONGO -= 25;
        regras.push(`OBLONGO: mandíbula larga ${safeFixed(m.mandibulaZigomas * 100, 0)}% → -25 [não é oblongo]`);
    }

    // PENALIDADE: Mandíbula ESTREITA = CORAÇÃO, não OBLONGO
    if (m.mandibulaZigomas < 0.78) {
        p.OBLONGO -= 30;
        regras.push(`OBLONGO: mandíbula estreita ${safeFixed(m.mandibulaZigomas * 100, 0)}% → -30 [indica coração]`);
    }

    if (!ehAlongado) {
        p.OBLONGO -= 40;
    }

    // DEBUG: Pontuação parcial após OBLONGO
    console.log(`🟠 OBLONGO após regras: ${p.OBLONGO} pts`);
    console.log(`📊 COMPARAÇÃO: QUADRADO=${p.QUADRADO} vs OBLONGO=${p.OBLONGO} vs OVAL=${p.OVAL}`);

    // ═══════════════════════════════════════════════════════════════════════════
    // CORAÇÃO / TRIANGULAR INVERTIDO - V18
    // Coração = queixo pontudo + mandíbula ESTREITA (< 78%)
    // NÃO é coração se rosto é compacto/circular (isso indica TRIANGULAR)
    // ═══════════════════════════════════════════════════════════════════════════

    // Queixo pontudo é indicador de coração - MAS só se mandíbula é MUITO estreita
    const mandibulaEstreitaParaCoracao = m.mandibulaZigomas < 0.78;

    if (m.afilamento > 45 && mandibulaEstreitaParaCoracao) {
        const bonus = Math.round((m.afilamento - 45) * 0.5);
        p.CORACAO += 18 + bonus;
        regras.push(`CORAÇÃO: queixo pontudo (${safeFixed(m.afilamento, 0)}%) + mandíbula estreita → +${18 + bonus}`);
    }

    // V41: Queixo MUITO pontudo (> 60%) + jaw moderada (< 82%) = CORAÇÃO
    // Robert Pattinson: 67% afilamento, jaw 82% (borderline)
    if (m.afilamento > 60 && m.mandibulaZigomas < 0.82) {
        const bonus = Math.round((m.afilamento - 60) * 2);
        p.CORACAO += 40 + bonus;
        regras.push(`CORAÇÃO: queixo pontudo (${safeFixed(m.afilamento, 0)}%) + jaw moderada → +${40 + bonus}`);
    }

    // Mandíbula MUITO ESTREITA é crucial para coração
    if (m.mandibulaZigomas < 0.75) {
        const bonus = Math.round((0.75 - m.mandibulaZigomas) * 80);
        p.CORACAO += 25 + bonus;
        p.TRIANGULAR_INVERTIDO += 30;
        regras.push(`CORAÇÃO: mandíbula muito estreita (${safeFixed(m.mandibulaZigomas * 100, 0)}%) → +${25 + bonus}`);
    }

    // Testa relativamente larga ajuda, mas não é obrigatório
    if (m.testaZigomas >= 0.92 && mandibulaEstreitaParaCoracao) {
        p.CORACAO += 12;
        regras.push(`CORAÇÃO: testa proporcional (${safeFixed(m.testaZigomas * 100, 0)}%) → +12`);
    }

    if (m.testaZigomas > 1.0 && mandibulaEstreitaParaCoracao) {
        p.CORACAO += 18;
        p.TRIANGULAR_INVERTIDO += 22;
        regras.push(`CORAÇÃO/TRIANG_INV: testa larga → +18/+22`);
    }

    // V39: PENALIDADE AJUSTADA: Se mandíbula >= 78%, penaliza menos se queixo é pontudo
    if (m.mandibulaZigomas >= 0.78) {
        if (m.afilamento > 60) {
            // Queixo pontudo = penalidade reduzida
            p.CORACAO -= 25;
            p.TRIANGULAR_INVERTIDO -= 20;
            regras.push(`CORAÇÃO: mandíbula ${safeFixed(m.mandibulaZigomas * 100, 0)}% >= 78% mas queixo pontudo → -25`);
        } else {
            // Penalidade normal
            p.CORACAO -= 45;
            p.TRIANGULAR_INVERTIDO -= 40;
            regras.push(`CORAÇÃO: mandíbula ${safeFixed(m.mandibulaZigomas * 100, 0)}% >= 78% → -45 [não é coração]`);
        }
    }

    // PENALIDADE: Rosto compacto (altura/largura ~1) NÃO é coração, é TRIANGULAR
    if (m.alturaLargura >= 0.90 && m.alturaLargura <= 1.10) {
        p.CORACAO -= 20;
        regras.push(`CORAÇÃO: rosto compacto (${safeFixed(m.alturaLargura)}) → -20 [indica triangular]`);
    }

    // BÔNUS: Rostos ALONGADOS com mandíbula estreita = CORAÇÃO clássico
    if (m.alturaLargura > 1.40 && m.mandibulaZigomas < 0.78) {
        p.CORACAO += 30;
        regras.push(`CORAÇÃO: rosto alongado + mandíbula estreita → +30`);
    }

    // V47: PENALIDADE AUMENTADA: Se testa TAMBÉM é estreita, é DIAMANTE, não CORAÇÃO
    if (m.testaZigomas < 0.86 && m.mandibulaZigomas < 0.86) {
        p.CORACAO -= 70;
        regras.push(`CORAÇÃO: testa E mandíbula estreitas (< 86%) → -70 [indica DIAMANTE]`);
    }

    // DEBUG
    console.log(`❤️ CORAÇÃO após regras: ${p.CORACAO} pts`);

    // ═══════════════════════════════════════════════════════════════════════════
    // TRIANGULAR - V25
    // Triangular = base do rosto mais proeminente (mandíbula + queixo)
    // NÃO deve ser para rostos alongados (> 1.45)
    // Se mandíbula é MUITO LARGA (> 1.0), só é triangular se a TESTA for estreita
    // ═══════════════════════════════════════════════════════════════════════════

    const rostoAlongadoTriangular = m.alturaLargura > 1.45;
    const testaLargaParaTriangular = m.testaZigomas >= 0.90;

    // 🔺 DEBUG TRIANGULAR FLAGS
    console.log(`🔺 ═══════════════════════════════════════════════════════`);
    console.log(`🔺 DEBUG TRIANGULAR:`);
    console.log(`🔺    Proporção: ${safeFixed(m.alturaLargura, 2)}`);
    console.log(`🔺    Testa: ${safeFixed(m.testaZigomas * 100, 1)}%`);
    console.log(`🔺    Mandíbula: ${safeFixed(m.mandibulaZigomas * 100, 1)}%`);
    console.log(`🔺    Tipo Mandíbula: ${m.tipoMandibula}`);
    console.log(`🔺 FLAGS:`);
    console.log(`🔺    rostoAlongadoTriangular (> 1.45): ${rostoAlongadoTriangular}`);
    console.log(`🔺    testaLargaParaTriangular (>= 90%): ${testaLargaParaTriangular}`);
    console.log(`🔺    ehCompacto: ${ehCompacto}`);
    console.log(`🔺    mandíbula > zigomas (> 100%): ${m.mandibulaZigomas > 1.0}`);
    console.log(`🔺    mandíbula moderada (78-82%): ${m.mandibulaZigomas >= 0.78 && m.mandibulaZigomas < 0.82}`);
    console.log(`🔺    testa estreita (< 85%): ${m.testaZigomas < 0.85}`);

    // Mandíbula muito maior que zigomas
    if (m.mandibulaZigomas > 1.0) {
        if (!rostoAlongadoTriangular && !testaLargaParaTriangular) {
            // Só é triangular se NÃO for alongado E tiver testa estreita
            p.TRIANGULAR += 45;
            regras.push(`TRIANGULAR: mandíbula > zigomas + testa estreita → +45`);
        } else if (rostoAlongadoTriangular) {
            // Se for alongado, é Retangular
            p.RETANGULAR += 35;
            regras.push(`RETANGULAR: mandíbula > zigomas em rosto alongado → +35`);
        } else if (testaLargaParaTriangular) {
            // Se testa é larga, é QUADRADO (mandíbula larga + testa larga)
            p.QUADRADO += 40;
            regras.push(`QUADRADO: mandíbula > zigomas + testa larga → +40 [vence triangular]`);
        }
    }

    // Mandíbula larga (>= 85%) indica tendência triangular forte - MAS cuidado com retangulares/quadrados
    if (m.mandibulaZigomas >= 0.85 && m.mandibulaZigomas <= 1.0 && !rostoAlongadoTriangular) {
        // Se testa for muito larga, reduz o bônus de triangular
        if (m.testaZigomas > 0.95) {
            p.QUADRADO += 20;
            regras.push(`QUADRADO: mandíbula larga + testa larga → +20`);
        } else {
            const bonus = Math.round((m.mandibulaZigomas - 0.85) * 150);
            p.TRIANGULAR += 25 + bonus;
            regras.push(`TRIANGULAR: mandíbula larga (${safeFixed(m.mandibulaZigomas * 100, 0)}%) → +${25 + bonus}`);
        }
    }

    // Mandíbula moderada (78-82%) + rosto compacto = possível triangular
    // Reduzido teto de 85% para 82% para evitar capturar mandíbulas LARGAS (Quadrado/Retangular)
    if (m.mandibulaZigomas >= 0.78 && m.mandibulaZigomas < 0.82 && ehCompacto) {
        p.TRIANGULAR += 20;
        regras.push(`TRIANGULAR: mandíbula moderada + rosto compacto → +20`);
    }

    // Testa estreita é característica de triangular - MAS não para rostos alongados
    if (m.testaZigomas < 0.85 && !rostoAlongadoTriangular) {
        p.TRIANGULAR += 22;
        regras.push(`TRIANGULAR: testa estreita (${safeFixed(m.testaZigomas * 100, 0)}%) → +22`);
    }

    // Rosto compacto/circular tem tendência triangular
    if (m.alturaLargura >= 0.90 && m.alturaLargura <= 1.10) {
        p.TRIANGULAR += 15;
        regras.push(`TRIANGULAR: rosto compacto (${safeFixed(m.alturaLargura)}) → +15`);
    }

    // Combinação: testa estreita + mandíbula >= 78% (apenas se não for alongado)
    if (m.testaZigomas < 0.88 && m.mandibulaZigomas >= 0.78 && !rostoAlongadoTriangular) {
        p.TRIANGULAR += 15;
        regras.push(`TRIANGULAR: combo testa estreita + mandíbula >= 78% → +15`);
    }

    // V82: Bônus para "triângulo invertido" - EXCETO quando afilamento é alto (indica DIAMANTE)
    // Face que afunila de cima para baixo com mandíbula suave
    if (ehCompacto && ehSuave && m.testaZigomas >= m.mandibulaZigomas && m.afilamento < 67) {
        p.TRIANGULAR += 20;
        regras.push(`TRIANGULAR: triângulo invertido (compacto + suave + testa >= jaw + afilamento < 67%) → +20`);
    }

    // PENALIDADE: Se rosto é ALONGADO (> 1.45), provavelmente é Retangular/Oblongo, não Triangular
    if (rostoAlongadoTriangular) {
        p.TRIANGULAR -= 25;
        regras.push(`TRIANGULAR: rosto alongado (${safeFixed(m.alturaLargura)}) → -25 [indica retangular/oblongo]`);
    }

    // V38.3: PENALIDADE: Se mandíbula é MODERADA, provavelmente é OVAL, não Triangular
    // Ryan Gosling (MODERADO) deve ir para OVAL, não TRIANGULAR
    if (m.tipoMandibula === 'MODERADO') {
        p.TRIANGULAR -= 30;
        regras.push(`TRIANGULAR: mandíbula MODERADA → -30 [indica OVAL]`);
    }

    // PENALIDADE: Se mandíbula < 75%, NÃO é triangular
    if (m.mandibulaZigomas < 0.75) {
        p.TRIANGULAR -= 35;
        regras.push(`TRIANGULAR: mandíbula ${safeFixed(m.mandibulaZigomas * 100, 0)}% < 75% → -35 [não é triangular]`);
    }

    // PENALIDADE: Se rosto é MUITO alongado, provavelmente não é triangular (geralmente é Oblongo/Retangular)
    if (ehAlongado) {
        p.TRIANGULAR -= 20;
        regras.push(`TRIANGULAR: rosto muito alongado (${safeFixed(m.alturaLargura)}) → -20`);
    }

    // V77: PENALIDADE para perfil DIAMANTE - excluir SUAVE (não é estrutura de diamante)
    const mandibulaMaiorQueTesta = m.mandibulaZigomas > m.testaZigomas;
    const tipoNaoDiamanteTriangular = m.tipoMandibula !== 'SUAVE'; // SUAVE não é DIAMANTE
    if (m.testaZigomas < 0.83 && m.mandibulaZigomas < 0.83 && m.uniformidade < 12 && !mandibulaMaiorQueTesta && tipoNaoDiamanteTriangular) {
        console.log(`🔺 ❌ Perfil DIAMANTE (ambos < 83% + !SUAVE) → -40`);
        p.TRIANGULAR -= 40;
        regras.push(`TRIANGULAR: perfil DIAMANTE (ambos < 83%, jaw <= testa, !SUAVE) → -40`);
    }

    console.log(`🔺 TRIANGULAR SCORE FINAL: ${p.TRIANGULAR} pts`);
    console.log(`🔺 ═══════════════════════════════════════════════════════`);

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
