
import { cn } from "@/lib/utils"

interface VoiceWaveformProps {
    active?: boolean;
    className?: string;
}

export function VoiceWaveform({ active = false, className }: VoiceWaveformProps) {
    return (
        <div className={cn("flex items-center gap-1 h-12 justify-center", className)}>
            {[1, 2, 3, 4, 5].map((bar) => (
                <div
                    key={bar}
                    className={cn(
                        "w-1.5 bg-emerald-600 rounded-full transition-all duration-300 ease-in-out",
                        active ? "animate-[wave_1s_ease-in-out_infinite]" : "h-1.5 bg-slate-200"
                    )}
                    style={{
                        animationDelay: `${bar * 0.15}s`,
                        height: active ? "100%" : "6px" // Fallback height, animation controls dynamic height
                    }}
                />
            ))}
            <style jsx>{`
                @keyframes wave {
                    0%, 100% { height: 20%; }
                    50% { height: 100%; }
                }
            `}</style>
        </div>
    )
}
