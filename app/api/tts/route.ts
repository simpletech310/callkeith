
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const { text } = await req.json();

        if (!text) {
            return NextResponse.json({ error: 'Text is required' }, { status: 400 });
        }

        const apiKey = process.env.DEEPGRAM_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'Missing DEEPGRAM_API_KEY' }, { status: 500 });
        }

        // Deepgram Aura API
        const response = await fetch(`https://api.deepgram.com/v1/speak?model=aura-2-orpheus-en`, {
            method: 'POST',
            headers: {
                'Authorization': `Token ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text }),
        });

        if (!response.ok) {
            const error = await response.text();
            console.error("Deepgram Error:", error);
            return NextResponse.json({ error: "Deepgram TTS Failed", details: error }, { status: 500 });
        }

        const audioBuffer = await response.arrayBuffer();

        // Return Audio
        return new NextResponse(audioBuffer, {
            headers: {
                'Content-Type': 'audio/mp3',
                'Content-Length': audioBuffer.byteLength.toString(),
            },
        });

    } catch (error) {
        console.error("TTS Proxy Error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
