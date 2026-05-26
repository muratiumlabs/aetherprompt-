# 🌟 AetherPrompt - AI Art Prompt Optimizer & Mood Analyzer

**AetherPrompt**, kullanıcının Türkçe olarak yazdığı basit ve temel çizim fikirlerini (Örn: *"Karanlıkta parlayan bir robot çiz"*), görsel yapay zeka motorlarının (Midjourney v6, Google Veo, Nano Banana, SDXL vb.) en iyi anlayacağı İngilizce profesyonel promptlara dönüştüren ve bu promptların sanatsal atmosferini (mood) analiz eden çok amaçlı lüks bir araçtır.

Bu proje hem **göz alıcı fütüristik bir Web Uygulaması (HTML/CSS/JS)** hem de terminalden çalışabilen **sıfır bağımlılıklı bir Python CLI betiği** içermektedir.

---

## ✨ Özellikler

1. **Çoklu Model Desteği (API Entegrasyonu)**:
   * **GROQ AI (Llama 3.3 70B)**: Yıldırım hızında ve son derece zeki zenginleştirmeler sunar.
   * **Gemini 3.1 Flash-Lite**: Akıcı ve sanatsal olarak geniş yetenekli çeviriler üretir.
   * **Gemini 2.5 Flash**: Yüksek düzey sanatsal yaratıcılık ve dengeli görsel komutlar tasarlar.
2. **Cam Efekti Tasarım Sistemi (Glassmorphic Dark Theme)**:
   * Derin uzay mavisi ve parıldayan HSL neon geçişleri.
   * Yumuşak arka plan süzülen partikülleri ve üzerine gelindiğinde parıldayan kartlar.
3. **Dinamik Duygu ve Atmosfer Göstergeleri (Mood Dashboard)**:
   * Yapay zekanın ürettiği sahneyi analiz ederek *Gizem*, *Dinamizm/Neon Gücü*, *Karanlık/Melankoli* ve *Görsel Detay* yüzdelerini canlı ve animasyonlu barlarla görselleştirir.
4. **Sanatsal Renk Paleti Oluşturucu**:
   * Sahnenin ruhuna uygun 5 uyumlu rengi HEX kodlarıyla üretir. HEX kodlarına tıklayarak doğrudan kopyalayabilirsiniz.
5. **Tek Tıkla Prompt Zenginleştiriciler (Magic Words)**:
   * Sahnenizin tarzına en uygun zenginleştirici anahtar kelimeleri (Örn: *octane render, volumetric lighting*) tek tıkla prompta ekler.
6. **Güvenli API Saklama & Ön Kurulum**:
   * API anahtarlarınız önceden tanımlanmıştır, anında çalışmaya hazırdır! Dilerseniz ayarlardan kendi anahtarlarınızı girip yerel tarayıcı hafızasında saklayabilirsiniz.
7. **Çevrimdışı Mod (Offline Fallback Engine)**:
   * İnternet veya API bağlantınız olmasa bile yerleşik akıllı algoritmasıyla promptu zenginleştirir, duygu analizini ve renk paletini yerel olarak hesaplar.

---

## 🚀 Çalıştırma Yönergeleri

### 1. Web Uygulamasını Çalıştırma
Herhangi bir kurulum veya sunucu gerektirmez!
* Proje klasöründeki `index.html` dosyasına **çift tıklayarak** herhangi bir modern web tarayıcısında (Chrome, Edge, Opera, Safari) anında çalıştırabilirsiniz.

### 2. Python Scriptini Çalıştırma
Betiğin en önemli özelliği **SIFIR bağımlılık** ile çalışmasıdır! `pip install` ile harici kütüphane yüklemenize gerek kalmadan, doğrudan Python'ın yerleşik kütüphaneleriyle çalışır.
* Terminalinizi veya komut satırını açın ve şu komutu yazın:
  ```bash
  python aether_prompt.py
  ```

---

## 📦 GitHub'a Aktarma ve Ücretsiz Canlıya Alma (GitHub Pages)

Bu projeyi GitHub hesabınıza yüklemek ve dünya çapında herkesin erişebileceği ücretsiz bir web sitesi olarak yayına almak için şu adımları izleyebilirsiniz:

### Adım 1: Git Deposunu Başlatın
Masaüstünüzdeki `AI analiz prompt` klasörünün içinde bir terminal (PowerShell veya CMD) açın ve şu komutları sırasıyla çalıştırın:
```bash
# Git deposunu başlat
git init

# Tüm dosyaları takip listesine ekle
git add .

# İlk yükleme kaydını oluştur
git commit -m "İlk Commit - AetherPrompt v1.0"
```

### Adım 2: GitHub Üzerinde Yeni Depo (Repository) Oluşturun
1. [GitHub](https://github.com) hesabınıza giriş yapın.
2. Sağ üstteki **"+"** ikonuna tıklayıp **"New repository"** seçeneğini seçin.
3. Depo adını `AI-art-prompt-optimizer` veya dilediğiniz bir isim yapın. Depoyu **Public (Açık)** olarak ayarlayın ve "Create repository" butonuna basın.

### Adım 3: Kodları GitHub'a Gönderin
GitHub'ın size verdiği bağlantıları terminalinizde çalıştırarak kodlarınızı yükleyin:
```bash
# GitHub deponuzu yerel deponuzla eşleştirin (URL kısmını kendi deponuzla değiştirin)
git remote add origin https://github.com/KULLANICI_ADINIZ/DEPO_ADINIZ.git

# Ana dalı main olarak adlandırın
git branch -M main

# Kodları GitHub'a yükleyin
git push -u origin main
```

### Adım 4: Web Sitesini Ücretsiz Yayına Alın (GitHub Pages)
1. GitHub web sitesinde oluşturduğunuz deponun sayfasına gidin.
2. Üst menüdeki **"Settings"** (Ayarlar) sekmesine tıklayın.
3. Sol menüden **"Pages"** sekmesine gelin.
4. **"Build and deployment"** başlığı altındaki **Branch** seçeneğini `None` yerine `main` yapın ve klasörü `/ (root)` olarak bırakıp **"Save"** butonuna basın.
5. Yaklaşık 1-2 dakika içinde sayfanın üst kısmında size özel canlı web sitenizin adresi belirecektir! (Örn: `https://kullaniciadiniz.github.io/depoadi/`)

---

## 🛠 Kullanılan Teknolojiler

* **Web Front-End**: HTML5, Vanilla CSS3 (Backdrop-filter Glassmorphism, HSL Color System, CSS Grids), Vanilla Javascript (ES6 Fetch, LocalStorage).
* **AI API Integration**: GROQ Cloud API (Llama 3.3), Google Generative Language API (Gemini Generative Engine).
* **Python Back-End**: Python 3, `urllib.request`, `json`, `os` (sıfır bağımlılıklı saf API entegrasyonu).
* **Aesthetic Assets**: Ionicons v7 Minimalist Icons, Google Fonts (Outfit & Inter).

---

*AetherPrompt ile hayal gücünüzü kusursuz promptlara dökün ve yapay zeka sanatının keyfini çıkarın!* ✨🎨
