import Link from "next/link";

export function Footer() {
    return (
        <footer className="py-8 px-4 border-t border-white/5 bg-black text-center relative z-10">
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 text-xs text-gray-500 font-mono">
                <span>&copy; 2024 PRIME AI</span>
                <span className="hidden md:inline">|</span>
                <div className="flex gap-4">
                    <Link href="/terms" className="hover:text-primary transition-colors">Termos de Uso</Link>
                    <Link href="/privacy" className="hover:text-primary transition-colors">Política de Privacidade</Link>
                    <a href="mailto:contato@primeai.com" className="hover:text-primary transition-colors">Contato / Suporte</a>
                </div>
            </div>
        </footer>
    );
}
