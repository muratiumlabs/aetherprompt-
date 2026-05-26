# -*- coding: utf-8 -*-
"""
AetherPrompt - Yapay Zeka Sanat Promptu Optimize Edici & Duygu Analizci
----------------------------------------------------------------------
Bu hafif Python betiği, Türkçe yazılmış basit çizim fikirlerini
profesyonel İngilizce promptlara zenginleştirerek çevirir ve 
atmosfer/renk analizi sunar.

Sıfır Bağımlılık: Standart Python kütüphaneleri (urllib) ile yazılmıştır.
Ekstra kütüphane yüklemeden (pip install yapmadan) çalışır!
"""

import sys
import json
import urllib.request
import urllib.error

import os
import re

# API Anahtarlarını Güvenli Yükleme Fonksiyonu
def load_api_keys():
    groq_key = os.environ.get("GROQ_API_KEY", "")
    gemini_key = os.environ.get("GEMINI_API_KEY", "")
    
    # Yerel config.js dosyasından okuma girişimi (Web ile ortak anahtar paylaşımı)
    try:
        if os.path.exists("config.js"):
            with open("config.js", "r", encoding="utf-8") as f:
                content = f.read()
                
                # regex ile anahtarları yakala
                groq_match = re.search(r"groqKey\s*:\s*['\"]([^'\"]*)['\"]", content)
                gemini_match = re.search(r"geminiKey\s*:\s*['\"]([^'\"]*)['\"]", content)
                
                if groq_match and groq_match.group(1):
                    groq_key = groq_match.group(1)
                if gemini_match and gemini_match.group(1):
                    gemini_key = gemini_match.group(1)
    except Exception:
        pass
        
    return groq_key, gemini_key

GROQ_API_KEY, GEMINI_API_KEY = load_api_keys()

# ANSI Renk Kodları (Konsolda premium görsel çıktılar için)
C_BLUE = "\033[94m"
C_CYAN = "\033[96m"
C_GREEN = "\033[92m"
C_YELLOW = "\033[93m"
C_RED = "\033[91m"
C_MAGENTA = "\033[95m"
C_BOLD = "\033[1m"
C_END = "\033[0m"

# Hazır Stil presetleri veri seti
PRESET_KEYWORDS = {
    "1": ("Cyberpunk", "cyberpunk, futuristic neon lighting, high-tech, octane render, complex circuitry, dark synthwave vibe"),
    "2": ("Fantastik", "epic cinematic fantasy, hyper-realistic, dramatic dark fantasy lighting, unreal engine 5 render, highly detailed, mythical atmosphere"),
    "3": ("Sürrealizm", "surrealist oil painting, dreamscape, whimsical details, salvador dali stili, ethereal color palette, floating elements, mysterious vibe"),
    "4": ("Anime", "gorgeous anime background art, makoto shinkai stili, vibrant colors, beautiful sky gradient, clean line art, studio ghibli aesthetic"),
    "5": ("Yağlı Boya", "impasto oil painting, thick brush strokes, van gogh dynamic texture, dramatic chiaroscuro lighting, classical masterpiece"),
    "6": ("Gotik", "dark gothic atmosphere, lovecraftian horror elements, heavy fog, high contrast chiaroscuro, unsettling beautiful mood"),
    "7": ("Gerçekçi", "photorealistic, 8k resolution, highly detailed, hyper-realistic, dramatic cinematic lighting, professional photographic composition, sharp focus, natural textures")
}

def print_banner():
    banner = fr"""
{C_MAGENTA}{C_BOLD}========================================================================
    ___         __  __                ____                               __ 
   /   |  ___  / /_/ /_  ___  _____  / __ \_________  ____ ___  ____  / /_
  / /| | / _ \/ __/ __ \/ _ \/ ___/ / /_/ / ___/ __ \/ __ `__ \/ __ \/ __/
 / ___ |/  __/ /_/ / / /  __/ /    / ____/ /  / /_/ / / / / / / /_/ / /_  
/_/  |_|\___/\__/_/ /_/\___/_/    /_/   /_/   \____/_/ /_/ /_/ .___/\__/  
                                                            /_/          
         >> AI Art Prompt Optimizer & Mood Analyzer Dashboard <<
========================================================================{C_END}
"""
    print(banner)

