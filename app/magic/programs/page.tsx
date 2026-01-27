"use client";

import { useEffect, useState } from "react";
import { Icons } from "@/components/ui/Icons";
import Link from 'next/link';
import { KeithVoiceAgent } from "@/components/KeithVoiceAgent";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";

interface ProgramApp {
    name: string;
    org: string;
    status: string;
    id: string; // usually same as user id for magic link in this MVP
}

export default function ProgramsPage() {
    const [showAgent, setShowAgent] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [programs, setPrograms] = useState<ProgramApp[]>([]);
    const [loading, setLoading] = useState(true);

    const supabase = createClient();

    useEffect(() => {
        async function fetchUser() {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUser(user);

                // Fetch real leads from DB
                const { data: leads } = await supabase
                    .from('leads')
                    .select(`
                        id,
                        status,
                        created_at,
                        resource:resource_id (
                            name,
                            category
                        )
                    `)
                    .eq('user_id', user.id)
                    .neq('status', 'closed')
                    .neq('status', 'cancelled')
                    .order('created_at', { ascending: false });

                const programList: ProgramApp[] = [];

                if (leads && leads.length > 0) {
                    leads.forEach((lead: any) => {
                        // Map DB lead to UI model
                        // Note: lead.resource is an array or object depending on query, usually object with single() but here multiple
                        // Typescript might complain about the join shape so we cast or handle simply

                        const resourceName = lead.resource?.name || "Unknown Resource";
                        const category = lead.resource?.category || "General";

                        // Status Map
                        const statusMap: Record<string, string> = {
                            'submitted': 'Submitted',
                            'acknowledged': 'Under Review',
                            'accepted': 'Accepted',
                            'on_hold': 'Under Review', // Mapped to Under Review per user request to remove Action Required
                            'new': 'Submitted'
                        };

                        programList.push({
                            name: resourceName,
                            org: category,
                            status: statusMap[lead.status] || 'Active',
                            id: lead.id // Use Lead ID for unique application details
                        });
                    });
                    // Using Lead ID allows /magic/[lead_id] to show specific application details
                    // However, the [id] page ALREADY fetches 'latest lead'.
                    // So linking multiple programs to the SAME page will result in them all showing the LATEST status.
                    // This is a limitation. 
                    // For now, let's just populate the list.
                }
                setPrograms(programList);
            }
            setLoading(false);
        }
        fetchUser();
    }, [supabase]);

    return (
        <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-start py-12 px-4 font-sans relative">
            <div className="w-full max-w-3xl space-y-8">

                {/* Header / Brand */}
                <div className="flex flex-col items-center space-y-4">
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 relative group">
                        <div className="absolute inset-0 bg-emerald-500/10 rounded-2xl blur-xl" />
                        <Icons.care className="w-10 h-10 text-emerald-600 relative z-10" />
                    </div>
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Onward.ai</h1>
                        <p className="text-slate-500">My Applications</p>
                    </div>
                </div>

                {/* Programs List */}
                <div className="space-y-4">
                    {loading ? (
                        <div className="flex justify-center p-8">
                            <Icons.spinner className="w-6 h-6 animate-spin text-slate-400" />
                        </div>
                    ) : programs.length > 0 ? (
                        programs.map((app, idx) => (
                            <Link key={idx} href={`/magic/${app.id}`} className="block group">
                                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 hover:border-emerald-500/50 hover:shadow-md transition-all p-6 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-emerald-100 p-3 rounded-xl group-hover:bg-emerald-200 transition-colors">
                                            <Icons.resources className="w-6 h-6 text-emerald-700" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-semibold text-slate-900">{app.name}</h3>
                                                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">{app.status}</span>
                                            </div>
                                            <p className="text-sm text-slate-500">{app.org}</p>
                                        </div>
                                    </div>
                                    <div className="text-slate-300 group-hover:text-emerald-500 transition-colors">
                                        <Icons.arrowRight className="w-5 h-5" />
                                    </div>
                                </div>
                            </Link>
                        ))
                    ) : (
                        <div className="text-center p-8 bg-white rounded-2xl border border-dashed border-slate-200 text-slate-500">
                            No active applications found. Talk to Keith to get started.
                        </div>
                    )}


                </div>

                {/* Footer Action */}
                <div className="text-center">
                    <button
                        onClick={() => supabase.auth.signOut().then(() => window.location.href = '/login')}
                        className="text-slate-400 hover:text-slate-600 text-sm font-medium transition-colors flex items-center justify-center gap-2 w-full"
                    >
                        <Icons.logout className="w-4 h-4" />
                        Sign Out
                    </button>
                    <p className="mt-8 text-xs text-slate-300">
                        &copy; 2026 Onward.ai. Secure & Private.
                    </p>
                </div>
            </div>

            {/* Talk to Keith FAB */}
            <button
                onClick={() => setShowAgent(true)}
                className="fixed bottom-6 right-6 bg-emerald-600 hover:bg-emerald-700 text-white p-4 rounded-full shadow-lg shadow-emerald-500/30 transition-all hover:scale-105 active:scale-95 z-20 flex items-center gap-2 font-medium pr-6"
            >
                <Icons.mic className="w-6 h-6" />
                Talk to Keith
            </button>

            {/* Agent Modal */}
            {showAgent && (
                <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-200">
                        {/* Close Button */}
                        <button
                            onClick={() => setShowAgent(false)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 z-10 p-2 bg-slate-100 rounded-full transition-colors"
                        >
                            <Icons.close className="w-4 h-4" />
                        </button>

                        <div className="p-1">
                            {/* Pass User Context to Keith */}
                            <KeithVoiceAgent userContext={user ? {
                                name: user.user_metadata?.full_name || "Friend",
                                email: user.email,
                                phone: user.user_metadata?.phone,
                                id: user.id,
                                programs: programs.map(p => `${p.name} at ${p.org}`)
                            } : undefined} />
                        </div>
                    </div>
                </div>
            )}
        </main>
    )
}
