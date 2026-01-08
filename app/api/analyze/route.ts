import { NextResponse } from "next/server";
import { checkRateLimit, getClientIP } from "@/lib/security";

// 🔧 HELPER: Extrai JSON de texto (incluindo blocos Markdown)
function extractJSON(text: string): string | null {
    if (!text) return null;

    // 1. Tenta extrair de bloco Markdown ```json ... ```
    const markdownMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (markdownMatch) {
        return markdownMatch[1].trim();
    }

    // 2. Tenta extrair JSON puro (sem Markdown)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
        return jsonMatch[0].trim();
    }

    return null;
}

export async function POST(req: Request) {
    // 🛡️ PROTEÇÃO ANTI-DDOS: Rate Limiting (10 req/min por IP)
    const clientIP = getClientIP(req);
    const rateLimit = checkRateLimit(clientIP, 10, 60000);

    if (!rateLimit.allowed) {
        console.warn(`⚠️ Rate limit - IP: ${clientIP}`);
        return NextResponse.json(
            { error: "Muitas requisições. Aguarde 1 minuto." },
            { status: 429, headers: { 'Retry-After': '60' } }
        );
    }

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

        // --- DEFINIÇÃO MANUAL DE MODELOS (OTIMIZADA) ---
        // Lista fixa para evitar latência de listagem e garantir versões específicas (Safety Nets).

        let candidateModels: string[] = [];

        if (mode === "stylist") {
            // Stylist: Foco em 2.0 Flash (Equilíbrio) e 2.0 Pro (Inteligência)
            candidateModels = [
                "models/gemini-2.0-flash",         // Stable 2.0
                "models/gemini-2.0-flash-exp",     // Experimental (criativo)
                "models/gemini-2.0-flash-lite",    // Rápido e Eficiente
                "models/gemini-flash-latest",      // Alias seguro
                "models/gemini-2.0-pro-exp"        // Mais inteligente de todos
            ];
        } else {
            // Forensic: Foco em 2.0 Pro e precisão
            candidateModels = [
                "models/gemini-2.0-flash",         // Stable 2.0
                "models/gemini-2.0-pro-exp",       // Melhor para raciocínio complexo
                "models/gemini-2.0-flash-lite",    // Velocidade
                "models/gemini-pro-latest",        // Alias seguro Pro
                "models/gemini-2.0-flash-exp"
            ];
        }

        console.log(`🎯 Modo: ${mode.toUpperCase()} | Fila: `, candidateModels.map(m => m.replace("models/", "")));

        // Remove duplicatas mantendo a ordem de prioridade
        const uniqueCandidates = [...new Set(candidateModels)];
        console.log("🧠 CÉREBROS DISPONÍVEIS:", uniqueCandidates);

        // --- SELEÇÃO DO PROMPT (O CÉREBRO DUPLO + FUZZY LOGIC) ---
        // (Preparando o Prompt UMA vez para usar em todos os modelos)
        let promptText = "";
        let metricsContext = "";
        const hasDetailedMetrics = metrics && metrics.formato_rosto;

        // Função para normalizar formato do rosto (MAIÚSCULAS -> Title Case)
        const normalizeShape = (shape: string): string => {
            if (!shape) return "Oval";
            const lower = shape.toLowerCase();
            // Mapeia formatos especiais
            const map: { [key: string]: string } = {
                'oval': 'Oval',
                'redondo': 'Redondo',
                'quadrado': 'Quadrado',
                'retangular': 'Quadrado', // Retangular é variante de Quadrado
                'oblongo': 'Oval', // Oblongo é variante alongada de Oval
                'coracao': 'Coração',
                'coração': 'Coração',
                'triangular': 'Triângulo',
                'triangulo': 'Triângulo',
                'triângulo': 'Triângulo',
                'triangular_invertido': 'Coração', // Triângulo invertido = Coração
                'diamante': 'Diamante',
            };
            return map[lower] || shape.charAt(0).toUpperCase() + shape.slice(1).toLowerCase();
        };

        // Formato normalizado para consistência
        const normalizedShape = hasDetailedMetrics ? normalizeShape(metrics.formato_rosto) : null;

        if (hasDetailedMetrics) {
            metricsContext = `
            📊 DADOS TÉCNICOS(VERDADE ABSOLUTA - USE ISTO):
- Formato Principal: ${normalizedShape} (Confiança: ${metrics.confianca}%)
- Segunda Opção: ${metrics.segunda_opcao ? normalizeShape(metrics.segunda_opcao) : "N/A"} (Confiança: ${metrics.confianca_segunda || 0}%)
- Ângulo Mandíbula: ${(metrics.angulo_mandibula_medio || 0).toFixed(1)}°
- Proporção Altura / Largura: ${(metrics.prop_altura_largura || 0).toFixed(2)}
- Índice de Afilamento: ${(metrics.indice_afilamento || 0).toFixed(1)}%
    - SCORE GEOMÉTRICO(BEAUTY SCORE): ${metrics.beauty_score || "N/A"}
            
            INSTRUÇÃO CRÍTICA: O formato do rosto É ${normalizedShape}. Não tente adivinhar outro.Use EXATAMENTE esse valor.
            INSTRUÇÃO CRÍTICA: A "Nota do Look" DEVE ser EXATAMENTE ${metrics.beauty_score} (se disponível). Se não, calcule com base na geometria.
            `;
        }

        // ... (Prompt generation logic remains similar but simplified context here for brevity in replacement if needed, 
        // OR we just keep existing prompt logic. To avoid deleting the prompt generation logic which is between lines 66-194, 
        // I will focus this tool call ONLY on the loop logic if possible.
        // BUT the prompt is needed INSIDE the payload which is constructed differently per request? 
        // No, prompt is constant. Model URL changes.)

        // Let's reconstruct the prompt setup here to ensure it's available for the loop.

        if (mode === "stylist") {
            promptText = `
            🚨 INSTRUÇÃO CRÍTICA: Sua resposta deve ser APENAS um JSON válido. 
            NÃO inclua NENHUM texto antes ou depois do JSON.
            NÃO use Markdown, código, títulos ou explicações.
            Comece sua resposta DIRETAMENTE com { e termine com }
            
            ATUE COMO: O maior especialista mundial em Visagismo, Antropometria Facial, Estética e Imagem Pessoal.
            CONTEXTO DO USUÁRIO: "${userContext || 'Análise de look do dia'}"
            
            ⚠️ VALIDAÇÃO CRÍTICA(EXECUTAR PRIMEIRO):
1. Verifique se há um ROSTO HUMANO REAL na imagem.
            2. Se a imagem contiver: animais, objetos, desenhos, memes, paisagens, personagens fictícios, IA gerada, ou qualquer coisa que NÃO seja um rosto humano real - REJEITE IMEDIATAMENTE.
            3. Se não houver rosto humano, retorne APENAS este JSON:
{
    "error": "face_not_detected",
        "message": "Nenhum rosto humano detectado. Por favor, envie uma foto do seu rosto."
}
            
            SE HOUVER UM ROSTO HUMANO REAL, continue com a análise:

TAREFA: Realizar uma análise COMPLETA(Forense + Estilo).
            O usuário é VIP e pagou para ter TUDO: Análise geométrica precisa E dicas de estilo.

            ⛔ REGRAS ABSOLUTAS - PROIBIÇÕES:
- NUNCA sugira cirurgias plásticas(rinoplastia, bichectomia, lifting, etc)
    - NUNCA sugira procedimentos invasivos(botox, preenchimento, harmonização facial médica)
        - NUNCA sugira tratamentos dermatológicos agressivos
            - NUNCA mencione "corrigir" defeitos físicos permanentes
                - Foque APENAS em VISAGISMO: como PARECER melhor, não como MUDAR o rosto

            ✅ FOCO TOTAL EM VISAGISMO(O QUE VOCÊ DEVE SUGERIR):
- Cortes de cabelo ideais para o formato do rosto
    - Estilo de barba que harmoniza a mandíbula
        - Armação de óculos ideal
            - Maquiagem e contorno
                - Cores de roupa que favorecem
                    - Ângulos melhores para fotos
                        - Postura e expressão facial
                            - Acessórios que valorizam
                                - Penteados e styling de cabelo

            ${metricsContext}

            DIRETRIZES DE ANÁLISE PROFUNDA(Chain of Thought):
1. ** Mapeamento de Landmarks:** Localize mentalmente Trichion, Glabella, Menton, Zigomas e Gonions.
            2. ** Índice Facial:** Calcule a proporção Altura vs Largura Bizigomática.
            3. ** Ângulo Gonial:** Estime o ângulo da mandíbula. < 115º indica quadrado / forte. > 125º indica oval / suave.
            4. ** Simetria:** Compare o lado esquerdo vs direito.
            5. ** Estilo & Vibe:** Analise a roupa, maquiagem e cabelo atuais para o contexto informado.

            SAÍDA JSON(ESTRITA - SUPERSET):
{
    "analise_geral": {
        "nota_final": (Número decimal entre 4.0 e 10.0 - seja REALISTA e VARIADO, nem todo mundo é 7 +),
        "nota_potencial": (Número decimal entre nota_final e 10.0 - o máximo que essa pessoa pode alcançar COM VISAGISMO),
        "idade_real_estimada": (Número inteiro),
        "potencial_genetico": "Baixo" | "Médio" | "Alto" | "Elite",
            "arquetipo": "The Hunter | Noble | Charmer | Creator | Ruler | Mystic | Warrior | Angel",
                "resumo_brutal": "Uma avaliação técnica, direta e sem filtros sobre a harmonia facial."
    },
    "rosto": {
        "formato_rosto": "Oval" | "Quadrado" | "Redondo" | "Diamante" | "Triângulo" | "Coração",
            "pontos_fortes": ["Característica Técnica 1", "Característica Técnica 2"],
                "pontos_de_atencao": ["Observação de visagismo 1 - ex: cabelo muito rente destaca as orelhas", "Observação 2 - ex: barba pode definir mais a mandíbula"],
                    "analise_pele": "Análise da textura e tom de pele para recomendações de skincare básico."
    },
    "grafico_radar": {
        "simetria": (0 - 100),
            "pele": (0 - 100),
                "estrutura_ossea": (0 - 100),
                    "terco_medio": (0 - 100),
                        "proporcao_aurea": (0 - 100)
    },
    "corpo_postura": {
        "analise": "Se visível, descreva. Se não, 'Apenas rosto visível'.",
            "gordura_estimada": "Baixa" | "Média" | "Alta"
    },
    "plano_harmonizacao": {
        "passo_1_imediato": "VISAGISMO: Ex: usar barba com degradê para alongar o rosto",
            "passo_2_rotina": "CUIDADOS: Ex: hidratante facial e protetor solar diário",
                "passo_3_longo_prazo": "ESTILO: Ex: investir em óculos com armação que suavize os traços"
    },
    "analise_cromatica": {
        "estacao": "Inverno Brilhante | Outono Escuro | Verão Suave | etc",
            "descricao": "Explicação breve do porquê desta estação baseada em pele/cabelo/olhos",
                "paleta_ideal": ["#HEX", "#HEX", "#HEX", "#HEX", "#HEX"]
    },
    "guia_vestuario": {
        "pecas_chave": ["Item 1 (ex: Jaqueta de Couro)", "Item 2 (ex: Camisa Gola V)"],
            "evitar": ["Item 1", "Estampa X"],
                "acessorios": "Sugestão específica (ex: Óculos aviador dourado)"
    },
    "feedback_rapido": {
        "nota_do_look": (0 - 10 baseada na produção atual),
        "vibe_transmitida": "Ex: Elegante, Cansada, Poderosa, Desleixada",
            "o_que_funcionou": "Ex: Esse batom destacou seus lábios.",
                "o_que_matou_o_look": "Ex: O cabelo muito lambido ressaltou a testa."
    },
    "sugestao_imediata": {
        "corte_ideal": "Ex: Corte com volume no topo para alongar o rosto",
            "truque_de_5_minutos": "Ex: Solte dois fios na frente para suavizar o queixo.",
                "produto_chave": "Ex: Pomada matte para texturizar o cabelo."
    },
    "plano_acao_30_dias": {
        "titulo": "Título personalizado baseado no maior ponto fraco (ex: 'Definição de Mandíbula')",
        "foco_principal": "Qual área será trabalhada (ex: 'Fortalecer músculos masseter e melhorar definição do maxilar')",
        "exercicios": [
            {
                "nome": "Nome do exercício específico (ex: Mewing)",
                "icone": "Emoji representativo (ex: 👅)",
                "frequencia": "Ex: 24h/dia (postura) ou 3x ao dia",
                "duracao": "Ex: 5 minutos ou contínuo",
                "instrucoes": "Passo a passo detalhado de como fazer o exercício corretamente",
                "beneficio": "O que esse exercício vai melhorar especificamente no rosto"
            },
            {
                "nome": "Segundo exercício",
                "icone": "😬",
                "frequencia": "Ex: 2x ao dia",
                "duracao": "20 repetições",
                "instrucoes": "Instruções detalhadas",
                "beneficio": "Benefício específico"
            },
            {
                "nome": "Terceiro exercício",
                "icone": "💆",
                "frequencia": "1x ao dia",
                "duracao": "5 minutos",
                "instrucoes": "Instruções detalhadas",
                "beneficio": "Benefício específico"
            },
            {
                "nome": "Quarto exercício ou hábito",
                "icone": "🧘",
                "frequencia": "Diário",
                "duracao": "Constante",
                "instrucoes": "Instruções detalhadas",
                "beneficio": "Benefício específico"
            }
        ],
        "meta_semanal": "O que a pessoa pode esperar ver de mudança a cada semana",
        "dica_pro": "Um conselho avançado para acelerar os resultados"
    },
    "adaptacao_trend": "Se o usuário pediu uma tendência, explique como adaptar. Se não, dê uma dica de tendência atual."
} `;

        } else {
            // === MODO FORENSE (PADRÃO) ===
            promptText = `
            🚨 INSTRUÇÃO CRÍTICA: Sua resposta deve ser APENAS um JSON válido. 
            NÃO inclua NENHUM texto antes ou depois do JSON.
            NÃO use Markdown, código, títulos ou explicações.
            Comece sua resposta DIRETAMENTE com { e termine com }
            
            ATUE COMO: O maior especialista mundial em Visagismo, Antropometria Facial e Estética.
            
            ⚠️ VALIDAÇÃO CRÍTICA(EXECUTAR PRIMEIRO):
1. Verifique se há um ROSTO HUMANO REAL na imagem.
            2. Se a imagem contiver: animais, objetos, desenhos, memes, paisagens, personagens fictícios, IA gerada, ou qualquer coisa que NÃO seja um rosto humano real - REJEITE IMEDIATAMENTE.
            3. Se não houver rosto humano, retorne APENAS este JSON:
{
    "error": "face_not_detected",
        "message": "Nenhum rosto humano detectado. Por favor, envie uma foto do seu rosto."
}
            
            SE HOUVER UM ROSTO HUMANO REAL, continue com a análise:

TAREFA: Realizar uma análise forense e geométrica de alta precisão da face na imagem.

            ⛔ REGRAS ABSOLUTAS - PROIBIÇÕES:
- NUNCA sugira cirurgias plásticas(rinoplastia, bichectomia, lifting, etc)
    - NUNCA sugira procedimentos invasivos(botox, preenchimento, harmonização facial médica)
        - NUNCA mencione "corrigir" defeitos físicos permanentes
            - Foque APENAS em VISAGISMO: como PARECER melhor através de estilo

            ✅ EXEMPLOS DE SUGESTÕES VÁLIDAS:
- Corte de cabelo ideal para o formato
    - Estilo de barba para definir a mandíbula
        - Óculos que harmonizam o rosto
            - Ângulos melhores para fotos
                - Skincare básico(hidratante, protetor)

            ${metricsContext}

            DIRETRIZES DE ANÁLISE PROFUNDA(Chain of Thought):
1. ** Mapeamento de Landmarks:** Localize mentalmente Trichion, Glabella, Menton, Zigomas e Gonions.
            2. ** Índice Facial:** Calcule a proporção Altura vs Largura Bizigomática.
            3. ** Ângulo Gonial:** Estime o ângulo da mandíbula. < 115º indica quadrado / forte. > 125º indica oval / suave.
            4. ** Simetria:** Compare o lado esquerdo vs direito.

    SAÍDA: APENAS O JSON ABAIXO.
            {
                "analise_geral": {
                    "nota_final": (Número decimal entre 4.0 e 10.0 - seja REALISTA, nem todo mundo é 7 +),
                    "nota_potencial": (Número decimal entre nota_final e 10.0 - o máximo que essa pessoa pode alcançar COM VISAGISMO),
                    "idade_real_estimada": (Número inteiro),
                    "potencial_genetico": "Baixo" | "Médio" | "Alto" | "Elite",
                        "arquetipo": "The Hunter | Noble | Charmer | Creator | Ruler | Mystic | Warrior | Angel",
                            "resumo_brutal": "Uma avaliação técnica, direta e sem filtros sobre a harmonia facial."
                },
                "rosto": {
                    "formato_rosto": "Oval" | "Quadrado" | "Redondo" | "Diamante" | "Triângulo" | "Coração",
                        "pontos_fortes": [
                            "MÍNIMO 4 pontos. Cada ponto deve ser uma frase COMPLETA e ESPECÍFICA sobre essa pessoa.",
                            "Exemplo: 'Maxilar bem definido com ângulo de 118° que transmite força e masculinidade'",
                            "Exemplo: 'Olhos amendoados com boa proporção em relação ao terço médio, criando harmonia natural'",
                            "Exemplo: 'Zigomas proeminentes que captam bem a luz e estruturam o rosto'",
                            "NÃO use frases genéricas como 'estrutura facial equilibrada' - seja ESPECÍFICO sobre O QUE está bom e PORQUÊ"
                        ],
                            "pontos_de_atencao": ["Observação de visagismo - ex: barba pode definir mais a mandíbula", "Dica de estilo - ex: cabelo com volume no topo alonga o rosto"],
                                "analise_pele": "Análise da textura para recomendações de skincare básico (hidratante, protetor)."
                },
                "grafico_radar": {
                    "simetria": (0 - 100),
                        "pele": (0 - 100),
                            "estrutura_ossea": (0 - 100),
                                "terco_medio": (0 - 100),
                                    "proporcao_aurea": (0 - 100)
                },
                "corpo_postura": {
                    "analise": "Se visível, descreva. Se não, 'Apenas rosto visível'.",
                        "gordura_estimada": "Baixa" | "Média" | "Alta"
                },
                "plano_harmonizacao": {
                    "passo_1_imediato": "VISAGISMO: Ex: usar barba degradê para definir mandíbula",
                        "passo_2_rotina": "CUIDADOS: Ex: hidratante e protetor solar diário",
                            "passo_3_longo_prazo": "ESTILO: Ex: experimentar óculos com armação que suavize os traços"
                }
            } `;
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
            // generationConfig será injetado dentro do loop para poder variar se necessário
        };

        // --- LOOP DE EXECUÇÃO (CASCATA) ---
        let genResp: Response | null = null;
        let lastError: any = null;
        let usedModel = "";

        if (uniqueCandidates.length === 0) {
            throw new Error("Nenhum modelo disponível na API.");
        }

        // Loop de modelos
        for (const modelName of uniqueCandidates) {
            console.log(`🤖 TENTANDO MODELO: ${modelName}...`);

            const generateUrl = `https://generativelanguage.googleapis.com/v1beta/${modelName}:generateContent?key=${apiKey}`;

            // Configura temperatura e seed para resultados CONSISTENTES
            const currentConfig = {
                temperature: 0.1,
                seed: 42,
            };

            const currentBody = { ...requestBody, generationConfig: currentConfig };

            try {
                genResp = await fetch(generateUrl, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(currentBody)
                });

                if (genResp.ok) {
                    usedModel = modelName;
                    console.log(`✅ SUCESSO com ${modelName}!`);
                    lastError = null;
                    break; // Sai do loop se funcionar
                }

                const errorBody = await genResp.json().catch(() => ({}));
                const errorMessage = errorBody.error?.message || genResp.statusText;
                console.warn(`⚠️ FALHA em ${modelName} (${genResp.status}): ${errorMessage}`);

            } catch (e: any) {
                console.warn(`⚠️ ERRO DE REDE em ${modelName}: ${e.message}`);
                lastError = e;
            }
        }

        // --- FALLBACK #1: GROQ API (Cérebro Substituto) ---
        if (!genResp || !genResp.ok) {
            console.warn("⚠️ Gemini falhou. Tentando GROQ como backup...");

            const groqApiKey = process.env.GROQ_API_KEY;

            if (groqApiKey) {
                try {
                    const groqModels = [
                        "llama-3.2-90b-vision-preview",
                        "llama-3.2-11b-vision-preview",
                        "llava-v1.5-7b-4096-preview"
                    ];

                    for (const groqModel of groqModels) {
                        console.log(`🧠 GROQ: Tentando ${groqModel}...`);

                        const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                            method: "POST",
                            headers: {
                                "Authorization": `Bearer ${groqApiKey}`,
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify({
                                model: groqModel,
                                messages: [{
                                    role: "user",
                                    content: [
                                        { type: "text", text: promptText },
                                        { type: "image_url", image_url: { url: faceImage.startsWith("data:") ? faceImage : `data:image/jpeg;base64,${cleanBase64(faceImage)}` } }
                                    ]
                                }],
                                max_tokens: 2000,
                                temperature: 0.4
                            })
                        });

                        if (groqResponse.ok) {
                            const groqData = await groqResponse.json();
                            const groqText = groqData.choices?.[0]?.message?.content || "";
                            const groqJsonString = extractJSON(groqText);

                            if (groqJsonString) {
                                console.log(`✅ GROQ: Sucesso com ${groqModel}!`);
                                const groqResult = JSON.parse(groqJsonString);

                                if (hasDetailedMetrics && groqResult.rosto) {
                                    groqResult.rosto.formato_rosto = metrics.formato_rosto;
                                    if (metrics.beauty_score && groqResult.analise_geral) {
                                        groqResult.analise_geral.nota_final = metrics.beauty_score;
                                    }
                                }

                                groqResult.ai_provider = "GROQ";
                                return NextResponse.json(groqResult);
                            }
                        } else {
                            const errBody = await groqResponse.json().catch(() => ({}));
                            console.warn(`⚠️ GROQ ${groqModel} falhou: ${errBody.error?.message || groqResponse.status}`);
                        }
                    }
                } catch (groqError: any) {
                    console.warn("⚠️ GROQ erro:", groqError.message);
                }
            } else {
                console.warn("⚠️ GROQ_API_KEY não configurada, pulando fallback GROQ...");
            }
        }

        // --- FALLBACK #2: Geração Local (Último Recurso) ---
        if (!genResp || !genResp.ok) {
            console.warn("⚠️ Todos os modelos falharam. Ativando FALLBACK LOCAL...");

            const shape = metrics?.formato_rosto || "Oval";
            const archetypeMap: any = {
                "Quadrado": "THE RULER", "QUADRADO": "THE RULER",
                "Diamante": "THE HUNTER", "DIAMANTE": "THE HUNTER",
                "Oval": "THE NOBLE", "OVAL": "THE NOBLE",
                "Triângulo": "THE CREATOR", "TRIANGULAR": "THE CREATOR",
                "Coração": "THE CHARMER", "CORACAO": "THE CHARMER",
                "Redondo": "THE MYSTIC", "REDONDO": "THE MYSTIC",
                "RETANGULAR": "THE COMMANDER"
            };

            // Usa métricas reais do MediaPipe
            const beautyScore = metrics?.beauty_score || "7.5"; // Valor fixo para consistência
            const propAlturaLargura = metrics?.prop_altura_largura || 1.3;
            const propSimetria = metrics?.prop_mandibula_zigomas || 0.85;
            const simetriaScore = Math.min(95, Math.max(50, Math.round((propSimetria * 100))));
            const estruturaScore = Math.min(95, Math.max(50, Math.round((propAlturaLargura - 1) * 100 + 60)));

            const fallbackResult = {
                analise_geral: {
                    nota_final: String(beautyScore),
                    idade_real_estimada: 25,
                    potencial_genetico: parseFloat(String(beautyScore)) >= 8.5 ? "Elite" : parseFloat(String(beautyScore)) >= 7.5 ? "Alto" : "Médio",
                    arquetipo: archetypeMap[shape] || archetypeMap[shape.toUpperCase()] || "THE MAVERICK",
                    resumo_brutal: `Análise geométrica detectou formato ${shape}. Estrutura com proporções ${parseFloat(String(beautyScore)) >= 8 ? "harmônicas" : "equilibradas"}.`
                },
                rosto: {
                    formato_rosto: shape,
                    pontos_fortes: [
                        `Formato ${shape} com estrutura óssea bem definida — ${propAlturaLargura > 1.2 ? 'proporção vertical elegante que alonga naturalmente o rosto' : 'equilíbrio harmonioso entre altura e largura facial'}`,
                        `Simetria mandibular de ${Math.round(propSimetria * 100)}% — ${propSimetria > 0.85 ? 'acima da média populacional, indicando boa harmonia entre os lados' : 'dentro da faixa considerada atrativa pela antropometria'}`,
                        `Ângulo mandibular de ${(metrics?.angulo_mandibula_medio || 120).toFixed(0)}° — ${(metrics?.angulo_mandibula_medio || 120) < 120 ? 'maxilar mais definido que transmite força e presença' : 'contorno suave que confere aparência jovial'}`,
                        `Proporção áurea facial de ${Math.round((parseFloat(String(beautyScore)) / 10) * 100)}% — ${parseFloat(String(beautyScore)) >= 7.5 ? 'alinhamento natural com padrões clássicos de beleza' : 'características únicas que fogem do padrão comum'}`
                    ],
                    pontos_de_atencao: [
                        propSimetria < 0.9 ? "Pequena variação de simetria detectada — pode ser otimizada com técnicas de visagismo" : "Estrutura já equilibrada — foco em manutenção",
                        "Análise de pele e textura requer processamento avançado de IA"
                    ],
                    analise_pele: "Análise básica - para detalhes completos, tente novamente."
                },
                grafico_radar: {
                    simetria: simetriaScore,
                    pele: Math.min(95, Math.max(60, Math.round(simetriaScore * 0.85))), // Derivado da simetria para consistência
                    estrutura_ossea: estruturaScore,
                    terco_medio: Math.round(simetriaScore * 0.9),
                    proporcao_aurea: Math.round((parseFloat(String(beautyScore)) / 10) * 100)
                },
                corpo_postura: { analise: "Apenas rosto visível.", gordura_estimada: "Média" },
                plano_harmonizacao: {
                    passo_1_imediato: "Iluminação adequada para fotos",
                    passo_2_rotina: "Skincare básico diário",
                    passo_3_longo_prazo: "Consultoria de visagismo"
                },
                is_fallback: true,
                ai_provider: "LOCAL"
            };

            return NextResponse.json(fallbackResult);
        }

        const data = await genResp.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

        console.log("📝 RAW TEXT LENGTH:", rawText.length);

        // === LIMPEZA ROBUSTA DO JSON ===
        // 1. Remove markdown code blocks (```json ... ```)
        let cleanedText = rawText
            .replace(/```json\s*/gi, '')
            .replace(/```\s*/g, '')
            .trim();

        // 2. Extração de JSON com regex melhorada
        // Encontra o primeiro { e o último } correspondente
        let jsonMatch = null;
        let braceCount = 0;
        let startIdx = -1;
        let endIdx = -1;

        for (let i = 0; i < cleanedText.length; i++) {
            if (cleanedText[i] === '{') {
                if (startIdx === -1) startIdx = i;
                braceCount++;
            } else if (cleanedText[i] === '}') {
                braceCount--;
                if (braceCount === 0 && startIdx !== -1) {
                    endIdx = i;
                    break;
                }
            }
        }

        if (startIdx !== -1 && endIdx !== -1) {
            jsonMatch = cleanedText.substring(startIdx, endIdx + 1);
        }

        if (!jsonMatch) {
            // Fallback: regex simples
            const regexMatch = cleanedText.match(/\{[\s\S]*\}/);
            jsonMatch = regexMatch ? regexMatch[0] : null;
        }

        if (!jsonMatch) {
            // FALLBACK: Usa métricas locais quando IA não retorna JSON válido
            console.warn("⚠️ IA respondeu sem JSON válido. Usando FALLBACK LOCAL...");
            console.warn("Raw text (primeiros 300 chars):", rawText.substring(0, 300));

            const shape = metrics?.formato_rosto || "Oval";
            const archetypeMap: any = {
                "Quadrado": "THE RULER", "QUADRADO": "THE RULER",
                "Diamante": "THE HUNTER", "DIAMANTE": "THE HUNTER",
                "Oval": "THE NOBLE", "OVAL": "THE NOBLE",
                "Triângulo": "THE CREATOR", "TRIANGULAR": "THE CREATOR",
                "Coração": "THE CHARMER", "CORACAO": "THE CHARMER",
                "Redondo": "THE MYSTIC", "REDONDO": "THE MYSTIC",
                "RETANGULAR": "THE COMMANDER"
            };

            const beautyScore = metrics?.beauty_score || "7.5";
            const propSimetria = metrics?.prop_mandibula_zigomas || 0.85;
            const propAlturaLargura = metrics?.prop_altura_largura || 1.3;
            const simetriaScore = Math.min(95, Math.max(50, Math.round((propSimetria * 100))));
            const estruturaScore = Math.min(95, Math.max(50, Math.round((propAlturaLargura - 1) * 100 + 60)));

            return NextResponse.json({
                analise_geral: {
                    nota_final: parseFloat(String(beautyScore)),
                    nota_potencial: Math.min(9.9, parseFloat(String(beautyScore)) + 1.2),
                    idade_real_estimada: 25,
                    potencial_genetico: parseFloat(String(beautyScore)) >= 8.5 ? "Elite" : parseFloat(String(beautyScore)) >= 7.5 ? "Alto" : "Médio",
                    arquetipo: archetypeMap[shape] || archetypeMap[shape.toUpperCase()] || "THE MAVERICK",
                    resumo_brutal: `Análise geométrica detectou formato ${shape}. Score de beleza: ${beautyScore}.`
                },
                rosto: {
                    formato_rosto: shape,
                    pontos_fortes: [
                        `Formato ${shape} com estrutura óssea bem definida — ${propAlturaLargura > 1.2 ? 'proporção vertical elegante' : 'equilíbrio harmonioso entre altura e largura'}`,
                        `Simetria mandibular de ${Math.round(propSimetria * 100)}% — ${propSimetria > 0.85 ? 'acima da média populacional' : 'dentro da faixa atrativa'}`,
                        `Ângulo mandibular de ${(metrics?.angulo_mandibula_medio || 120).toFixed(0)}° — ${(metrics?.angulo_mandibula_medio || 120) < 120 ? 'maxilar definido' : 'contorno suave e jovial'}`,
                        `Proporção áurea de ${Math.round((parseFloat(String(beautyScore)) / 10) * 100)}% — alinhamento com padrões de beleza`
                    ],
                    pontos_de_atencao: ["Para análise mais detalhada com dicas de estilo, tente novamente"],
                    analise_pele: "Análise básica disponível."
                },
                grafico_radar: {
                    simetria: simetriaScore,
                    pele: Math.round(simetriaScore * 0.85),
                    estrutura_ossea: estruturaScore,
                    terco_medio: Math.round(simetriaScore * 0.9),
                    proporcao_aurea: Math.round((parseFloat(String(beautyScore)) / 10) * 100)
                },
                corpo_postura: { analise: "Apenas rosto visível.", gordura_estimada: "Média" },
                plano_harmonizacao: {
                    passo_1_imediato: "Iluminação adequada para fotos",
                    passo_2_rotina: "Skincare básico diário",
                    passo_3_longo_prazo: "Consultoria de visagismo profissional"
                },
                feedback_rapido: {
                    nota_do_look: parseFloat(String(beautyScore)),
                    vibe_transmitida: "Confiante",
                    o_que_funcionou: "Estrutura facial bem definida",
                    o_que_matou_o_look: "Para análise detalhada, tente novamente"
                },
                analise_cromatica: {
                    estacao: "Análise pendente",
                    descricao: "Tente novamente para análise cromática completa",
                    paleta_ideal: ["#2C3E50", "#34495E", "#1ABC9C", "#3498DB", "#9B59B6"]
                },
                guia_vestuario: {
                    pecas_chave: ["Camisa bem ajustada", "Blazer estruturado"],
                    evitar: ["Cores muito vibrantes sem análise cromática"],
                    acessorios: "Óculos com armação que complemente seu formato de rosto"
                },
                sugestao_imediata: {
                    corte_ideal: `Corte que valorize o formato ${shape}`,
                    truque_de_5_minutos: "Postura ereta e contato visual",
                    produto_chave: "Hidratante facial"
                },
                is_fallback: true,
                ai_provider: "LOCAL_FALLBACK"
            });
        }

        // 3. Limpa caracteres problemáticos
        const cleanJson = jsonMatch
            .replace(/[\x00-\x1F\x7F]/g, ' ') // Remove control characters
            .replace(/,\s*}/g, '}')           // Remove trailing commas
            .replace(/,\s*]/g, ']');          // Remove trailing commas em arrays

        console.log(`📝 JSON (${mode}) Extraído: ${cleanJson.length} chars`);

        let aiResult;
        try {
            aiResult = JSON.parse(cleanJson);
        } catch (parseError: any) {
            console.error("❌ JSON Parse Error:", parseError.message);
            console.error("❌ JSON (primeiros 500 chars):", cleanJson.substring(0, 500));

            // Última tentativa: remover qualquer coisa após o último }
            const lastBrace = cleanJson.lastIndexOf('}');
            if (lastBrace > 0) {
                const truncatedJson = cleanJson.substring(0, lastBrace + 1);
                try {
                    aiResult = JSON.parse(truncatedJson);
                    console.log("✅ JSON recuperado após truncamento");
                } catch {
                    // Fallback local ao invés de erro
                    console.warn("⚠️ JSON irrecuperável. Usando fallback local...");
                    const shape = metrics?.formato_rosto || "Oval";
                    const beautyScore = metrics?.beauty_score || "7.5";
                    aiResult = {
                        analise_geral: {
                            nota_final: parseFloat(String(beautyScore)),
                            nota_potencial: Math.min(9.9, parseFloat(String(beautyScore)) + 1.2),
                            arquetipo: "THE MAVERICK",
                            resumo_brutal: `Formato ${shape} detectado. Score: ${beautyScore}`
                        },
                        rosto: { formato_rosto: shape, pontos_fortes: [], pontos_de_atencao: [] },
                        grafico_radar: { simetria: 75, pele: 70, estrutura_ossea: 70, terco_medio: 70, proporcao_aurea: 70 },
                        is_fallback: true
                    };
                }
            } else {
                // Fallback local
                console.warn("⚠️ Nenhum JSON encontrado. Usando fallback local...");
                const shape = metrics?.formato_rosto || "Oval";
                const beautyScore = metrics?.beauty_score || "7.5";
                aiResult = {
                    analise_geral: {
                        nota_final: parseFloat(String(beautyScore)),
                        nota_potencial: Math.min(9.9, parseFloat(String(beautyScore)) + 1.2),
                        arquetipo: "THE MAVERICK",
                        resumo_brutal: `Formato ${shape} detectado. Score: ${beautyScore}`
                    },
                    rosto: { formato_rosto: shape, pontos_fortes: [], pontos_de_atencao: [] },
                    grafico_radar: { simetria: 75, pele: 70, estrutura_ossea: 70, terco_medio: 70, proporcao_aurea: 70 },
                    is_fallback: true
                };
            }
        }

        // --- SAFETY NET: GARANTIR CONSISTÊNCIA ---
        // Se tivermos métricas, forçamos o resultado da IA a respeitá-las
        if (hasDetailedMetrics && normalizedShape) {
            if (aiResult.rosto) {
                aiResult.rosto.formato_rosto = normalizedShape; // USA O FORMATO NORMALIZADO!
                aiResult.rosto.formato_original_mediapipe = metrics.formato_rosto; // Debug
                aiResult.rosto.confianca = `${metrics.confianca}%`;

                // Injetar dados técnicos
                aiResult.rosto.dados_tecnicos = {
                    angulo_mandibula: metrics.angulo_mandibula_medio,
                    indice_afilamento: metrics.indice_afilamento,
                    segunda_opcao: metrics.segunda_opcao ? normalizeShape(metrics.segunda_opcao) : null
                };
            }

            // FORÇA o uso do beauty_score do MediaPipe para CONSISTÊNCIA
            // Isso garante que a mesma foto SEMPRE dê o mesmo resultado
            if (metrics.beauty_score && aiResult.analise_geral) {
                aiResult.analise_geral.nota_final = parseFloat(metrics.beauty_score);
                // Nota potencial: +1.0 até +1.5 baseado no score atual (determinístico)
                const currentScore = parseFloat(metrics.beauty_score);
                const potentialBonus = currentScore >= 8.5 ? 0.8 : currentScore >= 7.5 ? 1.2 : 1.5;
                aiResult.analise_geral.nota_potencial = Math.min(9.9, parseFloat((currentScore + potentialBonus).toFixed(1)));
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
