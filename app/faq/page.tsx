import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { ArrowRight, HelpCircle, CheckCircle2 } from 'lucide-react';
import { generateFAQSchema, createJsonLdScript } from '@/lib/seo/schema';

export const metadata: Metadata = {
    title: "Perguntas Frequentes (FAQ) | Prime AI - Análise Facial com IA",
    description: "Tire todas suas dúvidas sobre análise facial com IA ✓ Como funciona ✓ É grátis? ✓ Segurança ✓ Precisão ✓ Diferencial Prime AI ✓ Respostas completas",
    keywords: [
        "faq prime ai",
        "dúvidas análise facial",
        "como funciona scanner facial",
        "análise facial é grátis",
        "ia facial segura",
        "precisão análise facial"
    ],
    alternates: {
        canonical: "/faq"
    }
};

const faqs = [
    {
        question: "O que é análise facial com IA?",
        answer: "Análise facial com IA (Inteligência Artificial) é um processo automatizado que usa algoritmos de visão computacional para mapear e avaliar características faciais. O Prime AI utiliza tecnologia Google MediaPipe que identifica 468 pontos faciais, calculando simetria, proporções, harmonia e outros aspectos estéticos baseados em padrões científicos de beleza."
    },
    {
        question: "Como funciona o Prime AI?",
        answer: "O processo é simples: (1) Você envia uma selfie, (2) Nossa IA mapeia 468 pontos no seu rosto usando MediaPipe Face Mesh, (3) Calculamos métricas como simetria bilateral, proporção áurea, terços faciais e índices biométricos, (4) Em 30 segundos, você recebe sua nota de beleza (0-10), seu formato de rosto, análise de simetria e recomendações personalizadas."
    },
    {
        question: "É realmente grátis? Quantas análises posso fazer?",
        answer: "Sim! Oferecemos 5 análises faciais gratuitas para todos. Você pode testar livremente o scanner, descobrir seu formato de rosto e nota de beleza sem pagar nada. Para análises ilimitadas, insights profundos e recomendações de estilo premium, você pode assinar o Prime AI VIP por apenas R$ 19,90/mês."
    },
    {
        question: "Meus dados e fotos são seguros?",
        answer: "Absolutamente. Sua privacidade é nossa prioridade. Não armazenamos suas fotos em nossos servidores - elas são processadas em tempo real e descartadas imediatamente após a análise. Não vendemos, compartilhamos ou divulgamos suas imagens para terceiros. Todo o processo é criptografado e segue a LGPD (Lei Geral de Proteção de Dados)."
    },
    {
        question: "Qual a precisão da análise facial?",
        answer: "Nossa análise tem 95% de precisão no mapeamento de landmarks faciais, usando a mesma tecnologia MediaPipe do Google. Os cálculos de simetria, proporção áurea e formatos de rosto são baseados em estudos científicos de antropometria facial. Importante: resultados podem variar conforme iluminação, ângulo e qualidade da foto enviada."
    },
    {
        question: "O que é MediaPipe Face Mesh?",
        answer: "MediaPipe Face Mesh é uma tecnologia de código aberto desenvolvida pelo Google que utiliza machine learning para detectar 468 marcos (landmarks) faciais em 3D em tempo real. É a mesma tecnologia usada em filtros do Instagram, Snapchat e apps de realidade aumentada, garantindo alta precisão e confiabilidade."
    },
    {
        question: "Como posso melhorar minha nota facial?",
        answer: "Sua nota reflete características estruturais, mas você pode otimizar sua aparência: (1) Melhore a iluminação e ângulo das fotos, (2) Cuide da pele (hidratação, limpeza), (3) Escolha corte de cabelo adequado ao seu formato de rosto, (4) Use técnicas de visagismo, (5) Membros VIP recebem guia completo de estilo personalizado com dicas específicas para seu rosto."
    },
    {
        question: "Qual é o meu formato de rosto?",
        answer: "Nossa IA identifica automaticamente seu formato entre 9 tipos: Oval, Redondo, Quadrado, Retangular, Coração, Triângulo, Triângulo Invertido, Diamante e Oblongo. Conhecer seu formato ajuda a escolher óculos, corte de cabelo, barba e maquiagem que harmonizam com suas características naturais."
    },
    {
        question: "O que diferencia Prime AI de outros scanners faciais?",
        answer: "Diferenciais: (1) Tecnologia Google MediaPipe (468 pontos vs 68 da concorrência), (2) 100% em português brasileiro, (3) Grátis para começar, (4) Análise em 30 segundos, (5) Não armazenamos suas fotos, (6) Versão VIP com consultoria de estilo completa, (7) Base científica sólida (proporção áurea, antropometria facial)."
    },
    {
        question: "Funciona em qualquer tipo de foto?",
        answer: "Para melhores resultados: (1) Foto do rosto de frente, (2) Boa iluminação natural, (3) Sem óculos ou chapéus, (4) Fundo neutro, (5) Expressão neutra. Fotos de perfil, muito escuras ou com filtros podem reduzir a precisão. A IA funcionará, mas com resultados menos confiáveis."
    },
    {
        question: "O que é a proporção áurea facial?",
        answer: "A proporção áurea (phi = 1.618) é uma razão matemática encontrada na natureza e considerada universalmente harmoniosa. Na estética facial, medimos distâncias como largura do rosto/comprimento, distância entre os olhos, etc. Quanto mais próximo de 1.618, mais 'harmônico' é considerado matematicamente."
    },
    {
        question: "Prime AI VIP vale a pena?",
        answer: "Sim, se você quer: (1) Análises ilimitadas (testar diferentes fotos, ângulos, estilos), (2) Guia de estilo personalizado (cabelo, barba, óculos), (3) Insights profundos (forensic mode), (4) Recomendações específicas de melhoria, (5) Acesso à área de membros. Por R$ 19,90/mês (menos que um lanche), você tem consultoria de imagem 24/7."
    }
];

