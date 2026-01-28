'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Loader2, Plus, Trash2, Globe, Check, X } from 'lucide-react';
import { Icons } from '@/components/ui/Icons';

export default function OrganizationProfile() {
    const supabase = createClient();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [scraping, setScraping] = useState(false);
    const [orgData, setOrgData] = useState<any>(null);

    // Categories State
    const [category, setCategory] = useState('food');
    const [secondaryCats, setSecondaryCats] = useState<string[]>([]);
    const [useCustomCategory, setUseCustomCategory] = useState(false);
    const [customCategory, setCustomCategory] = useState('');

    const CATEGORY_OPTIONS = [
        'food', 'housing', 'legal', 'health', 'mental health',
        'transportation', 'childcare', 'education', 'employment', 'other'
    ];

    // Programs State
    const [programs, setPrograms] = useState<any[]>([]);
    const [newProgName, setNewProgName] = useState('');
    const [newProgDesc, setNewProgDesc] = useState('');

    useEffect(() => {
        fetchOrgData();
    }, []);

    const fetchOrgData = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
            const { data, error } = await supabase
                .from('resources')
                .select('*')
                .eq('owner_id', user.id)
                .single();

            if (data) {
                setOrgData(data);
                setPrograms(data.programs || []);
                setCategory(data.category || 'food');
                setSecondaryCats(data.secondary_categories || []);
            }
        }
        setLoading(false);
    };

    const handleScrape = async () => {
        if (!orgData?.scrape_url) return;
        setScraping(true);
        try {
            const res = await fetch('/api/scrape', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: orgData.scrape_url }),
            });

            const scraped = await res.json();
            if (scraped.error) throw new Error(scraped.error);

            setOrgData((prev: any) => ({
                ...prev,
                description: scraped.description || prev.description,
                website: orgData.scrape_url, // Assume scrape URL is website
            }));

            alert('Info scraped successfully! Review changes before saving.');
        } catch (e: any) {
            alert('Scrape failed: ' + e.message);
        } finally {
            setScraping(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            let finalCategory = category;
            if (useCustomCategory && customCategory) {
                finalCategory = customCategory.toLowerCase();
            }

            // Update resource with new fields
            const { error } = await supabase
                .from('resources')
                .update({
                    name: orgData.name,
                    description: orgData.description,
                    category: finalCategory,
                    secondary_categories: secondaryCats,
                    application_process: orgData.application_process,
                    scrape_url: orgData.scrape_url,
                    website: orgData.website,
                    programs: programs,
                    contact_info: orgData.contact_info,
                    location: orgData.location,
                })
                .eq('id', orgData.id);

            if (error) throw error;
            alert('Saved successfully!');
        } catch (e: any) {
            alert('Save failed: ' + e.message);
        } finally {
            setSaving(false);
        }
    };

    // Category Handlers
    const handleToggleSecondary = (cat: string) => {
        if (secondaryCats.includes(cat)) {
            setSecondaryCats(secondaryCats.filter(c => c !== cat));
        } else {
            if (secondaryCats.length >= 2) return; // Max 2
            setSecondaryCats([...secondaryCats, cat]);
        }
    };

    // Program Handlers
    const handleAddProgram = () => {
        if (!newProgName || !newProgDesc) return;
        setPrograms([...programs, { name: newProgName, description: newProgDesc }]);
        setNewProgName('');
        setNewProgDesc('');
    };

    const removeProgram = (index: number) => {
        setPrograms(programs.filter((_, i) => i !== index));
    };

    if (loading) return <div className="p-8"><Loader2 className="animate-spin" /> Loading...</div>;
    if (!orgData) return <div className="p-8">No organization found linked to your account.</div>;

    return (
        <div className="space-y-6 max-w-5xl">
            {/* Header Section */}
            <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-start justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">Organization Profile</h3>
                        <p className="text-sm text-slate-500 mt-1">
                            This information helps Keith match you with the right people.
                        </p>
                    </div>
                </div>

                {/* Scrape Input */}
                <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-100">
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Import from Website</label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={orgData.scrape_url || ''}
                            onChange={(e) => setOrgData({ ...orgData, scrape_url: e.target.value })}
                            className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            placeholder="https://example.org"
                        />
                        <button
                            onClick={handleScrape}
                            disabled={scraping || !orgData.scrape_url}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors"
                        >
                            {scraping ? <Loader2 className="animate-spin h-4 w-4" /> : <Globe className="h-4 w-4" />}
                            Scrape
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Form */}
            <div className="bg-white shadow rounded-lg p-6 space-y-8">

                {/* Basic Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Organization Name</label>
                        <input
                            type="text"
                            value={orgData.name || ''}
                            onChange={(e) => setOrgData({ ...orgData, name: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Primary Category</label>
                        {!useCustomCategory ? (
                            <div className="flex gap-2">
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
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
                                    placeholder="Enter category..."
                                />
                                <button
                                    type="button"
                                    onClick={() => { setUseCustomCategory(false); setCustomCategory(''); }}
                                    className="px-3 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium hover:bg-slate-200"
                                >
                                    Cancel
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Secondary Categories */}
                <div>
                    <label className="block text-xs font-medium text-slate-700 mb-2">
                        Secondary Categories <span className="text-slate-400 font-normal">(Select up to 2)</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {CATEGORY_OPTIONS.map(cat => {
                            const isSelected = secondaryCats.includes(cat);
                            const isDisabled = !isSelected && secondaryCats.length >= 2;
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
                                    {isSelected && <Check className="inline w-3 h-3 ml-1" />}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Descriptions */}
                <div className="space-y-6">
                    <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Description (Important for Keith)</label>
                        <textarea
                            rows={3}
                            value={orgData.description || ''}
                            onChange={(e) => setOrgData({ ...orgData, description: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            placeholder="Describe what services this organization provides..."
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Application process / Considerations</label>
                        <textarea
                            rows={2}
                            value={orgData.application_process || ''}
                            onChange={(e) => setOrgData({ ...orgData, application_process: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            placeholder="E.g. Walk-ins welcome M-F, need ID, etc."
                        />
                    </div>
                </div>

                {/* Programs Section */}
                <div className="pt-4 border-t border-slate-100">
                    <label className="block text-sm font-bold text-slate-900 mb-3">Programs & Services</label>

                    <div className="space-y-3 mb-4">
                        {programs.map((prog, idx) => (
                            <div key={idx} className="flex gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100 items-start group">
                                <div className="flex-1">
                                    <div className="font-semibold text-sm text-slate-900">{prog.name || prog.title}</div>
                                    <div className="text-xs text-slate-600">{prog.description || prog.details}</div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeProgram(idx)}
                                    className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X className="w-4 h-4" />
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
                                className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                placeholder="Program Name (e.g. Senior Lunch)"
                            />
                            <input
                                value={newProgDesc}
                                onChange={e => setNewProgDesc(e.target.value)}
                                className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
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

                {/* Save Button */}
                <div className="flex justify-end pt-4">
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving}
                        className="px-6 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 shadow-sm disabled:opacity-50 transition-all active:scale-95"
                    >
                        {saving ? <Loader2 className="inline w-4 h-4 animate-spin mr-2" /> : null}
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>

            </div>
        </div>
    );
}
