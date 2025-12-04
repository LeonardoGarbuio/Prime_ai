import { NextResponse } from "next/server";

export async function POST(req: Request) {
    // --- SEGURANÇA: LER DO ARQUIVO .ENV ---
    const apiKey = process.env.GOOGLE_API_KEY;

    if (!apiKey) {
        console.error("❌ ERRO CRÍTICO: GOOGLE_API_KEY não encontrada.");
        return NextResponse.json(
            { error: "Configuração de servidor inválida. Chave de API não encontrada." },
            { status: 500 }
        );
    }

    try {
        const { faceImage, bodyImage } = await req.json();

        if (!faceImage) {
            return NextResponse.json({ error: "Imagem obrigatória" }, { status: 400 });
        }

        const cleanBase64 = faceImage.replace(/^data:image\/\w+;base64,/, "");

        // --- PASSO 1: AUTODESCOBERTA DE MODELO ---
        // Isso evita o erro 404 se um modelo específico não estiver ativo na conta
        console.log("🔍 PRIME AI: Conectando ao Google...");

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

        // Ordenação para garantir consistência (sempre tenta os mesmos modelos na mesma ordem)
        models.sort((a: any, b: any) => a.name.localeCompare(b.name));

        // Prioridade de seleção: Flash 2.5 -> Flash 2.0 -> Flash 1.5 -> Pro 1.5
        let chosenModel = models.find((m: any) => m.name.includes("gemini-2.5-flash") && m.supportedGenerationMethods.includes("generateContent"))?.name;
        if (!chosenModel) chosenModel = models.find((m: any) => m.name.includes("gemini-2.0-flash") && m.supportedGenerationMethods.includes("generateContent"))?.name;
        if (!chosenModel) chosenModel = models.find((m: any) => m.name.includes("gemini-1.5-flash-001") && m.supportedGenerationMethods.includes("generateContent"))?.name;
        if (!chosenModel) chosenModel = models.find((m: any) => m.name.includes("gemini-1.5-flash") && m.supportedGenerationMethods.includes("generateContent"))?.name;
        if (!chosenModel) chosenModel = models.find((m: any) => m.name.includes("gemini-1.5-pro") && m.supportedGenerationMethods.includes("generateContent"))?.name;

        if (!chosenModel) throw new Error("Nenhum modelo Gemini disponível nesta conta.");

        console.log("✅ CÉREBRO ATIVO:", chosenModel);

        const generateUrl = `https://generativelanguage.googleapis.com/v1beta/${chosenModel}:generateContent?key=${apiKey}`;

        // --- PASSO 2: PROMPT CIRÚRGICO (PRECISÃO EXTREMA) ---
        const promptText = `
        ATUE COMO: O maior especialista mundial em Visagismo, Antropometria Facial e Cirurgia Plástica Estética.
        TAREFA: Realizar uma análise forense e geométrica de alta precisão da face na imagem.

        🚨 SEGURANÇA (DOG TEST):
        SE A IMAGEM NÃO FOR UM ROSTO HUMANO NÍTIDO (ex: cachorro, gato, objeto, desenho):
        Retorne IMEDIATAMENTE um JSON com "erro_leitura": true e "resumo_brutal": "Face humana não detectada. Envie uma foto nítida.". NÃO INVENTE DADOS.

        DIRETRIZES DE ANÁLISE PROFUNDA (Chain of Thought):
        1. **Mapeamento de Landmarks:** Localize mentalmente Trichion, Glabella, Menton, Zigomas e Gonions.
        2. **Índice Facial:** Calcule a proporção Altura vs Largura Bizigomática.
        3. **Ângulo Gonial:** Estime o ângulo da mandíbula. <115º indica quadrado/forte. >125º indica oval/suave.
        4. **Simetria:** Compare o lado esquerdo vs direito.

        REGRAS DE CLASSIFICAÇÃO GEOMÉTRICA (Prioridade Absoluta):
        - **QUADRADO:** Largura da Testa ≈ Largura das Maçãs ≈ Largura da Mandíbula. Ângulo da mandíbula nítido/reto (90º).
        - **REDONDO:** Largura Bizigomática é a maior dimensão. Altura facial reduzida. Sem ângulos definidos.
        - **OVAL:** Formato clássico equilibrado. Comprimento é ~1.5x a largura. Mandíbula curva.
        - **DIAMANTE:** Zigomas proeminentes e largos (ponto mais largo). Testa e queixo estreitos.
        - **TRIÂNGULO (Pêra):** Base mandibular larga é a maior medida do rosto.
        - **CORAÇÃO:** Testa larga e proeminente. Queixo afunila drasticamente.

        CRITÉRIOS DE PONTUAÇÃO (Seja Crítico):
        - 9.0 - 10.0: Perfeição Divina (Simetria absoluta). Raríssimo.
        - 7.0 - 8.9: Atraente/Comum.
        - < 6.0: Desarmonia severa.
        
        IMPORTANTE: Use precisão decimal real baseada na foto (ex: 7.23, 8.65). NÃO repita números.

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

        const requestBody = {
            contents: [{
                parts: [
                    { text: promptText },
                    { inline_data: { mime_type: "image/jpeg", data: cleanBase64 } }
                ]
            }],
            generationConfig: {
                temperature: 0.0,
                seed: 42
            }
        };

        const genResp = await fetch(generateUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody)
        });

        if (!genResp.ok) {
            const errorBody = await genResp.json().catch(() => ({}));
            console.error("❌ ERRO NA GERAÇÃO:", JSON.stringify(errorBody, null, 2));

            if (genResp.status === 403) throw new Error("Chave Bloqueada durante a geração (Forbidden).");
            if (genResp.status === 429) throw new Error("Muitas requisições (Quota Exceeded). Espere um pouco.");

            throw new Error(`Erro IA (${genResp.status}): ${errorBody.error?.message || genResp.statusText}`);
        }

        const data = await genResp.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

        const jsonMatch = rawText.match(/\{[\s\S]*\}/);

        if (!jsonMatch) {
            console.error("IA respondeu texto sem JSON:", rawText);
            throw new Error("Formato inválido.");
        }

        const cleanJson = jsonMatch[0];
        console.log("📝 JSON Extraído com Sucesso.");

        return NextResponse.json(JSON.parse(cleanJson));

    } catch (error: any) {
        console.error("❌ ERRO:", error.message);
        return NextResponse.json({
            error: "Erro de Processamento",
            details: error.message,
            analise_geral: { nota_final: 7.0, resumo_brutal: "Erro técnico. Verifique se o arquivo .env está correto." },
            rosto: { formato_rosto: "Oval" },
            erro_leitura: true
        }, { status: 500 });
    }
}