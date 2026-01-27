
import { KeithVoiceAgent } from "@/components/KeithVoiceAgent";
import { Icons } from "@/components/ui/Icons";

export default function KeithPage() {
    return (
        <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-start py-20 px-4">
            <div className="w-full max-w-2xl text-center space-y-4 mb-12">
                <div className="flex items-center justify-center gap-3 mb-6">
                    {/* Logo Placeholder */}
                    <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-emerald-600/20">
                        <Icons.care className="w-6 h-6" />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Onward.ai</h1>
                </div>
                <p className="text-slate-600 text-lg">
                    Connecting you with the resources you need, right now.
                </p>
            </div>

            <div className="absolute top-6 left-6">
                <a href="/" className="text-slate-500 hover:text-slate-700 font-medium text-sm flex items-center gap-2 px-4 py-2 hover:bg-slate-100 rounded-full transition-colors">
                    <Icons.arrowLeft className="w-4 h-4" />
                    Back to Home
                </a>
            </div>

            <div className="absolute top-6 right-6">
                <a href="/login" className="text-emerald-700 hover:text-emerald-800 font-medium text-sm bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100 hover:border-emerald-200 transition-colors flex items-center gap-2">
                    <Icons.users className="w-4 h-4" />
                    Member Sign In
                </a>
            </div>

            <div className="w-full max-w-5xl">
                <KeithVoiceAgent />
            </div>

            <div className="mt-16 text-center text-slate-400 text-sm">
                Powered by Gemini 3 Pro & Deepgram Saga
            </div>
        </main>
    );
}
