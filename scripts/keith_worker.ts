import { Room, RoomEvent, RemoteParticipant, DataPacket_Kind } from 'livekit-client';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Polyfills for Node.js environment
import 'ws';
import * as crypto from 'crypto';

global.WebSocket = require('ws');
global.fetch = require('cross-fetch');

// Extensive Polyfills for LiveKit Client
// @ts-ignore
global.navigator = {
    userAgent: 'Node.js',
    product: 'ReactNative', // Bypass some browser checks
    mediaDevices: {
        getUserMedia: () => Promise.resolve(null),
        enumerateDevices: () => Promise.resolve([]),
    }
} as any;

// @ts-ignore
global.window = {
    setTimeout: setTimeout,
    clearTimeout: clearTimeout,
    setInterval: setInterval,
    clearInterval: clearInterval,
    WebSocket: global.WebSocket,
    navigator: global.navigator,
    location: { protocol: 'http:', hostname: 'localhost', port: '3000' },
    addEventListener: () => { },
    removeEventListener: () => { },
} as any;

// @ts-ignore
global.document = {
    addEventListener: () => { },
    removeEventListener: () => { },
} as any;

// Configuration
const LIVEKIT_URL = process.env.NEXT_PUBLIC_LIVEKIT_URL || "";
const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY || "";
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET || "";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""; // Should really be Service Role for data access

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const roomName = 'health-help-01'; // Default test room
const agentName = 'KEITH-AI';

console.log("🤖 KEITH AGENT: Initializing...");

const room = new Room();

async function startAgent() {
    try {
        // 1. Connect to Room
        await room.connect(LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
            identity: agentName,
            name: "KEITH (AI Case Manager)",
            autoSubscribe: true,
        });
        console.log(`✅ Connected to room: ${room.name}`);

        // 2. Listen for Events
        room.on(RoomEvent.DataReceived, handleDataMessage);
        room.on(RoomEvent.ParticipantConnected, (p) => {
            console.log(`👤 User Connected: ${p.identity}`);
            sendMessage(`Hello! I'm KEITH. How can I help you move onward today?`);
        });

    } catch (error) {
        console.error("❌ Failed to connect agent:", error);
    }
}

// 3. Conversation Logic
interface ConversationState {
    step: 'DISCOVERY' | 'SUGGESTION' | 'AGREEMENT' | 'MAGIC_LINK';
    needs: string;
}

let state: ConversationState = {
    step: 'DISCOVERY',
    needs: ''
};

async function handleDataMessage(payload: Uint8Array, participant?: RemoteParticipant) {
    const decoder = new TextDecoder();
    const message = decoder.decode(payload);
    console.log(`📩 Received: "${message}" from ${participant?.identity}`);

    // Simple State Machine for MVP flow
    let response = "";

    // Global Reset Command
    if (message.toLowerCase().includes('reset') || message.toLowerCase().includes('start over')) {
        state.step = 'DISCOVERY';
        sendMessage("Okay, let's start over. What kind of support are you looking for today?");
        return;
    }

    switch (state.step) {
        case 'DISCOVERY':
            state.needs = message;
            response = `I hear that you're looking for help with "${message}". I'm checking our resources...`;
            state.step = 'SUGGESTION';

            // Trigger RAG Search asynchronously
            setTimeout(async () => {
                const resources = await performRagSearch(message);
                if (resources.length > 0) {
                    const topMatch = resources[0];
                    sendMessage(`I found a great resource: ${topMatch.name}. They help with ${topMatch.category}. Would you like to connect with them?`);
                    state.step = 'AGREEMENT';
                } else {
                    sendMessage("I couldn't find a perfect match, but I can connect you with a general case worker. Would that help?");
                    state.step = 'AGREEMENT';
                }
            }, 2000);
            break;

        case 'SUGGESTION':
            // Handled by async RAG, but if user interrupts:
            response = "One moment, I'm just looking that up.";
            break;

        case 'AGREEMENT':
            if (message.toLowerCase().includes('yes') || message.toLowerCase().includes('sure') || message.toLowerCase().includes('ok')) {
                response = "Great. I'm generating a secure Magic Link for you now. You'll receive it via SMS shortly, which will let you track this referral.";
                state.step = 'MAGIC_LINK';

                // Mock Magic Link Action with distinct log for verification
                console.log(`🔗 [MAGIC_LINK_ACTION] Generating link for user to access: ${state.needs}`);
                console.log(`🔗 [MAGIC_LINK_SENT] Sent to +1 (555) 010-9999`);

            } else {
                response = "I understand. Is there something else you're looking for?";
                state.step = 'DISCOVERY';
            }
            break;

        case 'MAGIC_LINK':
            response = "I've sent that text. Is there anything else I can help with?";
            state.step = 'DISCOVERY'; // Reset
            break;
    }

    if (response) {
        sendMessage(response);
    }
}

async function performRagSearch(query: string) {
    console.log(`🔍 RAG Search for: ${query}`);

    // Naive keyword extraction: remove common stop words
    const stopWords = ['i', 'need', 'want', 'looking', 'for', 'help', 'with', 'a', 'the', 'in', 'to', 'is', 'are'];
    const keywords = query.toLowerCase().split(' ').filter(w => !stopWords.includes(w));
    const searchTerm = keywords.length > 0 ? keywords[0] : query; // Fallback to first significant word

    console.log(`🔎 Filtered Search Term: ${searchTerm}`);

    const { data, error } = await supabase
        .from('resources')
        .select('*')
        .ilike('description', `%${searchTerm}%`)
        .limit(1);

    if (error) console.error("RAG Error:", error);
    return data || [];
}

async function sendMessage(text: string) {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    await room.localParticipant.publishData(data, DataPacket_Kind.RELIABLE);
    console.log(`📤 Sent: "${text}"`);
}

startAgent();
