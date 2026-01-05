// Prime AI - Face Fingerprint System
// Sistema de impressão digital facial para consistência de formato de rosto

import { NormalizedLandmark } from "@mediapipe/tasks-vision";
import CryptoJS from 'crypto-js';

// 🔐 Chave de criptografia (em produção usar .env)
const ENCRYPTION_KEY = process.env.NEXT_PUBLIC_FINGERPRINT_KEY || 'prime-ai-face-2026-secure';

// 🔐 Funções de criptografia AES-256
function encryptData(data: any): string {
    const jsonString = JSON.stringify(data);
    return CryptoJS.AES.encrypt(jsonString, ENCRYPTION_KEY).toString();
}

function decryptData(encrypted: string): any {
    try {
        const bytes = CryptoJS.AES.decrypt(encrypted, ENCRYPTION_KEY);
        const decrypted = bytes.toString(CryptoJS.enc.Utf8);
        return JSON.parse(decrypted);
    } catch {
        return null; // Corrupted data
    }
}

// Tipos
export interface FaceMetrics {
    eyeRatio: number;            // distância olhos / largura rosto
    noseRatio: number;           // altura nariz / altura rosto
    mouthRatio: number;          // largura boca / largura rosto
    facialIndex: number;         // altura / largura
    jawRatio: number;            // largura mandíbula / largura rosto
    cheekRatio: number;          // largura bochechas / largura rosto
}

export interface FaceFingerprint {
    id: string;
    metrics: FaceMetrics;
    faceShape: string;
    timestamp: number;
    analysisCount: number;
    // Cache da última análise da IA (para reusar quando a mesma pessoa voltar)
    lastAnalysis?: {
        pontos_fortes?: string[];
        pontos_de_atencao?: string[];
        analise_pele?: string;
        arquetipo?: string;
        resumo_brutal?: string;
        nota_final?: number;
        ai_provider?: string;
    };
}

export interface FaceCache {
    fingerprints: FaceFingerprint[];
    version: string;
}

// Constantes
const STORAGE_KEY = 'prime_face_cache';
const MAX_ENTRIES = 10;
const EXPIRY_DAYS = 730; // 2 anos
const SIMILARITY_THRESHOLD = 85; // 85% de similaridade

// Utilitários matemáticos
function euclideanDistance(p1: NormalizedLandmark, p2: NormalizedLandmark): number {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    return Math.sqrt(dx * dx + dy * dy);
}

function hashCode(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
}

/**
 * Calcula métricas faciais invariantes ao ângulo
 * Usa proporções geométricas que se mantêm constantes
 */
export function calculateFaceMetrics(landmarks: NormalizedLandmark[]): FaceMetrics {
    // Pontos-chave do MediaPipe Face Mesh (468 landmarks)
    const leftEyeOuter = landmarks[33];
    const rightEyeOuter = landmarks[263];
    const leftEyeInner = landmarks[133];
    const rightEyeInner = landmarks[362];
    const noseTip = landmarks[1];
    const noseBase = landmarks[168];
    const mouthLeft = landmarks[61];
    const mouthRight = landmarks[291];
    const chinBottom = landmarks[152];
    const foreheadTop = landmarks[10];
    const leftCheek = landmarks[234];
    const rightCheek = landmarks[454];
    const leftJaw = landmarks[172];
    const rightJaw = landmarks[397];

    // Cálculo de distâncias
    const eyeDistance = euclideanDistance(leftEyeOuter, rightEyeOuter);
    const innerEyeDistance = euclideanDistance(leftEyeInner, rightEyeInner);
    const faceWidth = eyeDistance * 2.2; // estimativa baseada em proporção média
    const faceHeight = euclideanDistance(foreheadTop, chinBottom);
    const noseHeight = euclideanDistance(noseBase, chinBottom);
    const mouthWidth = euclideanDistance(mouthLeft, mouthRight);
    const cheekWidth = euclideanDistance(leftCheek, rightCheek);
    const jawWidth = euclideanDistance(leftJaw, rightJaw);

    // Métricas invariantes (proporções que não mudam com ângulo)
    return {
        eyeRatio: eyeDistance / faceWidth,
        noseRatio: noseHeight / faceHeight,
        mouthRatio: mouthWidth / faceWidth,
        facialIndex: faceHeight / faceWidth,
        jawRatio: jawWidth / faceWidth,
        cheekRatio: cheekWidth / faceWidth
    };
}

/**
 * Gera fingerprint único baseado nas métricas
 */
export function generateFingerprint(metrics: FaceMetrics): string {
    const rounded = {
        eyeRatio: metrics.eyeRatio.toFixed(3),
        noseRatio: metrics.noseRatio.toFixed(3),
        mouthRatio: metrics.mouthRatio.toFixed(3),
        facialIndex: metrics.facialIndex.toFixed(3),
        jawRatio: metrics.jawRatio.toFixed(3),
        cheekRatio: metrics.cheekRatio.toFixed(3)
    };
    const values = Object.values(rounded).join('-');
    return hashCode(values);
}

/**
 * Calcula similaridade entre dois conjuntos de métricas
 * Retorna porcentagem de 0 a 100
 */
