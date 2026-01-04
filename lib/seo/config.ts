// SEO Configuration - Prime AI
export const SEO_CONFIG = {
    siteName: "Prime AI",
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://primeai.app",
    defaultTitle: "Prime AI - Análise Biométrica Facial com IA",
    defaultDescription: "Descubra o quão longe você está do seu Prime. Análise facial avançada com inteligência artificial que revela sua verdadeira pontuação estética.",
    locale: "pt_BR",
    keywords: [
        // Keywords Primárias (Alto Volume)
        "análise facial",
        "análise facial ia",
        "análise facial grátis",
        "análise facial online",
        "scanner facial",
        "scanner facial online",
        "scanner de rosto",
        "scanner facial grátis",
        "ia de beleza",
        "inteligência artificial beleza",
        "ai facial analysis",

        // Termos Específicos do Nicho
        "biometria facial",
        "biometria facial online",
        "simetria facial",
        "teste simetria facial",
        "proporção áurea facial",
        "golden ratio face",
        "formato de rosto",
        "teste formato rosto",
        "descobrir formato de rosto",
        "calculadora rosto",
        "calculadora de beleza",
        "avaliação facial",
        "nota facial",
        "face rating",
        "face rating brasil",
        "beauty score",

        // Long-Tail Keywords (Alta Conversão)
        "como analisar meu rosto",
        "como analisar meu rosto com ia",
        "descobrir meu formato de rosto",
        "teste de beleza facial grátis",
        "ia que analisa rosto",
        "ia que dá nota para rosto",
        "melhor site análise facial",
        "análise facial biométrica grátis",
        "qual minha nota de beleza",

        // Termos Técnicos
        "mediapipe face mesh",
        "mediapipe análise facial",
        "google face analysis",
        "ai facial recognition",
        "deep learning face",
        "computer vision face",

        // Comparações e Qualificadores
        "melhor análise facial",
        "análise facial precisa",
        "scanner facial confiável",
        "análise facial brasileira",
        "prime ai",
        "prime facial",

        // Relacionados a Estética
        "visagismo",
        "visagismo online",
        "harmonia facial",
        "estética facial",
        "terços faciais",
        "índice facial"
    ],
    social: {
        twitter: "@primeai",
        facebook: "primeai",
        instagram: "@primeai"
    },
    creator: "Prime AI",
    publisher: "Prime AI"
};

// Page-specific metadata configurations
export const PAGE_METADATA = {
    home: {
        title: "Análise Facial com IA Grátis | Prime AI - Scanner Facial Online",
        description: "Análise Facial com IA 100% Grátis ✓ Descubra sua nota de beleza, formato de rosto e simetria facial em 30s ✓ Scanner facial online com tecnologia Google MediaPipe ✓ Teste agora!",
        keywords: ["análise facial grátis", "ia facial", "prime ai", "análise de beleza", "scanner facial grátis"],
        canonical: "/"
    },
    scan: {
        title: "Scanner Facial Grátis | Análise de Rosto com IA",
        description: "Scanner Facial Grátis ✓ Faça sua análise facial com IA agora ✓ Descubra formato do rosto, simetria e proporção áurea ✓ Resultados em tempo real ✓ 100% privado e seguro",
        keywords: ["scan facial", "análise grátis", "scanner de rosto", "teste facial online"],
        canonical: "/scan"
    },
    camera: {
        title: "Capturar Foto | Prime AI Scanner",
        description: "Capture sua foto para análise facial em tempo real. IA avançada analisa simetria, proporções e características faciais.",
        keywords: ["captura facial", "foto análise", "camera ia"],
        canonical: "/camera"
    },
    results: {
        title: "Seus Resultados | Prime AI",
        description: "Veja sua análise facial completa com pontuação Prime, formato de rosto identificado e recomendações personalizadas.",
        keywords: ["resultados análise facial", "pontuação prime"],
        canonical: "/results"
    },
    vipScanner: {
        title: "Scanner VIP Premium | Prime AI",
        description: "Acesso VIP ilimitado ao scanner facial mais avançado. Análises ilimitadas, insights profundos e recomendações exclusivas.",
        keywords: ["prime ai vip", "scanner premium", "análise ilimitada"],
        canonical: "/vip-scanner"
    },
    comoFunciona: {
        title: "Como Funciona a Análise Facial com IA? | Tecnologia MediaPipe",
        description: "Como Funciona a Análise Facial com IA? ✓ Tecnologia MediaPipe mapeia 468 pontos faciais ✓ Cálculo científico de simetria e proporção áurea ✓ Entenda a ciência por trás da IA",
        keywords: ["como funciona ia facial", "tecnologia prime ai", "mediapipe face mesh", "análise facial científica"],
        canonical: "/como-funciona"
    },
    terms: {
        title: "Termos de Uso | Prime AI",
        description: "Termos de uso e condições de serviço do Prime AI.",
        keywords: ["termos de uso", "condições"],
        canonical: "/terms",
        robots: "noindex, follow"
    },
    privacy: {
        title: "Política de Privacidade | Prime AI",
        description: "Política de privacidade e proteção de dados do Prime AI.",
        keywords: ["privacidade", "lgpd", "proteção de dados"],
        canonical: "/privacy",
        robots: "noindex, follow"
    },
    faq: {
        title: "Perguntas Frequentes (FAQ) | Prime AI - Análise Facial com IA",
        description: "Tire todas suas dúvidas sobre análise facial com IA ✓ Como funciona ✓ É grátis? ✓ Segurança ✓ Precisão ✓ Diferencial Prime AI ✓ Respostas completas",
        keywords: ["faq prime ai", "dúvidas análise facial", "como funciona scanner facial", "ia facial segura"],
        canonical: "/faq"
    },
    obrigado: {
        title: "Obrigado pela Compra | Prime AI VIP",
        description: "Bem-vindo ao Prime AI VIP! Sua assinatura foi ativada com sucesso.",
        keywords: ["prime ai vip ativado"],
        canonical: "/obrigado",
        robots: "noindex, nofollow"
    }
};
