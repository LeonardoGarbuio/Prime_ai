// Para rodar: node teste-chave.js
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Sua chave nova
const apiKey = "AIzaSyBBsCR7S4bVUuoxfD4ub9J7lhLiakWk_6c";

async function testarChave() {
  console.log("🔍 Iniciando diagnóstico da Chave API...");
  const genAI = new GoogleGenerativeAI(apiKey);

  try {
    // 1. Tenta listar os modelos disponíveis para esta chave
    console.log("📡 Conectando ao Google para listar modelos...");
    const modelResponse = await genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // Teste simples de geração de texto
    console.log("🧪 Tentando gerar um texto simples (Teste de vida)...");
    const result = await modelResponse.generateContent("Responda apenas: OK, estou vivo.");
    const response = await result.response;
    console.log("✅ SUCESSO! A IA respondeu:", response.text());
    console.log("👉 SUA CHAVE ESTÁ FUNCIONANDO PERFEITAMENTE.");
    
  } catch (error) {
    console.error("\n❌ ERRO FATAL NO TESTE:");
    console.error(error.message);
    
    if (error.message.includes("404")) {
      console.log("\n⚠️ DIAGNÓSTICO: Erro 404 (Not Found).");
      console.log("Isso significa que a 'Generative Language API' não está ativada no seu projeto do Google Cloud.");
      console.log("COMO RESOLVER:");
      console.log("1. Entre em: https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com");
      console.log("2. Selecione o projeto da sua chave no topo.");
      console.log("3. Clique no botão azul 'ATIVAR' (ENABLE).");
    }
  }
}

testarChave();