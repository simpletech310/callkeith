import React from 'react';
import OrgSidebar from '@/components/OrgSidebar';

export default function OrganizationLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-slate-100">
            <OrgSidebar />
            <main className="md:pl-64 flex flex-col min-h-screen pt-16 pb-20 md:pt-0 md:pb-0 font-sans">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 w-full py-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
