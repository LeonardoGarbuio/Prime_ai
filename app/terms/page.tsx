import React from 'react';
import { Metadata } from 'next';
import { generatePageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = generatePageMetadata({ page: 'terms' });

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-black text-gray-300 p-6 md:p-12 font-sans">
            <div className="max-w-3xl mx-auto">
                <h1 className="text-3xl font-bold text-white mb-6">Termos de Uso e Políticas de Privacidade</h1>
                <p className="text-sm text-gray-500 mb-8">Última atualização: {new Date().toLocaleDateString()}</p>

                <div className="space-y-8">
                    {/* SEÇÃO 1 - SERVIÇO */}
                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">1. O Serviço</h2>
                        <p className="leading-relaxed">
                            A PRIME AI comercializa um produto digital de informação ("Infoproduto") no formato de Dossiê/Relatório PDF.
                            O serviço utiliza Inteligência Artificial para identificar padrões geométricos faciais e oferecer sugestões estéticas baseadas em visagismo.
                        </p>
                    </section>

                    {/* SEÇÃO 2 - DISCLAIMER (BLINDAGEM JURÍDICA) */}
                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">2. Isenção de Responsabilidade (Disclaimer)</h2>
                        <div className="space-y-3 leading-relaxed">
                            <p>
                                O relatório gerado pela PRIME AI tem caráter <strong>estritamente recreativo, estético e informativo</strong>.
                            </p>
                            <ul className="list-disc pl-5 space-y-2 text-gray-400">
                                <li>NÃO somos uma clínica médica, dermatológica ou cirúrgica.</li>
                                <li>As sugestões referem-se a truques de estilo e não prometem alteração biológica.</li>
                                <li>
                                    <strong>Natureza da IA:</strong> Devido à natureza probabilística da Inteligência Artificial, as sugestões de estilo podem apresentar variações sutis entre análises, refletindo a subjetividade e a diversidade de opções do visagismo.
                                </li>
                                <li>Resultados dependem diretamente da qualidade, iluminação e ângulo da foto enviada pelo usuário.</li>
                            </ul>
                        </div>
                    </section>

                    {/* SEÇÃO 3 - ENTREGA */}
                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">3. Entrega e Acesso</h2>
                        <p className="leading-relaxed">
                            O acesso ao Dossiê é enviado para o e-mail cadastrado imediatamente após a confirmação do pagamento.
                            É responsabilidade exclusiva do usuário fornecer um e-mail válido no momento da compra.
                        </p>
                    </section>

                    {/* SEÇÃO 4 - REEMBOLSO */}
                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">4. Reembolso e Cancelamento</h2>
                        <p className="leading-relaxed">
                            Em conformidade com o Art. 49 do Código de Defesa do Consumidor (CDC), oferecemos garantia incondicional de 7 dias.
                            Se desejar o reembolso por qualquer motivo, entre em contato com nosso suporte oficial dentro deste prazo para estorno integral.
                        </p>
                    </section>
                </div>

                <div className="mt-12 pt-8 border-t border-gray-800">
                    <a href="/" className="text-green-500 hover:text-green-400 transition-colors hover:underline">
                        ← Voltar para o início
                    </a>
                </div>
            </div>
        </div>
    );
}