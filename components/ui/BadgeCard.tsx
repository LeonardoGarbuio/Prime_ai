"use client";

// Badge type defined locally since history feature was removed
export interface Badge {
    id: string;
    name: string;
    description: string;
    icon: string;
    unlocked: boolean;
    unlockedAt?: string;
}

interface BadgeCardProps {
    badge: Badge;
    size?: "sm" | "md" | "lg";
    showDescription?: boolean;
}

export function BadgeCard({ badge, size = "md", showDescription = true }: BadgeCardProps) {
    const sizeClasses = {
        sm: "w-12 h-12 text-xl",
        md: "w-16 h-16 text-2xl",
        lg: "w-20 h-20 text-3xl"
    };

    const textSizes = {
        sm: "text-xs",
        md: "text-sm",
        lg: "text-base"
    };

    return (
        <div className={`flex flex-col items-center gap-2 ${badge.unlocked ? '' : 'opacity-40 grayscale'}`}>
            <div
                className={`${sizeClasses[size]} rounded-2xl flex items-center justify-center transition-all ${badge.unlocked
                    ? 'bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 shadow-[0_0_20px_rgba(57,255,20,0.15)]'
                    : 'bg-white/5 border border-white/10'
                    }`}
            >
                <span>{badge.icon}</span>
            </div>
            <div className="text-center">
                <p className={`${textSizes[size]} font-bold ${badge.unlocked ? 'text-white' : 'text-gray-500'}`}>
                    {badge.name}
                </p>
                {showDescription && (
                    <p className="text-xs text-gray-500 max-w-[120px]">
                        {badge.unlocked ? badge.description : '???'}
                    </p>
                )}
            </div>
        </div>
    );
}

interface BadgeGridProps {
    badges: Badge[];
    showLocked?: boolean;
}

export function BadgeGrid({ badges, showLocked = true }: BadgeGridProps) {
    const displayBadges = showLocked ? badges : badges.filter(b => b.unlocked);

    return (
        <div className="grid grid-cols-3 md:grid-cols-5 gap-6">
            {displayBadges.map(badge => (
                <BadgeCard key={badge.id} badge={badge} />
            ))}
        </div>
    );
}

interface NewBadgePopupProps {
    badge: Badge;
    onClose: () => void;
}

export function NewBadgePopup({ badge, onClose }: NewBadgePopupProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-black border border-primary/50 rounded-3xl p-8 text-center animate-[scaleIn_0.3s_ease-out] shadow-[0_0_60px_rgba(57,255,20,0.2)]">
                <div className="text-6xl mb-4 animate-bounce">
                    {badge.icon}
                </div>
                <p className="text-primary text-sm font-mono uppercase tracking-wider mb-2">
                    Nova Conquista!
                </p>
                <h3 className="text-2xl font-bold text-white mb-2">{badge.name}</h3>
                <p className="text-gray-400 text-sm mb-6 max-w-[250px]">{badge.description}</p>
                <button
                    onClick={onClose}
                    className="px-6 py-2 bg-primary text-black font-bold rounded-lg hover:bg-primary/90 transition-colors"
                >
                    CONTINUAR
                </button>
            </div>
        </div>
    );
}