export function calculateSimilarity(m1: FaceMetrics, m2: FaceMetrics): number {
    const weights = {
        eyeRatio: 1.5,      // Mais importante
        facialIndex: 1.5,   // Mais importante
        noseRatio: 1.0,
        mouthRatio: 1.0,
        jawRatio: 1.2,
        cheekRatio: 1.0
    };

    const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);

    const diffs = [
        Math.abs(m1.eyeRatio - m2.eyeRatio) * weights.eyeRatio,
        Math.abs(m1.noseRatio - m2.noseRatio) * weights.noseRatio,
        Math.abs(m1.mouthRatio - m2.mouthRatio) * weights.mouthRatio,
        Math.abs(m1.facialIndex - m2.facialIndex) * weights.facialIndex,
        Math.abs(m1.jawRatio - m2.jawRatio) * weights.jawRatio,
        Math.abs(m1.cheekRatio - m2.cheekRatio) * weights.cheekRatio
    ];

    const weightedAvgDiff = diffs.reduce((a, b) => a + b, 0) / totalWeight;
    const similarity = (1 - weightedAvgDiff) * 100;

    return Math.max(0, Math.min(100, similarity));
}

/**
 * Classe para gerenciar cache de fingerprints faciais
 */
export class FaceFingerprintCache {
    private storageKey = STORAGE_KEY;
    private maxEntries = MAX_ENTRIES;
    private expiryDays = EXPIRY_DAYS;

    /**
     * Carrega cache do localStorage (com descriptografia)
     */
    load(): FaceCache {
        try {
            const encryptedData = localStorage.getItem(this.storageKey);
            if (!encryptedData) {
                return { fingerprints: [], version: '2.0' }; // v2.0 = criptografado
            }

            // Tenta descriptografar (v2.0)
            const decryptedData = decryptData(encryptedData);
            if (decryptedData) {
                console.log('🔐 Cache descriptografado com sucesso');
                return decryptedData as FaceCache;
            }

            // Fallback: dados antigos sem criptografia (v1.0)
            try {
                const cache = JSON.parse(encryptedData) as FaceCache;
                console.log('⚠️ Migrando cache v1.0 para v2.0 criptografado');
                cache.version = '2.0';
                return cache;
            } catch {
                return { fingerprints: [], version: '2.0' };
            }
        } catch (error) {
            console.error('Erro ao carregar cache:', error);
            return { fingerprints: [], version: '2.0' };
        }
    }

    /**
     * Busca fingerprint similar no cache
     * Retorna o fingerprint se similaridade >= threshold
     */
    findSimilar(metrics: FaceMetrics): FaceFingerprint | null {
        const cache = this.load();

        let bestMatch: { fp: FaceFingerprint; similarity: number } | null = null;

        for (const fp of cache.fingerprints) {
            const similarity = calculateSimilarity(metrics, fp.metrics);

            if (similarity >= SIMILARITY_THRESHOLD) {
                if (!bestMatch || similarity > bestMatch.similarity) {
                    bestMatch = { fp, similarity };
                }
            }
        }

        if (bestMatch) {
            console.log(`✅ Face fingerprint match encontrado: ${bestMatch.similarity.toFixed(1)}% similar - Formato: ${bestMatch.fp.faceShape}`);
            return bestMatch.fp;
        }

        console.log('🆕 Nenhum fingerprint similar encontrado - nova pessoa detectada');
        return null;
    }

    /**
     * Salva ou atualiza fingerprint no cache
     * @param analysis - Análise da IA para cachear (opcional)
     */
    save(metrics: FaceMetrics, faceShape: string, analysis?: FaceFingerprint['lastAnalysis']): void {
        try {
            const cache = this.load();
            const id = generateFingerprint(metrics);

            // Procurar fingerprint similar existente
            const similar = this.findSimilar(metrics);

            if (similar) {
                // Atualizar existente
                const index = cache.fingerprints.findIndex(fp => fp.id === similar.id);
                if (index >= 0) {
                    cache.fingerprints[index].timestamp = Date.now();
                    cache.fingerprints[index].analysisCount++;
                    cache.fingerprints[index].metrics = metrics;

                    // Atualizar análise APENAS se a nova for da IA real (não fallback)
                    if (analysis && analysis.ai_provider !== 'LOCAL' && analysis.ai_provider !== 'LOCAL_FALLBACK') {
                        cache.fingerprints[index].lastAnalysis = analysis;
                        console.log(`🧠 Análise da IA cacheada para este rosto!`);
                    }
                    console.log(`📝 Fingerprint atualizado - Análises: ${cache.fingerprints[index].analysisCount}`);
                }
            } else {
                // Adicionar novo
                const newFp: FaceFingerprint = {
                    id,
                    metrics,
                    faceShape,
                    timestamp: Date.now(),
                    analysisCount: 1
                };

                // Salvar análise se existir e não for fallback
                if (analysis && analysis.ai_provider !== 'LOCAL' && analysis.ai_provider !== 'LOCAL_FALLBACK') {
                    newFp.lastAnalysis = analysis;
                    console.log(`🧠 Análise da IA salva junto com fingerprint!`);
                }

                cache.fingerprints.push(newFp);
                console.log(`✨ Novo fingerprint salvo - Formato: ${faceShape}`);
            }

            // Limpar cache de entradas antigas/excedentes
            this.cleanup(cache);

            // Salvar (CRIPTOGRAFADO)
            const encryptedCache = encryptData(cache);
            localStorage.setItem(this.storageKey, encryptedCache);
            console.log('🔒 Cache salvo criptografado (AES-256)');
        } catch (error) {
            console.error('Erro ao salvar fingerprint:', error);
        }
    }

