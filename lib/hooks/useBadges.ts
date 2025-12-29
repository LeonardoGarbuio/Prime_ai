"use client";

import { useState, useEffect, useCallback } from 'react';

// Badge types (moved from history.ts)
export interface Badge {
    id: string;
    name: string;
    description: string;
    icon: string;
    unlocked: boolean;
    unlockedAt?: string;
}

export const AVAILABLE_BADGES: Omit<Badge, 'unlocked' | 'unlockedAt'>[] = [
    { id: 'first_scan', name: 'Primeiro Scan', description: 'Completou sua primeira análise', icon: '🎯' },
    { id: 'consistent', name: 'Consistente', description: 'Fez 3 ou mais análises', icon: '📊' },
    { id: 'evolution', name: 'Evolução', description: 'Sua nota aumentou entre análises', icon: '📈' },
    { id: 'on_fire', name: 'Em Alta', description: '3 análises seguidas com melhoria', icon: '🔥' },
    { id: 'elite', name: 'Elite', description: 'Alcançou nota 9+', icon: '👑' },
    { id: 'top_symmetry', name: 'Top Simetria', description: 'Simetria acima de 90%', icon: '⚖️' },
    { id: 'perfect_skin', name: 'Pele Perfeita', description: 'Pele avaliada acima de 90%', icon: '✨' },
    { id: 'golden_ratio', name: 'Proporção Áurea', description: 'Proporção acima de 85%', icon: '🏛️' },
    { id: 'vip_member', name: 'VIP Member', description: 'Fez uma análise VIP', icon: '💎' },
];

// Simplified history type for badge checking
interface AnalysisHistory {
    nota_final: number;
}

const BADGES_KEY = 'prime_ai_badges';

export function useBadges() {
    const [badges, setBadges] = useState<Badge[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    // Carrega badges do localStorage
    useEffect(() => {
        if (typeof window !== 'undefined') {
            try {
                const stored = localStorage.getItem(BADGES_KEY);
                if (stored) {
                    setBadges(JSON.parse(stored));
                } else {
                    // Inicializa com todos os badges bloqueados
                    const initialBadges: Badge[] = AVAILABLE_BADGES.map(b => ({
                        ...b,
                        unlocked: false
                    }));
                    setBadges(initialBadges);
                }
            } catch (e) {
                console.error('Erro ao carregar badges:', e);
            }
            setIsLoaded(true);
        }
    }, []);

    // Salva no localStorage quando badges mudam
    useEffect(() => {
        if (isLoaded && typeof window !== 'undefined') {
            localStorage.setItem(BADGES_KEY, JSON.stringify(badges));
        }
    }, [badges, isLoaded]);

    // Desbloqueia um badge
    const unlockBadge = useCallback((badgeId: string) => {
        setBadges(prev => prev.map(b => {
            if (b.id === badgeId && !b.unlocked) {
                return { ...b, unlocked: true, unlockedAt: new Date().toISOString() };
            }
            return b;
        }));
    }, []);

    // Verifica e desbloqueia badges baseado no histórico
    const checkAndUnlockBadges = useCallback((
        history: AnalysisHistory[],
        currentResult?: any
    ) => {
        const newlyUnlocked: string[] = [];

        // Primeiro Scan
        if (history.length >= 1) {
            const badge = badges.find(b => b.id === 'first_scan');
            if (badge && !badge.unlocked) {
                unlockBadge('first_scan');
                newlyUnlocked.push('first_scan');
            }
        }

        // Consistente (3+ scans)
        if (history.length >= 3) {
            const badge = badges.find(b => b.id === 'consistent');
            if (badge && !badge.unlocked) {
                unlockBadge('consistent');
                newlyUnlocked.push('consistent');
            }
        }

        // Evolução (nota aumentou)
        if (history.length >= 2) {
            const current = history[0];
            const previous = history[1];
            if (current.nota_final > previous.nota_final) {
                const badge = badges.find(b => b.id === 'evolution');
                if (badge && !badge.unlocked) {
                    unlockBadge('evolution');
                    newlyUnlocked.push('evolution');
                }
            }
        }

        // Em Alta (3 análises seguidas com melhoria)
        if (history.length >= 3) {
            const last3 = history.slice(0, 3);
            if (last3[0].nota_final > last3[1].nota_final &&
                last3[1].nota_final > last3[2].nota_final) {
                const badge = badges.find(b => b.id === 'on_fire');
                if (badge && !badge.unlocked) {
                    unlockBadge('on_fire');
                    newlyUnlocked.push('on_fire');
                }
            }
        }

        // Verifica baseado no resultado atual
        if (currentResult || history.length > 0) {
            const result = currentResult || history[0];

            // Elite (nota >= 9)
            const nota = parseFloat(result.nota_final || result.analise_geral?.nota_final) || 0;
            if (nota >= 9) {
                const badge = badges.find(b => b.id === 'elite');
                if (badge && !badge.unlocked) {
                    unlockBadge('elite');
                    newlyUnlocked.push('elite');
                }
            }

            // Top Simetria (>= 90)
            const simetria = result.simetria || result.grafico_radar?.simetria || 0;
            if (simetria >= 90) {
                const badge = badges.find(b => b.id === 'top_symmetry');
                if (badge && !badge.unlocked) {
                    unlockBadge('top_symmetry');
                    newlyUnlocked.push('top_symmetry');
                }
            }

            // Pele Perfeita (>= 90)
            const pele = result.pele || result.grafico_radar?.pele || 0;
            if (pele >= 90) {
                const badge = badges.find(b => b.id === 'perfect_skin');
                if (badge && !badge.unlocked) {
                    unlockBadge('perfect_skin');
                    newlyUnlocked.push('perfect_skin');
                }
            }

            // Proporção Áurea (>= 85)
            const proporcao = result.proporcao_aurea || result.grafico_radar?.proporcao_aurea || 0;
            if (proporcao >= 85) {
                const badge = badges.find(b => b.id === 'golden_ratio');
                if (badge && !badge.unlocked) {
                    unlockBadge('golden_ratio');
                    newlyUnlocked.push('golden_ratio');
                }
            }

            // VIP Member
            if (result.fullResult?.isVip || result.isVip) {
                const badge = badges.find(b => b.id === 'vip_member');
                if (badge && !badge.unlocked) {
                    unlockBadge('vip_member');
                    newlyUnlocked.push('vip_member');
                }
            }
        }

        return newlyUnlocked;
    }, [badges, unlockBadge]);

    // Retorna apenas badges desbloqueados
    const getUnlockedBadges = useCallback(() => {
        return badges.filter(b => b.unlocked);
    }, [badges]);

    // Retorna badges bloqueados
    const getLockedBadges = useCallback(() => {
        return badges.filter(b => !b.unlocked);
    }, [badges]);

    // Conta badges
    const getBadgeStats = useCallback(() => {
        const unlocked = badges.filter(b => b.unlocked).length;
        return {
            unlocked,
            total: badges.length,
            percentage: Math.round((unlocked / badges.length) * 100)
        };
    }, [badges]);

    return {
        badges,
        isLoaded,
        unlockBadge,
        checkAndUnlockBadges,
        getUnlockedBadges,
        getLockedBadges,
        getBadgeStats
    };
}
