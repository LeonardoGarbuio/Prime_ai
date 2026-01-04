import React from 'react';
import { Metadata } from 'next';
import { generatePageMetadata } from '@/lib/seo/metadata';
import { AlertTriangle } from 'lucide-react';

export const metadata: Metadata = generatePageMetadata({ page: 'privacy' });

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-black text-gray-300 p-6 md:p-12 font-sans">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-white mb-6">Política de Privacidade</h1>
                <p className="text-sm text-gray-500 mb-8">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>

                <div className="space-y-8">
                    {/* Seção 1 - Coleta de Dados */}
                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">1. Coleta de Dados Biométricos</h2>
                        <p className="mb-4">
                            Ao utilizar os serviços da PRIME AI, o usuário faz o upload voluntário de sua imagem facial.
                            Declaramos explicitamente que:
                        </p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>A imagem é utilizada <strong>EXCLUSIVAMENTE</strong> para o processamento algorítmico instantâneo.</li>
                            <li><strong>Ciclo de Vida do Dado:</strong> As imagens são processadas em tempo real e descartadas da memória após a análise. Não mantemos banco de dados de rostos.</li>
                            <li>Não vendemos, comercializamos ou usamos suas imagens para treinamento de IA.</li>
                        </ul>
                    </section>

                    {/* Seção 2 - Armazenamento Local */}
                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">2. Armazenamento Local de Métricas Faciais</h2>
                        <p className="mb-4">
                            Para garantir consistência nos resultados (mesmo formato de rosto em fotos diferentes),
                            armazenamos proporções geométricas do seu rosto <strong>localmente no seu navegador</strong>.
                        </p>

                        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-4">
                            <p className="text-green-300 font-semibold mb-2">
                                ✅ 100% Local - Nunca Sai do Seu Dispositivo
                            </p>
                            <ul className="list-disc list-inside text-sm space-y-1">
                                <li>Armazenado apenas no localStorage do seu navegador</li>
                                <li>NUNCA é enviado para nossos servidores</li>
                                <li>Você pode apagar a qualquer momento limpando o cache do navegador</li>
                                <li>Expira automaticamente após 2 anos de inatividade</li>
                            </ul>
                        </div>

                        <p className="text-sm text-gray-400">
                            <strong>O que armazenamos:</strong> Apenas proporções matemáticas
                            (exemplo: razão distância_olhos / largura_rosto = 0.45). Não armazenamos
                            fotos, imagens ou dados que identifiquem você.
                        </p>
                    </section>

                    {/* Seção 3 - APIs de Terceiros (CRÍTICO) */}
                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">
                            3. Processamento por Provedores de Inteligência Artificial
                        </h2>

                        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-6 mb-6">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-yellow-300 font-semibold mb-2">
                                        ⚠️ IMPORTANTE: Uso de APIs de Terceiros
                                    </p>
                                    <p className="text-gray-300 text-sm">
                                        Para realizar a análise facial com inteligência artificial, sua imagem
                                        é processada temporariamente por provedores de IA de terceiros.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <h3 className="text-xl font-semibold text-primary mb-3">
                            3.1. Como Funciona o Processamento
                        </h3>
                        <ol className="list-decimal list-inside space-y-3 mb-6">
                            <li>Você envia sua foto através do nosso site</li>
                            <li>A imagem é enviada para APIs de Inteligência Artificial parceiras:
                                <ul className="list-disc list-inside ml-6 mt-2 text-gray-400">
                                    <li><strong>Google Cloud (Gemini API)</strong> - Processador principal</li>
                                    <li><strong>Groq</strong> - Processador alternativo (fallback)</li>
                                </ul>
                            </li>
                            <li>A IA analisa a imagem e gera o relatório</li>
                            <li><strong>A imagem é DESCARTADA imediatamente</strong> após o processamento</li>
                            <li>Recebemos apenas o texto do relatório (sem sua foto)</li>
                        </ol>

                        <h3 className="text-xl font-semibold text-primary mb-3">
                            3.2. Garantias de Segurança
                        </h3>
                        <ul className="list-disc list-inside space-y-2 mb-6">
                            <li><strong>Criptografia:</strong> Todas as transmissões usam HTTPS/TLS</li>
                            <li><strong>Descarte Imediato:</strong> As APIs de IA não armazenam sua foto</li>
                            <li><strong>Sem Identificação:</strong> Não vinculamos sua foto ao seu e-mail ou CPF</li>
                            <li><strong>Processamento Isolado:</strong> Cada análise é independente</li>
                        </ul>

                        <h3 className="text-xl font-semibold text-primary mb-3">
                            3.3. Base Legal (LGPD)
                        </h3>
                        <p className="mb-4">
                            O processamento por sub-processadores é baseado em:
                        </p>
                        <ul className="list-disc list-inside space-y-2 mb-4">
                            <li><strong>Art. 7º, I:</strong> Consentimento do titular (você aceita os termos)</li>
                            <li><strong>Art. 11, II, f:</strong> Legítimo interesse para prestação do serviço</li>
                            <li><strong>Art. 33:</strong> Sub-processadores sob contrato de DPA (Data Processing Agreement)</li>
                        </ul>

                        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                            <p className="text-sm text-gray-400">
                                <strong>Transparência:</strong> Os provedores de IA (Google e Groq) operam
                                conforme suas próprias políticas de privacidade, que são compatíveis com LGPD e GDPR.
                                Não vendemos, comercializamos ou usamos suas imagens para treinamento de IA.
                            </p>
                        </div>
                    </section>

                    {/* Seção 4 - O que NÃO fazemos */}
                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">4. O Que NÃO Fazemos Com Seus Dados</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="flex items-start gap-2">
                                <span className="text-red-500">❌</span>
                                <span>Não vendemos suas fotos ou dados</span>
                            </div>
                            <div className="flex items-start gap-2">
                                <span className="text-red-500">❌</span>
                                <span>Não usamos imagens para treinar IA</span>
                            </div>
                            <div className="flex items-start gap-2">
                                <span className="text-red-500">❌</span>
                                <span>Não armazenamos fotos em banco</span>
                            </div>
                            <div className="flex items-start gap-2">
                                <span className="text-red-500">❌</span>
                                <span>Não compartilhamos com anunciantes</span>
                            </div>
                            <div className="flex items-start gap-2">
                                <span className="text-red-500">❌</span>
                                <span>Não cruzamos dados faciais com CPF/email</span>
                            </div>
                            <div className="flex items-start gap-2">
                                <span className="text-red-500">❌</span>
                                <span>Não compartilhamos com redes sociais</span>
                            </div>
                        </div>
                    </section>

                    {/* Seção 5 - Dados de Pagamento */}
                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">5. Dados de Pagamento</h2>
                        <p>
                            Todas as transações financeiras são processadas por gateways de pagamento criptografados
                            externos (Kiwify). A PRIME AI não tem acesso e não armazena números de cartão de crédito.
                        </p>
                    </section>

                    {/* Seção 6 - Seus Direitos */}
                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">6. Seus Direitos (LGPD)</h2>
                        <p className="mb-4">
                            Conforme a Lei Geral de Proteção de Dados (Lei 13.709/2018), você tem direito a:
                        </p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Solicitar informações sobre seus dados</li>
                            <li>Corrigir dados incompletos ou desatualizados</li>
                            <li>Solicitar a eliminação de dados pessoais</li>
                            <li>Revogar consentimento a qualquer momento</li>
                        </ul>
                        <p className="mt-4 text-sm text-gray-400">
                            Como não armazenamos contas de usuário ou fotos, nosso sistema é
                            "Privacy by Design" (Privacidade desde a concepção).
                        </p>
                    </section>
                </div>

                <div className="mt-12 pt-8 border-t border-gray-800">
                    <a href="/" className="text-primary hover:underline">← Voltar para o início</a>
                </div>
            </div>
        </div>
    );
}
