
import asyncio
import os
from livekit import rtc, api
from dotenv import load_dotenv

load_dotenv('.env.local')

LIVEKIT_URL = os.getenv("NEXT_PUBLIC_LIVEKIT_URL")
LIVEKIT_API_KEY = os.getenv("LIVEKIT_API_KEY")
LIVEKIT_API_SECRET = os.getenv("LIVEKIT_API_SECRET")

ROOM_NAME = 'health-help-01'
CLIENT_IDENTITY = 'Test-User-Mom-Py'

async def main():
    print(f"👤 TEST USER (Python): Connecting to {ROOM_NAME}...")
    
    # Generate Token
    grant = api.VideoGrants(room_join=True, room=ROOM_NAME)
    token = api.AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET) \
        .with_grants(grant) \
        .with_identity(CLIENT_IDENTITY) \
        .with_name("Concerned Mother") \
        .to_jwt()
        
    room = rtc.Room()

    @room.on("data_received")
    def on_data_received(data: rtc.DataPacket):
        message = data.data.decode('utf-8')
        print(f"\n💬 KEITH SAYS: \"{message}\"\n")
        
        # Auto-respond logic
        if "connect with them" in message.lower():
            asyncio.create_task(delayed_response(room, "Yes, please send me the info."))

    try:
        await room.connect(LIVEKIT_URL, token)
        print("✅ User Connected.")
        
        await asyncio.sleep(2)
        await send_message(room, "Hi, I need housing for me and my young child.")
        
        # Keep alive for a bit to receive responses
        await asyncio.sleep(15)
        print("🏁 Test interactions done. Disconnecting.")
        await room.disconnect()
        
    except Exception as e:
        print(f"❌ Client Error: {e}")

async def delayed_response(room, text):
    await asyncio.sleep(2)
    await send_message(room, text)

async def send_message(room, text):
    print(f"🗣️ YOU SAY: \"{text}\"")
    data = text.encode('utf-8')
    await room.local_participant.publish_data(data, reliable=True)

if __name__ == "__main__":
    asyncio.run(main())
