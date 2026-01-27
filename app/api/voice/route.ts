
import { AccessToken } from 'livekit-server-sdk';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    const room = req.nextUrl.searchParams.get('room') || 'onward-default-room';
    const username = req.nextUrl.searchParams.get('username') || 'guest';

    const metadata = req.nextUrl.searchParams.get('metadata') || '{}';
    console.log(" API /voice: Received Metadata =", metadata);

    if (!process.env.LIVEKIT_API_KEY || !process.env.LIVEKIT_API_SECRET) {
        return NextResponse.json(
            { error: 'Server misconfigured' },
            { status: 500 }
        );
    }

    const at = new AccessToken(
        process.env.LIVEKIT_API_KEY,
        process.env.LIVEKIT_API_SECRET,
        {
            identity: username,
            metadata: metadata, // Pass generic JSON metadata
        }
    );

    at.addGrant({ roomJoin: true, room: room });

    return NextResponse.json({ token: await at.toJwt() });
}