    /**
     * Limpa entradas antigas e limita quantidade
     */
    private cleanup(cache: FaceCache): void {
        const now = Date.now();
        const expiryMs = this.expiryDays * 24 * 60 * 60 * 1000;

        // Remover expirados (mais de 2 anos)
        const before = cache.fingerprints.length;
        cache.fingerprints = cache.fingerprints.filter(fp => {
            return (now - fp.timestamp) < expiryMs;
        });
        const removed = before - cache.fingerprints.length;
        if (removed > 0) {
            console.log(`🗑️ ${removed} fingerprint(s) expirado(s) removido(s)`);
        }

        // Limitar quantidade (manter os mais usados/recentes)
        if (cache.fingerprints.length > this.maxEntries) {
            cache.fingerprints.sort((a, b) => {
                // Priorizar por uso e recência
                const scoreA = a.analysisCount * 0.7 + (a.timestamp / 1000000) * 0.3;
                const scoreB = b.analysisCount * 0.7 + (b.timestamp / 1000000) * 0.3;
                return scoreB - scoreA;
            });
            cache.fingerprints = cache.fingerprints.slice(0, this.maxEntries);
            console.log(`📊 Cache limitado a ${this.maxEntries} entradas`);
        }
    }

    /**
     * Limpa todo o cache
     */
    clear(): void {
        localStorage.removeItem(this.storageKey);
        console.log('🧹 Cache de fingerprints limpo');
    }

    /**
     * Retorna estatísticas do cache
     */
    getStats(): { count: number; oldestDays: number; totalAnalyses: number } {
        const cache = this.load();
        const now = Date.now();

        if (cache.fingerprints.length === 0) {
            return { count: 0, oldestDays: 0, totalAnalyses: 0 };
        }

        const oldestTimestamp = Math.min(...cache.fingerprints.map(fp => fp.timestamp));
        const oldestDays = Math.floor((now - oldestTimestamp) / (24 * 60 * 60 * 1000));
        const totalAnalyses = cache.fingerprints.reduce((sum, fp) => sum + fp.analysisCount, 0);

        return {
            count: cache.fingerprints.length,
            oldestDays,
            totalAnalyses
        };
    }

    /**
     * Busca análise cacheada para um fingerprint similar
     * Retorna a análise se existir e for válida
     */
    getCachedAnalysis(metrics: FaceMetrics): FaceFingerprint['lastAnalysis'] | null {
        const similar = this.findSimilar(metrics);
        if (similar && similar.lastAnalysis) {
            console.log('🧠 Análise da IA encontrada no cache do fingerprint!');
            console.log(`   → pontos_fortes: ${similar.lastAnalysis.pontos_fortes?.length || 0} itens`);
            console.log(`   → ai_provider: ${similar.lastAnalysis.ai_provider}`);
            return similar.lastAnalysis;
        }
        return null;
    }
}

// Exportar instância singleton
export const faceFingerprintCache = new FaceFingerprintCache();

/**
 * Função helper para salvar análise da IA junto com fingerprint
 * Chamada após receber resposta da API
 */
export function saveAnalysisToFingerprint(
    landmarks: any[],
    faceShape: string,
    analysisResult: any
): void {
    try {
        const metrics = calculateFaceMetrics(landmarks as any);

        // Extrair dados relevantes para cache
        const analysis: FaceFingerprint['lastAnalysis'] = {
            pontos_fortes: analysisResult?.rosto?.pontos_fortes,
            pontos_de_atencao: analysisResult?.rosto?.pontos_de_atencao,
            analise_pele: analysisResult?.rosto?.analise_pele,
            arquetipo: analysisResult?.analise_geral?.arquetipo,
            resumo_brutal: analysisResult?.analise_geral?.resumo_brutal,
            nota_final: parseFloat(analysisResult?.analise_geral?.nota_final) || 0,
            ai_provider: analysisResult?.ai_provider || 'UNKNOWN'
        };

        faceFingerprintCache.save(metrics, faceShape, analysis);
    } catch (error) {
        console.error('Erro ao salvar análise no fingerprint:', error);
    }
}

/**
 * Função helper para buscar análise cacheada por landmarks
 */
export function getCachedAnalysisFromFingerprint(landmarks: any[]): FaceFingerprint['lastAnalysis'] | null {
    try {
        const metrics = calculateFaceMetrics(landmarks as any);
        return faceFingerprintCache.getCachedAnalysis(metrics);
    } catch (error) {
        console.error('Erro ao buscar análise no fingerprint:', error);
        return null;
    }
}
