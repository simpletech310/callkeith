'use client'

import { useState, useTransition } from 'react'
import { createOrganization, updateOrganization } from '@/app/actions/admin'
import { Icons } from '@/components/ui/Icons'

interface Program {
    name: string
    description: string
}

export default function AddResourceModal({
    onClose,
    onSuccess,
    initialData,
    defaultCategory // New Prop
}: {
    onClose: () => void,
    onSuccess: () => void,
    initialData?: any,
    defaultCategory?: string | null
}) {
    const [isPending, startTransition] = useTransition()
    const [useCustomCategory, setUseCustomCategory] = useState(false)
    const [secondaryCats, setSecondaryCats] = useState<string[]>(initialData?.secondary_categories || [])

    const CATEGORY_OPTIONS = [
        'food', 'housing', 'legal', 'health', 'mental health',
        'transportation', 'childcare', 'education', 'employment', 'other'
    ]

    const handleToggleSecondary = (cat: string) => {
        if (secondaryCats.includes(cat)) {
            setSecondaryCats(secondaryCats.filter(c => c !== cat))
        } else {
            if (secondaryCats.length >= 2) return // Max 2
            setSecondaryCats([...secondaryCats, cat])
        }
    }

    // Programs State
    const [programs, setPrograms] = useState<Program[]>(initialData?.programs || [])
    const [newProgName, setNewProgName] = useState('')
    const [newProgDesc, setNewProgDesc] = useState('')

    const handleAddProgram = () => {
        if (!newProgName || !newProgDesc) return
        setPrograms([...programs, { name: newProgName, description: newProgDesc }])
        setNewProgName('')
        setNewProgDesc('')
    }

    const removeProgram = (index: number) => {
        setPrograms(programs.filter((_, i) => i !== index))
    }

    const isEditing = !!initialData

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[100]">
            <div className="bg-white w-full max-w-2xl rounded-xl p-6 shadow-2xl animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-lg text-slate-900">{isEditing ? 'Edit Resource' : 'Add New Resource'}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <Icons.x className="w-5 h-5" />
                    </button>
                </div>

                <form action={(formData) => {
                    startTransition(async () => {
                        // If custom category is used, override the select value
                        if (useCustomCategory && customCategory) {
                            formData.set('category', customCategory.toLowerCase())
                        }

                        // Attach Programs
                        formData.set('programs', JSON.stringify(programs))

                        // Attach Secondary Categories using duplicate keys
                        formData.delete('secondary_categories') // Clear if exists
                        secondaryCats.forEach(cat => formData.append('secondary_categories', cat))

                        let res;
                        if (isEditing) {
                            formData.set('id', initialData.id)
                            res = await updateOrganization(formData)
                        } else {
                            res = await createOrganization(formData)
                        }

                        if (res.error) {
                            alert(res.error)
                        } else {
                            alert(isEditing ? 'Resource Updated!' : `Resource Created! Keith now knows about this.`)
                            onSuccess()
                        }
                    })
                }} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">Organization Name</label>
                            <input
                                name="name"
                                defaultValue={initialData?.name}
                                required
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                placeholder="e.g. Gotham Legal Aid"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">Resource Category</label>
                            {!useCustomCategory ? (
                                <div className="flex gap-2">
                                    <select
                                        name="category"
                                        defaultValue={initialData?.category || defaultCategory || 'food'}
                                        className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    >
                                        {CATEGORY_OPTIONS.map(cat => (
                                            <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                                        ))}
                                    </select>
                                    <button
                                        type="button"
                                        onClick={() => setUseCustomCategory(true)}
                                        className="px-3 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium hover:bg-slate-200"
                                    >
                                        + New
                                    </button>
                                </div>
                            ) : (
                                <div className="flex gap-2">
                                    <input
                                        value={customCategory}
                                        onChange={(e) => setCustomCategory(e.target.value)}
                                        className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        placeholder="Enter new category..."
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => { setUseCustomCategory(false); setCustomCategory('') }}
                                        className="px-3 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium hover:bg-slate-200"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Secondary Categories Section */}
                    <div>
                        <label className="block text-xs font-medium text-slate-700 mb-2">
                            Secondary Categories <span className="text-slate-400 font-normal">(Select up to 2)</span>
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {CATEGORY_OPTIONS.map(cat => {
                                const isSelected = secondaryCats.includes(cat)
                                const isDisabled = !isSelected && secondaryCats.length >= 2
                                return (
                                    <button
                                        key={cat}
                                        type="button"
                                        disabled={isDisabled}
                                        onClick={() => handleToggleSecondary(cat)}
                                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${isSelected
                                                ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                                : isDisabled
                                                    ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'
                                                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                                            }`}
                                    >
                                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                                        {isSelected && <Icons.check className="inline w-3 h-3 ml-1" />}
                                    </button>
                                )
                            })}
                        </div>
                    </div>


                    <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Description (Important for Keith)</label>
                        <textarea
                            name="description"
                            defaultValue={initialData?.description}
                            required
                            rows={2}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            placeholder="Describe what services this organization provides..."
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Contact Email</label>
                        <input
                            name="email"
                            type="email"
                            defaultValue={initialData?.contact_info?.email || initialData?.email} // Fallback
                            required
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            placeholder="contact@org.com"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Service Area & Location</label>
                        <input
                            name="service_area"
                            defaultValue={initialData?.contact_info?.service_area}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            placeholder="e.g. Santa Monica, CA or 'Global'"
                        />
                    </div>

                    {/* Programs Section */}
                    <div className="pt-4 border-t border-slate-100">
                        <label className="block text-sm font-bold text-slate-900 mb-3">Programs & Services</label>

                        <div className="space-y-3 mb-4">
                            {programs.map((prog, idx) => (
                                <div key={idx} className="flex gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100 items-start">
                                    <div className="flex-1">
                                        <div className="font-semibold text-sm text-slate-900">{prog.name}</div>
                                        <div className="text-xs text-slate-600">{prog.description}</div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeProgram(idx)}
                                        className="text-slate-400 hover:text-red-500"
                                    >
                                        <Icons.x className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            {programs.length === 0 && <div className="text-xs text-slate-400 italic">No programs added yet.</div>}
                        </div>

                        <div className="flex gap-2 items-start bg-slate-50 p-3 rounded-lg border border-slate-200/60">
                            <div className="flex-1 space-y-2">
                                <input
                                    value={newProgName}
                                    onChange={e => setNewProgName(e.target.value)}
                                    className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded text-slate-900 placeholder:text-slate-400"
                                    placeholder="Program Name (e.g. Senior Lunch)"
                                />
                                <input
                                    value={newProgDesc}
                                    onChange={e => setNewProgDesc(e.target.value)}
                                    className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded text-slate-900 placeholder:text-slate-400"
                                    placeholder="Short description for Keith..."
                                />
                            </div>
                            <button
                                type="button"
                                onClick={handleAddProgram}
                                className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-xs font-medium"
                            >
                                Add Program
                            </button>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900">Cancel</button>
                        <button disabled={isPending} type="submit" className="px-4 py-2 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50">
                            {isPending ? 'Saving...' : (isEditing ? 'Save Changes' : 'Add Resource')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
