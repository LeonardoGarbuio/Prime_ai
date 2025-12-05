import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const apiKey = process.env.GOOGLE_API_KEY;

    if (!apiKey) {
        console.error("❌ ERRO CRÍTICO: GOOGLE_API_KEY não encontrada.");
        return NextResponse.json(
            { error: "Configuração de servidor inválida. Chave de API não encontrada." },
            { status: 500 }
        );
    }

    try {
        const { faceImage, bodyImage, metrics } = await req.json();

        if (!faceImage) {
            return NextResponse.json({ error: "Imagem obrigatória" }, { status: 400 });
        }

        const cleanBase64 = faceImage.replace(/^data:image\/\w+;base64,/, "");

        console.log("🔍 PRIME AI: Conectando ao Google...");

        // Se temos métricas detalhadas do MediaPipe (novo sistema)
        const hasDetailedMetrics = metrics && metrics.formato_rosto;

        if (hasDetailedMetrics) {
            console.log("📏 MEDIAPIPE DETALHADO RECEBIDO:", metrics.formato_rosto, `(${metrics.confianca}%)`);
        } else if (metrics) {
            console.log("📏 MEDIAPIPE SIMPLES RECEBIDO:", metrics);
        }

        const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
        const listResp = await fetch(listUrl);

        if (!listResp.ok) {
            const errorBody = await listResp.json().catch(() => ({}));
            console.error("❌ ERRO DE CONEXÃO:", JSON.stringify(errorBody, null, 2));

            if (listResp.status === 403) throw new Error("Chave de API Bloqueada/Inválida (Forbidden).");
            if (listResp.status === 400) throw new Error("Chave de API Inválida (Bad Request).");

            throw new Error(`Erro API Google: ${listResp.status} - ${errorBody.error?.message || "Sem detalhes"}`);
        }

        const listData = await listResp.json();
        let models = listData.models || [];

        models.sort((a: any, b: any) => a.name.localeCompare(b.name));

        let chosenModel = models.find((m: any) => m.name.includes("gemini-2.5-flash") && m.supportedGenerationMethods.includes("generateContent"))?.name;
        if (!chosenModel) chosenModel = models.find((m: any) => m.name.includes("gemini-2.0-flash") && m.supportedGenerationMethods.includes("generateContent"))?.name;
        if (!chosenModel) chosenModel = models.find((m: any) => m.name.includes("gemini-1.5-flash-001") && m.supportedGenerationMethods.includes("generateContent"))?.name;
        if (!chosenModel) chosenModel = models.find((m: any) => m.name.includes("gemini-1.5-flash") && m.supportedGenerationMethods.includes("generateContent"))?.name;
        if (!chosenModel) chosenModel = models.find((m: any) => m.name.includes("gemini-1.5-pro") && m.supportedGenerationMethods.includes("generateContent"))?.name;

        if (!chosenModel) throw new Error("Nenhum modelo Gemini disponível nesta conta.");

        console.log("✅ CÉREBRO ATIVO:", chosenModel);

        const generateUrl = `https://generativelanguage.googleapis.com/v1beta/${chosenModel}:generateContent?key=${apiKey}`;

        // Construir prompt
        let promptText = "";

        if (hasDetailedMetrics) {
            // PROMPT AVANÇADO COM DADOS DO FUZZY LOGIC
            promptText = `
Analise este rosto. JÁ TEMOS UMA ANÁLISE GEOMÉTRICA PRECISA FEITA POR ALGORITMO.
USE ESTES DADOS COMO BASE ABSOLUTA PARA O FORMATO.

📊 DADOS TÉCNICOS (VERDADE ABSOLUTA):
- Formato Principal: ${metrics.formato_rosto} (Confiança: ${metrics.confianca}%)
- Segunda Opção: ${metrics.segunda_opcao} (Confiança: ${metrics.confianca_segunda}%)
- Ângulo Mandíbula: ${metrics.angulo_mandibula_medio.toFixed(1)}°
- Ângulo Queixo: ${metrics.angulo_queixo.toFixed(1)}°
- Proporção Altura/Largura: ${metrics.prop_altura_largura.toFixed(2)}
- Índice de Angularidade: ${metrics.indice_angularidade.toFixed(1)}%

INSTRUÇÕES:
1. O formato do rosto É ${metrics.formato_rosto}. Não tente adivinhar outro.
2. Use os ângulos e índices acima para justificar a análise.
3. Foque sua criatividade na análise de pele, arquétipos e plano de correção.

RETORNE APENAS ESTE JSON (sem texto adicional):
{
    "medidas": {
        "L_TESTA": ${(metrics.largura_testa_media * 100).toFixed(0)},
        "L_ZIGOMAS": 100,
        "L_MANDIBULA": ${(metrics.largura_mandibula_media * 100).toFixed(0)},
        "ALTURA": ${(metrics.prop_altura_largura * 100).toFixed(0)},
        "maior_largura": "CALCULE_BASEADO_NOS_DADOS",
        "angulo_mandibula": "${metrics.angulo_mandibula_medio < 125 ? 'ANGULAR' : 'CURVO'}"
    },
    "analise_geral": { 
        "nota_final": 7.23,
        "nota_potencial": 8.15,
        "idade_real_estimada": 28,
        "potencial_genetico": "Baixo | Médio | Alto | Elite",
        "arquetipo": "The Hunter | Noble | Charmer | Creator | Ruler | Mystic | Warrior | Angel",
        "resumo_brutal": "Avaliação técnica honesta baseada nas medidas exatas."
    },
    "rosto": { 
        "pontos_fortes": ["Técnico 1", "Técnico 2"], 
        "falhas_criticas": ["Específico 1", "Específico 2"], 
        "analise_pele": "Textura, poros, manchas" 
    },
    "grafico_radar": { 
        "simetria": 85, 
        "qualidade_pele": 78, 
        "estrutura_ossea": 82, 
        "harmonia_facial": 80, 
        "proporcao_aurea": 77
    },
    "corpo_postura": { 
        "analise": "Descrição ou 'Apenas rosto visível'", 
        "bf_estimado": "10-15% | 15-20% | etc" 
    },
    "plano_correcao": { 
        "passo_1_imediato": "24-48h: Ação específica",
        "passo_2_rotina": "30-90 dias: Protocolo",
        "passo_3_longo_prazo": "6+ meses: Estética"
    }
}`;
        } else {
            // Fallback para prompt antigo (sem métricas ou métricas simples)
            promptText = `
Analise este rosto e retorne APENAS medições objetivas.
RETORNE APENAS ESTE JSON (sem texto adicional):
{
    "medidas": {
        "L_TESTA": 0,
        "L_ZIGOMAS": 0,
        "L_MANDIBULA": 0,
        "ALTURA": 0,
        "maior_largura": "TESTA | ZIGOMAS | MANDIBULA",
        "angulo_mandibula": "ANGULAR | CURVO"
    },
    "analise_geral": { 
        "nota_final": 7.0,
        "nota_potencial": 8.0,
        "idade_real_estimada": 25,
        "potencial_genetico": "Médio",
        "arquetipo": "The Noble",
        "resumo_brutal": "Análise básica."
    },
    "rosto": { 
        "pontos_fortes": ["Traço 1"], 
        "falhas_criticas": ["Falha 1"], 
        "analise_pele": "Normal" 
    },
    "grafico_radar": { 
        "simetria": 80, 
        "qualidade_pele": 80, 
        "estrutura_ossea": 80, 
        "harmonia_facial": 80, 
        "proporcao_aurea": 80
    },
    "corpo_postura": { 
        "analise": "N/A", 
        "bf_estimado": "N/A" 
    },
    "plano_correcao": { 
        "passo_1_imediato": "Ação",
        "passo_2_rotina": "Rotina",
        "passo_3_longo_prazo": "Futuro"
    }
}`;
        }

        // Adicionar definições comuns de arquétipos e notas
        promptText += `
ARQUÉTIPOS:
- The Hunter: Olhos predatórios, maxilar dominante
- The Noble: Proporções clássicas, elegância
- The Charmer: Sorriso natural, energia amigável  
- The Creator: Testa ampla, olhar inteligente
- The Ruler: Estrutura óssea forte
- The Mystic: Traços exóticos
- The Warrior: Features marcadas
- The Angel: Traços infantis

NOTAS (seja justo):
9.5-10: Elite (0.01%)
9.0-9.4: Elite (0.1%)
8.5-8.9: Excepcional (1%)
8.0-8.4: Muito atraente (3%)
7.5-7.9: Atraente (10%)
7.0-7.4: Bonito (20%)
6.5-6.9: Acima média (30%)
6.0-6.4: Média+ (40%)
5.5-5.9: Média (50%)
< 5.5: Abaixo média

Use decimais variados (7.43, 6.81, 8.27).`;

        const requestBody = {
            contents: [{
                parts: [
                    { text: promptText },
                    { inline_data: { mime_type: "image/jpeg", data: cleanBase64 } }
                ]
            }],
            generationConfig: {
                temperature: 0.2,
                seed: 42
            }
        };

        let genResp: Response | null = null;
        let lastError: any = null;

        // Tentar até 3 vezes em caso de sobrecarga (503)
        for (let i = 0; i < 3; i++) {
            try {
                genResp = await fetch(generateUrl, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(requestBody)
                });

                if (genResp.ok) {
                    lastError = null;
                    break;
                }

                const errorBody = await genResp.json().catch(() => ({}));
                const errorMessage = errorBody.error?.message || genResp.statusText;
                lastError = new Error(`Erro IA (${genResp.status}): ${errorMessage}`);

                // Retry apenas em 503 (Service Unavailable) ou 429 (Too Many Requests)
                if (genResp.status === 503 || genResp.status === 429) {
                    console.warn(`⚠️ Tentativa ${i + 1} falhou (${genResp.status}). Retentando em ${2 * (i + 1)}s...`);
                    await new Promise(r => setTimeout(r, 2000 * (i + 1)));
                    continue;
                }

                // Erro fatal (400, 401, etc), não retentar
                break;

            } catch (e) {
                lastError = e;
                console.warn(`⚠️ Erro de rede na tentativa ${i + 1}. Retentando...`);
                await new Promise(r => setTimeout(r, 2000 * (i + 1)));
            }
        }

        if (!genResp || !genResp.ok) {
            console.error("❌ ERRO NA GERAÇÃO (FALHA FINAL):", lastError);
            throw lastError || new Error("Falha desconhecida na API do Google");
        }

        const data = await genResp.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);

        if (!jsonMatch) throw new Error("Formato inválido.");

        const aiResult = JSON.parse(jsonMatch[0]);

        // SE TIVERMOS MÉTRICAS DETALHADAS, SOBRESCREVEMOS O RESULTADO DA IA
        if (hasDetailedMetrics) {
            aiResult.rosto.formato_rosto = metrics.formato_rosto;
            aiResult.rosto.confianca = `${metrics.confianca}%`;
            aiResult.rosto.justificativa_completa = metrics.descricao;

            // Injetar dados calculados para o frontend exibir se quiser
            aiResult.rosto.dados_tecnicos = {
                angulo_mandibula: metrics.angulo_mandibula_medio,
                indice_angularidade: metrics.indice_angularidade,
                segunda_opcao: metrics.segunda_opcao
            };
        }

        return NextResponse.json(aiResult);

    } catch (error: any) {
        console.error("❌ ERRO:", error.message);
        return NextResponse.json({
            error: "Erro de Processamento",
            details: error.message,
            analise_geral: { nota_final: 7.0, resumo_brutal: "Erro técnico." },
            rosto: { formato_rosto: "Oval" },
            erro_leitura: true
        }, { status: 500 });
    }
}
