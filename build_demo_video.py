import os
import subprocess
import asyncio
import edge_tts

os.makedirs("video_work", exist_ok=True)

segments = [
    {
        "id": "seg1",
        "audio_text": "Kính chào Ban giám khảo Avalanche UniHack 2026. Đây là TrustPact Protocol — Nền tảng ký quỹ giao dịch đa bên và phòng vệ gian lận trực tuyến trên Avalanche. Hàng năm tại Việt Nam, hơn 390 triệu USD bị chiếm đoạt do lừa đảo giao dịch trung gian P2P và OTC trên mạng xã hội. Các mô hình trung gian truyền thống phụ thuộc hoàn toàn vào niềm tin cá nhân, dễ dẫn tới nguy cơ bùng tiền, làm giả biên lai ngân hàng và lãng phí nguồn vốn bảo lãnh.",
        "images": ["video_assets/slide_01.png", "video_assets/slide_02.png"]
    },
    {
        "id": "seg2",
        "audio_text": "TrustPact giải quyết triệt để vấn đề này bằng Hợp đồng ký quỹ phi lưu ký UniversalEscrow. Tiền của người mua được khóa an toàn tuyệt đối trong Smart Contract trên Avalanche, không một cá nhân nào có thể đơn phương chiếm đoạt. Hệ thống áp dụng cơ chế Phê duyệt kép: Tiền chỉ giải ngân cho người bán khi cả Người mua bấm Hài lòng và Giao dịch trung gian bấm Xác nhận bàn giao hợp lệ. Nếu sản phẩm lỗi, người mua được hoàn tiền 100% ngay lập tức.",
        "images": ["video_assets/slide_03.png", "video_assets/web_create.png"]
    },
    {
        "id": "seg3",
        "audio_text": "Điểm đột phá của TrustPact là mô hình kinh tế Real-Yield bền vững. Vốn thế chấp của các giao dịch trung gian không nằm bất động, mà được tự động gửi vào bể thanh khoản Aave V3 trên Avalanche để sinh lời thực tế khoảng 5.2% một năm. Lợi tức được chia 80% cho trung gian và 20% tích lũy vào Quỹ bảo hiểm rủi ro. Đồng thời, hạn mức bảo lãnh 1:1 và chế tài Slashing tự động đền bù cho nạn nhân nếu có bất kỳ hành vi gian lận nào.",
        "images": ["video_assets/slide_04.png", "video_assets/web_stake.png"]
    },
    {
        "id": "seg4",
        "audio_text": "Bên cạnh ký quỹ, TrustPact sở hữu Scam Radar — cơ sở dữ liệu mở với hơn 200 bản ghi cảnh báo lừa đảo đa kênh từ tài khoản ngân hàng, ví Web3 tới số điện thoại. Hệ thống tích hợp trực tiếp Bot Telegram Sentinel hoạt động 24/7 trong các hội nhóm, tự động phát hiện và cảnh báo tức thì ngay khi đối tượng lừa đảo xuất hiện.",
        "images": ["video_assets/slide_06.png", "video_assets/web_radar.png"]
    },
    {
        "id": "seg5",
        "audio_text": "Nhờ tốc độ đồng thuận Snowman dưới 0.8 giây của Avalanche, TrustPact mang lại trải nghiệm thanh toán tức thì như app ngân hàng. Toàn bộ 4 Smart Contract đã được triển khai thực tế trên Avalanche Fuji C-Chain, vượt qua 63 bài kiểm thử bảo mật Foundry 100%. TrustPact sẵn sàng trở thành chuẩn mực ký quỹ phi tập trung an toàn tại Việt Nam và Đông Nam Á. Xin chân thành cảm ơn Ban giám khảo.",
        "images": ["video_assets/slide_05.png", "video_assets/slide_10.png"]
    }
]

async def generate_all_audio():
    for seg in segments:
        seg_id = seg["id"]
        audio_file = f"video_work/{seg_id}.mp3"
        print(f"Generating TTS for {seg_id}...")
        communicate = edge_tts.Communicate(seg["audio_text"], "vi-VN-HoaiMyNeural")
        await communicate.save(audio_file)
        print(f"Saved {audio_file}")

