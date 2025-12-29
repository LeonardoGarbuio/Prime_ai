import Link from "next/link";
import { ScanFace } from "lucide-react";

export function Navbar() {
    return (
        <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-black/50 backdrop-blur-md border-b border-white/10">
            <Link href="/" className="flex items-center gap-2 group">
                <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <ScanFace className="w-5 h-5 text-primary" />
                </div>
                <span className="text-lg font-bold tracking-wider text-white font-mono">
                    PRIME <span className="text-primary">AI</span>
                </span>
            </Link>

            <div className="hidden md:flex items-center gap-6 text-sm text-gray-400 font-mono">
                <Link href="/como-funciona" className="hover:text-white transition-colors">COMO FUNCIONA</Link>
                <Link href="/vip-scanner" className="text-primary hover:text-primary/80 transition-colors">VIP</Link>
            </div>
        </nav>
    );
}
