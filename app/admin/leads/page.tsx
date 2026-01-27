import { getAllLeads } from "@/app/actions/admin";
import LeadsClientView from "./_components/LeadsClientView";

export default async function LeadsPage() {
    const leads = await getAllLeads();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-slate-900">Global Leads</h2>
                    <p className="text-sm text-slate-500">View all leads across all organizations.</p>
                </div>
            </div>

            <LeadsClientView initialLeads={leads} />
        </div>
    )
}
