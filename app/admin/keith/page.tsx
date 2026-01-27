'use client'

import { useState, useRef, useEffect } from 'react'
import { submitKeithTask, getKeithTaskResult } from '@/app/actions/admin'
import { Icons } from '@/components/ui/Icons'
import ResourceManager from './_components/ResourceManager'
import AddResourceModal from './_components/AddResourceModal'

export default function KeithPlayground() {
    const [messages, setMessages] = useState<{ role: 'user' | 'keith', content: string }[]>([
        { role: 'keith', content: "Hi admin! I'm ready to check your organizations. Ask me anything to test my responses." }
    ])
    const [view, setView] = useState<'chat' | 'manage'>('chat')
    const [showAddModal, setShowAddModal] = useState(false)

    // Chat State
    const [input, setInput] = useState('')
    const [isThinking, setIsThinking] = useState(false)
    const endRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = () => endRef.current?.scrollIntoView({ behavior: 'smooth' })
    useEffect(scrollToBottom, [messages])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim() || isThinking) return

        const userMsg = input
        setMessages(prev => [...prev, { role: 'user', content: userMsg }])
        setInput('')
        setIsThinking(true)

        try {
            // Submit Task
            const task = await submitKeithTask(userMsg)

            // Poll for result (Simple polling for MVP)
            const pollInterval = setInterval(async () => {
                const updatedTask = await getKeithTaskResult(task.id)
                if (updatedTask.status === 'completed') {
                    clearInterval(pollInterval)
                    setMessages(prev => [...prev, { role: 'keith', content: updatedTask.result.response }])
                    setIsThinking(false)
                } else if (updatedTask.status === 'failed') {
                    clearInterval(pollInterval)
                    setMessages(prev => [...prev, { role: 'keith', content: "[Error: Task failed in worker.]" }])
                    setIsThinking(false)
                }
            }, 1000)

            // Timeout cleanup 
            setTimeout(() => {
                clearInterval(pollInterval)
                if (isThinking) { // If still thinking after 10s
                    setIsThinking(false)
                    // setMessages(prev => [...prev, { role: 'keith', content: "[Timeout: Worker didn't respond.]" }])
                }
            }, 15000)

        } catch (err) {
            console.error(err)
            setIsThinking(false)
        }
    }

    if (view === 'manage') {
        return <ResourceManager onBack={() => setView('chat')} />
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-140px)]">
            {/* Chat Area */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 flex flex-col overflow-hidden shadow-sm">
                <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="text-sm font-semibold text-slate-700">Keith Voice Agent (Text Mode)</span>
                    </div>
                    <button className="text-xs text-slate-400 hover:text-slate-600">Clear History</button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((m, i) => (
                        <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${m.role === 'user'
                                ? 'bg-slate-900 text-white rounded-tr-none'
                                : 'bg-emerald-50 text-slate-800 border border-emerald-100 rounded-tl-none'
                                }`}>
                                {m.content.split('\n').map((line, j) => (
                                    <p key={j} className="mb-1 last:mb-0">{line}</p>
                                ))}
                            </div>
                        </div>
                    ))}
                    {isThinking && (
                        <div className="flex justify-start">
                            <div className="bg-slate-50 rounded-2xl px-4 py-3 border border-slate-100 flex gap-1">
                                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                            </div>
                        </div>
                    )}
                    <div ref={endRef} />
                </div>

                <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                    <form onSubmit={handleSubmit} className="flex gap-2">
                        <input
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            placeholder="Type a message to test Keith..."
                            className="flex-1 px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm text-slate-900"
                            disabled={isThinking}
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || isThinking}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <Icons.send className="w-4 h-4" />
                        </button>
                    </form>
                </div>
            </div>

            {/* Sidebar / KB Tools */}
            <div className="space-y-6">
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                    <h3 className="font-bold text-slate-900 mb-2">Knowledge Base</h3>
                    <p className="text-xs text-slate-500 mb-4">Quickly add resources to Keith's brain.</p>

                    <button
                        onClick={() => setShowAddModal(true)}
                        className="w-full py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors mb-2"
                    >
                        + Add Resource
                    </button>
                    <button
                        onClick={() => setView('manage')}
                        className="w-full py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors"
                    >
                        Manage Existing Resources
                    </button>
                </div>

                <div className="bg-blue-50 rounded-xl border border-blue-100 p-6">
                    <h3 className="font-bold text-blue-900 mb-2 text-sm">Testing Tips</h3>
                    <ul className="text-xs text-blue-800 space-y-2 list-disc pl-4">
                        <li>Try asking for help with specific needs like "housing" or "legal".</li>
                        <li>Test Keith's probing questions by being vague.</li>
                        <li>Verify that Keith generates leads correctly by accepting an offer.</li>
                    </ul>
                </div>
            </div>

            {showAddModal && (
                <AddResourceModal
                    onClose={() => setShowAddModal(false)}
                    onSuccess={() => setShowAddModal(false)}
                />
            )}
        </div>
    )
}
