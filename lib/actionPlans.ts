"use client";

/**
 * ACTION PLANS - Exercícios personalizados baseados nos problemas detectados
 * 
 * O sistema detecta pontos fracos na análise e sugere treinos específicos
 * para melhorar cada área em 30 dias.
 */

export interface Exercise {
    name: string;
    duration: string;
    description: string;
    icon?: string;
}

export interface ActionPlan {
    id: string;
    title: string;
    icon: string;
    color: string;
    duration: string;
    exercises: Exercise[];
}

// Mapeamento de problemas → planos de ação
export const ACTION_PLANS: Record<string, ActionPlan> = {
    'MANDIBULA_FRACA': {
        id: 'jawline',
        title: 'Treino de Mandíbula',
        icon: '💪',
        color: 'from-orange-500 to-red-500',
        duration: '30 Dias',
        exercises: [
            {
                name: 'Mewing',
                duration: '24h (postura)',
                description: 'Língua inteira pressionada no céu da boca, dentes levemente encostados, lábios selados.',
                icon: '👅'
            },
            {
                name: 'Jaw Clench',
                duration: '3x20 reps/dia',
                description: 'Aperte os dentes com força por 5 segundos, relaxe por 3. Repita.',
                icon: '😬'
            },
            {
                name: 'Chiclete Duro',
                duration: '20 min/dia',
                description: 'Mascar chiclete duro (tipo Falim) alternando os lados. Fortalece músculos masseter.',
                icon: '🫧'
            },
            {
                name: 'Chin Tucks',
                duration: '3x15 reps/dia',
                description: 'Puxe o queixo para trás criando "papada falsa". Mantém 5s cada.',
                icon: '🙆'
            }
        ]
    },

    'ASSIMETRIA': {
        id: 'symmetry',
        title: 'Correção de Assimetria',
        icon: '⚖️',
        color: 'from-blue-500 to-cyan-500',
        duration: '30 Dias',
        exercises: [
            {
                name: 'Massagem Facial',
                duration: '5 min/dia',
                description: 'Massageie o lado mais fraco do rosto com movimentos circulares ascendentes.',
                icon: '💆'
            },
            {
                name: 'Mascar no Lado Fraco',
                duration: 'Todas refeições',
                description: 'Mastigue sempre começando pelo lado menos desenvolvido.',
                icon: '🦷'
            },
            {
                name: 'Dormir de Costas',
                duration: 'Todas as noites',
                description: 'Evite dormir de lado para não pressionar um lado do rosto.',
                icon: '😴'
            },
            {
                name: 'Consciência Postural',
                duration: 'Constante',
                description: 'Evite apoiar o rosto na mão ou inclinar a cabeça para um lado.',
                icon: '🧘'
            }
        ]
    },

    'PELE_RUIM': {
        id: 'skin',
        title: 'Protocolo de Pele',
        icon: '✨',
        color: 'from-pink-500 to-purple-500',
        duration: '30 Dias',
        exercises: [
            {
                name: 'Limpeza',
                duration: '2x/dia',
                description: 'Lave o rosto manhã e noite com sabonete facial suave.',
                icon: '🧼'
            },
            {
                name: 'Hidratação',
                duration: 'Após lavar',
                description: 'Aplique hidratante leve (oil-free se pele oleosa).',
                icon: '💧'
            },
            {
                name: 'Protetor Solar',
                duration: 'Toda manhã',
                description: 'FPS 30+ mesmo em dias nublados. Reaplicar a cada 3-4h.',
                icon: '☀️'
            },
            {
                name: 'Água',
                duration: '2-3L/dia',
                description: 'Hidratação vem de dentro. Mínimo 2 litros de água por dia.',
                icon: '🚰'
            }
        ]
    },

    'OLHEIRAS': {
        id: 'dark_circles',
        title: 'Redução de Olheiras',
        icon: '👁️',
        color: 'from-indigo-500 to-violet-500',
        duration: '30 Dias',
        exercises: [
            {
                name: 'Sono Regulado',
                duration: '7-8h/noite',
                description: 'Dormir e acordar sempre no mesmo horário.',
                icon: '🌙'
            },
            {
                name: 'Compressa Fria',
                duration: '5 min/dia',
                description: 'Aplique colheres geladas ou rodelas de pepino nos olhos.',
                icon: '🥒'
            },
            {
                name: 'Vitamina C Sérum',
                duration: 'Toda manhã',
                description: 'Aplique sérum de vitamina C na região dos olhos.',
                icon: '🍊'
            }
        ]
    },

    'ESTRUTURA_OSSEA': {
        id: 'bone_structure',
        title: 'Definição Facial',
        icon: '💀',
        color: 'from-gray-500 to-slate-600',
        duration: '60 Dias',
        exercises: [
            {
                name: 'Perda de Gordura',
                duration: 'Déficit calórico',
                description: 'Reduzir gordura corporal revela a estrutura óssea naturalmente.',
                icon: '🏃'
            },
            {
                name: 'Mewing Avançado',
                duration: '24h',
                description: 'Mewing com força (hard mewing) por períodos curtos.',
                icon: '💪'
            },
            {
                name: 'Exercícios Pescoço',
                duration: '3x/semana',
                description: 'Fortalecer pescoço melhora postura e aparência facial.',
                icon: '🦒'
            }
        ]
    }
};

