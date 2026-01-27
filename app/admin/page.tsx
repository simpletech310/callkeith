import { getAdminStats } from "@/app/actions/admin";
import { Icons } from "@/components/ui/Icons";

export default async function AdminDashboard() {
    const stats = await getAdminStats();

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold text-slate-900">Dashboard Overview</h2>
                <p className="text-slate-500">Welcome back to the command center.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title="Total Leads"
                    value={stats.leads}
                    icon={<Icons.users className="w-6 h-6 text-blue-600" />}
                    trend="+12% from last week"
                />
                <StatCard
                    title="Organizations"
                    value={stats.orgs}
                    icon={<Icons.briefcase className="w-6 h-6 text-emerald-600" />}
                    trend="Active Partners"
                />
                <StatCard
                    title="Active Alerts"
                    value={stats.alerts}
                    icon={<Icons.alertCircle className="w-6 h-6 text-amber-600" />}
                    trend="Needs Attention"
                />
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <h3 className="font-semibold text-slate-900">System Activity</h3>
                    <button className="text-xs font-medium text-emerald-600 hover:text-emerald-700">View All</button>
                </div>
                <div className="p-6 text-center text-slate-500 text-sm py-12">
                    No recent system logs available.
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon, trend }: { title: string, value: number, icon: React.ReactNode, trend?: string }) {
    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                    {icon}
                </div>
                {trend && <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-full">{trend}</span>}
            </div>
            <div className="text-3xl font-bold text-slate-900 mb-1">{value}</div>
            <div className="text-sm text-slate-500 font-medium">{title}</div>
        </div>
    )
}
