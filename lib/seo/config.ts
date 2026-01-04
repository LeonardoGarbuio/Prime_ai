// SEO Configuration - Prime AI
export const SEO_CONFIG = {
    siteName: "Prime AI",
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://primeai.app",
    defaultTitle: "Prime AI - Análise Biométrica Facial com IA",
    defaultDescription: "Descubra o quão longe você está do seu Prime. Análise facial avançada com inteligência artificial que revela sua verdadeira pontuação estética.",
    locale: "pt_BR",
    keywords: [
        "análise facial",
        "análise facial ia",
        "biometria facial",
        "inteligência artificial",
        "beleza",
        "simetria facial",
        "prime",
        "scanner facial",
        "análise estética",
        "formato de rosto",
        "avaliação facial"
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
        title: "Prime AI - Análise Biométrica Facial com IA",
        description: "Descubra o quão longe você está do seu Prime. Análise facial avançada com inteligência artificial que revela sua verdadeira pontuação estética.",
        keywords: ["análise facial grátis", "ia facial", "prime ai", "análise de beleza"],
        canonical: "/"
    },
    scan: {
        title: "Análise Facial Gratuita | Prime AI",
        description: "Faça sua análise facial gratuita agora. Descubra sua pontuação Prime, formato de rosto e recomendações personalizadas com IA avançada.",
        keywords: ["scan facial", "análise grátis", "scanner de rosto"],
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
        title: "Como Funciona | Prime AI - Tecnologia de Análise Facial",
        description: "Entenda como nossa IA analisa seu rosto com tecnologia de ponta em biometria facial e machine learning.",
        keywords: ["como funciona ia facial", "tecnologia prime ai"],
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
    obrigado: {
        title: "Obrigado pela Compra | Prime AI VIP",
        description: "Bem-vindo ao Prime AI VIP! Sua assinatura foi ativada com sucesso.",
        keywords: ["prime ai vip ativado"],
        canonical: "/obrigado",
        robots: "noindex, nofollow"
    }
};
