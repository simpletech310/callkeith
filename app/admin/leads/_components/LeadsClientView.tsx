'use client'

import { useState, useMemo } from 'react'
import { Icons } from '@/components/ui/Icons'

export default function LeadsClientView({ initialLeads }: { initialLeads: any[] }) {
    const [searchText, setSearchText] = useState('')
    const [selectedOrg, setSelectedOrg] = useState('all')
    const [selectedCategory, setSelectedCategory] = useState('all')
    const [timeFrame, setTimeFrame] = useState('all')

    // Extract unique values for filters
    const organizations = useMemo(() => {
        const orgs = new Set(initialLeads.map(l => l.resources?.name).filter(Boolean))
        return Array.from(orgs).sort()
    }, [initialLeads])

    const categories = useMemo(() => {
        const cats = new Set(initialLeads.map(l => l.resources?.category).filter(Boolean))
        return Array.from(cats).sort()
    }, [initialLeads])

    // Filter Logic
    const filteredLeads = useMemo(() => {
        return initialLeads.filter(lead => {
            // Text Search
            const searchLower = searchText.toLowerCase()
            const matchesSearch = !searchText ||
                lead.user?.email?.toLowerCase().includes(searchLower) ||
                lead.resources?.name?.toLowerCase().includes(searchLower) ||
                lead.notes?.toLowerCase().includes(searchLower)

            // Org Filter
            const matchesOrg = selectedOrg === 'all' || lead.resources?.name === selectedOrg

            // Category Filter
            const matchesCategory = selectedCategory === 'all' || lead.resources?.category === selectedCategory

            // Time Frame Filter
            let matchesTime = true
            if (timeFrame !== 'all') {
                const leadDate = new Date(lead.created_at)
                const now = new Date()
                const diffTime = Math.abs(now.getTime() - leadDate.getTime())
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

                if (timeFrame === '7d' && diffDays > 7) matchesTime = false
                if (timeFrame === '30d' && diffDays > 30) matchesTime = false
                if (timeFrame === 'month' && (leadDate.getMonth() !== now.getMonth() || leadDate.getFullYear() !== now.getFullYear())) matchesTime = false
            }

            return matchesSearch && matchesOrg && matchesCategory && matchesTime
        })
    }, [initialLeads, searchText, selectedOrg, selectedCategory, timeFrame])

    return (
        <div className="space-y-6">
            {/* Filters Toolbar */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-64">
                    <Icons.search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        placeholder="Search user, org, or notes..."
                        className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900"
                    />
                </div>

                <div className="flex flex-wrap gap-3 w-full md:w-auto">
                    <select
                        value={selectedOrg}
                        onChange={(e) => setSelectedOrg(e.target.value)}
                        className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white text-slate-900"
                    >
                        <option value="all">All Organizations</option>
                        {organizations.map(org => (
                            <option key={org} value={org}>{org}</option>
                        ))}
                    </select>

                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white text-slate-900"
                    >
                        <option value="all">All Categories</option>
                        {categories.map(cat => (
                            <option key={cat} value={cat} className="capitalize">{cat}</option>
                        ))}
                    </select>

                    <select
                        value={timeFrame}
                        onChange={(e) => setTimeFrame(e.target.value)}
                        className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white text-slate-900"
                    >
                        <option value="all">All Time</option>
                        <option value="7d">Last 7 Days</option>
                        <option value="30d">Last 30 Days</option>
                        <option value="month">This Month</option>
                    </select>
                </div>
            </div>

            {/* Filter Stats */}
            <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                <span>Showing {filteredLeads.length} of {initialLeads.length} leads</span>
                {(selectedOrg !== 'all' || selectedCategory !== 'all' || timeFrame !== 'all' || searchText) && (
                    <button
                        onClick={() => {
                            setSearchText('')
                            setSelectedOrg('all')
                            setSelectedCategory('all')
                            setTimeFrame('all')
                        }}
                        className="text-blue-600 hover:underline"
                    >
                        Clear Filters
                    </button>
                )}
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-medium">
                        <tr>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3">Seeker</th>
                            <th className="px-6 py-3">Organization</th>
                            <th className="px-6 py-3">Created</th>
                            <th className="px-6 py-3">Notes</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredLeads.map((lead: any) => (
                            <tr key={lead.id} className="hover:bg-slate-50/50">
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium capitalize 
                                        ${lead.status === 'new' ? 'bg-blue-50 text-blue-700' :
                                            lead.status === 'submitted' ? 'bg-amber-50 text-amber-700' :
                                                'bg-slate-100 text-slate-600'}`}>
                                        {lead.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 font-medium text-slate-900">
                                    {lead.user?.email || lead.user_id}
                                </td>
                                <td className="px-6 py-4 text-slate-600">
                                    <div className="font-medium text-slate-900">{lead.resources?.name || 'Unknown resource'}</div>
                                    <div className="text-xs text-slate-400 capitalize">{lead.resources?.category}</div>
                                </td>
                                <td className="px-6 py-4 text-slate-400 text-xs">
                                    {new Date(lead.created_at).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 text-slate-500 max-w-xs truncate" title={lead.notes}>
                                    {lead.notes || '-'}
                                </td>
                            </tr>
                        ))}
                        {filteredLeads.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                    No leads found matching your filters.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
