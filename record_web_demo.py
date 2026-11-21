import os
import subprocess
import asyncio
import time
import edge_tts
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By

os.makedirs("web_demo_frames", exist_ok=True)
os.makedirs("web_demo_work", exist_ok=True)

scenes = [
    {
        "id": "scene1_radar",
        "audio_text": "Xin chào Ban giám khảo. Đây là giao diện thực tế của TrustPact Protocol. Tính năng đầu tiên là Scam Radar, hệ thống phòng vệ gian lận đa kênh. Trước khi giao dịch, người dùng chỉ cần nhập số tài khoản ngân hàng, ví Web3, số điện thoại hoặc Telegram vào thanh tìm kiếm. Hệ thống ngay lập tức đối soát với cơ sở dữ liệu on-chain, cảnh báo rủi ro tức thì và phân loại chi tiết các hình thức lừa đảo để người dùng phòng tránh.",
    },
    {
        "id": "scene2_create",
        "audio_text": "Khi bắt đầu giao dịch, người dùng truy cập trang Khởi tạo Ký quỹ ba bên. Tại đây, người mua nhập địa chỉ ví của bên bán, chọn Giao dịch trung gian uy tín và nhập số tiền cọc. Mọi điều khoản nghiệm thu được ghi nhận minh bạch. Phí quyết toán chỉ không phẩy ba phần trăm và tiền nạp được chuyển thẳng vào Hợp đồng thông minh UniversalEscrow trên Avalanche, hoàn toàn phi lưu ký.",
    },
    {
        "id": "scene3_escrow_flow",
        "audio_text": "Trong phòng ký quỹ, tài sản được bảo vệ bằng cơ chế Phê duyệt kép bất biến. Bên bán giao hàng và nộp bằng chứng nghiệm thu. Hợp đồng chỉ mở két giải ngân khi cả Bên Mua bấm Hài lòng và Giao dịch trung gian bấm Xác nhận. Không một cá nhân nào có thể đơn phương chiếm đoạt tiền. Nhờ cơ chế đồng thuận Snowman của Avalanche, tốc độ quyết toán hoàn tất chỉ trong bảy trăm tám mươi mili giây.",
    },
    {
        "id": "scene4_broker_stake",
        "audio_text": "Đây là tính năng đột phá nhất: Quản lý vốn thế chấp GDTG. Để nhận bảo lãnh, trung gian nạp tiền cọc với hạn mức một một. Số vốn này không nằm bất động mà được hợp đồng tự động gửi vào bể Aave V ba trên Avalanche để sinh lời thực tế khoảng năm phần trăm một năm. Lợi tức được chia tám mươi phần trăm cho trung gian và hai mươi phần trăm tích lũy vào Quỹ bảo hiểm rủi ro. Nếu trung gian gian lận, hệ thống tự động khấu trừ đền bù cho nạn nhân.",
    },
    {
        "id": "scene5_profile_legal",
        "audio_text": "Cuối cùng, uy tín của các bên được bảo chứng bằng Hộ chiếu TrustPassport SBT, chứng chỉ Soulbound gắn vĩnh viễn với ví on-chain, không thể mua bán hay chuyển nhượng. Nền tảng vận hành hoàn toàn tuân thủ chế định Đặt cọc theo Điều ba trăm hai mươi tám Bộ luật Dân sự hai nghìn không trăm mười lăm. Cảm ơn Ban giám khảo đã theo dõi buổi demo sản phẩm TrustPact Protocol.",
    }
]

async def fetch_tts_retry(text, path):
    for attempt in range(5):
        try:
            c = edge_tts.Communicate(text, "vi-VN-HoaiMyNeural")
            await c.save(path)
            print(f"TTS generated: {path}")
            return True
        except Exception as e:
            print(f"Attempt {attempt+1} failed for {path}: {e}, waiting 2s...")
            await asyncio.sleep(2)
    return False

def get_audio_duration(path):
    cmd = ["ffprobe", "-i", path, "-show_entries", "format=duration", "-v", "quiet", "-of", "csv=p=0"]
    res = subprocess.run(cmd, capture_output=True, text=True, check=True)
    return float(res.stdout.strip())

def init_driver():
    options = Options()
    options.add_argument("--headless=new")
    options.add_argument("--window-size=1920,1080")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-gpu")
    driver = webdriver.Chrome(options=options)
    return driver