def get_system_instructions(prompt, style_name, style_keywords, generator, lighting, aspect_ratio, target_language, is_video, is_consistency_active=False, char_ref_url='', char_weight='100', char_anchor='', is_char_sheet_active=False, char_sheet_style='standard', active_characters=None):
    lang_instructions = """SADECE TÜRKÇE: Çizim fikrini İngilizceye ÇEVİRME. Promptu TÜRKÇE dilinde bırak, ancak onu görsel motorların (generator) en yüksek performansı alabileceği, sanatsal kelimelerle bezenmiş, son derece zengin ve profesyonel bir TÜRKÇE prompt'a dönüştür. (Örn: "Bir adam" yerine "Karizmatik ve kendinden emin duruşu olan bir adam...")""" if target_language == "tr" else """SADECE İNGİLİZCE: Çizim fikrini profesyonel İNGİLİZCE diline ÇEVİR. Görsel yapay zeka motorlarının (generator) en iyi anlayacağı sanatsal terimlerle, kamera detaylarıyla bezeli, son derece zengin bir İngilizce prompt'a dönüştür."""

    if generator == "ChatGPT Plus (DALL-E 3)":
        medium_instructions = """Bu, ChatGPT Plus içindeki DALL-E 3 görsel üreticisidir. ChatGPT için promptlar kısa komutlar veya teknik kodlar (--ar, --v vb.) barındırmamalıdır! Onun yerine zengin, doğal, hikayesel ve paragraf bazlı betimleyici bir dil kullanılmalıdır. Promptu son derece detaylı bir sahne betimlemesi yapan akıcı bir paragraf olarak yaz."""
    elif is_video:
        medium_instructions = """Bu bir HAREKETLİ VİDEO üreticisidir (generator). Promptu statik bir resim gibi değil, canlı bir video sahnesi veya animasyon üretecek şekilde tasarla. Kesinlikle kamera hareketleri (Örn: slow pan, smooth zoom, tracking shot, slow motion, aerial rotation), hareket dinamikleri (fluid motion, cinematic physics), kare hızı (24fps/30fps) ve gerçekçi video akıcılığıyla ilgili komutlar ekle."""
    else:
        medium_instructions = """Bu bir STATİK GÖRSEL üreticisidir (generator). Promptu hareketsiz, yüksek kaliteli, derin kompozisyona sahip tek kare bir resim veya fotoğraf üretecek şekilde tasarla."""

    magic_words_str = '["sinematik kamera hareketi", "yavas pan", "4k sinematik video"]' if target_language == "tr" and is_video else ('["sinematik isik", "yuksek detay", "ultra gercekci"]' if target_language == "tr" else ('["slow cinematic pan", "fluid motion", "hyper-realistic video physics", "24fps 4k"]' if is_video else '["octane render", "cinematic lighting", "unreal engine 5"]'))

    if active_characters is None:
        active_characters = []
        if char_anchor or char_ref_url:
            active_characters.append({
                "name": "Karakter 1",
                "features": char_anchor or "Belirtilmemiş",
                "url": char_ref_url,
                "hasImage": bool(char_ref_url)
            })

    consistency_instructions = ""
    if is_consistency_active and active_characters:
        model_sheet_rule = ""
        if is_char_sheet_active:
            if char_sheet_style == 'pixar':
                model_sheet_rule = '- ÖNEMLİ: Bu bir 3D Pixar ve Disney tarzı Animasyon Karakter Tasarım Sayfasıdır (3D CGI Pixar Character Model Sheet). Sahneleri tek bir resim yerine, bu karakterleri son derece kaliteli 3D animasyon (highly detailed render, friendly Disney eyes, smooth vinyl textures) stilinde çoklu açılardan (ön, yan ve 3/4 profil) gösteren bir model paftası halinde tasarla. Arka planı düz nötr stüdyo arka planı yap.'
            elif char_sheet_style == 'anime':
                model_sheet_rule = '- ÖNEMLİ: Bu bir Anime ve Manga Tarzı Karakter Konsept Tasarım Sayfasıdır (Anime Character Concept Art Sheet). Sahneleri Makoto Shinkai veya Studio Ghibli tarzında el çizimi esintileriyle, temiz çizgi sanatı (clean line-art), pastel tonlar ve çoklu açılardan (ön profil, yan profil ve farklı sevimli yüz ifadeleri) gösteren bir konsept paftası olarak tasarla. Arka planı düz veya beyaz yap.'
            elif char_sheet_style == 'game3d':
                model_sheet_rule = '- ÖNEMLİ: Bu bir 3D Dijital Oyun Karakter Tasarım Sayfasıdır (3D Game Character Model Turnaround Sheet). Sahneleri Unreal Engine veya Unity oyun motoru için modellenmiş bir 3D asset gibi, nötr bir T-Pose veya A-Pose duruşunda, ön, yan ve arka profilden gösteren bir T-pose turnaround paftası halinde tasarla. Arka plan tamamen boş stüdyo stili gri/beyaz olmalıdır.'
            elif char_sheet_style == 'chibi':
                model_sheet_rule = '- ÖNEMLİ: Bu sevimli bir Chibi ve minyatür oyuncak karakter tasarım paftasıdır (Cute Chibi Figurine Model Sheet). Sahneleri kocaman gözlü, büyük kafalı, sevimli küçük gövdeli (chibi style, vinyl toy aesthetic) olarak ön profil, yan profil ve farklı mimiklerle gösteren bir karakter sayfası olarak tasarla. Arka planı düz veya tatlı pastel renkte yap.'
            else:
                model_sheet_rule = '- ÖNEMLİ: Bu bir Karakter Tasarım Sayfasıdır (Character Sheet / Model Sheet). Tek bir sahne yerine karakterleri çoklu açılardan (ön profil, yan profil, 3/4 açılı çekim ve farklı duygusal mimikler) gösteren bir model paftası oluştur. Arka planı tamamen düz veya beyaz yap.'

        char_details_list = []
        for index, char in enumerate(active_characters):
            char_details_list.append(f'- Karakter #{index+1}: Adı: "{char["name"]}", Ayırt Edici Fiziksel Özellikleri: "{char["features"]}", Görsel Referans: "{char.get("url") or "Yok"}"')
        char_details_list_str = "\n".join(char_details_list)

        cref_links = " ".join([c["url"] for c in active_characters if c.get("hasImage") and c.get("url")])
        cref_rule = ""
        if cref_links:
            if "midjourney" in generator.lower():
                cref_rule = f"\n- Çizim motoru Midjourney v6 olduğundan, promptun en sonuna strictly tek bir ` --cref {cref_links} --cw {char_weight}` parametresini ekle. Tüm referans URL'lerini boşluklarla ayırarak tek bir --cref arkasına yığ."
            else:
                dal_ref_list = []
                for c in active_characters:
                    if c.get("hasImage") and c.get("url"):
                        dal_ref_list.append(f'[Character Reference ({c["name"]}): {c["url"]}]')
                dal_ref_text = " ".join(dal_ref_list)
                cref_rule = f"\n- Çizim motoru ChatGPT veya diğer motorlar olduğundan, promptun en sonuna strictly şu teknik referans etiketlerini ekle: ` {dal_ref_text} [Character Weight: {char_weight}]`"
        else:
            cref_rule = f"\n- Bu sahnede hiçbir karakter için görsel referans linki girilmemiştir, bu yüzden promptun sonuna kesinlikle ` --cref ` veya ` [Character Reference] ` parametreleri EKLEME! Sadece metinsel çapa özelliklerini kullanarak karakterlerin tutarlılığını sağla."

        consistency_instructions = f"""
Karakter Tutarlılık Motoru Kuralları (BUNLARI KESİNLİKLE UYGULA):
- Sahne içinde aşağıdaki karakterler yer almaktadır. Her karakteri ismiyle (Örn: "Asel", "Mert") prompt içinde konumlandırmalı, onlara ait fiziksel ayırt edici özellikleri ({'Türkçe' if target_language == 'tr' else 'İngilizce'} dilde) prompt metnine akıcı ve tutarlı bir şekilde harmanlamalısın:
{char_details_list_str}
- Karakterlerin fiziksel özelliklerinin değişmemesini (çapa özellikleri) sağla. Diğer sahneleri, pozu ve arka planı bu çapalar etrafında kurgula.
{model_sheet_rule}
{cref_rule}
"""

    char_input_details = ""
    if is_consistency_active and active_characters:
        char_input_details_list = []
        for i, c in enumerate(active_characters):
            char_input_details_list.append(f'- Karakter #{i+1}: Adı: "{c["name"]}", Özellikleri: "{c["features"]}", Görsel Referans: "{c.get("url") or "Yok"}"')
        char_input_details = "\n".join(char_input_details_list)
    else:
        char_input_details = "- Karakter Tanımlanmamıştır."

    return f"""Kullanıcının Türkçe olarak yazdığı basit bir çizim fikrini, görsel yapay zeka motorları ({generator}) için mükemmel derecede optimize edilmiş, son derece estetik, sanatsal detaylarla bezeli profesyonel bir prompt'a dönüştür. Ayrıca bu promptun duygu durumunu ve atmosfersel özelliklerini analiz et.

Girdi Bilgileri:
- Kullanıcı Fikri (Türkçe): "{prompt}"
- Sanat Tarzı: "{style_name}" (Bu sanatsal tarza ait anahtar kelimeleri prompta dahil et: {style_keywords})
- Işık & Atmosfer: "{lighting}"
- Çizim Platformu: "{generator}"
- Boyut Oranı (Aspect Ratio): "{aspect_ratio}"
- Karakter Tutarlılığı: "{'Aktif' if is_consistency_active else 'Pasif'}"
- Karakter Tasarım Sayfası Modu: "{'Aktif' if is_char_sheet_active else 'Pasif'}"
- Aktif Karakterlerin Detayları:
{char_input_details}
- Karakter Ağırlığı (Midjourney cw): "{char_weight}"

Motor Tipi ve Medya Kuralı:
{medium_instructions}

Dil Kuralı:
{lang_instructions}

Akıllı Harmanlama ve Anlamsal Analiz (Semantic Blending):
- Kullanıcının girdiği fikri ({prompt}) anlamsal olarak analiz et. Kullanıcı kendi metninde zaten belirli bir tarz (örneğin 'gothic', 'cyberpunk', 'beksinski' vb.) veya ışıklandırma ('bioluminescent') belirtmiş olabilir. Seçilen arayüz ayarlarıyla (Sanat Tarzı: "{style_name}", Işık: "{lighting}") kullanıcının kendi fikirlerini mükemmel bir şekilde harmanla (blend).
- ÖNEMLİ: Asla kelime ve kavram tekrarı yapma. Örneğin, kullanıcı metninde zaten 'gothic' yazdıysa ve tarz olarak da 'Gotik' seçildiyse, promptta mükerrer şekilde 'gothic gotik gothic horror' kelimelerini ardı ardına yığma. Bunun yerine anlamsal olarak birleştirilmiş, tek, akıcı ve son derece sanatsal bir kompozisyon oluştur. Tekrarları temizle.
{consistency_instructions}

Boyut Oranı (Aspect Ratio) Kuralı:
- Seçilen en-boy oranı: {aspect_ratio}. Bu boyut oranını tüm çizim ve video motorları için çıktı promptunda KESİNLİKLE belirtmelisin!
- Eğer çizim motoru Midjourney ise: Promptun en sonuna strictly ` --ar {aspect_ratio} --v 6.0` ekle.
- Eğer çizim motoru ChatGPT (DALL-E 3) veya diğer tüm motorlar ise: Hem prompt metninin içinde bu en-boy oranına uygun kompozisyonu betimsel olarak yaz (Örn: "in a wide 16:9 widescreen format", "in a square 1:1 portrait composition", "cinematic 21:9 ultra-wide view" vb.) hem de promptun en sonuna strictly ` [Aspect Ratio: {aspect_ratio}]` ifadesini teknik etiket olarak ekle. En-boy oranının çıktıda yer aldığından emin ol!

Senden Çıktıyı SADECE VE SADECE aşağıdaki JSON şemasına birebir uyacak şekilde almamız gerekiyor. Yanıtında JSON dışında hiçbir açıklama, markdown kodu veya düz yazı olmasın:

{{
  "optimized_prompt": "Zenginleştirilmiş, son derece estetik prompt. Cümleler akıcı, sanatsal kelimelerle dolu olmalı. Çizim motoru {generator} kurallarına göre optimize edilmiş olmalı. Boyut oranı kuralına göre {aspect_ratio} değeri prompt metninin sonuna eklenmelidir. Hedef dilde ({'Turkish' if target_language == 'tr' else 'English'}) olmalıdır.",
  "vibe_mysterious": 85, // 0-100 arası tamsayı. Gizem, büyüleyicilik, ruhanilik oranı
  "vibe_dynamic": 70, // 0-100 arası tamsayı. Canlılık, enerji, neon gücü oranı
  "vibe_dark": 40, // 0-100 arası tamsayı. Karanlık, dramatiklik, melankoli oranı
  "complexity": 90, // 0-100 arası tamsayı. Çizimin detay zenginliği, karmaşıklığı
  "dominant_vibe": "{'Video' if is_video else style_name}", // Baskın atmosferi temsil eden TEK BİR kelime
  "color_palette": ["#1A1A2E", "#16213E", "#0F3460", "#E94560", "#FFFFFF"], // Görüntünün ruhuna uyan 5 HEX rengi
  "magic_words": {magic_words_str} // Hızlı eklenebilecek 3 adet terim
}}

Yanıtın sadece geçerli bir JSON olmalıdır."""

