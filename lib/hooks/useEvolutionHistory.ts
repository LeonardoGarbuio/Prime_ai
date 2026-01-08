"use client";

import { useState, useEffect, useCallback } from 'react';

/**
 * EVOLUTION HISTORY - Rastreador de progresso facial ao longo do tempo
 * 
 * Armazena análises semanais para gerar gráfico de evolução.
 * Limite: 1 entrada por semana para evitar spam.
 */

export interface EvolutionEntry {
    id: string;
    date: string;
    timestamp: number;
    score: number;
    symmetry: number;
    skin: number;
    structure: number;
    harmony: number;
    thumbnail?: string; // Base64 pequeno da foto
}

const EVOLUTION_KEY = 'prime_ai_evolution';
const MIN_DAYS_BETWEEN_ENTRIES = 6; // Mínimo 6 dias entre entradas

export function useEvolutionHistory() {
    const [history, setHistory] = useState<EvolutionEntry[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    // Carregar histórico
    useEffect(() => {
        if (typeof window !== 'undefined') {
            try {
                const stored = localStorage.getItem(EVOLUTION_KEY);
                if (stored) {
                    const parsed = JSON.parse(stored);
                    // Ordenar por data (mais recente primeiro)
                    parsed.sort((a: EvolutionEntry, b: EvolutionEntry) => b.timestamp - a.timestamp);
                    setHistory(parsed);
                }
            } catch (e) {
                console.error('Erro ao carregar histórico de evolução:', e);
            }
            setIsLoaded(true);
        }
    }, []);

    // Salvar histórico
    const saveHistory = useCallback((entries: EvolutionEntry[]) => {
        if (typeof window !== 'undefined') {
            localStorage.setItem(EVOLUTION_KEY, JSON.stringify(entries));
            setHistory(entries);
        }
    }, []);

    // Verificar se pode adicionar nova entrada
    const canAddEntry = useCallback((): { allowed: boolean; daysRemaining: number } => {
        if (history.length === 0) {
            return { allowed: true, daysRemaining: 0 };
        }

        const lastEntry = history[0]; // Mais recente
        const daysSince = Math.floor((Date.now() - lastEntry.timestamp) / (1000 * 60 * 60 * 24));
        const daysRemaining = Math.max(0, MIN_DAYS_BETWEEN_ENTRIES - daysSince);

        return {
            allowed: daysSince >= MIN_DAYS_BETWEEN_ENTRIES,
            daysRemaining
        };
    }, [history]);

    // Adicionar nova entrada
    const addEntry = useCallback((result: any, thumbnail?: string): boolean => {
        const { allowed } = canAddEntry();

        if (!allowed) {
            console.warn('⏳ Muito cedo para nova entrada de evolução');
            return false;
        }

        // Criar thumbnail pequeno (máx 100x100)
        let smallThumbnail = thumbnail;
        if (thumbnail && thumbnail.length > 50000) {
            // Se muito grande, não salvar
            smallThumbnail = undefined;
        }

        const newEntry: EvolutionEntry = {
            id: `evo_${Date.now()}`,
            date: new Date().toISOString(),
            timestamp: Date.now(),
            score: parseFloat(result.analise_geral?.nota_final || "7.0"),
            symmetry: result.grafico_radar?.simetria || result.grafico_radar?.Simetria || 70,
            skin: result.grafico_radar?.qualidade_pele || result.grafico_radar?.pele || 70,
            structure: result.grafico_radar?.estrutura_ossea || 70,
            harmony: result.grafico_radar?.harmonia_facial || result.grafico_radar?.terco_medio || 70,
            thumbnail: smallThumbnail
        };

        const newHistory = [newEntry, ...history].slice(0, 52); // Máx 1 ano de dados (52 semanas)
        saveHistory(newHistory);

        console.log('✅ Nova entrada de evolução salva:', newEntry);
        return true;
    }, [history, canAddEntry, saveHistory]);

    // Calcular evolução
    const getEvolution = useCallback(() => {
        if (history.length < 2) {
            return null;
        }

        const latest = history[0];
        const oldest = history[history.length - 1];
        const previous = history[1];

        return {
            totalChange: +(latest.score - oldest.score).toFixed(1),
            recentChange: +(latest.score - previous.score).toFixed(1),
            symmetryChange: +(latest.symmetry - oldest.symmetry).toFixed(0),
            skinChange: +(latest.skin - oldest.skin).toFixed(0),
            weeksTracked: history.length,
            isImproving: latest.score > previous.score
        };
    }, [history]);

    // Dados para gráfico
    const getChartData = useCallback(() => {
        // Retornar em ordem cronológica (mais antigo primeiro)
        return [...history].reverse().map(entry => ({
            date: new Date(entry.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
            score: entry.score,
            symmetry: entry.symmetry,
            skin: entry.skin,
            structure: entry.structure
        }));
    }, [history]);

    // Limpar histórico
    const clearHistory = useCallback(() => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem(EVOLUTION_KEY);
            setHistory([]);
        }
    }, []);

    return {
        history,
        isLoaded,
        canAddEntry,
        addEntry,
        getEvolution,
        getChartData,
        clearHistory
    };
}
