import { Lock } from "lucide-react";
import { Button } from "./Button";

interface BlurRevealProps {
    children: React.ReactNode;
    isLocked?: boolean;
    onUnlock?: () => void;
    price?: string;
    title?: string;
    description?: string;
}

export function BlurReveal({
    children,
    isLocked = true,
    onUnlock,
    price = "R$ 19,90",
    title = "POTENCIAL OCULTO",
    description = "Desbloqueie sua análise completa e o plano de correção personalizado."
}: BlurRevealProps) {
    return (
        <div className="relative overflow-hidden rounded-xl border border-secondary bg-black/50">
            <div className={isLocked ? "blur-xl select-none pointer-events-none opacity-50 transition-all duration-700" : ""}>
                {children}
            </div>

            {isLocked && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/20 backdrop-blur-[2px]">
                    <div className="p-6 text-center space-y-4 max-w-sm mx-auto">
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/30">
                            <Lock className="w-8 h-8 text-primary" />
                        </div>
                        <h3 className="text-xl font-bold text-white font-mono uppercase">
                            {title}
                        </h3>
                        <p className="text-gray-400 text-sm">
                            {description}
                        </p>
                        <Button onClick={onUnlock} size="lg" className="w-full animate-pulse">
                            Desbloquear por {price}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