export default function FAQPage() {
    const faqSchema = generateFAQSchema(faqs);

    return (
        <main className="min-h-screen bg-black text-white">
            <Navbar />

            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={createJsonLdScript(faqSchema)}
            />

            {/* Hero */}
            <section className="relative pt-32 pb-20 px-4 text-center overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/20 blur-[120px] rounded-full opacity-20 pointer-events-none" />

                <div className="relative z-10 max-w-4xl mx-auto">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono mb-6">
                        <HelpCircle className="w-3 h-3" /> PERGUNTAS FREQUENTES
                    </div>

                    <h1 className="text-4xl md:text-6xl font-bold mb-6">
                        DÚVIDAS SOBRE <span className="text-primary">ANÁLISE FACIAL</span>
                    </h1>

                    <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                        Tire todas suas dúvidas sobre como funciona a análise facial com inteligência artificial,
                        segurança de dados, precisão e muito mais.
                    </p>
                </div>
            </section>

            {/* FAQs */}
            <section className="py-20 px-4">
                <div className="max-w-4xl mx-auto space-y-6">
                    {faqs.map((faq, index) => (
                        <div
                            key={index}
                            className="p-6 md:p-8 rounded-2xl bg-gradient-to-b from-white/5 to-transparent border border-white/10 hover:border-primary/30 transition-all"
                        >
                            <div className="flex items-start gap-4">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center mt-1">
                                    <CheckCircle2 className="w-5 h-5 text-primary" />
                                </div>
                                <div className="flex-1">
                                    <h2 className="text-xl md:text-2xl font-bold text-white mb-4">
                                        {faq.question}
                                    </h2>
                                    <p className="text-gray-400 leading-relaxed">
                                        {faq.answer}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* CTA */}
            <section className="py-20 px-4 border-t border-white/5">
                <div className="max-w-2xl mx-auto text-center">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                        Ainda com dúvidas? <span className="text-primary">Teste grátis!</span>
                    </h2>
                    <p className="text-gray-400 mb-8">
                        A melhor forma de entender é experimentar. Faça sua primeira análise facial gratuita agora.
                    </p>

                    <Link href="/scan">
                        <Button
                            size="lg"
                            className="h-16 px-12 text-lg font-bold shadow-[0_0_30px_rgba(57,255,20,0.2)] hover:shadow-[0_0_50px_rgba(57,255,20,0.4)] transition-all"
                        >
                            FAZER ANÁLISE GRÁTIS
                            <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                    </Link>

                    <p className="text-xs text-gray-600 mt-4">
                        5 análises gratuitas • Sem cartão de crédito • Resultado em 30s
                    </p>
                </div>
            </section>

            <Footer />
        </main>
    );
}
