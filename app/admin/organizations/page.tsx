'use client'

import { useState, useEffect, useTransition } from 'react'
import { createOrganization, getAllOrganizations, deleteOrganization } from '@/app/actions/admin'
import { Icons } from '@/components/ui/Icons'
import AddResourceModal from '../keith/_components/AddResourceModal'

export default function OrganizationsPage() {
    const [isPending, startTransition] = useTransition()
    const [showModal, setShowModal] = useState(false)
    const [orgs, setOrgs] = useState<any[]>([])
    const [editingOrg, setEditingOrg] = useState<any>(null)

    const fetchOrgs = () => {
        getAllOrganizations().then(setOrgs)
    }

    // Simple fetch on mount
    useEffect(() => {
        fetchOrgs()
    }, [])

    const handleEdit = (org: any) => {
        setEditingOrg(org)
        setShowModal(true)
    }

    const handleNew = () => {
        setEditingOrg(null)
        setShowModal(true)
    }

    const handleClose = () => {
        setShowModal(false)
        setEditingOrg(null)
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-slate-900">Organizations</h2>
                    <p className="text-sm text-slate-500">Manage partner organizations and their credentials.</p>
                </div>
                <button
                    onClick={handleNew}
                    className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
                >
                    <Icons.plus className="w-4 h-4" />
                    New Organization
                </button>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-medium">
                        <tr>
                            <th className="px-6 py-3">Name</th>
                            <th className="px-6 py-3">Category</th>
                            <th className="px-6 py-3">Owner/Email</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {orgs.map((org) => (
                            <tr key={org.id} className="hover:bg-slate-50/50">
                                <td className="px-6 py-4 font-medium text-slate-900">{org.name}</td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col gap-1 items-start">
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 border border-emerald-200">
                                            {org.category}
                                        </span>
                                        {org.secondary_categories?.length > 0 && (
                                            <div className="flex flex-wrap gap-1">
                                                {org.secondary_categories.map((sc: string) => (
                                                    <span key={sc} className="text-[10px] text-slate-500 px-1.5 py-0.5 bg-slate-100 rounded border border-slate-200 capitalize">
                                                        {sc}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-slate-500">
                                    {org.contact_info?.email || 'N/A'}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={() => handleEdit(org)}
                                            className="text-slate-400 hover:text-emerald-600 transition-colors p-2 hover:bg-emerald-50 rounded-lg"
                                            title="Edit Details"
                                        >
                                            <Icons.settings className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={async () => {
                                                if (confirm('Are you sure you want to delete this organization?')) {
                                                    await deleteOrganization(org.id)
                                                    fetchOrgs()
                                                }
                                            }}
                                            className="text-slate-400 hover:text-red-600 transition-colors p-2 hover:bg-red-50 rounded-lg"
                                            title="Delete Organization"
                                        >
                                            <Icons.trash className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {orgs.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                                    No organizations found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <AddResourceModal
                    onClose={handleClose}
                    onSuccess={() => {
                        handleClose()
                        fetchOrgs()
                    }}
                    initialData={editingOrg}
                    defaultCategory="food"
                />
            )}
        </div>
    )
}
