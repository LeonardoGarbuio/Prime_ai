import React from 'react';

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-black text-gray-300 p-6 md:p-12 font-sans">
            <div className="max-w-3xl mx-auto">
                <h1 className="text-3xl font-bold text-white mb-6">Termos de Uso e Serviço</h1>
                <p className="text-sm text-gray-500 mb-8">Última atualização: {new Date().toLocaleDateString()}</p>

                <div className="space-y-6">
                    <section>
                        <h2 className="text-xl font-semibold text-white mb-2">1. O Serviço</h2>
                        <p>
                            A PRIME AI comercializa um produto digital de informação ("Infoproduto") no formato de Dossiê/Relatório PDF.
                            O serviço utiliza Inteligência Artificial para identificar padrões geométricos faciais e oferecer sugestões estéticas baseadas em visagismo.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-2">2. Isenção de Responsabilidade Médica (Disclaimer)</h2>
                        <p>
                            O relatório gerado pela PRIME AI tem caráter <strong>estritamente recreativo, estético e informativo</strong>.
                        </p>
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                            <li>NÃO somos uma clínica médica, dermatológica ou cirúrgica.</li>
                            <li>As sugestões referem-se a truques de estilo e não prometem alteração biológica.</li>
                            <li>Resultados podem variar de pessoa para pessoa e dependem da qualidade da foto enviada.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-2">3. Entrega e Acesso</h2>
                        <p>
                            O acesso ao Dossiê é enviado para o e-mail cadastrado imediatamente após a confirmação do pagamento.
                            É responsabilidade do usuário fornecer um e-mail válido.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-2">4. Reembolso e Cancelamento</h2>
                        <p>
                            Em conformidade com o Art. 49 do Código de Defesa do Consumidor (CDC), oferecemos garantia de 7 dias.
                            Se desejar o reembolso, entre em contato com nosso suporte dentro deste prazo.
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
