import Link from "next/link";
import { Icons } from "@/components/ui/Icons";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen bg-slate-50">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-900 text-white flex-shrink-0">
                <div className="p-6 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-emerald-500 rounded flex items-center justify-center text-slate-900">
                            <Icons.briefcase className="w-5 h-5" />
                        </div>
                        <span className="font-bold text-lg tracking-tight">Onward Admin</span>
                    </div>
                </div>

                <nav className="p-4 space-y-1">
                    <NavLink href="/admin" icon={<Icons.home className="w-4 h-4" />}>Dashboard</NavLink>
                    <div className="pt-4 pb-2 px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Management</div>
                    <NavLink href="/admin/organizations" icon={<Icons.briefcase className="w-4 h-4" />}>Organizations</NavLink>
                    <NavLink href="/admin/leads" icon={<Icons.users className="w-4 h-4" />}>Leads</NavLink>
                    <NavLink href="/admin/users" icon={<Icons.settings className="w-4 h-4" />}>Users & Roles</NavLink>

                    <div className="pt-4 pb-2 px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">AI Tools</div>
                    <NavLink href="/admin/keith" icon={<Icons.mic className="w-4 h-4 text-emerald-400" />}>Keith Playground</NavLink>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between">
                    <h1 className="font-semibold text-slate-800">Superadmin Portal</h1>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-slate-500">superadmin@simpletech.com</span>
                        <a href="/" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">Exit</a>
                    </div>
                </header>
                <div className="p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}

function NavLink({ href, children, icon }: { href: string; children: React.ReactNode; icon: React.ReactNode }) {
    return (
        <Link href={href} className="flex items-center gap-3 px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-md transition-colors text-sm font-medium">
            {icon}
            {children}
        </Link>
    )
}
