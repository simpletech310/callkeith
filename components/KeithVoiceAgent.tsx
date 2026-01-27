
"use client"

import {
    LiveKitRoom,
    RoomAudioRenderer,
    VoiceAssistantControlBar,
    AgentState,
    DisconnectButton,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { useEffect, useState, useRef } from "react";
import { VoiceWaveform } from "./ui/VoiceWaveform";
import { cn } from "@/lib/utils";
import { Icons } from "./ui/Icons";

interface KeithVoiceAgentProps {
    userContext?: {
        name: string;
        email: string;
        phone: string;
        id: string;
        programs?: string[];
    }
}

export function KeithVoiceAgent({ userContext }: KeithVoiceAgentProps) {
    const [token, setToken] = useState("");
    const [url, setUrl] = useState("");
    const [hasStarted, setHasStarted] = useState(false);
    const [isInitializing, setIsInitializing] = useState(false);

    const handleStart = async () => {
        setIsInitializing(true);
        try {
            // Encode user context if available
            let query = "room=health-help-01";
            console.log(" KeithVoiceAgent: userContext =", userContext);

            if (userContext) {
                const metadata = JSON.stringify(userContext);
                query += `&username=${encodeURIComponent(userContext.name)}&metadata=${encodeURIComponent(metadata)}`;
            } else {
                query += "&username=Guest";
            }

            const resp = await fetch(`/api/voice?${query}`);
            const data = await resp.json();
            setToken(data.token);
            setUrl(process.env.NEXT_PUBLIC_LIVEKIT_URL || "");
            setHasStarted(true);
        } catch (e) {
            console.error(e);
        } finally {
            setIsInitializing(false);
        }
    };

    if (!hasStarted) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[500px] w-full bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-sm p-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-6 relative group">
                    <div className="absolute inset-0 bg-emerald-500/10 rounded-full blur-xl group-hover:bg-emerald-500/20 transition-all duration-500" />
                    <Icons.mic className="w-12 h-12 text-emerald-500 relative z-10" />
                </div>

                <h2 className="text-xl font-semibold text-slate-900 mb-2">Speak with KEITH</h2>
                <p className="text-slate-500 text-center max-w-xs mb-8">
                    Start a voice conversation to find local resources for food, housing, and legal aid.
                </p>

                <button
                    onClick={handleStart}
                    disabled={isInitializing}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-full font-medium transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isInitializing ? (
                        <>
                            <Icons.spinner className="w-5 h-5 animate-spin" />
                            Connecting...
                        </>
                    ) : (
                        <>
                            Start Conversation
                        </>
                    )}
                </button>
            </div>
        );
    }

    return (
        <LiveKitRoom
            video={false}
            audio={true}
            token={token}
            serverUrl={url}
            connect={true}
            className="flex flex-col items-center justify-center min-h-[500px] w-full bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-sm"
        >
            <div className="flex flex-col items-center gap-6 p-8 z-10 w-full max-w-md">
                {/* Agent Visualizer */}
                <div className="relative group">
                    <div className="absolute inset-0 bg-emerald-500/10 rounded-full blur-xl group-hover:bg-emerald-500/20 transition-all duration-500" />
                    <div className="relative bg-white p-6 rounded-2xl shadow-lg border border-slate-100">
                        <VoiceWaveform active={true} className="w-32 h-16" />
                    </div>

                    {/* Floating Status Badge */}
                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-slate-900/90 text-white text-xs font-medium px-3 py-1 rounded-full backdrop-blur-sm border border-slate-700/50 flex items-center gap-1.5 shadow-xl">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400/80 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        KEITH is listening
                    </div>
                </div>

                {/* Conversation Tips */}
                <div className="text-center space-y-2 max-w-sm">
                    <h3 className="text-slate-900 font-semibold mb-1">How can I help you move onward?</h3>
                    <p className="text-sm text-slate-500">
                        "I need food assistance in Compton." <br />
                        "Where can I find legal aid?"
                    </p>
                </div>

                {/* Simple Chat Interface (Data Channel) */}
                <ChatInterface />
            </div>

            <RoomAudioRenderer />

            {/* Control Bar Override Removed */}
            <div className="mt-8 flex items-center gap-4">
                {/*  Keeping Logout/Disconnect but removing bar */}
                <DisconnectButton>
                    <div className="bg-red-50 hover:bg-red-100 text-red-600 p-2 rounded-full transition-colors flex items-center gap-2 px-4 shadow-sm border border-red-100">
                        <Icons.logout className="w-4 h-4" />
                        <span className="text-sm font-medium">End Session</span>
                    </div>
                </DisconnectButton>
            </div>
        </LiveKitRoom>
    );
}