def inject_cursor(driver):
    cursor_script = """
    if (!document.getElementById('demo-cursor')) {
        const c = document.createElement('div');
        c.id = 'demo-cursor';
        c.style.position = 'fixed';
        c.style.width = '28px';
        c.style.height = '28px';
        c.style.pointerEvents = 'none';
        c.style.zIndex = '9999999';
        c.style.transition = 'transform 0.1s ease';
        c.innerHTML = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M5.5 3.2L18.8 12.2L12.4 13.5L15.6 20.8L12.7 22L9.5 14.8L5.5 18.5V3.2Z" fill="#38BDF8" stroke="#0F172A" stroke-width="1.8"/></svg>`;
        document.body.appendChild(c);
    }
    window.setCursor = function(x, y) {
        const c = document.getElementById('demo-cursor');
        if (c) {
            c.style.left = x + 'px';
            c.style.top = y + 'px';
        }
    };
    """
    driver.execute_script(cursor_script)

def move_cursor(driver, x, y):
    driver.execute_script(f"window.setCursor({x}, {y});")

def capture_scene1(driver, frame_dir):
    # SCENE 1: SCAM RADAR
    driver.get("http://localhost:3000")
    time.sleep(2)
    inject_cursor(driver)
    
    frames = []
    def save_f(name):
        p = os.path.join(frame_dir, f"{name}.png")
        driver.save_screenshot(p)
        frames.append(p)

    move_cursor(driver, 960, 400)
    save_f("s1_01")
    
    # Move to search bar
    move_cursor(driver, 850, 240)
    save_f("s1_02")
    
    # Type query step by step
    query = "1903889922101"
    search_input = driver.find_element(By.TAG_NAME, "input")
    for i in [3, 6, 9, 13]:
        sub_q = query[:i]
        driver.execute_script("arguments[0].value = arguments[1]; arguments[0].dispatchEvent(new Event('input', { bubbles: true }));", search_input, sub_q)
        time.sleep(0.3)
        save_f(f"s1_type_{i}")
        
    time.sleep(0.5)
    save_f("s1_search_result")
    
    # Click STK Ngan Hang filter pill
    driver.execute_script("window.scrollTo({top: 300, behavior: 'instant'});")
    inject_cursor(driver)
    move_cursor(driver, 600, 180)
    save_f("s1_filter_bank")
    
    # Click Telegram filter pill
    move_cursor(driver, 680, 180)
    save_f("s1_filter_tele")
    
    # Click Web3 filter pill
    move_cursor(driver, 840, 180)
    save_f("s1_filter_web3")
    
    # Scroll through table
    for y in [450, 650, 850, 1000, 700, 300, 0]:
        driver.execute_script(f"window.scrollTo({{top: {y}, behavior: 'instant'}});")
        inject_cursor(driver)
        move_cursor(driver, 960, 450)
        time.sleep(0.2)
        save_f(f"s1_scroll_{y}")
        
    return frames

def capture_scene2(driver, frame_dir):
    # SCENE 2: CREATE ESCROW
    driver.get("http://localhost:3000/create")
    time.sleep(2)
    inject_cursor(driver)
    
    frames = []
    def save_f(name):
        p = os.path.join(frame_dir, f"{name}.png")
        driver.save_screenshot(p)
        frames.append(p)

    move_cursor(driver, 960, 300)
    save_f("s2_01")
    
    # Move to Seller Wallet Input
    move_cursor(driver, 600, 380)
    inputs = driver.find_elements(By.TAG_NAME, "input")
    if len(inputs) > 0:
        driver.execute_script("arguments[0].value = '0x71C8A6917E26B64E4D3E83C569D2D4906F60492E'; arguments[0].dispatchEvent(new Event('input', { bubbles: true }));", inputs[0])
    save_f("s2_seller_input")
    
    # Move to Amount Input
    move_cursor(driver, 600, 520)
    if len(inputs) > 1:
        driver.execute_script("arguments[0].value = '500'; arguments[0].dispatchEvent(new Event('input', { bubbles: true }));", inputs[1])
    save_f("s2_amount_input")
    
    # Move to Terms Textarea
    textareas = driver.find_elements(By.TAG_NAME, "textarea")
    if len(textareas) > 0:
        driver.execute_script("arguments[0].value = 'Bàn giao tài khoản quản trị, bảo hành 30 ngày theo cam kết'; arguments[0].dispatchEvent(new Event('input', { bubbles: true }));", textareas[0])
    move_cursor(driver, 600, 680)
    save_f("s2_terms_input")
    
    # Scroll to fee breakdown & submit button
    driver.execute_script("window.scrollTo({top: 400, behavior: 'instant'});")
    inject_cursor(driver)
    move_cursor(driver, 960, 650)
    save_f("s2_fee_and_button")
    
    move_cursor(driver, 960, 750)
    save_f("s2_submit_hover")
    
    return frames

