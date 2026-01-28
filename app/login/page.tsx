"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Icons } from "@/components/ui/Icons";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [mode, setMode] = useState<'magic' | 'password'>('magic');
    const [isLoading, setIsLoading] = useState(false);
    const [isSent, setIsSent] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            const supabase = createClient();

            if (mode === 'magic') {
                const { error } = await supabase.auth.signInWithOtp({
                    email,
                    options: {
                        emailRedirectTo: `${window.location.origin}/auth/callback?next=/magic/programs`,
                    },
                });

                if (error) throw error;
                setIsSent(true);
            } else {
                // Password/PIN Login
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password
                });

                if (error) throw error;

                // Redirect on success
                router.push("/magic/programs");
            }

        } catch (err: any) {
            console.error("Login Error:", err);
            setError(err.message || "Authentication failed");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-emerald-50 to-transparent pointer-events-none" />

            <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8 relative z-10 space-y-8">
                {/* Brand */}
                <div className="flex flex-col items-center gap-4">
                    <div className="bg-emerald-50 p-3 rounded-2xl">
                        <Icons.care className="w-10 h-10 text-emerald-600" />
                    </div>
                    <div className="text-center space-y-1">
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Onward.ai</h1>
                        <p className="text-slate-500">Sign in to access your applications</p>
                    </div>
                </div>

                {isSent ? (
                    <div className="bg-emerald-50 rounded-2xl p-6 text-center space-y-4 animate-in fade-in slide-in-from-bottom-4">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm text-emerald-600">
                            <Icons.check className="w-6 h-6" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="font-semibold text-emerald-900">Check your email</h3>
                            <p className="text-sm text-emerald-800/70">
                                We sent a magic link to <span className="font-medium">{email}</span>. Click it to sign in instantly.
                            </p>
                        </div>
                        <button
                            onClick={() => setIsSent(false)}
                            className="text-xs text-emerald-600 hover:text-emerald-700 font-medium mt-4"
                        >
                            Try a different email
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 ml-1">Email Address</label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="name@example.com"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-400"
                                />
                            </div>

                            {mode === 'password' && (
                                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                    <label className="text-sm font-medium text-slate-700 ml-1">PIN / Password</label>
                                    <input
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-400"
                                    />
                                </div>
                            )}
                        </div>

                        {error && (
                            <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm flex items-center gap-2">
                                <Icons.warning className="w-4 h-4 shrink-0" />
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/30 active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <Icons.spinner className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    {mode === 'magic' ? 'Send Magic Link' : 'Sign In'}
                                    <Icons.arrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>

                        <div className="text-center flex flex-col gap-4">
                            <button
                                type="button"
                                onClick={() => setMode(mode === 'magic' ? 'password' : 'magic')}
                                className="text-sm text-slate-500 hover:text-emerald-600 transition-colors"
                            >
                                {mode === 'magic' ? 'Use PIN / Password instead' : 'Use Magic Link instead'}
                            </button>

                            {mode === 'magic' && (
                                <p className="text-xs text-slate-400 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                    <span className="font-semibold text-slate-600">What is a Magic Link?</span>
                                    <br />
                                    We'll email you a secure link. Click it to log in instantly—no password required.
                                </p>
                            )}

                            <Link href="/" className="text-sm text-slate-400 hover:text-slate-600 transition-colors inline-flex items-center justify-center gap-1 group">
                                <Icons.arrowLeft className="w-3 h-3 transition-transform group-hover:-translate-x-1" /> Back to Home
                            </Link>
                        </div>
                    </form>
                )}

                <p className="text-center text-xs text-slate-400">
                    &copy; 2026 Onward.ai. By signing in, you agree to our Terms.
                </p>
            </div>
        </main>
    );
}
