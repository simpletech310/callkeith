
// lib/keith/workers.ts

export interface KeithWorker {
    id: string;
    name: string;
    systemPrompt: string;
    languageCode: string; // e.g., 'en-US', 'es-MX'
}

export const WORKERS: Record<string, KeithWorker> = {
    ENGLISH: {
        id: "keith-en-01",
        name: "Keith (English)",
        languageCode: "en-US",
        systemPrompt: `You are KEITH (Kindness Efficiency Intelligent Triage Helper).
    TONE: Calm, unhurried, empathetic.
    GOAL: Resource referral.
    identity: "I am a helpful neighbor."
    If Spanish is detected, transfer to 'keith-es-01'.`
    },
    SPANISH: {
        id: "keith-es-01",
        name: "Keith (Español)",
        languageCode: "es-MX",
        systemPrompt: `Eres KEITH (Asistente de Triaje Inteligente).
    TONO: Calmado, empático, paciente.
    META: Referencia de recursos humanitarios.
    IDENTIDAD: "Soy un vecino servicial."
    Si detectas Inglés, transfiere a 'keith-en-01'.`
    }
};

export function getWorkerByLang(lang: 'en' | 'es'): KeithWorker {
    return lang === 'es' ? WORKERS.SPANISH : WORKERS.ENGLISH;
}