import { useChat } from "@livekit/components-react";

function ChatInterface() {
    const { send, chatMessages, isSending } = useChat();
    const [input, setInput] = useState("");
    const [isThinking, setIsThinking] = useState(false);
    const [isCallActive, setIsCallActive] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const recognitionRef = useRef<any>(null); // SpeechRecognition
    const lastReadIndexRef = useRef<number>(-1);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [chatMessages, isThinking]);

    // Clear thinking state when new message arrives from Agent
    useEffect(() => {
        const lastMsg = chatMessages[chatMessages.length - 1];
        if (lastMsg) {
            const isAgent = lastMsg.from?.identity !== "Me" && lastMsg.from?.identity !== "Guest";
            if (isAgent) {
                setIsThinking(false);

                // Speak if in Call Mode AND it's a new message
                if (isCallActive && chatMessages.length - 1 > lastReadIndexRef.current) {
                    lastReadIndexRef.current = chatMessages.length - 1;
                    speak(lastMsg.message || "");
                }
            }
        }
    }, [chatMessages, isCallActive]);

    // Speech Recognition Setup
    useEffect(() => {
        if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
            const SpeechRecognition = (window as any).webkitSpeechRecognition;
            const recognition = new SpeechRecognition();
            recognition.continuous = false; // Stop after one sentence to send
            recognition.interimResults = false;
            recognition.lang = 'en-US';

            recognition.onstart = () => setIsListening(true);
            recognition.onend = () => setIsListening(false);
            recognition.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                if (transcript) {
                    handleVoiceSend(transcript);
                }
            };

            recognitionRef.current = recognition;
        }
    }, []);

    const handleVoiceSend = async (text: string) => {
        setIsThinking(true);
        await send(text);
        // Recognition stops automatically. We might restart it after agent speaks? 
        // For simple flow: User taps 'Speak' or we rely on them tapping again.
    };

    // Mobile Audio Unlock: Plays a silent buffer to wake up the audio engine on iOS/Android
    const playSilentAudio = () => {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const buffer = audioCtx.createBuffer(1, 1, 22050);
        const source = audioCtx.createBufferSource();
        source.buffer = buffer;
        source.connect(audioCtx.destination);
        source.start(0);
        // Clean up
        setTimeout(() => audioCtx.close(), 100);
    };

    const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

    const toggleCall = () => {
        if (!isCallActive) {
            playSilentAudio(); // <--- UNLOCK AUDIO CONTEXT
            setIsCallActive(true);
            setTimeout(() => startListening(), 500); // Small delay to allow UI to settle
            // Ensure any previous audio is stopped
            if (audioElement) {
                audioElement.pause();
                setAudioElement(null);
            }
        } else {
            setIsCallActive(false);
            if (audioElement) {
                audioElement.pause();
                setAudioElement(null);
            }
            if (recognitionRef.current) recognitionRef.current.stop();
        }
    };

    const startListening = () => {
        // Interruption: If speaking, stop it.
        if (audioElement) {
            audioElement.pause();
            setAudioElement(null);
        }
        window.speechSynthesis.cancel();

        if (recognitionRef.current && !isListening) {
            try { recognitionRef.current.start(); } catch (e) { }
        }
    };

    const speak = async (text: string) => {
        // Stop any current audio
        if (audioElement) {
            audioElement.pause();
            setAudioElement(null);
        }
        window.speechSynthesis.cancel();

        // Remove markdown links: [Link Text](url) -> "Link Text"
        let cleanText = text.replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1");

        // Remove raw URLs: https://... -> ""
        cleanText = cleanText.replace(/(https?:\/\/[^\s]+)/g, "");

        // Remove special chars like *
        cleanText = cleanText.replace(/[\*\_]/g, "");

        if (!cleanText.trim()) {
            // If empty text, just start listening again
            if (isCallActive) startListening();
            return;
        }

        try {
            const response = await fetch('/api/tts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: cleanText }),
            });

            if (!response.ok) throw new Error("TTS Failed");

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const audio = new Audio(url);

            setAudioElement(audio);

            audio.onended = () => {
                if (isCallActive) {
                    startListening();
                }
                URL.revokeObjectURL(url);
                setAudioElement(null);
            };

            await audio.play();

        } catch (error) {
            console.error("TTS Playback Error:", error);
            // Fallback to Browser TTS if Deepgram fails
            const utterance = new SpeechSynthesisUtterance(cleanText);
            utterance.onend = () => { if (isCallActive) startListening(); };
            window.speechSynthesis.speak(utterance);
        }
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim()) {
            setIsThinking(true);
            await send(input);
            setInput("");
        }
    };

    // If Call is Active, show Call UI
    if (isCallActive) {
        return (
            <div className="w-full h-[450px] flex flex-col items-center justify-between p-8 bg-gradient-to-br from-emerald-900 to-slate-900 rounded-2xl text-white relative overflow-hidden animate-in fade-in duration-300">
                {/* Background Pulse */}
                {isListening && <div className="absolute inset-0 bg-emerald-500/10 animate-pulse" />}

                {/* Header */}
                <div className="text-center space-y-2 z-10">
                    <h3 className="text-lg font-semibold tracking-wide">KEITH AI</h3>
                    <div className="flex items-center justify-center gap-2 text-emerald-300/80 text-xs uppercase tracking-wider font-bold">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        Live Call
                    </div>
                </div>

                {/* Avatar / Visualizer */}
                <div className="relative z-10">
                    <div className={cn(
                        "w-32 h-32 rounded-full flex items-center justify-center border-4 transition-all duration-500",
                        isListening ? "border-emerald-400 shadow-[0_0_40px_rgba(52,211,153,0.4)] scale-110" :
                            isThinking ? "border-white/20 animate-pulse" : "border-white/10"
                    )}>
                        <Icons.mic className={cn("w-12 h-12 transition-colors", isListening ? "text-emerald-400" : "text-white/50")} />
                    </div>
                    {/* Ripple effects */}
                    {isListening && (
                        <>
                            <div className="absolute inset-0 rounded-full border border-emerald-500/30 animate-ping [animation-duration:2s]" />
                            <div className="absolute inset-0 rounded-full border border-emerald-500/20 animate-ping [animation-duration:2s] [animation-delay:0.5s]" />
                        </>
                    )}
                </div>

                {/* Status Text */}
                <div className="h-8 text-center z-10">
                    {isListening ? (
                        <p className="text-emerald-300 font-medium">Listening...</p>
                    ) : isThinking ? (
                        <p className="text-slate-400 animate-pulse">Thinking...</p>
                    ) : (
                        <p className="text-slate-500 text-sm">Tap mic to speak</p>
                    )}
                </div>

                {/* Controls */}
                <div className="flex items-center gap-6 z-10">
                    <button
                        onClick={startListening}
                        disabled={isThinking || isListening}
                        className={cn(
                            "p-4 rounded-full transition-all shadow-lg",
                            isListening ? "bg-emerald-500/20 text-emerald-400" : "bg-white text-emerald-900 hover:scale-105 active:scale-95"
                        )}
                    >
                        <Icons.mic className="w-6 h-6" />
                    </button>
                    <button
                        onClick={toggleCall}
                        className="p-4 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-all shadow-lg hover:scale-105 active:scale-95 border border-red-500/50"
                    >
                        <Icons.close className="w-6 h-6" />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full mt-4 flex flex-col gap-4">
            <div
                ref={scrollRef}
                className="h-[350px] overflow-y-auto bg-slate-100/50 rounded-2xl p-4 border border-slate-200 text-sm space-y-4 scroll-smooth"
            >
                {/* Empty State */}
                {chatMessages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-2 opacity-60">
                        <Icons.chat className="w-8 h-8 scale-x-[-1]" />
                        <p className="text-xs italic">Start the conversation...</p>
                    </div>
                )}

                {/* Messages */}
                {chatMessages.map((msg) => {
                    const isMe = !msg.from || msg.from.identity === "Me" || msg.from.identity === "Guest";
                    const isAgent = msg.from?.identity?.includes("KEITH");

                    return (
                        <div key={msg.timestamp} className={cn("flex w-full", isAgent ? "justify-start" : "justify-end")}>
                            <div className={cn(
                                "max-w-[85%] p-3 rounded-2xl shadow-sm text-sm relative leading-relaxed",
                                isAgent
                                    ? "bg-white text-slate-800 border border-slate-100 rounded-tl-sm"
                                    : "bg-emerald-600 text-white rounded-tr-sm"
                            )}>
                                {isAgent && <span className="text-[10px] font-bold text-emerald-600 block mb-1 uppercase tracking-wider">KEITH</span>}
                                {(() => {
                                    // 1. Split by Markdown Links: [Label](Url)
                                    const mdLinkRegex = /(\[[^\]]+\]\([^\)]+\))/g;
                                    const mdParts = msg.message?.split(mdLinkRegex) || [];

                                    return mdParts.map((part, i) => {
                                        // Check if this part is a Markdown Link
                                        const mdMatch = part.match(/^\[([^\]]+)\]\(([^\)]+)\)$/);
                                        if (mdMatch) {
                                            const label = mdMatch[1];
                                            const url = mdMatch[2];
                                            return (
                                                <a key={i} href={url} target="_blank" rel="noopener noreferrer" className={cn("underline font-medium hover:opacity-80", isAgent ? "text-emerald-600" : "text-white")}>
                                                    {label}
                                                </a>
                                            );
                                        }

                                        // Fallback: Check for raw URLs in the remaining text
                                        const urlRegex = /(https?:\/\/[^\s]+)/g;
                                        const textParts = part.split(urlRegex);
                                        return textParts.map((subPart, j) =>
                                            subPart.match(urlRegex) ? (
                                                <a key={`${i}-${j}`} href={subPart} target="_blank" rel="noopener noreferrer" className={cn("underline font-medium hover:opacity-80", isAgent ? "text-emerald-600" : "text-white")}>
                                                    {subPart}
                                                </a>
                                            ) : subPart
                                        );
                                    });
                                })()}
                            </div>
                        </div>
                    );
                })}

                {/* Typing Indicator */}
                {(isThinking || isSending) && (
                    <div className="flex w-full justify-start">
                        <div className="bg-white text-slate-400 border border-slate-100 p-3 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-1.5 w-fit">
                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                        </div>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} className="flex gap-2 relative">
                <input
                    className="flex-1 bg-white border border-slate-300 rounded-full pl-5 pr-12 py-3 text-sm focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all text-slate-900 placeholder:text-slate-400 shadow-sm"
                    placeholder="Type or speak..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={isThinking}
                />

                {/* Switch to Call Mode Button */}
                <button
                    type="button"
                    onClick={toggleCall}
                    className="absolute right-12 top-1.5 text-slate-400 hover:text-emerald-600 p-2 transition-colors"
                    title="Switch to Voice Call"
                >
                    <Icons.mic className="w-4 h-4" />
                </button>

                <button
                    type="submit"
                    disabled={!input.trim() || isThinking}
                    className="absolute right-1.5 top-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white p-2 rounded-full transition-all shadow-sm"
                >
                    {isThinking ? <Icons.spinner className="w-4 h-4 animate-spin" /> : <Icons.chat className="w-4 h-4" />}
                </button>
            </form>
        </div>
    )
}