def call_groq_api(system_prompt):
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": "llama-3.3-70b-versatile",
        "messages": [
            {"role": "system", "content": "You are a professional prompt designer. You must only reply with a valid JSON block, containing no extra markdown formatting."},
            {"role": "user", "content": system_prompt}
        ],
        "response_format": {"type": "json_object"},
        "temperature": 0.7,
        "max_tokens": 1000
    }
    
    req = urllib.request.Request(url, data=json.dumps(payload).encode('utf-8'), headers=headers, method="POST")
    with urllib.request.urlopen(req, timeout=15) as res:
        res_data = json.loads(res.read().decode('utf-8'))
        return json.loads(res_data["choices"][0]["message"]["content"])

def call_gemini_api(model_name, system_prompt):
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={GEMINI_API_KEY}"
    headers = {
        "Content-Type": "application/json"
    }
    payload = {
        "contents": [
            {"parts": [{"text": system_prompt}]}
        ],
        "generationConfig": {
            "responseMimeType": "application/json",
            "temperature": 0.7,
            "maxOutputTokens": 1000
        }
    }
    
    req = urllib.request.Request(url, data=json.dumps(payload).encode('utf-8'), headers=headers, method="POST")
    with urllib.request.urlopen(req, timeout=15) as res:
        res_data = json.loads(res.read().decode('utf-8'))
        text_content = res_data["candidates"][0]["content"]["parts"][0]["text"]
        return json.loads(text_content)