/**
 * Analisa o resultado e retorna os planos de ação relevantes
 */
export function getActionPlans(result: any): ActionPlan[] {
    const plans: ActionPlan[] = [];

    // 1. Mandíbula Fraca
    const tipoMandibula = result.metrics?.tipoMandibula || '';
    const jawScore = result.grafico_radar?.estrutura_ossea || 70;

    if (tipoMandibula === 'SUAVE' || tipoMandibula === 'MUITO_SUAVE' || jawScore < 65) {
        plans.push(ACTION_PLANS.MANDIBULA_FRACA);
    }

    // 2. Assimetria
    const symmetryScore = result.grafico_radar?.simetria || result.grafico_radar?.Simetria || 80;
    if (symmetryScore < 75) {
        plans.push(ACTION_PLANS.ASSIMETRIA);
    }

    // 3. Pele
    const skinScore = result.grafico_radar?.qualidade_pele || result.grafico_radar?.pele || 80;
    if (skinScore < 70) {
        plans.push(ACTION_PLANS.PELE_RUIM);
    }

    // 4. Estrutura Óssea (se nota muito baixa)
    if (jawScore < 55) {
        plans.push(ACTION_PLANS.ESTRUTURA_OSSEA);
    }

    // 5. Verificar pontos_de_atencao da IA
    const pontosAtencao = result.rosto?.pontos_de_atencao || [];
    for (const ponto of pontosAtencao) {
        const pontoLower = ponto.toLowerCase();

        if (pontoLower.includes('olheira') || pontoLower.includes('olhos cansados')) {
            if (!plans.find(p => p.id === 'dark_circles')) {
                plans.push(ACTION_PLANS.OLHEIRAS);
            }
        }

        if (pontoLower.includes('mandíbula') || pontoLower.includes('maxilar') || pontoLower.includes('jawline')) {
            if (!plans.find(p => p.id === 'jawline')) {
                plans.push(ACTION_PLANS.MANDIBULA_FRACA);
            }
        }

        if (pontoLower.includes('assimetr')) {
            if (!plans.find(p => p.id === 'symmetry')) {
                plans.push(ACTION_PLANS.ASSIMETRIA);
            }
        }

        if (pontoLower.includes('pele') || pontoLower.includes('acne') || pontoLower.includes('textura')) {
            if (!plans.find(p => p.id === 'skin')) {
                plans.push(ACTION_PLANS.PELE_RUIM);
            }
        }
    }

    // Limitar a 3 planos para não sobrecarregar
    return plans.slice(0, 3);
}
