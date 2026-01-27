"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Loader2, Mail, Phone, CheckCircle, XCircle, Clock, Filter } from 'lucide-react';
import { format } from 'date-fns';

export default function OrganizationLeads() {
    const supabase = createClient();
    const [loading, setLoading] = useState(true);
    const [leads, setLeads] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState('incoming');

    useEffect(() => {
        fetchLeads();
    }, []);

    const fetchLeads = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
            try {
                const res = await fetch(`/api/organization/leads?userId=${user.id}`);
                const data = await res.json();
                if (Array.isArray(data)) {
                    setLeads(data);
                }
            } catch (err) {
                console.error("Failed to fetch leads:", err);
            }
        }
        setLoading(false);
    };

    const updateStatus = async (leadId: string, newStatus: string) => {
        // Optimistic update
        setLeads(leads.map(lead => lead.id === leadId ? { ...lead, status: newStatus } : lead));

        const { error } = await supabase
            .from('leads')
            .update({ status: newStatus })
            .eq('id', leadId);

        if (error) {
            console.error('Failed to update status', error);
            alert('Failed to update status');
            fetchLeads(); // Revert
        }
    };

    const filteredLeads = leads.filter(lead => {
        if (activeTab === 'incoming') return ['submitted', 'acknowledged'].includes(lead.status);
        if (activeTab === 'accepted') return ['accepted', 'enrolled'].includes(lead.status);
        if (activeTab === 'on_hold') return lead.status === 'on_hold';
        if (activeTab === 'closed') return ['cancelled', 'closed'].includes(lead.status);
        return true; // 'all'
    });

    const getTabCount = (tab: string) => {
        return leads.filter(lead => {
            if (tab === 'incoming') return ['submitted', 'acknowledged'].includes(lead.status);
            if (tab === 'accepted') return ['accepted', 'enrolled'].includes(lead.status);
            if (tab === 'on_hold') return lead.status === 'on_hold';
            if (tab === 'closed') return ['cancelled', 'closed'].includes(lead.status);
            return true;
        }).length;
    };

    if (loading) return <div className="p-8"><Loader2 className="animate-spin text-emerald-600" /> Loading leads...</div>;

    return (
        <div className="space-y-6 max-w-5xl">
            {/* Header & Tabs Container */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="p-6 pb-0 border-b border-slate-100">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">
                                Leads Dashboard
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Manage and track incoming applications.
                            </p>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex space-x-1 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
                        {[
                            { id: 'incoming', name: 'Incoming' },
                            { id: 'accepted', name: 'Accepted' },
                            { id: 'on_hold', name: 'On Hold' },
                            { id: 'closed', name: 'Closed' },
                            { id: 'all', name: 'All Leads' },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                                    whitespace-nowrap px-4 py-3 font-medium text-sm transition-all border-b-2
                                    ${activeTab === tab.id
                                        ? 'border-emerald-500 text-emerald-700 bg-emerald-50/50'
                                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}
                                `}
                            >
                                <span className="flex items-center gap-2">
                                    {tab.name}
                                    <span className={`py-0.5 px-2 rounded-full text-[10px] font-bold ${activeTab === tab.id
                                            ? 'bg-emerald-100 text-emerald-700'
                                            : 'bg-slate-100 text-slate-500'
                                        }`}>
                                        {getTabCount(tab.id)}
                                    </span>
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Leads List */}
            <div className="space-y-4">
                {filteredLeads.map((lead) => {
                    const metadata = lead.user?.raw_user_meta_data || {};
                    const displayName = metadata.full_name || metadata.name ||
                        (metadata.first_name ? `${metadata.first_name} ${metadata.last_name || ''}` : null) ||
                        lead.user?.email || 'Anonymous User';

                    return (
                        <div key={lead.id} className="bg-white rounded-lg shadow-sm border border-slate-200 hover:border-emerald-200 hover:shadow-md transition-all duration-200 group">
                            <div className="p-5">
                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">

                                    {/* Left: User Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-base font-semibold text-slate-900 truncate">
                                                {displayName}
                                            </h3>
                                            <StatusBadge status={lead.status} />
                                        </div>

                                        <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-500 mb-3">
                                            {lead.user?.email && (
                                                <div className="flex items-center gap-1.5">
                                                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                                                    {lead.user.email}
                                                </div>
                                            )}
                                            {metadata.phone && (
                                                <div className="flex items-center gap-1.5">
                                                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                                                    {formatPhoneNumber(metadata.phone)}
                                                </div>
                                            )}
                                            <div className="flex items-center gap-1.5">
                                                <Clock className="h-3.5 w-3.5 text-slate-400" />
                                                {format(new Date(lead.created_at), 'MMM d, h:mm a')}
                                            </div>
                                        </div>

                                        {/* Intake Summary */}
                                        <div className="bg-slate-50 rounded p-3 border border-slate-100/80">
                                            <div className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1 flex items-center justify-between">
                                                <span>Intake Summary</span>
                                                <span className="text-emerald-600 font-medium normal-case bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                                                    For: {lead.resource_name || 'General Inquiry'}
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-800 leading-relaxed">
                                                {lead.notes || 'No specific notes recorded.'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Right: Actions */}
                                    <div className="flex md:flex-col items-center md:items-end gap-2 pt-2 md:pt-0 border-t md:border-t-0 md:border-l border-slate-100 md:pl-4 mt-2 md:mt-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                        {lead.status === 'submitted' && (
                                            <button
                                                onClick={() => updateStatus(lead.id, 'acknowledged')}
                                                className="w-full md:w-auto px-3 py-1.5 text-xs font-medium text-yellow-700 bg-yellow-50 hover:bg-yellow-100 border border-yellow-200 rounded transition-colors text-center"
                                            >
                                                Acknowledge
                                            </button>
                                        )}
                                        {['submitted', 'acknowledged', 'on_hold'].includes(lead.status) && (
                                            <>
                                                <button
                                                    onClick={() => updateStatus(lead.id, 'accepted')}
                                                    className="w-full md:w-auto px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm rounded transition-colors text-center flex items-center justify-center gap-1"
                                                >
                                                    <CheckCircle className="w-3.5 h-3.5" /> Accept
                                                </button>
                                                {lead.status !== 'on_hold' && (
                                                    <button
                                                        onClick={() => updateStatus(lead.id, 'on_hold')}
                                                        className="w-full md:w-auto px-3 py-1.5 text-xs font-medium text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded transition-colors text-center"
                                                    >
                                                        Hold
                                                    </button>
                                                )}
                                            </>
                                        )}
                                        {lead.status !== 'cancelled' && (
                                            <button
                                                onClick={() => updateStatus(lead.id, 'cancelled')}
                                                className="w-full md:w-auto px-3 py-1.5 text-xs font-medium text-slate-500 bg-white hover:text-red-600 hover:bg-red-50 border border-slate-200 hover:border-red-100 rounded transition-colors text-center"
                                            >
                                                Cancel
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {filteredLeads.length === 0 && (
                <div className="text-center py-16 bg-white rounded-lg border border-dashed border-slate-200">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-50 mb-3">
                        <Filter className="h-5 w-5 text-slate-400" />
                    </div>
                    <h3 className="text-sm font-medium text-slate-900">No {activeTab.replace('_', ' ')} leads found</h3>
                    <p className="mt-1 text-sm text-slate-500">
                        Check back later or try a different filter.
                    </p>
                </div>
            )}
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const styles = {
        submitted: 'bg-blue-50 text-blue-700 border-blue-100',
        acknowledged: 'bg-yellow-50 text-yellow-700 border-yellow-100',
        accepted: 'bg-emerald-50 text-emerald-700 border-emerald-100',
        on_hold: 'bg-orange-50 text-orange-700 border-orange-100',
        cancelled: 'bg-slate-50 text-slate-600 border-slate-100',
        enrolled: 'bg-purple-50 text-purple-700 border-purple-100',
        closed: 'bg-slate-50 text-slate-600 border-slate-100'
    };

    const icons = {
        submitted: Clock,
        acknowledged: Mail,
        accepted: CheckCircle,
        on_hold: Clock,
        cancelled: XCircle,
        enrolled: CheckCircle,
        closed: XCircle
    };

    const Icon = icons[status as keyof typeof icons] || Clock;
    const style = styles[status as keyof typeof styles] || styles.submitted;

    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${style} capitalize`}>
            <Icon className="h-3 w-3 mr-1" />
            {status.replace('_', ' ')}
        </span>
    );
}

function formatPhoneNumber(phone: string) {
    const cleaned = ('' + phone).replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
        return '(' + match[1] + ') ' + match[2] + '-' + match[3];
    }
    return phone;
}
