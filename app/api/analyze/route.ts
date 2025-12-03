import { NextResponse } from "next/server";

export async function POST(req: Request) {
    // --- SUA CHAVE ---
    const apiKey = "AIzaSyBBsCR7S4bVUuoxfD4ub9J7lhLiakWk_6c"; 
    
    try {
        const { faceImage, bodyImage } = await req.json();

        if (!faceImage) {
            return NextResponse.json({ error: "Imagem obrigatória" }, { status: 400 });
        }

        const cleanBase64 = faceImage.replace(/^data:image\/\w+;base64,/, "");

        // --- PASSO 1: AUTODESCOBERTA ESTÁVEL ---
        console.log("🔍 PRIME AI: Selecionando modelo estável...");
        
        const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
        const listResp = await fetch(listUrl);

        if (!listResp.ok) {
            throw new Error(`Erro API Google: ${listResp.status}`);
        }

        const listData = await listResp.json();
        let models = listData.models || [];

        // 1. ORDENAÇÃO OBRIGATÓRIA: Garante que a lista sempre tenha a mesma ordem
        models.sort((a: any, b: any) => a.name.localeCompare(b.name));

        // 2. SELEÇÃO HIERÁRQUICA: Prioriza o GEMINI 2.5 FLASH conforme solicitado
        let chosenModel = models.find((m: any) => m.name.includes("gemini-2.5-flash") && m.supportedGenerationMethods.includes("generateContent"))?.name;
        
        // Fallbacks se a versão 2.5 não existir, tenta 2.0 ou 1.5
        if (!chosenModel) chosenModel = models.find((m: any) => m.name.includes("gemini-2.0-flash") && m.supportedGenerationMethods.includes("generateContent"))?.name;
        if (!chosenModel) chosenModel = models.find((m: any) => m.name.includes("gemini-1.5-flash-001") && m.supportedGenerationMethods.includes("generateContent"))?.name;
        if (!chosenModel) chosenModel = models.find((m: any) => m.name.includes("gemini-1.5-flash") && m.supportedGenerationMethods.includes("generateContent"))?.name;
        if (!chosenModel) chosenModel = models.find((m: any) => m.name.includes("gemini-1.5-pro") && m.supportedGenerationMethods.includes("generateContent"))?.name;
        
        if (!chosenModel) throw new Error("Sem modelos disponíveis.");

        console.log("✅ CÉREBRO ATIVO (FIXO):", chosenModel);

        const generateUrl = `https://generativelanguage.googleapis.com/v1beta/${chosenModel}:generateContent?key=${apiKey}`;

        // --- PASSO 2: PROMPT CIRÚRGICO ---
        const promptText = `
        ATUE COMO: O maior especialista mundial em Visagismo, Antropometria Facial e Cirurgia Plástica Estética.
        TAREFA: Realizar uma análise forense e geométrica de alta precisão da face na imagem.

        DIRETRIZES DE ANÁLISE PROFUNDA (Chain of Thought):
        1. **Mapeamento de Landmarks:** Localize mentalmente Trichion (linha do cabelo), Glabella, Nasion, Subnasale, Stoimon, Menton, Zigomas e Gonions.
        2. **Índice Facial:** Calcule a proporção Altura (N-Gn) vs Largura Bizigomática.
        3. **Ângulo Gonial:** Estime o ângulo da mandíbula. <115º indica quadrado/forte. >125º indica oval/suave.
        4. **Terços Faciais:** Compare o terço superior (trichion-glabella), médio (glabella-subnasale) e inferior (subnasale-menton).
        5. **Simetria:** Compare o lado esquerdo vs direito (olhos, altura das sobrancelhas, commissuras labiais).

        REGRAS DE CLASSIFICAÇÃO GEOMÉTRICA (Prioridade Absoluta):
        - **QUADRADO:** Largura da Testa ≈ Largura Bizigomática ≈ Largura Bigonial. Mandíbula com ângulo de ~90º bem definido. Queixo plano.
        - **REDONDO:** Largura Bizigomática é a maior dimensão. Altura facial reduzida. Queixo e mandíbula arredondados sem definição óssea.
        - **OVAL:** Formato clássico equilibrado. Comprimento é ~1.5x a largura. Mandíbula curva e suave. Testa levemente mais larga que o queixo.
        - **DIAMANTE:** Zigomas proeminentes e largos (ponto mais largo). Testa estreita e Mandíbula estreita. Queixo pontudo e definido.
        - **TRIÂNGULO (Pêra):** Base mandibular larga (Bigonial) é a maior medida do rosto. Testa estreita.
        - **CORAÇÃO (Triângulo Invertido):** Testa larga e proeminente. Linha do cabelo pode ter "bico de viúva". Queixo afunila drasticamente para uma ponta.

        CRITÉRIOS DE PONTUAÇÃO (Seja Extremamente Crítico e Variável):
        - 9.5 - 10.0: Perfeição Divina (Simetria absoluta, Golden Ratio). Raríssimo.
        - 9.0 - 9.4: Modelo Internacional (Traços marcantes e harmonia excelente).
        - 8.0 - 8.9: Muito atraente (Beleza acima da média, pequenas imperfeições).
        - 7.0 - 7.9: Atraente/Comum (Rosto harmônico mas padrão).
        - 6.0 - 6.9: Média (Algumas desproporções visíveis).
        - < 6.0: Desarmonia severa.
        
        IMPORTANTE: NÃO REPITA VALORES COMO 9.4. Use precisão decimal real baseada na foto (ex: 7.23, 8.65, 6.91).

        SAÍDA: APENAS O JSON ABAIXO. SEM TEXTO ANTES OU DEPOIS.
        {
            "analise_geral": { 
                "nota_final": (Número decimal entre 0.0 e 10.0. SEJA RIGOROSO E VARIÁVEL. Ex: 7.42), 
                "idade_real_estimada": (Número inteiro),
                "potencial_genetico": "Baixo" | "Médio" | "Alto" | "Elite",
                "resumo_brutal": "Uma avaliação técnica, direta e sem filtros sobre a harmonia facial e o que mais chama atenção (positivo ou negativo)."
            },
            "rosto": { 
                "formato_rosto": "Oval" | "Quadrado" | "Redondo" | "Diamante" | "Triângulo" | "Coração", 
                "pontos_fortes": ["Característica Técnica 1 (ex: Canthal Tilt Positivo)", "Característica Técnica 2 (ex: Linha Jawline Definida)"], 
                "falhas_criticas": ["Assimetria ou Falha 1 (ex: Ptose Palpebral)", "Falha 2 (ex: Retrognatismo Mandibular)"], 
                "analise_pele": "Análise dermatológica: textura, poros, oleosidade, rugas dinâmicas/estáticas, manchas." 
            },
            "grafico_radar": { 
                "simetria": (0-100), 
                "pele": (0-100), 
                "estrutura_ossea": (0-100), 
                "terco_medio": (0-100), 
                "proporcao_aurea": (0-100) 
            },
            "corpo_postura": { 
                "analise": "Se visível: postura cervical, definição de trapézio, clavícula. Se não, 'Apenas rosto visível'.", 
                "gordura_estimada": "Baixa (<12%)" | "Média (15-20%)" | "Alta (>25%)" 
            },
            "plano_correcao": { 
                "passo_1_imediato": "Correção visual imediata (ex: estilo de cabelo para compensar formato)", 
                "passo_2_rotina": "Protocolo de skincare ou hábito diário (ex: mewing, drenagem)", 
                "passo_3_longo_prazo": "Intervenção estética sugerida (ex: preenchimento, ortodontia) ou mudança de estilo de vida" 
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
                temperature: 0.0, // Zero para máxima consistência
                seed: 42 // 3. SEED FIXA: Garante que a mesma foto gere o mesmo resultado matemático
            }
        };

        const genResp = await fetch(generateUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody)
        });

        if (!genResp.ok) throw new Error(`Erro IA: ${genResp.statusText}`);

        const data = await genResp.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

        // --- PASSO 3: EXTRAÇÃO DE JSON CIRÚRGICA ---
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
            analise_geral: { nota_final: 7.0, resumo_brutal: "Erro na leitura geométrica. Tente imagem mais clara." },
            rosto: { formato_rosto: "Oval" },
            erro_leitura: true 
        }, { status: 500 });
    }
}