def clean_offline_redundancies(core_text, template_text):
    if not template_text:
        return ''
    import re
    # Extract words from core_text (longer than 2 characters)
    core_words = set(re.findall(r'\b[a-zA-Z0-9ığüşöçİĞÜŞÖÇ]{3,}\b', core_text.lower()))
    phrases = template_text.split(', ')
    filtered_phrases = []
    for phrase in phrases:
        phrase_words = re.findall(r'\b[a-zA-Z0-9ığüşöçİĞÜŞÖÇ]{3,}\b', phrase.lower())
        # If there is any overlap of words longer than 2 characters, skip it
        has_overlap = any(any(cw in pw or pw in cw for cw in core_words) for pw in phrase_words)
        if not has_overlap:
            filtered_phrases.append(phrase)
    return ', '.join(filtered_phrases) if filtered_phrases else template_text

def run_offline_generator(prompt, style_name, style_keywords, generator, lighting, aspect_ratio, target_language, is_video, is_consistency_active=False, char_ref_url='', char_weight='100', char_anchor='', is_char_sheet_active=False, char_sheet_style='standard', active_characters=None):
    # Descriptive aspect ratio words
    aspect_desc_en = "widescreen format"
    aspect_desc_tr = "geniş ekran formatında"
    if aspect_ratio == "16:9":
        aspect_desc_en = "widescreen 16:9 format"
        aspect_desc_tr = "geniş ekran 16:9 formatında"
    elif aspect_ratio == "1:1":
        aspect_desc_en = "square 1:1 composition"
        aspect_desc_tr = "kare 1:1 kompozisyonunda"
    elif aspect_ratio == "9:16":
        aspect_desc_en = "vertical 9:16 format"
        aspect_desc_tr = "dikey 9:16 formatında"
    elif aspect_ratio == "4:3":
        aspect_desc_en = "classic 4:3 photo format"
        aspect_desc_tr = "klasik 4:3 fotoğraf formatında"
    elif aspect_ratio == "21:9":
        aspect_desc_en = "cinematic ultra-wide 21:9 aspect ratio"
        aspect_desc_tr = "sinematik ultra geniş 21:9 formatında"

    if active_characters is None:
        active_characters = []
        if char_anchor or char_ref_url:
            active_characters.append({
                "name": "Karakter 1",
                "features": char_anchor or "Belirtilmemiş",
                "url": char_ref_url,
                "hasImage": bool(char_ref_url)
            })

    if target_language == "tr":
        # Turkish offline zenginleştirici
        style_tr_keywords = {
            "Cyberpunk": "siberpunk tarzı, fütüristik neon aydınlatma, yüksek teknoloji, unreal engine 5 render, karmaşık devreler, koyu synthwave havası",
            "Fantastik": "epik fantastik tarzı, hiper gerçekçi, dramatik karanlık fantastik ışıklandırma, unreal engine 5 render, son derece detaylı, efsanevi atmosfer",
            "Sürrealizm": "sürrealist yağlı boya tarzı, rüya gibi detaylar, salvador dali stili, büyüleyici renk paleti, havada süzülen elementler, gizemli hava",
            "Anime": "harika anime arka plan sanatı, canlı renkler, makoto shinkai stili, temiz çizgi sanatı, stüdyo ghibli estetiği",
            "Yağlı Boya": "yağlı boya tablosu, kalın fırça darbeleri, dinamik van gogh dokusu, dramatik chiaroscuro ışıklandırması, klasik şaheser kalitesi",
            "Gotik": "karanlık gotik atmosfer, lovecraftian korku elementleri, yoğun sis, yüksek kontrastlı chiaroscuro, karmaşık gölgeler, tekinsiz derecede güzel hava"
        }
        
        stop_words = ['çiz', 'tane', 'adet', 'böyle', 'olsun', 'şekilde', 'olarak']
        import re
        cleaned = re.sub(r'[.,\/#!$%\^&\*;:{}=\-_`~()?"\']', ' ', prompt.lower())
        tokens = [t.strip() for t in cleaned.split(' ') if t.strip()]
        filtered = [t for t in tokens if t not in stop_words]
        core = " ".join(filtered)
        
        raw_style_text = style_tr_keywords.get(style_name, "sanatsal stil")
        # Clean duplicates
        style_text = clean_offline_redundancies(core, raw_style_text)
        if not style_text:
            style_text = raw_style_text
            
        clean_lighting = clean_offline_redundancies(core, lighting.lower())
        if not clean_lighting:
            clean_lighting = lighting.lower()

        # Karakter Tutarlılık Metinsel Çapa ve Sayfası
        character_header = ""
        character_core = ""
        if is_consistency_active and active_characters:
            char_descs_list = []
            for c in active_characters:
                clean_feat = clean_offline_redundancies(core, c["features"])
                feat_str = clean_feat if clean_feat else c["features"]
                char_descs_list.append(f"{c['name']} ({feat_str})")
            char_descs = " ve ".join(char_descs_list)
            character_core = f"{char_descs}, "
            
            if is_char_sheet_active:
                if char_sheet_style == 'pixar':
                    character_header = "3d pixar disney animasyon tarzı karakter tasarım sayfası, çoklu açılardan 3d cgi model çizimleri, friendly disney style, smooth render, düz stüdyo arka planı, "
                elif char_sheet_style == 'anime':
                    character_header = "anime manga tarzı karakter konsept tasarım sayfası, temiz çizgi sanatı ve pastel tonlar, çoklu açılardan eskizler, stüdyo ghibli stili, düz arka plan, "
                elif char_sheet_style == 'game3d':
                    character_header = "3d oyun karakteri turnaround paftası, unreal engine turnaround asset, ön yan ve arka profilden model, nötr t-pose duruşu, düz gri stüdyo arka planı, "
                elif char_sheet_style == 'chibi':
                    character_header = "sevimli chibi oyuncak karakter tasarım paftası, büyük kafalı tatlı mini chibi, çoklu açılardan sevimli model paftası, düz pastel arka plan, "
                else:
                    character_header = "karakter tasarım sayfası, çoklu açılardan model çizimleri, düz arka plan, "
        
        if is_video:
            final = f"sinematik video: {character_header}{character_core}{core}, {style_text}, {clean_lighting} ile aydınlatılmış, {aspect_desc_tr}, yavaş sinematik kamera hareketi, akıcı pürüzsüz hareket, yüksek çözünürlüklü video, fotogerçekçi fizik, 24fps"
        elif generator == "ChatGPT Plus (DALL-E 3)":
            final = f"DALL-E 3 için zengin sahne betimlemesi: {character_header}{character_core}{core}, {style_text} tarzında, {clean_lighting} ile aydınlatılmış, {aspect_desc_tr}, şaheser kalitesinde, son derece detaylı ve derin bir atmosfer sunan sanatsal bir kompozisyon."
        else:
            final = f"{character_header}{character_core}{core}, {style_text}, {clean_lighting} ile aydınlatılmış, {aspect_desc_tr}, şaheser, son derece detaylı, görsel olarak göz alıcı"
        
        # Enforce Character Reference
        if is_consistency_active and active_characters:
            cref_links = " ".join([c["url"] for c in active_characters if c.get("hasImage") and c.get("url")])
            if cref_links:
                if "midjourney" in generator.lower():
                    final += f" --cref {cref_links} --cw {char_weight}"
                else:
                    dal_ref_list = []
                    for c in active_characters:
                        if c.get("hasImage") and c.get("url"):
                            dal_ref_list.append(f'[Character Reference ({c["name"]}): {c["url"]}]')
                    dal_ref = " ".join(dal_ref_list)
                    final += f" {dal_ref} [Character Weight: {char_weight}]"

        # Enforce Aspect Ratio
        if "midjourney" in generator.lower():
            final += f" --ar {aspect_ratio} --v 6.0"
        else:
            final += f" [Aspect Ratio: {aspect_ratio}]"
            
        return {
            "optimized_prompt": final,
            "vibe_mysterious": 75 if style_name in ["Sürrealizm", "Gotik"] else 45,
            "vibe_dynamic": 85 if style_name == "Cyberpunk" else 50,
            "vibe_dark": 90 if style_name == "Gotik" else 35,
            "complexity": 80,
            "dominant_vibe": "Video" if is_video else style_name,
            "color_palette": ["#0F0F1E", "#2A1A4A", "#6366F1", "#D946EF", "#00F2FE"] if style_name == "Cyberpunk" else ["#0A0A0A", "#2E1C0C", "#D97706", "#F59E0B", "#F6E8C3"],
            "magic_words": ["akici hareket", "yavas kamera kaymasi", "fotogercekci hareket"] if is_video else ["hiper gercekci", "sinematik parilti", "yuksek cozunurluk", "goz alici"]
        }

    # Gelişmiş kelime tabanlı Türkçe-İngilizce çeviri ve zenginleştirme motoru (Offline Fallback - English)
    dict_map = {
        'adam': 'man', 'erkek': 'man', 'kadın': 'woman', 'kız': 'girl', 'çocuk': 'child',
        'bakan': 'looking', 'bakacak': 'looking', 'bakıyor': 'looking', 'bak': 'look',
        'kamera': 'camera', 'kameraya': 'the camera', 'doğru': 'towards',
        'poz': 'pose', 'verecek': 'posing', 'veriyor': 'posing', 'cool': 'cool',
        'karizmatik': 'charismatic', 'yakışıklı': 'handsome', 'güzel': 'beautiful',
        'karanlıkta': 'in the darkness', 'karanlık': 'dark', 'parlayan': 'glowing', 'parıltı': 'glow',
        'biyolüminesans': 'bioluminescent', 'biyolüminesanslı': 'bioluminescent',
        'yumuşak': 'soft', 'parıldayan': 'sparkling', 'ışıltılı': 'glimmering',
        'aslan': 'lion', 'kedi': 'cat', 'köpek': 'dog', 'kuş': 'bird', 'robot': 'robot',
        'mekanik': 'mechanical', 'metal': 'metallic', 'fütüristik': 'futuristic',
        'şehir': 'city', 'dystopian': 'dystopian', 'siberpunk': 'cyberpunk',
        'orman': 'forest', 'deniz': 'sea', 'okyanus': 'ocean', 'gökyüzü': 'sky',
        'bulut': 'cloud', 'sis': 'fog', 'sisli': 'foggy', 'gölge': 'shadow',
        'ev': 'house', 'tapınak': 'temple', 'antik': 'ancient', 'altın': 'golden',
        've': 'and', 'ile': 'with', 'üstünde': 'above', 'altında': 'under',
        'bir': 'a', 'iki': 'two', 'uçan': 'flying', 'yüzen': 'floating',
        
        # Extended character traits translations
        'saçlı': 'hair', 'gözlü': 'eyed', 'göz': 'eyes', 'saç': 'hair', 'kızıl': 'red', 
        'sarı': 'blonde', 'siyah': 'black', 'kahverengi': 'brown', 'mavi': 'blue', 
        'yeşil': 'green', 'gri': 'grey', 'gümüş': 'silver', 'beyaz': 'white', 
        'kısa': 'short', 'uzun': 'long', 'küt': 'bob cut', 'dövme': 'tattoo', 
        'dövmeli': 'tattooed', 'yara': 'scar', 'iz': 'scar', 'izi': 'scar', 'olan': 'with'
    }
    
    stop_words = ['olacak', 'bu', 'olsun', 'çiz', 'tane', 'adet', 'böyle', 'şekilde', 'olarak']
    
    import re
    cleaned = re.sub(r'[.,\/#!$%\^&\*;:{}=\-_`~()?"\']', ' ', prompt.lower())
    tokens = [t.strip() for t in cleaned.split(' ') if t.strip()]
    
    english_parts = []
    for token in tokens:
        if token in stop_words:
            continue
        if token in dict_map:
            english_parts.append(dict_map[token])
        else:
            if re.match(r'^[a-zA-Z0-9\-]+$', token):
                english_parts.append(token)
                
    final_keywords = []
    for word in english_parts:
        if not final_keywords or final_keywords[-1] != word:
            final_keywords.append(word)
            
    core = ", ".join(final_keywords)
    if not core:
        core = f"artistic composition of {prompt}"
        
    raw_style_text = style_keywords
    style_text = clean_offline_redundancies(core, raw_style_text)
    if not style_text:
        style_text = raw_style_text
        
    clean_lighting = clean_offline_redundancies(core, lighting.lower())
    if not clean_lighting:
        clean_lighting = lighting.lower()

    # Karakter Tutarlılık Çevirisi ve Sayfası (İngilizce)
    character_header = ""
    character_core = ""
    if is_consistency_active and active_characters:
        char_descs_list = []
        for c in active_characters:
            anchor_cleaned = re.sub(r'[.,\/#!$%\^&\*;:{}=\-_`~()?"\']', ' ', c["features"].lower())
            anchor_tokens = [t.strip() for t in anchor_cleaned.split(' ') if t.strip()]
            anchor_english = []
            for token in anchor_tokens:
                if token in stop_words:
                    continue
                if token in dict_map:
                    anchor_english.append(dict_map[token])
                else:
                    if re.match(r'^[a-zA-Z0-9\-]+$', token):
                        anchor_english.append(token)
            translated_anchor = " ".join(anchor_english)
            feat_str = translated_anchor if translated_anchor else c["features"]
            char_descs_list.append(f"{c['name']} ({feat_str})")
        char_descs = " and ".join(char_descs_list)
        character_core = f"{char_descs}, "
        
        if is_char_sheet_active:
            if char_sheet_style == 'pixar':
                character_header = "3d pixar disney cgi character model sheet, dynamic expression poses, highly detailed 3d render, smooth friendly disney face structure, plain neutral studio background, "
            elif char_sheet_style == 'anime':
                character_header = "anime manga character concept art sheet, clean line-art, makoto shinkai style, multiple sketch angles, flat plain background, "
            elif char_sheet_style == 'game3d':
                character_header = "3d game asset character turnaround sheet, T-pose, front view, side view, back view profiles, unreal engine game-ready model, neutral studio grey background, "
            elif char_sheet_style == 'chibi':
                character_header = "cute chibi vinyl figurine model sheet, big head cute tiny body chibi style, toy turnaround model, multiple angles, plain pastel background, "
            else:
                character_header = "character expression model sheet, multiple angles, front view, side view, 3/4 angle shots, plain flat background, "
        
    if is_video:
        final = f"a cinematic video of {character_header}{character_core}{core}, {style_text}, in a setting illuminated by {clean_lighting}, {aspect_desc_en}, slow cinematic camera movement, smooth fluid motion, high-definition video, photorealistic physics, 24fps"
    elif generator == "ChatGPT Plus (DALL-E 3)":
        final = f"A detailed DALL-E 3 masterpiece depicting: {character_header}{character_core}{core}, styled as {style_text}, in a setting illuminated by {clean_lighting}, {aspect_desc_en}, highly aesthetic composition, rich visuals, detailed and stunning."
    else:
        final = f"{character_header}{character_core}{core}, {style_text}, in a setting illuminated by {clean_lighting}, {aspect_desc_en}, masterpiece, detailed, photorealistic"
    
    # Enforce Character Reference
    if is_consistency_active and active_characters:
        cref_links = " ".join([c["url"] for c in active_characters if c.get("hasImage") and c.get("url")])
        if cref_links:
            if "midjourney" in generator.lower():
                final += f" --cref {cref_links} --cw {char_weight}"
            else:
                dal_ref_list = []
                for c in active_characters:
                    if c.get("hasImage") and c.get("url"):
                        dal_ref_list.append(f'[Character Reference ({c["name"]}): {c["url"]}]')
                dal_ref = " ".join(dal_ref_list)
                final += f" {dal_ref} [Character Weight: {char_weight}]"

    # Enforce Aspect Ratio
    if "midjourney" in generator.lower():
        final += f" --ar {aspect_ratio} --v 6.0"
    else:
        final += f" [Aspect Ratio: {aspect_ratio}]"
        
    return {
        "optimized_prompt": final,
        "vibe_mysterious": 75 if style_name in ["Sürrealizm", "Gotik"] else 45,
        "vibe_dynamic": 85 if style_name == "Cyberpunk" else 50,
        "vibe_dark": 90 if style_name in ["Gotik", "Gothic"] else 35,
        "complexity": 80,
        "dominant_vibe": "Video" if is_video else style_name,
        "color_palette": ["#0F0F1E", "#2A1A4A", "#6366F1", "#D946EF", "#00F2FE"] if style_name == "Cyberpunk" else ["#0A0A0A", "#2E1C0C", "#D97706", "#F59E0B", "#F6E8C3"],
        "magic_words": ["slow cinematic pan", "fluid motion", "hyper-realistic video physics", "24fps 4k"] if is_video else ["8k resolution", "hyper detailed", "cinematic glow", "trending on artstation"]
    }

