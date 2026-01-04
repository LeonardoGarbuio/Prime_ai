"use client";

import { useState, useEffect, useCallback } from 'react';

// ====== TYPES ======
interface CachedResult {
    hash: string;
    result: any;
    timestamp: number;
}

interface CacheStore {
    [hash: string]: CachedResult;
}

// ====== CONSTANTS ======
const USAGE_COUNT_KEY = 'prime_ai_usage_count';
const PRO_STATUS_KEY = 'prime_ai_pro_status';
const CACHE_KEY = 'prime_ai_cache';
const MAX_FREE_USES = 5; // Limite de análises gratuitas para produção
const CACHE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias

// ====== HASH FUNCTION ======
async function generateImageHash(base64: string): Promise<string> {
    // Usar parte da imagem para gerar hash rápido
    // Pegar início, meio e fim para evitar colisões
    const sample = base64.slice(0, 20000) +
        base64.slice(Math.floor(base64.length / 2), Math.floor(base64.length / 2) + 10000) +
        base64.slice(-10000);

    const encoder = new TextEncoder();
    const data = encoder.encode(sample);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
}

// ====== HOOK ======
export function useApiLimiter() {
    const [usageCount, setUsageCount] = useState(0);
    const [isPro, setIsPro] = useState(false);
    const [cache, setCache] = useState<CacheStore>({});
    const [isLoaded, setIsLoaded] = useState(false);

    // Carregar dados do localStorage
    useEffect(() => {
        if (typeof window !== 'undefined') {
            try {
                // Carregar contador de uso
                const storedCount = localStorage.getItem(USAGE_COUNT_KEY);
                if (storedCount) {
                    setUsageCount(parseInt(storedCount, 10) || 0);
                }

                // Carregar status PRO
                const storedPro = localStorage.getItem(PRO_STATUS_KEY);
                setIsPro(storedPro === 'true');

                // Carregar cache
                const storedCache = localStorage.getItem(CACHE_KEY);
                if (storedCache) {
                    const parsedCache: CacheStore = JSON.parse(storedCache);

                    // Limpar cache expirado
                    const now = Date.now();
                    const validCache: CacheStore = {};
                    for (const [hash, entry] of Object.entries(parsedCache)) {
                        if (now - entry.timestamp < CACHE_MAX_AGE_MS) {
                            validCache[hash] = entry;
                        }
                    }
                    setCache(validCache);

                    // Salvar cache limpo
                    localStorage.setItem(CACHE_KEY, JSON.stringify(validCache));
                }
            } catch (e) {
                console.error('[useApiLimiter] Erro ao carregar dados:', e);
            }
            setIsLoaded(true);
        }
    }, []);

    // Salvar contador quando mudar
    useEffect(() => {
        if (isLoaded && typeof window !== 'undefined') {
            localStorage.setItem(USAGE_COUNT_KEY, String(usageCount));
        }
    }, [usageCount, isLoaded]);

    // Verificar se pode usar a API (não atingiu limite)
    const canUseApi = useCallback((): boolean => {
        if (isPro) return true;
        return usageCount < MAX_FREE_USES;
    }, [isPro, usageCount]);

    // Obter análises restantes
    const getRemainingUses = useCallback((): number => {
        if (isPro) return Infinity;
        return Math.max(0, MAX_FREE_USES - usageCount);
    }, [isPro, usageCount]);

    // Verificar cache por imagem
    const checkCache = useCallback(async (imageBase64: string): Promise<any | null> => {
        try {
            const hash = await generateImageHash(imageBase64);
            const cached = cache[hash];

            if (cached) {
                console.log('✅ [useApiLimiter] Cache HIT para hash:', hash.slice(0, 8));
                return cached.result;
            }

            console.log('❌ [useApiLimiter] Cache MISS para hash:', hash.slice(0, 8));
            return null;
        } catch (e) {
            console.error('[useApiLimiter] Erro ao verificar cache:', e);
            return null;
        }
    }, [cache]);

    // Salvar resultado no cache
    const saveToCache = useCallback(async (imageBase64: string, result: any): Promise<void> => {
        try {
            const hash = await generateImageHash(imageBase64);

            const newCache: CacheStore = {
                ...cache,
                [hash]: {
                    hash,
                    result,
                    timestamp: Date.now()
                }
            };

            setCache(newCache);
            localStorage.setItem(CACHE_KEY, JSON.stringify(newCache));
            console.log('💾 [useApiLimiter] Resultado cacheado para hash:', hash.slice(0, 8));
        } catch (e) {
            console.error('[useApiLimiter] Erro ao salvar no cache:', e);
        }
    }, [cache]);

    // Incrementar uso
    const incrementUsage = useCallback((): void => {
        if (!isPro) {
            setUsageCount(prev => prev + 1);
            console.log(`📊 [useApiLimiter] Uso incrementado: ${usageCount + 1}/${MAX_FREE_USES}`);
        }
    }, [isPro, usageCount]);

    // Ativar PRO
    const activatePro = useCallback((): void => {
        setIsPro(true);
        localStorage.setItem(PRO_STATUS_KEY, 'true');
        console.log('👑 [useApiLimiter] Status PRO ativado!');
    }, []);

    // Desativar PRO (para testes)
    const deactivatePro = useCallback((): void => {
        setIsPro(false);
        localStorage.setItem(PRO_STATUS_KEY, 'false');
    }, []);

    // Resetar contador (para testes)
    const resetUsage = useCallback((): void => {
        setUsageCount(0);
        localStorage.setItem(USAGE_COUNT_KEY, '0');
    }, []);

    // Limpar cache (para testes)
    const clearCache = useCallback((): void => {
        setCache({});
        localStorage.removeItem(CACHE_KEY);
    }, []);

    return {
        // Estado
        usageCount,
        isPro,
        isLoaded,
        maxFreeUses: MAX_FREE_USES,

        // Getters
        canUseApi,
        getRemainingUses,

        // Cache
        checkCache,
        saveToCache,

        // Actions
        incrementUsage,
        activatePro,
        deactivatePro,
        resetUsage,
        clearCache
    };
}
