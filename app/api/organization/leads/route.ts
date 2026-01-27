import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Service Role Client (Admin) to access auth.users and bypass RLS for aggregation
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
        return NextResponse.json({ error: 'Missing User ID' }, { status: 400 });
    }

    try {
        // 1. Get Resources owned by this user
        const { data: resources } = await supabaseAdmin
            .from('resources')
            .select('id, name')
            .eq('owner_id', userId);

        if (!resources || resources.length === 0) {
            return NextResponse.json([]);
        }

        const resourceIds = resources.map(r => r.id);

        // 2. Fetch Leads for these resources
        const { data: leads } = await supabaseAdmin
            .from('leads')
            .select('*')
            .in('resource_id', resourceIds)
            .order('created_at', { ascending: false });

        if (!leads) return NextResponse.json([]);

        // 3. Manually join/fetch User Details (since we can't simple join auth.users in standard query sometimes)
        // Or we can try the join if it works here, but manual is safer for auth.users
        const userIds = [...new Set(leads.map(l => l.user_id))];

        // Fetch users in a loop or filtered list (admin.listUsers doesn't support IN filter easily)
        // We will fetch individually or just rely on what we can get? 
        // Actually, we can use RPC or just map if the list is small. 
        // For MVP, checking each user is fine or getting all users.

        // Let's attach user data manually
        const enrichedLeads = await Promise.all(leads.map(async (lead) => {
            const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(lead.user_id);
            return {
                ...lead,
                user: user ? {
                    email: user.email,
                    raw_user_meta_data: user.user_metadata
                } : null,
                resource_name: resources.find(r => r.id === lead.resource_id)?.name
            };
        }));

        return NextResponse.json(enrichedLeads);

    } catch (error) {
        console.error("Org Leads Fetch Error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
