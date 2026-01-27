'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

// Initialize Admin Client (Bypass RLS)
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
)

export async function getAdminStats() {
    const { count: leadsCount } = await supabaseAdmin.from('leads').select('*', { count: 'exact', head: true })
    const { count: orgsCount } = await supabaseAdmin.from('resources').select('*', { count: 'exact', head: true }).not('owner_id', 'is', null)

    // Active Alerts could be leads with status 'new' for now
    const { count: alertsCount } = await supabaseAdmin.from('leads').select('*', { count: 'exact', head: true }).eq('status', 'new')

    return {
        leads: leadsCount || 0,
        orgs: orgsCount || 0,
        alerts: alertsCount || 0
    }
}

export async function getAllOrganizations() {
    // Fetch resources that look like organizations (have an owner_id or just all resources for now)
    const { data, error } = await supabaseAdmin
        .from('resources')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) throw error
    return data
}

export async function createOrganization(formData: FormData) {
    const name = formData.get('name') as string
    const email = formData.get('email') as string
    const category = formData.get('category') as string
    const website = formData.get('website') as string
    const service_area = formData.get('service_area') as string // New Field
    const description = formData.get('description') as string
    const programsRaw = formData.get('programs') as string
    const programs = programsRaw ? JSON.parse(programsRaw) : []
    const secondary_categories_raw = formData.getAll('secondary_categories') as string[]
    const secondary_categories = secondary_categories_raw || []

    // 1. Create Auth User
    // Generate random temp password
    const tempPassword = Math.random().toString(36).slice(-8)

    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
            full_name: name,
            role: 'org_admin'
        }
    })

    if (userError) return { error: userError.message }

    // 2. Create Resource Record linked to this user
    const { error: resourceError } = await supabaseAdmin.from('resources').insert({
        owner_id: userData.user.id,
        name,
        category,
        website,
        description,
        contact_info: { email, website, service_area },
        programs: programs,
        secondary_categories: secondary_categories
    })

    if (resourceError) return { error: resourceError.message }

    revalidatePath('/admin/organizations')
    return { success: true, tempPassword, email }
}

export async function updateOrganization(formData: FormData) {
    const id = formData.get('id') as string
    const name = formData.get('name') as string
    const category = formData.get('category') as string
    const description = formData.get('description') as string
    const programsRaw = formData.get('programs') as string
    const programs = programsRaw ? JSON.parse(programsRaw) : []
    const email = formData.get('email') as string
    const service_area = formData.get('service_area') as string // New Field
    const secondary_categories_raw = formData.getAll('secondary_categories') as string[]
    const secondary_categories = secondary_categories_raw || []

    // Update Resource Record
    const { error } = await supabaseAdmin.from('resources').update({
        name,
        category,
        description,
        contact_info: { email, service_area },
        programs: programs,
        secondary_categories: secondary_categories
    }).eq('id', id)

    if (error) return { error: error.message }


    revalidatePath('/admin/organizations')
    return { success: true }
}

export async function deleteOrganization(id: string) {
    const { error } = await supabaseAdmin.from('resources').delete().eq('id', id)
    if (error) return { error: error.message }

    revalidatePath('/admin/organizations')
    return { success: true }
}

export async function getAllLeads() {
    // 1. Fetch all leads
    const { data: leads, error } = await supabaseAdmin
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) {
        console.error("Fetch leads error:", error)
        return []
    }

    // 2. Enrich with Resource details
    const resourceIds = [...new Set(leads.map(l => l.resource_id))]
    const { data: resources } = await supabaseAdmin
        .from('resources')
        .select('id, name, category')
        .in('id', resourceIds)

    const resourceMap = new Map(resources?.map(r => [r.id, r]) || [])

    // 3. Enrich with User details (if possible via admin API)
    // Note: auth.users is not queryable via .from('users') usually. 
    // We use auth.admin.getUserById() or listUsers() but iterating is slow for many leads.
    // For now, let's just show the user_id or email if we can join via a known view, but manual enrichment is safer.
    // Actually, let's just get the full user list for mapped ID lookups if the list is small enough 
    // or fetch individually for this table page (since standard limit is 50-100).

    // Optimization: Fetch only unique user IDs involved
    const userIds = [...new Set(leads.map(l => l.user_id))]

    // We can't batch get users easily by ID list with auth.admin, but we can listUsers() and filter locally if small count,
    // OR just display the ID for now to prevent errors, 
    // OR try to fetch individually in parallel for this MVP.

    // Better yet: Just attach the resource info and let the user ID stand, or try a direct RPC if we had one.
    // Let's rely on manual resource map and return 'Unknown User' for email if not found, 
    // but let's try to get at least the users for the first page if we were paginating.

    // For MVP speed: Fetch all users (assuming < 1000 for beta) to map
    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 })
    const userMap = new Map(users.map(u => [u.id, u]))

    const enrichedLeads = leads.map(lead => ({
        ...lead,
        resources: resourceMap.get(lead.resource_id) || { name: 'Unknown', category: 'N/A' },
        user: userMap.get(lead.user_id) || { email: 'Unknown User', user_metadata: {} }
    }))

    return enrichedLeads
}

export async function submitKeithTask(message: string) {
    const { data, error } = await supabaseAdmin.from('agent_tasks').insert({
        title: 'Keith Playground Chat',
        assigned_agent: 'Keith',
        status: 'pending',
        payload: { message }
    }).select().single()

    if (error) throw error
    return data
}

export async function getKeithTaskResult(taskId: string) {
    const { data, error } = await supabaseAdmin.from('agent_tasks').select('*').eq('id', taskId).single()
    if (error) throw error
    return data
}

export async function getUsers() {
    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers()
    if (error) throw error
    return users
}

export async function getResourceCategories() {
    // Aggregate categories from resources table
    // Since we don't have a dedicated categories table, we'll fetch all unique categories
    const { data, error } = await supabaseAdmin
        .from('resources')
        .select('category')

    if (error) throw error

    // Count occurrences
    const categories: Record<string, number> = {}
    data?.forEach((row: any) => {
        const cat = row.category || 'Uncategorized'
        categories[cat] = (categories[cat] || 0) + 1
    })

    return Object.entries(categories).map(([name, count]) => ({ name, count }))
}

export async function getOrganizationsByCategory(category: string) {
    const { data, error } = await supabaseAdmin
        .from('resources')
        .select('*')
        .eq('category', category)
        .order('name', { ascending: true })

    if (error) throw error
    return data
}
