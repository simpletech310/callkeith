
import qrcode
import sys

def generate_qr():
    url = "https://callkeith.vercel.app/"
    try:
        # Create QR Code instance
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(url)
        qr.make(fit=True)

        # Create an image from the QR Code instance
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Save it
        output_path = "marketing/call_keith_qr.png"
        img.save(output_path)
        print(f"✅ Generated QR Code at: {output_path}")
        
    except ImportError:
        print("❌ Error: qrcode library not installed. Please run 'pip install qrcode[pil]'.")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error generating QR code: {e}")
        sys.exit(1)

if __name__ == "__main__":
    generate_qr()
