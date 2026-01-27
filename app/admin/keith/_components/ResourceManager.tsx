'use client'

import { useState, useEffect } from 'react'
import { getAllOrganizations } from '@/app/actions/admin'
import { Icons } from '@/components/ui/Icons'
import AddResourceModal from './AddResourceModal'

export default function ResourceManager({ onBack }: { onBack: () => void }) {
    const [organizations, setOrganizations] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [showAddModal, setShowAddModal] = useState(false)
    const [editingResource, setEditingResource] = useState<any>(null)

    const [selectedCategoryForAdd, setSelectedCategoryForAdd] = useState<string | null>(null)

    const PRIMARY_CATEGORIES = [
        'food', 'housing', 'legal', 'health', 'mental health', 'childcare', 'transportation', 'education'
    ]

    useEffect(() => {
        loadData()
    }, [])

    const loadData = () => {
        setLoading(true)
        getAllOrganizations().then(data => {
            setOrganizations(data || [])
            setLoading(false)
        })
    }

    const refreshData = () => {
        loadData()
    }

    // Group organizations
    const groupedOrgs = organizations.reduce((acc: any, org) => {
        const cat = org.category ? org.category.toLowerCase() : 'uncategorized'
        if (!acc[cat]) acc[cat] = []
        acc[cat].push(org)
        return acc
    }, {})

    // Ensure primary categories exist
    PRIMARY_CATEGORIES.forEach(cat => {
        if (!groupedOrgs[cat]) groupedOrgs[cat] = []
    })

    // Sort keys: Primary first, then others alphabetically
    const sortedCategories = Object.keys(groupedOrgs).sort((a, b) => {
        const idxA = PRIMARY_CATEGORIES.indexOf(a)
        const idxB = PRIMARY_CATEGORIES.indexOf(b)
        if (idxA !== -1 && idxB !== -1) return idxA - idxB
        if (idxA !== -1) return -1
        if (idxB !== -1) return 1
        return a.localeCompare(b)
    })

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="text-slate-400 hover:text-slate-600">
                        <Icons.arrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">Resource Manager</h2>
                        <p className="text-sm text-slate-500">Manage Keith's knowledge base categories.</p>
                    </div>
                </div>
                <button
                    onClick={() => {
                        setSelectedCategoryForAdd(null)
                        setShowAddModal(true)
                    }}
                    className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
                >
                    <Icons.plus className="w-4 h-4" />
                    Add Resource
                </button>
            </div>

            <div className="space-y-8">
                {sortedCategories.map((category) => {
                    const orgs = groupedOrgs[category]
                    return (
                        <div key={category} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
                                        {category === 'food' ? <Icons.heartHandshake className="w-4 h-4" /> :
                                            category === 'housing' ? <Icons.building className="w-4 h-4" /> :
                                                category === 'legal' ? <Icons.fileText className="w-4 h-4" /> :
                                                    category === 'health' ? <Icons.activity className="w-4 h-4" /> :
                                                        <Icons.globe className="w-4 h-4" />}
                                    </div>
                                    <div className="flex flex-col">
                                        <h3 className="font-bold text-slate-900 capitalize">{category}</h3>
                                        {/* Optional Description per category could go here if mapped */}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-medium bg-white border border-slate-200 text-slate-600 px-2 py-1 rounded-full">
                                        {orgs.length} Organizations
                                    </span>
                                    <button
                                        onClick={() => {
                                            setSelectedCategoryForAdd(category)
                                            setShowAddModal(true)
                                        }}
                                        className="p-1.5 hover:bg-slate-200 rounded-md text-emerald-600 transition-colors"
                                        title={`Add to ${category}`}
                                    >
                                        <Icons.plus className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {orgs.length === 0 ? (
                                <div className="px-6 py-8 text-center text-slate-400 text-sm">
                                    No organizations in this category yet.
                                    <button
                                        onClick={() => {
                                            setSelectedCategoryForAdd(category)
                                            setShowAddModal(true)
                                        }}
                                        className="ml-2 text-emerald-600 hover:underline font-medium"
                                    >
                                        Add one now
                                    </button>
                                </div>
                            ) : (
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-white border-b border-slate-100 text-slate-500 font-medium">
                                        <tr>
                                            <th className="px-6 py-3 w-1/3">Organization Info</th>
                                            <th className="px-6 py-3 w-1/4">Service Area</th>
                                            <th className="px-6 py-3 w-1/4">Contact</th>
                                            <th className="px-6 py-3 w-1/6 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {orgs.map((org: any) => (
                                            <tr
                                                key={org.id}
                                                onClick={() => setEditingResource(org)}
                                                className="hover:bg-slate-50/50 cursor-pointer transition-colors"
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="font-medium text-slate-900">{org.name}</div>
                                                    <div className="text-xs text-slate-500 mt-1 line-clamp-1">{org.description}</div>
                                                    {org.programs?.length > 0 && (
                                                        <div className="flex flex-wrap gap-1 mt-2">
                                                            {org.programs.map((p: any, i: number) => (
                                                                <span key={i} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                                                                    {p.name}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-slate-600">
                                                    <div className="flex items-center gap-2">
                                                        <Icons.mapPin className="w-3 h-3 text-slate-400" />
                                                        {org.contact_info?.service_area || 'Unspecified'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="space-y-1">
                                                        {org.website && (
                                                            <a
                                                                href={org.website.startsWith('http') ? org.website : `https://${org.website}`}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="flex items-center gap-2 text-blue-600 hover:underline"
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                <Icons.globe className="w-3 h-3" />
                                                                <span className="truncate max-w-[150px]">{org.website.replace(/^https?:\/\//, '')}</span>
                                                            </a>
                                                        )}
                                                        {org.contact_info?.email && (
                                                            <div className="flex items-center gap-2 text-slate-500">
                                                                <Icons.mail className="w-3 h-3" />
                                                                <span className="truncate max-w-[150px]">{org.contact_info.email}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            setEditingResource(org)
                                                        }}
                                                        className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-blue-600 transition-colors"
                                                    >
                                                        <Icons.settings className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )
                })}
            </div>

            {(showAddModal) && (
                <AddResourceModal
                    defaultCategory={selectedCategoryForAdd}
                    onClose={() => {
                        setShowAddModal(false)
                        setSelectedCategoryForAdd(null)
                    }}
                    onSuccess={() => {
                        setShowAddModal(false)
                        setSelectedCategoryForAdd(null)
                        refreshData()
                    }}
                />
            )}

            {editingResource && (
                <AddResourceModal
                    initialData={editingResource}
                    onClose={() => setEditingResource(null)}
                    onSuccess={() => {
                        setEditingResource(null)
                        refreshData()
                    }}
                />
            )}
        </div>
    )
}