def capture_scene3(driver, frame_dir):
    # SCENE 3: ESCROW WORKFLOW & DUAL CONSENT
    driver.get("http://localhost:3000")
    time.sleep(2)
    # Scroll to Workflow / Feature showcase
    driver.execute_script("window.scrollTo({top: 150, behavior: 'instant'});")
    inject_cursor(driver)
    
    frames = []
    def save_f(name):
        p = os.path.join(frame_dir, f"{name}.png")
        driver.save_screenshot(p)
        frames.append(p)

    move_cursor(driver, 500, 350)
    save_f("s3_step1_deposit")
    
    move_cursor(driver, 800, 350)
    save_f("s3_step2_delivery")
    
    move_cursor(driver, 1100, 350)
    save_f("s3_step3_dual_consent")
    
    move_cursor(driver, 1400, 350)
    save_f("s3_step4_settlement")
    
    # Hover over Dual-Consent details
    driver.execute_script("window.scrollTo({top: 350, behavior: 'instant'});")
    inject_cursor(driver)
    move_cursor(driver, 960, 500)
    save_f("s3_dual_approval_highlight")
    
    move_cursor(driver, 960, 600)
    save_f("s3_instant_speed")
    
    return frames

def capture_scene4(driver, frame_dir):
    # SCENE 4: BROKER STAKE & AAVE V3 REAL-YIELD
    driver.get("http://localhost:3000/broker/stake")
    time.sleep(2)
    inject_cursor(driver)
    
    frames = []
    def save_f(name):
        p = os.path.join(frame_dir, f"{name}.png")
        driver.save_screenshot(p)
        frames.append(p)

    # Top KPI cards
    move_cursor(driver, 500, 220)
    save_f("s4_kpi_stake")
    
    move_cursor(driver, 960, 220)
    save_f("s4_kpi_quota")
    
    move_cursor(driver, 1400, 220)
    save_f("s4_kpi_yield")
    
    # Click quick amount buttons
    move_cursor(driver, 500, 500)
    save_f("s4_amount_500")
    
    move_cursor(driver, 620, 500)
    save_f("s4_amount_1000")
    
    move_cursor(driver, 760, 500)
    save_f("s4_amount_2500")
    
    # Scroll down to Real-Yield Proof
    driver.execute_script("window.scrollTo({top: 450, behavior: 'instant'});")
    inject_cursor(driver)
    move_cursor(driver, 1200, 350)
    save_f("s4_aave_proof")
    
    move_cursor(driver, 1200, 520)
    save_f("s4_formula_80_20")
    
    # Scroll down to Slashing penalty
    driver.execute_script("window.scrollTo({top: 700, behavior: 'instant'});")
    inject_cursor(driver)
    move_cursor(driver, 960, 600)
    save_f("s4_slashing_rules")
    
    return frames

def capture_scene5(driver, frame_dir):
    # SCENE 5: PROFILE TRUSTPASSPORT SBT & COMPLIANCE
    driver.get("http://localhost:3000/profile")
    time.sleep(2)
    inject_cursor(driver)
    
    frames = []
    def save_f(name):
        p = os.path.join(frame_dir, f"{name}.png")
        driver.save_screenshot(p)
        frames.append(p)

    # Profile SBT
    move_cursor(driver, 960, 260)
    save_f("s5_sbt_badge")
    
    move_cursor(driver, 960, 420)
    save_f("s5_reputation_metrics")
    
    driver.execute_script("window.scrollTo({top: 400, behavior: 'instant'});")
    inject_cursor(driver)
    move_cursor(driver, 960, 550)
    save_f("s5_tx_history")
    
    # Navigate to Compliance
    driver.get("http://localhost:3000/compliance")
    time.sleep(2)
    inject_cursor(driver)
    
    move_cursor(driver, 960, 250)
    save_f("s5_compliance_header")
    
    move_cursor(driver, 600, 450)
    save_f("s5_civil_code_328")
    
    move_cursor(driver, 1300, 450)
    save_f("s5_decree_52")
    
    driver.execute_script("window.scrollTo({top: 450, behavior: 'instant'});")
    inject_cursor(driver)
    move_cursor(driver, 960, 550)
    save_f("s5_non_custodial_proof")
    
    return frames

def compile_scene_video(frame_files, audio_file, output_mp4, duration):
    n_frames = len(frame_files)
    d_per_frame = duration / float(n_frames)
    
    concat_txt = output_mp4 + ".txt"
    with open(concat_txt, "w", encoding="utf-8") as f:
        for p in frame_files:
            fp = os.path.abspath(p).replace("\\", "/")
            f.write(f"file '{fp}'\n")
            f.write(f"duration {d_per_frame:.3f}\n")
        # Repeat last frame
        last_fp = os.path.abspath(frame_files[-1]).replace("\\", "/")
        f.write(f"file '{last_fp}'\n")
        
    vf = "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,format=yuv420p"
    cmd = [
        "ffmpeg", "-y", "-f", "concat", "-safe", "0",
        "-i", concat_txt, "-i", os.path.abspath(audio_file),
        "-vf", vf, "-c:v", "libx264", "-r", "30", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "192k", "-shortest", output_mp4
    ]
    subprocess.run(cmd, check=True, capture_output=True)
    print(f"Compiled scene: {output_mp4}")

