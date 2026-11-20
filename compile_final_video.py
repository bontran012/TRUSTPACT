import os
import subprocess

segments = [
    {
        "id": "seg1",
        "audio": "video_work/seg1.mp3",
        "images": ["video_assets/slide_01.png", "video_assets/slide_02.png"]
    },
    {
        "id": "seg2",
        "audio": "video_work/seg2.mp3",
        "images": ["video_assets/slide_03.png", "video_assets/web_create.png"]
    },
    {
        "id": "seg3",
        "audio": "video_work/seg3.mp3",
        "images": ["video_assets/slide_04.png", "video_assets/web_stake.png"]
    },
    {
        "id": "seg4",
        "audio": "video_work/seg4.mp3",
        "images": ["video_assets/slide_06.png", "video_assets/web_radar.png"]
    },
    {
        "id": "seg5",
        "audio": "video_work/seg5.mp3",
        "images": ["video_assets/slide_05.png", "video_assets/slide_10.png"]
    }
]

def get_duration(audio_file):
    cmd = [
        "ffprobe", "-i", audio_file,
        "-show_entries", "format=duration",
        "-v", "quiet", "-of", "csv=p=0"
    ]
    res = subprocess.run(cmd, capture_output=True, text=True, check=True)
    return float(res.stdout.strip())

seg_finals = []
vf = "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,format=yuv420p"

for seg in segments:
    seg_id = seg["id"]
    audio = os.path.abspath(seg["audio"])
    dur = get_duration(audio)
    print(f"\n--- Compiling {seg_id} (Duration: {dur:.2f}s) ---")
    
    img1 = os.path.abspath(seg["images"][0])
    img2 = os.path.abspath(seg["images"][1])
    d1 = round(dur / 2.0, 2)
    d2 = round(dur - d1, 2)
    
    sub1 = os.path.abspath(f"video_work/{seg_id}_v1.mp4")
    sub2 = os.path.abspath(f"video_work/{seg_id}_v2.mp4")
    
    # 1. Render subclip 1
    print(f"Rendering subclip 1 ({d1}s)...")
    cmd1 = [
        "ffmpeg", "-y", "-loop", "1", "-t", str(d1),
        "-i", img1, "-vf", vf, "-c:v", "libx264", "-r", "30",
        "-pix_fmt", "yuv420p", sub1
    ]
    subprocess.run(cmd1, check=True, capture_output=True)
    
    # 2. Render subclip 2
    print(f"Rendering subclip 2 ({d2}s)...")
    cmd2 = [
        "ffmpeg", "-y", "-loop", "1", "-t", str(d2),
        "-i", img2, "-vf", vf, "-c:v", "libx264", "-r", "30",
        "-pix_fmt", "yuv420p", sub2
    ]
    subprocess.run(cmd2, check=True, capture_output=True)
    
    # 3. Concat subclips
    concat_list = os.path.abspath(f"video_work/{seg_id}_list.txt")
    with open(concat_list, "w", encoding="utf-8") as f:
        f.write(f"file '{sub1.replace(os.sep, '/')}'\n")
        f.write(f"file '{sub2.replace(os.sep, '/')}'\n")
        
    final_seg = os.path.abspath(f"video_work/{seg_id}_complete.mp4")
    cmd_merge = [
        "ffmpeg", "-y", "-f", "concat", "-safe", "0",
        "-i", concat_list, "-i", audio,
        "-c:v", "copy", "-c:a", "aac", "-b:a", "192k",
        "-shortest", final_seg
    ]
    subprocess.run(cmd_merge, check=True, capture_output=True)
    seg_finals.append(final_seg)
    print(f"Completed {seg_id}!")

# Merge all into final output
master_list = os.path.abspath("video_work/master_list.txt")
with open(master_list, "w", encoding="utf-8") as f:
    for sf in seg_finals:
        f.write(f"file '{sf.replace(os.sep, '/')}'\n")

output_mp4 = os.path.abspath("TrustPact_UniHack2026_Demo.mp4")
print("\n--- Merging All Segments into Master Video ---")
cmd_all = [
    "ffmpeg", "-y", "-f", "concat", "-safe", "0",
    "-i", master_list, "-c:v", "copy", "-c:a", "copy",
    output_mp4
]
subprocess.run(cmd_all, check=True, capture_output=True)

total_dur = get_duration(output_mp4)
file_size_mb = os.path.getsize(output_mp4) / (1024 * 1024)

print("\n=======================================================")
print("DEMO VIDEO COMPILED SUCCESSFULLY!")
print(f"File Path: {output_mp4}")
print(f"Total Duration: {total_dur:.2f} seconds ({int(total_dur // 60)}m {int(total_dur % 60)}s)")
print(f"File Size: {file_size_mb:.2f} MB")
print("=======================================================")
