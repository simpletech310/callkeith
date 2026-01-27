import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Icons } from "@/components/ui/Icons";
import { createClient } from "@supabase/supabase-js";

// Server-side Supabase Client (Admin)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function MagicLinkPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    let userData = {
        name: "",
        program: "",
        org: "",
        status: "Loading...",
        active: false,
        bgClasses: "bg-slate-50 border-slate-100",
        textClasses: "text-slate-400",
        icon: <Icons.spinner className="w-6 h-6 text-slate-400 animate-spin" />
    };

    // Attempt to fetch specific Lead
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (id && uuidRegex.test(id) && supabaseServiceKey) {
        // 1. Fetch Lead Details + Resource
        const { data: lead, error } = await supabase
            .from('leads')
            .select(`
                *,
                resource:resource_id (
                    name,
                    category,
                    description
                )
            `)
            .eq('id', id)
            .single();

        if (lead) {
            // 2. Fetch User Details for "Welcome back, Name"
            const { data: userDataResponse } = await supabase.auth.admin.getUserById(lead.user_id);
            if (userDataResponse?.user) {
                userData.name = userDataResponse.user.user_metadata.full_name || "Friend";
            }

            // 3. Populate Display Data
            // 3. Populate Display Data
            userData.program = lead.resource?.category || "General Assistance"; // Category serves as Program Name
            userData.org = lead.resource?.name || "Community Organization"; // Name is the Organization Name

            const status = lead.status || 'submitted';

            // Map internal status to display
            const statusMap: Record<string, string> = {
                'submitted': 'Application Submitted',
                'acknowledged': 'Under Review',
                'accepted': 'Accepted',
                'on_hold': 'Under Review', // Mapped to Under Review
                'cancelled': 'Cancelled',
                'new': 'Application Submitted'
            };

            userData.status = statusMap[status] || 'Application Submitted';

            // Set styles based on status
            if (status === 'accepted') {
                userData.bgClasses = "bg-emerald-50 border-emerald-100";
                userData.textClasses = "text-emerald-900";
                userData.icon = <Icons.checkCircle className="w-6 h-6 text-emerald-600" />;
            } else if (status === 'cancelled') {
                userData.bgClasses = "bg-gray-50 border-gray-100";
                userData.textClasses = "text-gray-900";
                userData.icon = <Icons.close className="w-6 h-6 text-gray-400" />;
            } else if (status === 'on_hold') {
                // Use Under Review styling for on_hold now
                userData.bgClasses = "bg-blue-50 border-blue-100";
                userData.textClasses = "text-blue-900";
                userData.icon = <Icons.dashboard className="w-6 h-6 text-blue-600" />;
            } else {
                userData.bgClasses = "bg-blue-50 border-blue-100";
                userData.textClasses = "text-blue-900";
                userData.icon = <Icons.dashboard className="w-6 h-6 text-blue-600" />;
            }
            userData.active = true;
        }
    }

    return (
        <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-start py-12 px-4 font-sans">
            <div className="w-full max-w-3xl space-y-8">

                {/* Navigation */}
                <div className="w-full flex justify-start">
                    <Link href="/magic/programs" className="text-slate-400 hover:text-slate-600 text-sm font-medium transition-colors flex items-center gap-2">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Applications
                    </Link>
                </div>

                {/* Header / Brand */}
                <div className="flex flex-col items-center space-y-4">
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 relative group">
                        <div className="absolute inset-0 bg-emerald-500/10 rounded-2xl blur-xl" />
                        <Icons.care className="w-10 h-10 text-emerald-600 relative z-10" />
                    </div>
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Onward.ai</h1>
                        <p className="text-slate-500">Resource Application Portal</p>
                    </div>
                </div>

                {/* Main Status Card */}
                <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden">
                    <div className={`p-6 flex items-start gap-4 border-b ${userData.bgClasses}`}>
                        <div className="bg-white/60 p-2 rounded-full backdrop-blur-sm">
                            {userData.icon}
                        </div>
                        <div className="space-y-1">
                            <h2 className={`text-lg font-semibold ${userData.textClasses}`}>{userData.status}</h2>
                            <p className="text-sm opacity-80 leading-relaxed">
                                Welcome back, <strong>{userData.name}</strong>.
                            </p>
                        </div>
                        <div className="ml-auto bg-white/50 backdrop-blur border border-slate-200/50 text-slate-600 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                            Status Update
                        </div>
                    </div>

                    <div className="p-8 space-y-8">
                        {/* Application Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Program</label>
                                <div className="flex items-center gap-3 text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                    <Icons.resources className="w-5 h-5 text-slate-400" />
                                    <span className="font-medium">{userData.program}</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Organization</label>
                                <div className="flex items-center gap-3 text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                    <Icons.users className="w-5 h-5 text-slate-400" />
                                    <span className="font-medium">{userData.org}</span>
                                </div>
                            </div>
                        </div>

                        {/* Simplified Timeline */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                                <Icons.settings className="w-4 h-4 text-slate-400" />
                                Progress Tracker
                            </h3>
                            {/* Simple 3-step visualization */}
                            <div className="relative flex items-center justify-between px-4 pt-4">
                                <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 -z-10 -translate-y-1/2" />

                                {/* Step 1: Submitted */}
                                <div className="flex flex-col items-center gap-2 bg-white px-2">
                                    <div className="w-4 h-4 rounded-full bg-emerald-500 ring-4 ring-emerald-50" />
                                    <span className="text-xs font-medium text-slate-900">Submitted</span>
                                </div>

                                {/* Step 2: Acknowledged */}
                                <div className="flex flex-col items-center gap-2 bg-white px-2">
                                    <div className={`w-4 h-4 rounded-full ring-4 ${['acknowledged', 'accepted', 'on_hold', 'cancelled'].includes(userData.status.toLowerCase().replace(' ', '_')) || userData.status === 'Under Review' ? 'bg-emerald-500 ring-emerald-50' : 'bg-slate-200 ring-white'}`} />
                                    <span className={`text-xs font-medium ${['acknowledged', 'accepted', 'on_hold', 'cancelled'].includes(userData.status.toLowerCase().replace(' ', '_')) || userData.status === 'Under Review' ? 'text-slate-900' : 'text-slate-400'}`}>Acknowledged</span>
                                </div>

                                {/* Step 3: Decision */}
                                <div className="flex flex-col items-center gap-2 bg-white px-2">
                                    <div className={`w-4 h-4 rounded-full ring-4 ${['accepted', 'cancelled'].includes(userData.status.toLowerCase()) ? (userData.status === 'Cancelled' ? 'bg-gray-400 ring-gray-50' : 'bg-emerald-500 ring-emerald-50') : 'bg-slate-200 ring-white'}`} />
                                    <span className={`text-xs font-medium ${['accepted', 'cancelled'].includes(userData.status.toLowerCase()) ? 'text-slate-900' : 'text-slate-400'}`}>Decision</span>
                                </div>
                            </div>
                        </div>

                        {/* ID */}
                        <div className="pt-6 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                            <span>Reference ID: <span className="font-mono text-slate-500">{id}</span></span>
                            <div className="flex items-center gap-2">
                                <Icons.mic className="w-3 h-3" />
                                <span>Recorded via Voice</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Action */}
                <div className="text-center">
                    <button className="text-slate-400 hover:text-slate-600 text-sm font-medium transition-colors flex items-center justify-center gap-2 w-full">
                        <Icons.logout className="w-4 h-4" />
                        Cancel Application
                    </button>
                    <p className="mt-8 text-xs text-slate-300">
                        &copy; 2026 Onward.ai. Secure & Private.
                    </p>
                </div>
            </div>
        </main>
    )
}
