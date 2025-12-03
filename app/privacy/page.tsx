import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export default function PrivacyPage() {
    return (
        <main className="min-h-screen bg-black text-white">
            <Navbar />
            <div className="max-w-4xl mx-auto px-4 py-32 space-y-8">
                <h1 className="text-4xl font-bold text-primary">Política de Privacidade</h1>
                <div className="space-y-4 text-gray-300">
                    <p>Sua privacidade é nossa prioridade. Esta política descreve como coletamos, usamos e protegemos suas informações.</p>
                    <h2 className="text-2xl font-bold text-white mt-8">1. Coleta de Dados</h2>
                    <p>Coletamos apenas as imagens enviadas para análise biométrica. Estas imagens são processadas em tempo real e não são armazenadas permanentemente em nossos servidores.</p>
                    <h2 className="text-2xl font-bold text-white mt-8">2. Uso das Informações</h2>
                    <p>As informações são usadas exclusivamente para gerar o relatório de análise estética e personalizar sua experiência de compra.</p>
                    <h2 className="text-2xl font-bold text-white mt-8">3. Segurança</h2>
                    <p>Implementamos medidas de segurança rigorosas para proteger seus dados contra acesso não autorizado.</p>
                </div>
            </div>
            <Footer />
        </main>
    );
}