def print_progress_bar(label, value, color_code):
    # Prints a beautiful text progress bar e.g. [██████░░░░] 60%
    width = 25
    filled_len = int(round(width * value / 100))
    bar = '█' * filled_len + '░' * (width - filled_len)
    print(f"  {C_BOLD}{label:<22}{C_END} [{color_code}{bar}{C_END}] {C_BOLD}{value}%{C_END}")

def main():
    print_banner()
    
    # 1. Input Prompt
    print(f"{C_CYAN}{C_BOLD}[ Adım 1 ]{C_END} Çizmek istediğiniz fikri Türkçe olarak yazın:")
    user_prompt = input(" >> ").strip()
    if not user_prompt:
        print(f"{C_RED}Hata: Boş fikir girilemez. Çıkış yapılıyor.{C_END}")
        return

    # 2. Select Style
    print(f"\n{C_CYAN}{C_BOLD}[ Adım 2 ]{C_END} Sanatsal bir tarz seçin (Sayı girin, varsayılan 1):")
    for key, (name, _) in PRESET_KEYWORDS.items():
        print(f"  ({key}) {name}")
    style_choice = input(" >> ").strip() or "1"
    if style_choice not in PRESET_KEYWORDS:
        style_choice = "1"
    style_name, style_keywords = PRESET_KEYWORDS[style_choice]

    # 3. Select AI Model
    print(f"\n{C_CYAN}{C_BOLD}[ Adım 3 ]{C_END} Kullanılacak Yapay Zeka modelini seçin (Varsayılan 1):")
    print("  (1) GROQ AI (Llama 3.3 70B - Yıldırım Hızında)")
    print("  (2) Gemini 3.1 Flash-Lite")
    print("  (3) Gemini 2.5 Flash")
    print("  (4) Gemini 3.5 Flash (Yeni Nesil & Üstün Zeka)")
    model_choice = input(" >> ").strip() or "1"

    # 3.5 Select AI Art/Video Generator
    print(f"\n{C_CYAN}{C_BOLD}[ Adım 3.5 ]{C_END} Hedef Çizim/Video Aracını seçin (Varsayılan 1):")
    print(f"  {C_BOLD}--- Görsel Üreticiler (Görüntü) ---{C_END}")
    print("  (1) Midjourney v6")
    print("  (2) ChatGPT Plus (DALL-E 3)")
    print("  (3) DALL-E 3 (API)")
    print("  (4) Stable Diffusion 3")
    print("  (5) Adobe Firefly v3")
    print("  (6) Nano Banana")
    print(f"  {C_BOLD}--- Video Üreticiler (Hareketli) ---{C_END}")
    print("  (7) Google Veo 3")
    print("  (8) OpenAI Sora")
    print("  (9) Runway Gen-3")
    print("  (10) Luma Dream Machine")
    print("  (11) Pika 2.0")
    
    gen_choice = input(" >> ").strip() or "1"
    
    generators_map = {
        "1": "Midjourney v6", "2": "ChatGPT Plus (DALL-E 3)", "3": "DALL-E 3 (API)",
        "4": "Stable Diffusion 3", "5": "Adobe Firefly v3", "6": "Nano Banana",
        "7": "Google Veo 3", "8": "OpenAI Sora", "9": "Runway Gen-3",
        "10": "Luma Dream Machine", "11": "Pika 2.0"
    }
    
    generator = generators_map.get(gen_choice, "Midjourney v6")
    is_video = gen_choice in ["7", "8", "9", "10", "11"]

    # 4. Select Target Language
    print(f"\n{C_CYAN}{C_BOLD}[ Adım 4 ]{C_END} Hedef çıktı dilini seçin (Varsayılan 1):")
    print("  (1) İngilizce (English)")
    print("  (2) Türkçe (Turkish)")
    lang_choice = input(" >> ").strip() or "1"
    target_language = "tr" if lang_choice == "2" else "en"

    # Settings presets
    lighting = "Chiaroscuro (Derin Kontrast & Gölgeler)"
    aspect_ratio = "16:9"

    # 4.5. Karakter Tutarlılık Ayarları
    print(f"\n{C_CYAN}{C_BOLD}[ Adım 4.5 ]{C_END} Karakter tutarlılığı özelliğini kullanmak istiyor musunuz? (e/h, Varsayılan h):")
    consistency_choice = input(" >> ").strip().lower() or "h"
    is_consistency_active = consistency_choice == "e"
    
    active_characters = []
    char_weight = "100"
    is_char_sheet_active = False
    char_sheet_style = "standard"
    
    if is_consistency_active:
        print(f"\n{C_MAGENTA}{C_BOLD}--- Karakter Yönetimi (En fazla 5 karakter ekleyebilirsiniz) ---{C_END}")
        char_count = 0
        while char_count < 5:
            char_count += 1
            print(f"\n{C_CYAN}{C_BOLD}[ Karakter #{char_count} ]{C_END}")
            char_name = input("  * Karakter Adı: ").strip()
            if not char_name:
                char_name = f"Karakter {char_count}"
            
            char_features = input("  * Karakter Ayırt Edici Özellikleri (Metinsel Çapa): ").strip()
            if not char_features:
                char_features = "Belirtilmemiş özellikler"
            
            has_image = False
            char_url = ""
            add_image = input("  * Bu karakter için Görsel Referans (URL) eklemek ister misiniz? (e/h, Varsayılan h): ").strip().lower()
            if add_image == "e":
                char_url = input("    Görsel Referans URL'si: ").strip()
                if char_url:
                    has_image = True
            
            active_characters.append({
                "name": char_name,
                "features": char_features,
                "url": char_url,
                "hasImage": has_image
            })
            
            if char_count < 5:
                another = input("\n  * Başka bir karakter eklemek istiyor musunuz? (e/h, Varsayılan h): ").strip().lower()
                if another != "e":
                    break
            else:
                print(f"  {C_YELLOW}Maksimum karakter sınırına (5) ulaşıldı.{C_END}")
        
        print(f"\n  {C_BOLD}* Karakter Benzerlik Derecesi (Ağırlık, 0-100, Varsayılan 100):{C_END}")
        char_weight = input("   >> ").strip() or "100"
        
        print(f"  {C_BOLD}* Karakter Tasarım Sayfası (Model Sheet) aktif olsun mu? (e/h, Varsayılan h):{C_END}")
        sheet_choice = input("   >> ").strip().lower() or "h"
        is_char_sheet_active = sheet_choice == "e"
        
        if is_char_sheet_active:
            print(f"  {C_BOLD}* Model Sheet Tasarım Tarzını seçin (Varsayılan 1):{C_END}")
            print("    (1) Standart Eskiz Model Paftası (Tüm Açılar & İfadeler)")
            print("    (2) 3D Pixar / Disney Animasyon Tarzı (High-End CGI)")
            print("    (3) Anime / Manga Konsept Model Paftası (Studio Ghibli / Shinkai)")
            print("    (4) 3D Dijital Oyun Karakter Paftası (Unreal Engine T-Pose)")
            print("    (5) Chibi / Sevimli Minyatür Figür Sayfası (Cute Chibi Design)")
            sheet_style_choice = input("     >> ").strip() or "1"
            style_map = {"1": "standard", "2": "pixar", "3": "anime", "4": "game3d", "5": "chibi"}
            char_sheet_style = style_map.get(sheet_style_choice, "standard")

    # API execution block
    print(f"\n{C_YELLOW}Aether Engine çalıştırılıyor, lütfen bekleyin...{C_END}")
    
    system_prompt = get_system_instructions(
        user_prompt, style_name, style_keywords, generator, lighting, aspect_ratio, target_language, is_video,
        is_consistency_active=is_consistency_active, char_weight=char_weight, 
        is_char_sheet_active=is_char_sheet_active, char_sheet_style=char_sheet_style, active_characters=active_characters
    )
    
    result = None
    try:
        if model_choice == "1":
            # Pass dummy key placeholder or variable
            url = "https://api.groq.com/openai/v1/chat/completions"
            headers = {
                "Authorization": f"Bearer {GROQ_API_KEY}",
                "Content-Type": "application/json"
            }
            payload = {
                "model": "llama-3.3-70b-versatile",
                "messages": [
                    {"role": "system", "content": "You are a professional prompt designer. You must only reply with a valid JSON block, containing no extra markdown formatting."},
                    {"role": "user", "content": system_prompt}
                ],
                "response_format": {"type": "json_object"},
                "temperature": 0.7,
                "max_tokens": 1000
            }
            
            req = urllib.request.Request(url, data=json.dumps(payload).encode('utf-8'), headers=headers, method="POST")
            with urllib.request.urlopen(req, timeout=15) as res:
                res_data = json.loads(res.read().decode('utf-8'))
                result = json.loads(res_data["choices"][0]["message"]["content"])
            
            model_info = "GROQ (Llama-3.3-70b)"
        elif model_choice == "2":
            result = call_gemini_api("gemini-1.5-flash", system_prompt)
            model_info = "Gemini 3.1 Flash-Lite"
        elif model_choice == "3":
            result = call_gemini_api("gemini-2.0-flash", system_prompt)
            model_info = "Gemini 2.5 Flash"
        else:
            result = call_gemini_api("gemini-3.5-flash", system_prompt)
            model_info = "Gemini 3.5 Flash"
    except Exception as e:
        print(f"\n{C_RED}[ API UYARISI ]{C_END} İstek atılamadı ({str(e)}). Yerel motor devreye giriyor...")
        result = run_offline_generator(
            user_prompt, style_name, style_keywords, generator, lighting, aspect_ratio, target_language, is_video,
            is_consistency_active=is_consistency_active, char_weight=char_weight,
            is_char_sheet_active=is_char_sheet_active, char_sheet_style=char_sheet_style, active_characters=active_characters
        )
        model_info = "Yerel Zenginleştirme Motoru (Offline)"

    # Print results
    print(f"\n{C_GREEN}{C_BOLD}====================== OPTİMİZE EDİLMİŞ ÇIKTILAR ======================{C_END}")
    print(f"  {C_BOLD}Motor:{C_END} {C_CYAN}{model_info}{C_END}  |  {C_BOLD}Sanat Tarzı:{C_END} {C_CYAN}{style_name}{C_END}  |  {C_BOLD}Dil:{C_END} {C_CYAN}{'Türkçe' if target_language == 'tr' else 'İngilizce'}{C_END}")
    print(f"------------------------------------------------------------------------")
    print(f"\n{C_BOLD}Optimize Edilmiş Prompt (Kopyalayabilirsiniz):{C_END}")
    print(f"{C_BLUE}{C_BOLD}{result['optimized_prompt']}{C_END}")
    print(f"\n------------------------------------------------------------------------")
    
    # Mood Dashboard
    print(f"\n{C_BOLD}Atmosfer & Duygu Analizi Göstergeleri:{C_END}")
    print(f"  {C_BOLD}Baskın Vibe:{C_END} {C_MAGENTA}{result.get('dominant_vibe', style_name)}{C_END}\n")
    
    print_progress_bar("Gizem & Sürreal", result.get("vibe_mysterious", 50), C_MAGENTA)
    print_progress_bar("Dinamizm & Canlılık", result.get("vibe_dynamic", 50), C_CYAN)
    print_progress_bar("Melankoli & Gölgeler", result.get("vibe_dark", 35), C_BLUE)
    print_progress_bar("Görsel Detay Seviyesi", result.get("complexity", 70), C_GREEN)
    
    # Color Palette suggestions
    print(f"\n{C_BOLD}Önerilen Renk Paleti (HEX Kodları):{C_END}")
    palette = result.get("color_palette", [])
    palette_blocks = "  "
    for color in palette:
        palette_blocks += f"  [{C_BOLD}{color}{C_END}]"
    print(palette_blocks)
    
    # Magic Words
    print(f"\n{C_BOLD}Prompt Geliştirici Kelimeler (İsteğe Bağlı Eklenebilir):{C_END}")
    magic = ", ".join(result.get("magic_words", ["highly detailed", "cinematic lighting"]))
    print(f"  * {C_YELLOW}{magic}{C_END}")
    
    print(f"\n{C_GREEN}{C_BOLD}========================================================================{C_END}")
    print(f"{C_GREEN}✔ İşlem tamamlandı. Promptu dilediğiniz çizim aracında kullanabilirsiniz!{C_END}\n")

if __name__ == "__main__":
    # Ensure ANSI terminal escape characters are processed correctly on Windows
    import os
    if os.name == 'nt':
        os.system('color')
    main()