def main():
    print("=== STARTING LIVE WEB FEATURE VIDEO DEMO CREATION ===")
    
    # Step 1: Generate Audio for all scenes
    for s in scenes:
        audio_p = f"web_demo_work/{s['id']}.mp3"
        print(f"Generating TTS for {s['id']}...")
        asyncio.run(fetch_tts_retry(s["audio_text"], audio_p))
        s["audio_file"] = audio_p
        s["duration"] = get_audio_duration(audio_p)
        print(f"Scene {s['id']} Duration: {s['duration']:.2f}s")
        
    # Step 2: Initialize Selenium and capture frames
    driver = init_driver()
    
    scene_clips = []
    
    # Scene 1
    print("\n--- Capturing Scene 1: Scam Radar Live Demo ---")
    s1_frames = capture_scene1(driver, "web_demo_frames")
    s1_mp4 = os.path.abspath("web_demo_work/scene1_out.mp4")
    compile_scene_video(s1_frames, scenes[0]["audio_file"], s1_mp4, scenes[0]["duration"])
    scene_clips.append(s1_mp4)
    
    # Scene 2
    print("\n--- Capturing Scene 2: Create Escrow Live Demo ---")
    s2_frames = capture_scene2(driver, "web_demo_frames")
    s2_mp4 = os.path.abspath("web_demo_work/scene2_out.mp4")
    compile_scene_video(s2_frames, scenes[1]["audio_file"], s2_mp4, scenes[1]["duration"])
    scene_clips.append(s2_mp4)
    
    # Scene 3
    print("\n--- Capturing Scene 3: Escrow Flow & Dual Consent ---")
    s3_frames = capture_scene3(driver, "web_demo_frames")
    s3_mp4 = os.path.abspath("web_demo_work/scene3_out.mp4")
    compile_scene_video(s3_frames, scenes[2]["audio_file"], s3_mp4, scenes[2]["duration"])
    scene_clips.append(s3_mp4)
    
    # Scene 4
    print("\n--- Capturing Scene 4: Broker Stake & Aave V3 Real-Yield ---")
    s4_frames = capture_scene4(driver, "web_demo_frames")
    s4_mp4 = os.path.abspath("web_demo_work/scene4_out.mp4")
    compile_scene_video(s4_frames, scenes[3]["audio_file"], s4_mp4, scenes[3]["duration"])
    scene_clips.append(s4_mp4)
    
    # Scene 5
    print("\n--- Capturing Scene 5: TrustPassport SBT & Compliance ---")
    s5_frames = capture_scene5(driver, "web_demo_frames")
    s5_mp4 = os.path.abspath("web_demo_work/scene5_out.mp4")
    compile_scene_video(s5_frames, scenes[4]["audio_file"], s5_mp4, scenes[4]["duration"])
    scene_clips.append(s5_mp4)
    
    driver.quit()
    
    # Step 3: Concat all scenes into Master Video
    master_txt = "web_demo_work/master_concat.txt"
    with open(master_txt, "w", encoding="utf-8") as f:
        for c in scene_clips:
            cp = c.replace("\\", "/")
            f.write(f"file '{cp}'\n")
            
    final_video = os.path.abspath("TrustPact_Web_Feature_Demo_2026.mp4")
    print("\n--- Merging All Scenes into Final Video ---")
    cmd_merge = [
        "ffmpeg", "-y", "-f", "concat", "-safe", "0",
        "-i", master_txt, "-c:v", "libx264", "-c:a", "aac",
        "-pix_fmt", "yuv420p", final_video
    ]
    subprocess.run(cmd_merge, check=True, capture_output=True)
    
    total_dur = get_audio_duration(final_video)
    size_mb = os.path.getsize(final_video) / (1024 * 1024)
    print("\n=========================================================")
    print("LIVE WEB FEATURE DEMO VIDEO COMPLETED!")
    print(f"File: {final_video}")
    print(f"Duration: {total_dur:.2f} seconds ({int(total_dur // 60)}m {int(total_dur % 60)}s)")
    print(f"Size: {size_mb:.2f} MB")
    print("=========================================================")

if __name__ == "__main__":
    main()
