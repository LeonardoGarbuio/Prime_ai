import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export default function TermsPage() {
    return (
        <main className="min-h-screen bg-black text-white">
            <Navbar />
            <div className="max-w-4xl mx-auto px-4 py-32 space-y-8">
                <h1 className="text-4xl font-bold text-primary">Termos de Uso</h1>
                <div className="space-y-4 text-gray-300">
                    <p>Ao usar o PRIME AI, você concorda com os seguintes termos:</p>
                    <h2 className="text-2xl font-bold text-white mt-8">1. Natureza do Serviço</h2>
                    <p>O PRIME AI é uma ferramenta de análise estética baseada em inteligência artificial. Os resultados são estimativas e não constituem diagnóstico médico.</p>
                    <h2 className="text-2xl font-bold text-white mt-8">2. Responsabilidade</h2>
                    <p>Não nos responsabilizamos por decisões tomadas com base nas análises fornecidas. O uso das informações é de inteira responsabilidade do usuário.</p>
                    <h2 className="text-2xl font-bold text-white mt-8">3. Reembolso</h2>
                    <p>Oferecemos garantia de 7 dias para o produto digital "Dossiê Prime AI", conforme o Código de Defesa do Consumidor.</p>
                </div>
            </div>
            <Footer />
        </main>
    );
}
