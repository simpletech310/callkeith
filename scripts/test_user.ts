
import { Room, RoomEvent, RemoteParticipant, DataPacket_Kind } from 'livekit-client';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Polyfills
import 'ws';
global.WebSocket = require('ws');
global.fetch = require('cross-fetch');
// @ts-ignore
global.navigator = { userAgent: 'Node.js', product: 'ReactNative', mediaDevices: { getUserMedia: () => Promise.resolve(null), enumerateDevices: () => Promise.resolve([]) } } as any;
// @ts-ignore
global.window = { setTimeout: setTimeout, clearTimeout: clearTimeout, WebSocket: global.WebSocket, navigator: global.navigator, addEventListener: () => { }, removeEventListener: () => { } } as any;

const LIVEKIT_URL = process.env.NEXT_PUBLIC_LIVEKIT_URL || "";
const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY || "";
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET || "";

const roomName = 'health-help-01';
const clientName = 'Test-User-Mom';

const room = new Room();

async function runClient() {
    console.log(`👤 TEST USER: Connecting to ${roomName}...`);

    try {
        await room.connect(LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
            identity: clientName,
            name: "Concerned Mother",
            autoSubscribe: true,
        });
        console.log("✅ User Connected.");

        room.on(RoomEvent.DataReceived, (payload, participant) => {
            const decoder = new TextDecoder();
            const text = decoder.decode(payload);
            console.log(`\n💬 KEITH SAYS: "${text}"\n`);

            // Auto-respond for the "Agreement" phase if asked
            if (text.includes("Would you like to connect")) {
                setTimeout(() => {
                    sendMessage("Yes, please send me the info.");
                }, 2000);
            }
        });

        // Wait a moment for connection to stabilize then send first message
        setTimeout(() => {
            sendMessage("Hi, I need housing for me and my young child.");
        }, 2000);

    } catch (error) {
        console.error("❌ Client Error:", error);
    }
}

async function sendMessage(text: string) {
    console.log(`🗣️ YOU SAY: "${text}"`);
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    await room.localParticipant.publishData(data, DataPacket_Kind.RELIABLE);
}

runClient();
// Keep alive
setInterval(() => { }, 1000);
