"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, LogOut, FileText, Settings, UserCog } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

export default function OrgSidebar() {
    const pathname = usePathname();
    const supabase = createClient();

    const navigation = [
        { name: "Incoming Leads", href: "/organization/leads", icon: Users },
        { name: "Org Profile", href: "/organization/profile", icon: LayoutDashboard },
    ];

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        window.location.href = "/";
    };

    return (
        <>
            {/* Mobile Header (Brand Only) */}
            <div className="md:hidden flex items-center justify-center h-16 px-4 bg-slate-900 border-b border-slate-800 text-white fixed top-0 left-0 right-0 z-40">
                <span className="text-xl font-bold tracking-tight">
                    Onward <span className="text-emerald-400">Org</span>
                </span>
            </div>

            {/* Mobile Bottom Tab Navigation */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around items-center h-16 z-50 px-2 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                {navigation.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? "text-emerald-600" : "text-slate-400 hover:text-slate-600"
                                }`}
                        >
                            <item.icon className="h-6 w-6" />
                            <span className="text-[10px] font-medium">{item.name}</span>
                        </Link>
                    );
                })}
                <button
                    onClick={handleSignOut}
                    className="flex flex-col items-center justify-center w-full h-full space-y-1 text-slate-400 hover:text-red-500"
                >
                    <LogOut className="h-6 w-6" />
                    <span className="text-[10px] font-medium">Sign Out</span>
                </button>
            </div>

            {/* Desktop Sidebar */}
            <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-50">
                <div className="flex-1 flex flex-col min-h-0 bg-slate-900">
                    <div className="flex items-center h-16 flex-shrink-0 px-4 bg-slate-900 border-b border-slate-800">
                        <span className="text-xl font-bold text-white tracking-tight">
                            Onward <span className="text-emerald-400">Org</span>
                        </span>
                    </div>
                    <div className="flex-1 flex flex-col overflow-y-auto">
                        <nav className="flex-1 px-2 py-4 space-y-1">
                            {navigation.map((item) => {
                                const isActive = pathname === item.href;
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={`
                                            group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors
                                            ${isActive
                                                ? "bg-slate-800 text-white"
                                                : "text-slate-300 hover:bg-slate-800 hover:text-white"}
                                        `}
                                    >
                                        <item.icon
                                            className={`mr-3 flex-shrink-0 h-5 w-5 ${isActive ? "text-emerald-400" : "text-slate-400 group-hover:text-emerald-400"
                                                }`}
                                        />
                                        {item.name}
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>
                    <div className="flex-shrink-0 flex bg-slate-800 p-4">
                        <button
                            onClick={handleSignOut}
                            className="flex-shrink-0 w-full group block"
                        >
                            <div className="flex items-center">
                                <div>
                                    <LogOut className="inline-block h-5 w-5 text-slate-400 group-hover:text-red-400" />
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm font-medium text-slate-300 group-hover:text-white">
                                        Sign Out
                                    </p>
                                </div>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
