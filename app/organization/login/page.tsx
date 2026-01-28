"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Icons } from "@/components/ui/Icons";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function OrganizationLoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            const supabase = createClient();

            // Password Login for Organizations
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) throw error;

            // Redirect to Org Portal
            router.push("/organization/leads");

        } catch (err: any) {
            console.error("Org Login Error:", err);
            setError(err.message || "Authentication failed");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-emerald-50 to-transparent pointer-events-none" />

            <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8 relative z-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Brand */}
                <div className="flex flex-col items-center gap-4">
                    <div className="bg-emerald-50/50 p-4 rounded-full ring-1 ring-emerald-100/50 shadow-sm">
                        <Icons.building className="w-8 h-8 text-emerald-600" />
                    </div>
                    <div className="text-center space-y-1">
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Partner Portal</h1>
                        <p className="text-sm text-slate-500">Log in to manage your organization's resources</p>
                    </div>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 ml-1">Work Email</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@organization.org"
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-400"
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between ml-1">
                                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Password</label>
                            </div>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••"
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-400"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                            <Icons.warning className="w-4 h-4 shrink-0" />
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold py-3.5 rounded-lg transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <Icons.spinner className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                Sign In
                                <Icons.arrowRight className="w-4 h-4" />
                            </>
                        )}
                    </button>

                    <div className="pt-4 border-t border-slate-100 flex flex-col items-center gap-4">
                        <a href="mailto:resource@callkeith.ai" className="text-sm font-medium text-emerald-600 hover:text-emerald-700 hover:underline transition-colors">
                            Want to become a resource? Email us
                        </a>

                        <Link href="/" className="text-xs text-slate-400 hover:text-slate-600 transition-colors inline-flex items-center gap-1 group">
                            Back to Home
                        </Link>
                    </div>
                </form>
            </div>
            <p className="mt-8 text-center text-xs text-slate-400 max-w-sm mx-auto">
                &copy; {new Date().getFullYear()} Onward.ai. Secure Access.
            </p>
        </main>
    );
}