def get_duration(audio_file):
    cmd = [
        "ffprobe", "-i", audio_file,
        "-show_entries", "format=duration",
        "-v", "quiet", "-of", "csv=p=0"
    ]
    res = subprocess.run(cmd, capture_output=True, text=True, check=True)
    return float(res.stdout.strip())

def build_video():
    # 1. Generate audio
    asyncio.run(generate_all_audio())
    
    seg_video_files = []
    
    for seg in segments:
        seg_id = seg["id"]
        audio_file = f"video_work/{seg_id}.mp3"
        duration = get_duration(audio_file)
        print(f"\nProcessing {seg_id}: Duration = {duration:.2f}s")
        
        img1 = os.path.abspath(seg["images"][0])
        img2 = os.path.abspath(seg["images"][1])
        d1 = duration / 2.0
        d2 = duration - d1
        
        sub1 = os.path.abspath(f"video_work/{seg_id}_sub1.mp4")
        sub2 = os.path.abspath(f"video_work/{seg_id}_sub2.mp4")
        
        vf = "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,format=yuv420p"
        
        # Subclip 1
        cmd1 = [
            "ffmpeg", "-y", "-loop", "1", "-t", f"{d1:.2f}",
            "-i", img1, "-vf", vf, "-c:v", "libx264", "-r", "30",
            "-pix_fmt", "yuv420p", sub1
        ]
        subprocess.run(cmd1, check=True, capture_output=True)
        
        # Subclip 2
        cmd2 = [
            "ffmpeg", "-y", "-loop", "1", "-t", f"{d2:.2f}",
            "-i", img2, "-vf", vf, "-c:v", "libx264", "-r", "30",
            "-pix_fmt", "yuv420p", sub2
        ]
        subprocess.run(cmd2, check=True, capture_output=True)
        
        # Concat text
        concat_txt = os.path.abspath(f"video_work/{seg_id}_concat.txt")
        with open(concat_txt, "w", encoding="utf-8") as f:
            f.write(f"file '{sub1.replace(os.sep, '/')}'\n")
            f.write(f"file '{sub2.replace(os.sep, '/')}'\n")
            
        seg_mp4 = os.path.abspath(f"video_work/{seg_id}_final.mp4")
        cmd_concat = [
            "ffmpeg", "-y", "-f", "concat", "-safe", "0",
            "-i", concat_txt, "-i", os.path.abspath(audio_file),
            "-c:v", "copy", "-c:a", "aac", "-b:a", "192k",
            "-shortest", seg_mp4
        ]
        subprocess.run(cmd_concat, check=True, capture_output=True)
        seg_video_files.append(seg_mp4)
        print(f"Segment {seg_id} compiled successfully!")

    # Final Merge
    all_concat_txt = os.path.abspath("video_work/all_segments.txt")
    with open(all_concat_txt, "w", encoding="utf-8") as f:
        for vf in seg_video_files:
            f.write(f"file '{vf.replace(os.sep, '/')}'\n")
            
    final_output = os.path.abspath("TrustPact_UniHack2026_Demo.mp4")
    print("\nMerging all segments into final video:", final_output)
    cmd_final = [
        "ffmpeg", "-y", "-f", "concat", "-safe", "0",
        "-i", all_concat_txt, "-c:v", "libx264", "-c:a", "aac",
        "-pix_fmt", "yuv420p", final_output
    ]
    subprocess.run(cmd_final, check=True, capture_output=True)
    
    final_duration = get_duration(final_output)
    size_mb = os.path.getsize(final_output) / (1024 * 1024)
    print(f"\n==========================================")
    print(f"DEMO VIDEO GENERATED SUCCESSFULLY!")
    print(f"Path: {final_output}")
    print(f"Duration: {final_duration:.2f} seconds")
    print(f"Size: {size_mb:.2f} MB")
    print(f"==========================================")

if __name__ == "__main__":
    build_video()
