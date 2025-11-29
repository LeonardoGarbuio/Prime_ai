import { NextResponse } from "next/server";
import Groq from "groq-sdk";

export async function POST(req: Request) {
    const groq = new Groq({
        apiKey: process.env.GROQ_API_KEY || "dummy_key_for_build",
    });

    try {
        const { faceImage, bodyImage } = await req.json();

        if (!faceImage) {
            return NextResponse.json(
                { error: "Face image is required" },
                { status: 400 }
            );
        }

        // Construct the user message content
        const content: any[] = [
            {
                type: "text",
                text: `Você é o PRIME AI, um assistente de análise estética biométrica.
Sua tarefa é analisar a imagem fornecida e gerar um relatório JSON estrito.

IMPORTANTE:
1. Responda APENAS com o JSON. Não escreva "Aqui está o JSON" ou qualquer texto antes ou depois.
2. Seja crítico e científico na análise (simetria, pele, postura).
3. Use notas de 0.0 a 10.0.

ESTRUTURA JSON OBRIGATÓRIA:
{
  "analise_geral": {
    "nota_final": 6.2,
    "idade_real_estimada": 25,
    "potencial_genetico": "Alto",
    "resumo_brutal": "Texto aqui"
  },
  "rosto": {
    "pontos_fortes": ["Item 1", "Item 2"],
    "falhas_criticas": ["Item 1", "Item 2"],
    "analise_pele": "Texto aqui"
  },
  "corpo_postura": {
    "analise": "Texto aqui",
    "gordura_estimada": "Texto aqui"
  },
  "plano_correcao": {
    "passo_1_imediato": "Texto aqui",
    "passo_2_rotina": "Texto aqui",
    "passo_3_longo_prazo": "Texto aqui"
  }
}`,
            },
            {
                type: "image_url",
                image_url: {
                    url: faceImage,
                },
            },
        ];

        if (bodyImage) {
            content.push({
                type: "image_url",
                image_url: {
                    url: bodyImage,
                },
            });
        }

        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "user",
                    content: content,
                },
            ],
            model: "meta-llama/llama-4-scout-17b-16e-instruct",
            temperature: 0.1,
            max_tokens: 1024,
            top_p: 1,
            stream: false,
            response_format: { type: "json_object" },
        });

        const result = completion.choices[0]?.message?.content;

        if (!result) {
            throw new Error("No analysis generated");
        }

        return NextResponse.json(JSON.parse(result));
    } catch (error: any) {
        console.error("Analysis Error Details:", JSON.stringify(error, null, 2));
        if (error.response) {
            console.error("Groq Response Error:", JSON.stringify(error.response.data, null, 2));
        }
        return NextResponse.json(
            { error: "Failed to analyze image", details: error.message },
            { status: 500 }
        );
    }
}
