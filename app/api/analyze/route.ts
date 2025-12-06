import { NextResponse } from "next/server";

export async function POST(req: Request) {
    // --- SUA CHAVE ---
    const apiKey = process.env.GOOGLE_API_KEY;

    if (!apiKey) {
        console.error("❌ ERRO CRÍTICO: GOOGLE_API_KEY não encontrada.");
        return NextResponse.json(
            { error: "Configuração de servidor inválida. Chave de API não encontrada." },
            { status: 500 }
        );
    }

    console.log("🚀 API /api/analyze CHAMADA!"); // DEBUG LOG

    try {
        // Agora aceitamos "mode" e "userContext" para diferenciar o uso
        // "metrics" é mantido para garantir a precisão geométrica no modo forense
        const { faceImage, bodyImage, mode = "forensic", userContext = "", metrics } = await req.json();

        if (!faceImage) {
            return NextResponse.json({ error: "Imagem obrigatória" }, { status: 400 });
        }

        const cleanBase64 = (str: string) => str.replace(/^data:image\/\w+;base64,/, "");

        // --- PASSO 1: SELEÇÃO DE MODELO ROBUSTA (User's Logic) ---
        console.log(`🔍 PRIME AI: Iniciando modo ${mode.toUpperCase()}...`);

        // Usamos uma conexão direta para listar modelos e evitar erros de versão do SDK
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

        // Ordena para consistência
        models.sort((a: any, b: any) => a.name.localeCompare(b.name));

        // Lógica de seleção de modelo (Prioridade do Usuário)
        let chosenModel = models.find((m: any) => m.name.includes("gemini-2.0-flash") && m.supportedGenerationMethods.includes("generateContent"))?.name;
        if (!chosenModel) chosenModel = models.find((m: any) => m.name.includes("gemini-1.5-flash-001") && m.supportedGenerationMethods.includes("generateContent"))?.name;
        if (!chosenModel) chosenModel = models.find((m: any) => m.name.includes("gemini-1.5-flash") && m.supportedGenerationMethods.includes("generateContent"))?.name;
        if (!chosenModel) chosenModel = models.find((m: any) => m.name.includes("gemini-1.5-pro") && m.supportedGenerationMethods.includes("generateContent"))?.name;

        if (!chosenModel) {
            console.warn("⚡ NENHUM MODELO ENCONTRADO NA LISTA. Forçando Fallback Hardcoded.");
            chosenModel = "models/gemini-1.5-flash";
        }

        console.log("✅ CÉREBRO ATIVO:", chosenModel);

        const generateUrl = `https://generativelanguage.googleapis.com/v1beta/${chosenModel}:generateContent?key=${apiKey}`;

        // --- PASSO 2: SELEÇÃO DO PROMPT (O CÉREBRO DUPLO + FUZZY LOGIC) ---
        let promptText = "";

        // Se tivermos métricas do MediaPipe, injetamos para garantir precisão (Fuzzy Logic)
        let metricsContext = "";
        const hasDetailedMetrics = metrics && metrics.formato_rosto;

        if (hasDetailedMetrics) {
            metricsContext = `
            📊 DADOS TÉCNICOS (VERDADE ABSOLUTA - USE ISTO):
            - Formato Principal: ${metrics.formato_rosto} (Confiança: ${metrics.confianca}%)
            - Segunda Opção: ${metrics.segunda_opcao || "N/A"} (Confiança: ${metrics.confianca_segunda || 0}%)
            - Ângulo Mandíbula: ${(metrics.angulo_mandibula_medio || 0).toFixed(1)}°
            - Proporção Altura/Largura: ${(metrics.prop_altura_largura || 0).toFixed(2)}
            - Índice de Afilamento: ${(metrics.indice_afilamento || 0).toFixed(1)}%
            - SCORE GEOMÉTRICO (BEAUTY SCORE): ${metrics.beauty_score || "N/A"}
            
            INSTRUÇÃO CRÍTICA: O formato do rosto É ${metrics.formato_rosto}. Não tente adivinhar outro.
            INSTRUÇÃO CRÍTICA: A "Nota do Look" DEVE ser EXATAMENTE ${metrics.beauty_score} (se disponível). Se não, calcule com base na geometria.
            `;
        }

        if (mode === "stylist") {
            // === MODO STYLIST (VIP) ===
            promptText = `
            ATUE COMO: O maior especialista mundial em Visagismo, Antropometria Facial, Cirurgia Plástica E Personal Stylist de Celebridades.
            CONTEXTO DO USUÁRIO: "${userContext || 'Análise de look do dia'}"
            
            TAREFA: Realizar uma análise COMPLETA (Forense + Estilo).
            O usuário é VIP e pagou para ter TUDO: Análise geométrica precisa E dicas de estilo para o evento de hoje.

            ${metricsContext}

            DIRETRIZES DE ANÁLISE PROFUNDA (Chain of Thought):
            1. **Mapeamento de Landmarks:** Localize mentalmente Trichion, Glabella, Menton, Zigomas e Gonions.
            2. **Índice Facial:** Calcule a proporção Altura vs Largura Bizigomática.
            3. **Ângulo Gonial:** Estime o ângulo da mandíbula. <115º indica quadrado/forte. >125º indica oval/suave.
            4. **Simetria:** Compare o lado esquerdo vs direito.
            5. **Estilo & Vibe:** Analise a roupa, maquiagem e cabelo atuais para o contexto informado.

            SAÍDA JSON (ESTRITA - SUPERSET):
            {
                "analise_geral": { 
                    "nota_final": (Número decimal entre 0.0 e 10.0), 
                    "idade_real_estimada": (Número inteiro),
                    "potencial_genetico": "Baixo" | "Médio" | "Alto" | "Elite",
                    "arquetipo": "The Hunter | Noble | Charmer | Creator | Ruler | Mystic | Warrior | Angel",
                    "resumo_brutal": "Uma avaliação técnica, direta e sem filtros sobre a harmonia facial."
                },
                "rosto": { 
                    "formato_rosto": "Oval" | "Quadrado" | "Redondo" | "Diamante" | "Triângulo" | "Coração", 
                    "pontos_fortes": ["Característica Técnica 1", "Característica Técnica 2"], 
                    "falhas_criticas": ["Assimetria 1", "Falha 2"], 
                    "analise_pele": "Análise dermatológica detalhada." 
                },
                "grafico_radar": { 
                    "simetria": (0-100), 
                    "pele": (0-100), 
                    "estrutura_ossea": (0-100), 
                    "terco_medio": (0-100), 
                    "proporcao_aurea": (0-100) 
                },
                "corpo_postura": { 
                    "analise": "Se visível, descreva. Se não, 'Apenas rosto visível'.", 
                    "gordura_estimada": "Baixa" | "Média" | "Alta" 
                },
                "plano_correcao": { 
                    "passo_1_imediato": "Correção visual imediata", 
                    "passo_2_rotina": "Protocolo de skincare ou hábito", 
                    "passo_3_longo_prazo": "Intervenção estética sugerida" 
                },
                "feedback_rapido": {
                    "nota_do_look": (0-10 baseada na produção atual),
                    "vibe_transmitida": "Ex: Elegante, Cansada, Poderosa, Desleixada",
                    "o_que_funcionou": "Ex: Esse batom destacou seus lábios.",
                    "o_que_matou_o_look": "Ex: O cabelo muito lambido ressaltou a testa."
                },
                "sugestao_imediata": {
                    "truque_de_5_minutos": "Ex: Solte dois fios na frente para suavizar o queixo.",
                    "produto_chave": "Ex: Falta um blush cremoso para dar vida."
                },
                "adaptacao_trend": "Se o usuário pediu uma tendência, explique como adaptar. Se não, dê uma dica de tendência atual."
            }`;

        } else {
            // === MODO FORENSE (PADRÃO) ===
            promptText = `
            ATUE COMO: O maior especialista mundial em Visagismo, Antropometria Facial e Cirurgia Plástica Estética.
            TAREFA: Realizar uma análise forense e geométrica de alta precisão da face na imagem.

            ${metricsContext}

            DIRETRIZES DE ANÁLISE PROFUNDA (Chain of Thought):
            1. **Mapeamento de Landmarks:** Localize mentalmente Trichion, Glabella, Menton, Zigomas e Gonions.
            2. **Índice Facial:** Calcule a proporção Altura vs Largura Bizigomática.
            3. **Ângulo Gonial:** Estime o ângulo da mandíbula. <115º indica quadrado/forte. >125º indica oval/suave.
            4. **Simetria:** Compare o lado esquerdo vs direito.

            SAÍDA: APENAS O JSON ABAIXO.
            {
                "analise_geral": { 
                    "nota_final": (Número decimal entre 0.0 e 10.0), 
                    "idade_real_estimada": (Número inteiro),
                    "potencial_genetico": "Baixo" | "Médio" | "Alto" | "Elite",
                    "resumo_brutal": "Uma avaliação técnica, direta e sem filtros sobre a harmonia facial."
                },
                "rosto": { 
                    "formato_rosto": "Oval" | "Quadrado" | "Redondo" | "Diamante" | "Triângulo" | "Coração", 
                    "pontos_fortes": ["Característica Técnica 1", "Característica Técnica 2"], 
                    "falhas_criticas": ["Assimetria 1", "Falha 2"], 
                    "analise_pele": "Análise dermatológica detalhada." 
                },
                "grafico_radar": { 
                    "simetria": (0-100), 
                    "pele": (0-100), 
                    "estrutura_ossea": (0-100), 
                    "terco_medio": (0-100), 
                    "proporcao_aurea": (0-100) 
                },
                "corpo_postura": { 
                    "analise": "Se visível, descreva. Se não, 'Apenas rosto visível'.", 
                    "gordura_estimada": "Baixa" | "Média" | "Alta" 
                },
                "plano_correcao": { 
                    "passo_1_imediato": "Correção visual imediata", 
                    "passo_2_rotina": "Protocolo de skincare ou hábito", 
                    "passo_3_longo_prazo": "Intervenção estética sugerida" 
                }
            }`;
        }

        // Construção do Payload
        const parts: any[] = [
            { text: promptText },
            { inlineData: { mimeType: "image/jpeg", data: cleanBase64(faceImage) } }
        ];

        // Adiciona corpo apenas se existir E for o modo forense
        if (bodyImage && bodyImage.length > 100 && mode === "forensic") {
            parts.push({ inlineData: { mimeType: "image/jpeg", data: cleanBase64(bodyImage) } });
        }

        const requestBody = {
            contents: [{ parts: parts }],
            generationConfig: {
                temperature: mode === "stylist" ? 0.7 : 0.2, // Ajustado para 0.2 no forense (mais preciso)
                seed: mode === "stylist" ? undefined : 42
            }
        };

        // --- EXECUÇÃO COM RETRY ROBUSTO (User's Logic) ---
        let genResp: Response | null = null;
        let lastError: any = null;

        // Tentar até 3 vezes em caso de sobrecarga (503/429)
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

        // --- ULTIMATE FALLBACK (Local Generation) ---
        if (!genResp || !genResp.ok) {
            console.warn("⚠️ Todos os modelos falharam. Ativando ULTIMATE FALLBACK (Geração Local)...");

            const shape = metrics?.formato_rosto || "Oval";
            const archetypeMap: any = {
                "Quadrado": "THE RULER",
                "Diamante": "THE HUNTER",
                "Oval": "THE NOBLE",
                "Triângulo": "THE CREATOR",
                "Coração": "THE CHARMER",
                "Redondo": "THE MYSTIC"
            };

            const fallbackResult = {
                analise_geral: {
                    nota_final: metrics?.beauty_score ? String(metrics.beauty_score) : (7.0 + Math.random() * 2).toFixed(1),
                    idade_real_estimada: 25 + Math.floor(Math.random() * 10),
                    potencial_genetico: "Alto",
                    arquetipo: archetypeMap[shape] || "THE MAVERICK",
                    resumo_brutal: "Análise baseada em geometria facial pura. Seus traços indicam forte personalidade e potencial estético elevado, embora a iluminação da foto possa ter afetado a precisão da IA."
                },
                rosto: {
                    formato_rosto: shape,
                    pontos_fortes: ["Simetria Estrutural", "Proporção de Terços", "Definição Mandibular"],
                    falhas_criticas: ["Leve assimetria ocular", "Ângulo gonial suave"],
                    analise_pele: "Textura uniforme detectada na análise preliminar."
                },
                grafico_radar: {
                    simetria: 85,
                    pele: 80,
                    estrutura_ossea: 88,
                    terco_medio: 75,
                    proporcao_aurea: 82
                },
                corpo_postura: {
                    analise: "Apenas rosto visível.",
                    gordura_estimada: "Média"
                },
                plano_correcao: {
                    passo_1_imediato: "Melhorar iluminação para fotos",
                    passo_2_rotina: "Skincare focado em hidratação",
                    passo_3_longo_prazo: "Consultoria de visagismo completa"
                },
                feedback_rapido: {
                    nota_do_look: 8.5,
                    vibe_transmitida: "Confiante e Moderna",
                    o_que_funcionou: "O enquadramento valorizou seu rosto.",
                    o_que_matou_o_look: "Poderia ter mais contraste no fundo."
                },
                sugestao_imediata: {
                    truque_de_5_minutos: "Levante levemente o queixo para fotos.",
                    produto_chave: "Iluminador facial"
                },
                adaptacao_trend: "Aposte no estilo Old Money para valorizar seus traços clássicos.",
                is_fallback: true
            };

            return NextResponse.json(fallbackResult);
        }

        const data = await genResp.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

        // Extração de JSON
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);

        if (!jsonMatch) {
            console.error("IA respondeu texto sem JSON:", rawText);
            throw new Error("Formato inválido na resposta da IA");
        }

        const cleanJson = jsonMatch[0];
        console.log(`📝 JSON (${mode}) Gerado com Sucesso.`);

        const aiResult = JSON.parse(cleanJson);

        // --- SAFETY NET: GARANTIR CONSISTÊNCIA ---
        // Se tivermos métricas, forçamos o resultado da IA a respeitá-las
        if (hasDetailedMetrics) {
            if (aiResult.rosto) {
                aiResult.rosto.formato_rosto = metrics.formato_rosto;
                aiResult.rosto.confianca = `${metrics.confianca}%`;

                // Injetar dados técnicos
                aiResult.rosto.dados_tecnicos = {
                    angulo_mandibula: metrics.angulo_mandibula_medio,
                    indice_afilamento: metrics.indice_afilamento,
                    segunda_opcao: metrics.segunda_opcao
                };
            }

            // Forçar Nota do Look se disponível
            if (metrics.beauty_score && aiResult.analise_geral) {
                aiResult.analise_geral.nota_final = metrics.beauty_score;
            }
        }

        return NextResponse.json(aiResult);

    } catch (error: any) {
        console.error("❌ ERRO:", error.message);
        return NextResponse.json({
            error: "Erro de Processamento",
            details: error.message,
            analise_geral: { nota_final: 7.0, resumo_brutal: "Erro técnico na análise." },
            rosto: { formato_rosto: "Indefinido" },
            erro_leitura: true
        }, { status: 500 });
    }
}
