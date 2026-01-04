import React from 'react';
import { Metadata } from 'next';
import { generatePageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = generatePageMetadata({ page: 'privacy' });

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-black text-gray-300 p-6 md:p-12 font-sans">
            <div className="max-w-3xl mx-auto">
                <h1 className="text-3xl font-bold text-white mb-6">Política de Privacidade</h1>
                <p className="text-sm text-gray-500 mb-8">Última atualização: {new Date().toLocaleDateString()}</p>

                <div className="space-y-6">
                    <section>
                        <h2 className="text-xl font-semibold text-white mb-2">1. Coleta de Dados Biométricos</h2>
                        <p>
                            Ao utilizar os serviços da PRIME AI, o usuário faz o upload voluntário de sua imagem facial.
                            Declaramos explicitamente que:
                        </p>
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                            <li>A imagem é utilizada <strong>EXCLUSIVAMENTE</strong> para o processamento algorítmico instantâneo.</li>
                            <li>Não vendemos, compartilhamos ou divulgamos sua foto para terceiros.</li>
                            <li><strong>Ciclo de Vida do Dado:</strong> As imagens são processadas em tempo real e descartadas da memória do servidor após a análise. Não mantemos banco de dados de rostos.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-2">2. Dados de Pagamento</h2>
                        <p>
                            Todas as transações financeiras são processadas por gateways de pagamento criptografados externos (Kiwify).
                            A PRIME AI não tem acesso e não armazena números de cartão de crédito.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-2">3. Seus Direitos (LGPD)</h2>
                        <p>
                            Conforme a Lei Geral de Proteção de Dados (Lei 13.709/2018), você tem direito a solicitar informações sobre seus dados.
                            Como não armazenamos contas de usuário ou fotos, nosso sistema é "Privacy by Design" (Privacidade desde a concepção).
                        </p>
                    </section>
                </div>

                <div className="mt-12 pt-8 border-t border-gray-800">
                    <a href="/" className="text-green-400 hover:underline">← Voltar para o início</a>
                </div>
            </div>
        </div>
    );
}
