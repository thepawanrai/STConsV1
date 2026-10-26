import urllib.request
import re
import os

links = [
    ("front_1", "https://kommodo.ai/i/dj4aZtKKMZ7y69MdGKpM"),
    ("front_2", "https://kommodo.ai/i/NV57uZCiBiRSVnjbV65S"),
    ("front_3", "https://kommodo.ai/i/LCWE1O3LaNtht9cLHKnp"),
    ("front_4", "https://kommodo.ai/i/8n8VJLHlgSUzsZcOzPxH"),
    ("front_5", "https://kommodo.ai/i/TO6qarZf4dkukpQQ0efL"),
    ("floorplan_1", "https://kommodo.ai/i/Wm8AWurKympEcSZ3ezF1"),
    ("floorplan_2", "https://kommodo.ai/i/w6wcZFRo1sCYTskeaitP"),
    ("floorplan_3", "https://kommodo.ai/i/u1Rt26xyCHEiOZ8vBv7z"),
    ("narayani_logo", "https://kommodo.ai/i/uaDi8haULvNDuOBghuKW")
]

os.makedirs("public/assets/projects/narayani-villas/elevation", exist_ok=True)
os.makedirs("public/assets/projects/narayani-villas/floorplans", exist_ok=True)
os.makedirs("public/assets/brand", exist_ok=True)

for key, url in links:
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req) as resp:
            html = resp.read().decode("utf-8", errors="ignore")
            title_m = re.search(r"<title[^>]*>(.*?)</title>", html)
            raw_title = title_m.group(1).replace(" | Kommodo", "").strip() if title_m else key
            clean_title = re.sub(r'[^a-zA-Z0-9]', '_', raw_title)[:30]
            
            img_m = re.search(r'<meta\s+property=["\']og:image["\']\s+content=["\']([^"\']+)["\']', html)
            if img_m:
                img_url = img_m.group(1)
                ext = ".png" if (".png" in img_url.lower() or "logo" in key) else ".jpg"
                if "front" in key:
                    dest = f"public/assets/projects/narayani-villas/elevation/{key}_{clean_title}{ext}"
                elif "floorplan" in key:
                    dest = f"public/assets/projects/narayani-villas/floorplans/{key}_{clean_title}{ext}"
                else:
                    dest = f"public/assets/brand/narayani-villas-official-logo{ext}"
                
                img_req = urllib.request.Request(img_url, headers={"User-Agent": "Mozilla/5.0"})
                with urllib.request.urlopen(img_req) as img_resp:
                    data = img_resp.read()
                    with open(dest, "wb") as f:
                        f.write(data)
                print(f"[SUCCESS] {key} -> {raw_title} -> {dest} ({len(data)} bytes)")
            else:
                print(f"[NO OG:IMAGE] {key} in {url}")
    except Exception as e:
        print(f"[ERROR] {key} {url}: {e}")
