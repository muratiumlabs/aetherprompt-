/* ----------------------------------------------------
   AETHERPROMPT FRONTEND LOGIC (app.js)
   Integrates GROQ AI & Gemini APIs with custom JSON parser
   🔒 API keys are loaded from config.js (gitignored — never in GitHub)
---------------------------------------------------- */

// 1. API Keys — config.js'den yüklenir (gitignore'da, GitHub'a gitmez)
//    localStorage'da kayıtlı key varsa onu kullan (ayarlar panelinden değiştirilebilir)
const _cfg = window.AETHER_CONFIG || {};
const DEFAULT_KEYS = {
    groq:   '',
    gemini: ''
};

// State Variables
let currentStyle = 'Cyberpunk / Sci-Fi';
let currentStyleKeywords = 'cyberpunk, futuristic neon lighting, high-tech, octane render, complex circuitry, dark synthwave vibe';
let apiKeys = { ...DEFAULT_KEYS };
let promptHistory = [];
let characterCards = []; // Dynamic list of active character objects

// Önce config.js'deki key'leri yükle, sonra localStorage override
apiKeys.groq   = localStorage.getItem('aether_groq_key')    || _cfg.groqKey   || '';
apiKeys.gemini = localStorage.getItem('aether_gemini_key')  || _cfg.geminiKey || '';

// 2. DOM Elements
const turkishPromptInput = document.getElementById('turkish-prompt');
const modelSelector = document.getElementById('model-selector');
const artGeneratorSelector = document.getElementById('art-generator-selector');
const languageSelector = document.getElementById('language-selector');
const lightingSelect = document.getElementById('lighting-select');
const aspectRatioSelect = document.getElementById('aspect-ratio-select');
const btnOptimize = document.getElementById('btn-optimize');
const btnSpinner = document.getElementById('btn-spinner');

// Output elements
const outputTitle = document.getElementById('output-title');
const optimizedPromptText = document.getElementById('optimized-prompt-text');
const btnCopyPrompt = document.getElementById('btn-copy-prompt');
const copyIcon = document.getElementById('copy-icon');
const artBadge = document.getElementById('art-badge');
const enhancersArea = document.getElementById('enhancers-area');
const enhancerChipsContainer = document.getElementById('enhancer-chips-container');

// Mood analyzer elements
const mainVibeIcon = document.getElementById('main-vibe-icon');
const mainVibeName = document.getElementById('main-vibe-name');
const barMysterious = document.getElementById('bar-mysterious');
const valMysterious = document.getElementById('val-mysterious');
const barDynamic = document.getElementById('bar-dynamic');
const valDynamic = document.getElementById('val-dynamic');
const barDark = document.getElementById('bar-dark');
const valDark = document.getElementById('val-dark');
const barComplexity = document.getElementById('bar-complexity');
const valComplexity = document.getElementById('val-complexity');

// Palette
const paletteContainer = document.getElementById('palette-container');

// Settings modal
const settingsPanel = document.getElementById('settings-panel');
const btnToggleSettings = document.getElementById('btn-toggle-settings');
const btnCloseSettings = document.getElementById('btn-close-settings');
const btnSaveSettings = document.getElementById('btn-save-settings');
const inputGroqKey = document.getElementById('input-groq-key');
const inputGeminiKey = document.getElementById('input-gemini-key');

// Toast
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toast-message');

// Karakter Tutarlılık DOM Elemanları
const charConsistencyToggle = document.getElementById('char-consistency-toggle');
const consistencyBody = document.getElementById('consistency-body');
const charWeightSlider = document.getElementById('char-weight-slider');
const charWeightVal = document.getElementById('char-weight-val');
const charSheetToggle = document.getElementById('char-sheet-toggle');
const charSheetStyleGroup = document.getElementById('char-sheet-style-group');
const charSheetStyleSelect = document.getElementById('char-sheet-style-select');
const consistencyHeader = document.getElementById('consistency-header');
const historyList = document.getElementById('history-list');
const historyEmpty = document.getElementById('history-empty');
const btnClearHistory = document.getElementById('btn-clear-history');

// Multi-Character Dynamic Container Elements
const characterListContainer = document.getElementById('character-list-container');
const btnAddCharacter = document.getElementById('btn-add-character');

// Gemini Assistant Micro Elements
const btnGenerateIdea = document.getElementById('btn-generate-idea');
const spinnerMicroIdea = document.getElementById('spinner-micro-idea');

// Particle background decoration
createParticles();

// 3. Initialize & Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Initialize beautiful glassmorphic custom dropdown selects
    initCustomSelects();

    // Set API input values from localStorage
    inputGroqKey.value = apiKeys.groq;
    inputGeminiKey.value = apiKeys.gemini;

    // 🔑 İlk ziyarette veya key yoksa ayarlar panelini otomatik aç
    if (!apiKeys.groq && !apiKeys.gemini) {
        setTimeout(() => {
            settingsPanel.classList.add('open');
            showToast('👋 Hoş geldiniz! Lütfen API anahtarlarınızı girerek başlayın.', 'key-outline');
        }, 800);
    }
    
    // Style presets cards selection
    const styleCards = document.querySelectorAll('.style-card');
    styleCards.forEach(card => {
        card.addEventListener('click', () => {
            styleCards.forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            currentStyle = card.dataset.style;
            currentStyleKeywords = card.dataset.keywords;
        });
    });

    // Preset chips click
    const presetChips = document.querySelectorAll('.preset-chip');
    presetChips.forEach(chip => {
        chip.addEventListener('click', () => {
            turkishPromptInput.value = chip.dataset.text;
            showToast('Örnek fikir yüklendi!', 'sparkles-outline');
        });
    });

    // Art Generator selection badge update
    artGeneratorSelector.addEventListener('change', () => {
        artBadge.textContent = artGeneratorSelector.options[artGeneratorSelector.selectedIndex].text;
    });

    // API settings modal events
    btnToggleSettings.addEventListener('click', () => settingsPanel.classList.add('open'));
    btnCloseSettings.addEventListener('click', () => settingsPanel.classList.remove('open'));
    btnSaveSettings.addEventListener('click', saveApiSettings);

    // Optimize trigger
    btnOptimize.addEventListener('click', handleOptimization);

    // Karakter Tutarlılık olay dinleyicileri
    consistencyHeader.addEventListener('click', (e) => {
        if (e.target.closest('.toggle-wrapper') || e.target.closest('.toggle-checkbox')) return;
        charConsistencyToggle.checked = !charConsistencyToggle.checked;
        triggerConsistencyToggle();
    });
    charConsistencyToggle.addEventListener('change', triggerConsistencyToggle);
    
    function triggerConsistencyToggle() {
        if (charConsistencyToggle.checked) {
            consistencyBody.classList.remove('collapsed');
            showToast('Karakter Tutarlılık Motoru aktif!', 'person-outline');
        } else {
            consistencyBody.classList.add('collapsed');
        }
    }
    
    charWeightSlider.addEventListener('input', () => {
        charWeightVal.textContent = `${charWeightSlider.value}%`;
    });

    charSheetToggle.addEventListener('change', () => {
        if (charSheetToggle.checked) {
            charSheetStyleGroup.classList.remove('hidden-style');
            showToast('Model Sayfası şablonu aktif edildi!', 'grid-outline');
        } else {
            charSheetStyleGroup.classList.add('hidden-style');
        }
    });

    // Copy to clipboard trigger
    btnCopyPrompt.addEventListener('click', copyPromptToClipboard);

    // Clear history event
    btnClearHistory.addEventListener('click', () => {
        if (promptHistory.length === 0) return;
        if (confirm('Tüm prompt geçmişinizi silmek istediğinize emin misiniz?')) {
            promptHistory = [];
            saveHistory();
            renderHistory();
            showToast('Geçmiş tamamen temizlendi!', 'trash-outline');
        }
    });

    // Mouse hover position tracker for premium glass-card spotlight effect
    const glassCards = document.querySelectorAll('.glass-card');
    glassCards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            card.style.setProperty('--mouse-x', x);
            card.style.setProperty('--mouse-y', y);
        });
    });

    // Gemini Art Idea + Character assistant button click
    if (btnGenerateIdea) {
        btnGenerateIdea.addEventListener('click', async () => {
            if (!apiKeys.gemini) {
                showToast('Lütfen önce API anahtarını yapılandırın!', 'key-outline');
                settingsPanel.classList.add('open');
                return;
            }

            const spinner = spinnerMicroIdea;
            const btnText = btnGenerateIdea.querySelector('.btn-micro-text');
            
            spinner.classList.remove('hidden');
            btnText.style.opacity = '0.5';
            btnGenerateIdea.disabled = true;

            try {
                // Tek API çağrısında hem sahne hem karakterler üret (uyumlu olsun)
                const systemPrompt = `Sen profesyonel bir yaratıcı yönetmen ve karakter tasarım asistanısın.
Kullanıcının seçtiği sanat tarzına birebir uyan, özgün ve sinematik bir sahne fikri ile o sahneye dahil olacak 1 veya 2 karakterin adı ve fiziksel özelliklerini oluştur. Sahne ve karakterler birbiriyle TAMAMEN uyumlu ve tutarlı olmalıdır.

Seçili Sanat Tarzı: ${currentStyle}
Tarz Anahtar Kelimeleri: ${currentStyleKeywords}

Yanıtını SADECE aşağıdaki JSON formatında ver. JSON dışında hiçbir metin, açıklama veya kod bloğu (örn: \`\`\`json) EKLEME:
{
  "scene": "Türkçe, tek cümlelik yaratıcı ve sinematik sahne fikri. Karakterlerin adlarını sahne içinde kullan.",
  "characters": [
    { "name": "Karakter1Adı", "features": "Fiziksel özellikleri (saç, göz, kıyafet detayı, belirgin iz vb.) tek cümle halinde" },
    { "name": "Karakter2Adı", "features": "Fiziksel özellikleri tek cümle halinde" }
  ]
}
NOT: Eğer sahne tek karaktere uygunsa "characters" dizisinde sadece 1 eleman olsun. Maksimum 2 karakter üret.`;

                const resultText = await callGeminiLiteDirect(systemPrompt, "");

                // Güçlü JSON ayıklama
                let cleaned = resultText.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
                const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
                if (jsonMatch) cleaned = jsonMatch[0];

                let parsed;
                try {
                    parsed = JSON.parse(cleaned);
                } catch (e) {
                    // JSON bozuksa sadece sahne fikri olarak kullan
                    typeWriterEffect(turkishPromptInput, resultText.trim());
                    showToast('Sahne fikri üretildi (karakter ayrıştırılamadı).', 'sparkles-outline');
                    return;
                }

                // 1. Sahne fikrini yaz
                if (parsed.scene) {
                    typeWriterEffect(turkishPromptInput, parsed.scene);
                }

                // 2. Karakterleri kartlara ekle
                if (parsed.characters && Array.isArray(parsed.characters) && parsed.characters.length > 0) {
                    
                    // Mevcut BOŞ kartları temizle (doluysa bırak)
                    const emptyCards = characterCards.filter(c => !c.nameInput.value.trim() && !c.featuresInput.value.trim());
                    emptyCards.forEach(c => {
                        c.cardEl.remove();
                        characterCards = characterCards.filter(x => x.id !== c.id);
                    });

                    // Karakter tutarlılık panelini aç
                    const consistencyToggle = document.getElementById('char-consistency-toggle');
                    const consistencyPanel = document.querySelector('.char-consistency-panel');
                    if (consistencyToggle && !consistencyToggle.checked) {
                        consistencyToggle.checked = true;
                        consistencyToggle.dispatchEvent(new Event('change', { bubbles: true }));
                        if (consistencyPanel) consistencyPanel.classList.add('open');
                    }

                    // Her karakter için kart ekle ve typewriter ile doldur
                    parsed.characters.slice(0, 2).forEach((char, idx) => {
                        if (!char.name && !char.features) return;
                        if (characterCards.length >= 5) return;

                        addCharacterCard();
                        const newCard = characterCards[characterCards.length - 1];
                        
                        // Typewriter ile doldur (kısa gecikmeyle ardışık)
                        setTimeout(() => {
                            if (char.name) typeWriterEffect(newCard.nameInput, char.name);
                            setTimeout(() => {
                                if (char.features) typeWriterEffect(newCard.featuresInput, char.features);
                            }, 150);
                        }, idx * 400);
                    });

                    showToast(`✨ Sahne + ${parsed.characters.length} karakter üretildi!`, 'sparkles-outline');
                } else {
                    showToast('Yaratıcı fikir üretildi!', 'sparkles-outline');
                }

            } catch (err) {
                console.error('Gemini Art Idea assistant error:', err);
                const shortMsg = err.message?.substring(0, 80) || 'Bilinmeyen hata';
                showToast(`Asistan hatası: ${shortMsg}`, 'alert-circle-outline');
            } finally {
                spinner.classList.remove('hidden');
                spinner.classList.add('hidden');
                btnText.style.opacity = '1';
                btnGenerateIdea.disabled = false;
            }
        });
    }

    // Add Character button click
    if (btnAddCharacter) {
        btnAddCharacter.addEventListener('click', () => {
            if (characterCards.length >= 5) {
                showToast('Maksimum 5 karakter ekleyebilirsiniz!', 'warning-outline');
                return;
            }
            addCharacterCard();
            showToast('Yeni karakter kartı eklendi.', 'person-add-outline');
        });
    }

    // Add default character card on start
    if (characterListContainer && characterCards.length === 0) {
        addCharacterCard();
    }

    // Initial load of history
    loadHistory();
});

// Password visibility toggler
function togglePasswordVisibility(inputId) {
    const input = document.getElementById(inputId);
    const type = input.type === 'password' ? 'text' : 'password';
    input.type = type;
}

// 4. API Settings Controller
function saveApiSettings() {
    apiKeys.groq = inputGroqKey.value.trim();
    apiKeys.gemini = inputGeminiKey.value.trim();
    
    localStorage.setItem('aether_groq_key', apiKeys.groq);
    localStorage.setItem('aether_gemini_key', apiKeys.gemini);
    
    settingsPanel.classList.remove('open');
    showToast('Ayarlar başarıyla kaydedildi!', 'checkmark-circle-outline');
}

// 5. Optimization & API Coordinator
async function handleOptimization() {
    const turkishPrompt = turkishPromptInput.value.trim();
    if (!turkishPrompt) {
        showToast('Lütfen bir sanat fikri yazın!', 'warning-outline');
        turkishPromptInput.focus();
        return;
    }

    // Toggle loading UI state
    setLoadingState(true);

    const selectedModel = modelSelector.value;
    const targetGenerator = artGeneratorSelector.value;
    const lighting = lightingSelect.options[lightingSelect.selectedIndex].text;
    const aspectRatio = aspectRatioSelect.value;
    const targetLanguage = languageSelector.value;

    const videoGenerators = ['veo', 'sora', 'runway', 'luma', 'pika'];
    const isVideo = videoGenerators.includes(targetGenerator);

    // Update Output title dynamically
    if (targetLanguage === 'tr') {
        outputTitle.innerHTML = `<ion-icon name="sparkles"></ion-icon> Optimize Edilmiş Türkçe ${isVideo ? 'Video' : 'Görsel'} Promptu`;
    } else {
        outputTitle.innerHTML = `<ion-icon name="sparkles"></ion-icon> Optimize Edilmiş İngilizce ${isVideo ? 'Video' : 'Görsel'} Promptu`;
    }

    // Gather dynamic characters list
    const activeCharacters = [];
    if (charConsistencyToggle.checked) {
        characterCards.forEach(char => {
            const name = char.nameInput.value.trim();
            const features = char.featuresInput.value.trim();
            const url = char.urlInput.value.trim();
            const activeUrl = url.length > 0 ? url : (char.imageBase64 ? (char.fileInput.files[0] ? char.fileInput.files[0].name : "local_character_image.png") : "");
            
            if (name || features || activeUrl) {
                activeCharacters.push({
                    name: name || 'Character',
                    features: features || 'No description',
                    url: activeUrl,
                    hasImage: activeUrl.length > 0
                });
            }
        });
    }

    try {
        let resultData = null;
        
        if (selectedModel === 'groq') {
            resultData = await callGroqAPI(turkishPrompt, targetGenerator, lighting, aspectRatio, targetLanguage, isVideo, activeCharacters);
        } else {
            // gemini-lite, gemini-flash, or gemini-3.5-flash
            let modelName = 'gemini-1.5-flash';
            if (selectedModel === 'gemini-flash') {
                modelName = 'gemini-2.0-flash';
            } else if (selectedModel === 'gemini-3.5-flash') {
                modelName = 'gemini-3.5-flash';
            }
            resultData = await callGeminiAPI(modelName, turkishPrompt, targetGenerator, lighting, aspectRatio, targetLanguage, isVideo, activeCharacters);
        }

        if (resultData) {
            renderDashboard(resultData, targetGenerator, aspectRatio);
            showToast('Prompt başarıyla optimize edildi!', 'sparkles-outline');
        } else {
            throw new Error('Yanıt alınamadı. Çevrimdışı mod çalıştırılıyor.');
        }

    } catch (error) {
        console.error('Optimization error:', error);
        showToast('API hatası! Yerel motorla optimize ediliyor...', 'alert-circle-outline');
        // Offline Fallback Generator
        const offlineData = runOfflineGenerator(turkishPrompt, targetGenerator, lighting, aspectRatio, targetLanguage, isVideo, activeCharacters);
        renderDashboard(offlineData, targetGenerator, aspectRatio);
    } finally {
        setLoadingState(false);
    }
}

// Set Button and Spinner States
function setLoadingState(isLoading) {
    if (isLoading) {
        btnOptimize.disabled = true;
        btnSpinner.classList.remove('hidden');
        btnOptimize.querySelector('.btn-text').style.opacity = '0.5';
    } else {
        btnOptimize.disabled = false;
        btnSpinner.classList.add('hidden');
        btnOptimize.querySelector('.btn-text').style.opacity = '1';
    }
}

// 6. GROQ API Entegrasyonu
async function callGroqAPI(prompt, generator, lighting, aspectRatio, targetLanguage, isVideo, activeCharacters) {
    if (!apiKeys.groq) {
        throw new Error('GROQ API anahtarı girilmedi.');
    }

    const systemInstructions = getSystemInstructions(prompt, generator, lighting, aspectRatio, targetLanguage, isVideo, activeCharacters);

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKeys.groq}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
                { role: 'system', content: 'You are a professional prompt designer. You must only reply with a valid JSON block, containing no extra markdown formatting.' },
                { role: 'user', content: systemInstructions }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.7,
            max_tokens: 1000
        })
    });

    if (!response.ok) {
        const errDetails = await response.text();
        throw new Error(`GROQ API Hatası: ${response.status} - ${errDetails}`);
    }

    const data = await response.json();
    const contentText = data.choices[0].message.content;
    return JSON.parse(contentText);
}

// 7. Gemini API Entegrasyonu
async function callGeminiAPI(modelName, prompt, generator, lighting, aspectRatio, targetLanguage, isVideo, activeCharacters) {
    if (!apiKeys.gemini) {
        throw new Error('Gemini API anahtarı girilmedi.');
    }

    const systemInstructions = getSystemInstructions(prompt, generator, lighting, aspectRatio, targetLanguage, isVideo, activeCharacters);

    // Gemini API v1beta JSON schema structure
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKeys.gemini}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            contents: [
                { parts: [{ text: systemInstructions }] }
            ],
            generationConfig: {
                responseMimeType: 'application/json',
                temperature: 0.7,
                maxOutputTokens: 1000
            }
        })
    });

    if (!response.ok) {
        const errDetails = await response.text();
        throw new Error(`Gemini API Hatası: ${response.status} - ${errDetails}`);
    }

    const data = await response.json();
    const contentText = data.candidates[0].content.parts[0].text;
    return JSON.parse(contentText);
}

// 8. Core Prompts Construction (Instruction set)
function getSystemInstructions(prompt, generator, lighting, aspectRatio, targetLanguage, isVideo, activeCharacters) {
    const langInstructions = targetLanguage === 'tr' 
        ? `SADECE TÜRKÇE: Çizim fikrini İngilizceye ÇEVİRME. Promptu TÜRKÇE dilinde bırak, ancak onu görsel motorların (${generator}) en yüksek performansı alabileceği, sanatsal kelimelerle bezenmiş, son derece zengin ve profesyonel bir TÜRKÇE prompt'a dönüştür. (Örn: "Bir adam" yerine "Karizmatik ve kendinden emin duruşu olan bir adam...")`
        : `SADECE İNGİLİZCE: Çizim fikrini profesyonel İNGİLİZCE diline ÇEVİR. Görsel yapay zeka motorlarının (${generator}) en iyi anlayacağı sanatsal terimlerle, kamera detaylarıyla bezeli, son derece zengin bir İngilizce prompt'a dönüştür.`;

    const mediumInstructions = isVideo 
        ? `Bu bir HAREKETLİ VİDEO üreticisidir (${generator}). Promptu statik bir resim gibi değil, canlı bir video sahnesi veya animasyon üretecek şekilde tasarla. Kesinlikle kamera hareketleri (Örn: slow pan, smooth zoom, tracking shot, slow motion, aerial rotation), hareket dinamikleri (fluid motion, cinematic physics), kare hızı (24fps/30fps) ve gerçekçi video akıcılığıyla ilgili komutlar ekle.`
        : (generator === 'chatgpt'
            ? `Bu, ChatGPT Plus içindeki DALL-E 3 görsel üreticisidir. ChatGPT için promptlar kısa komutlar veya teknik kodlar (--ar, --v vb.) barındırmamalıdır! Onun yerine zengin, doğal, hikayesel ve paragraf bazlı betimleyici bir dil kullanılmalıdır. Promptu son derece detaylı bir sahne betimlemesi yapan akıcı bir paragraf olarak yaz.`
            : `Bu bir STATİK GÖRSEL üreticisidir (${generator}). Promptu hareketsiz, yüksek kaliteli, derin kompozisyona sahip tek kare bir resim veya fotoğraf üretecek şekilde tasarla.`);

    const isConsistencyActive = charConsistencyToggle.checked;
    const charWeight = charWeightSlider.value;
    const isCharSheetActive = charSheetToggle.checked;

    let consistencyInstructions = "";
    if (isConsistencyActive && activeCharacters && activeCharacters.length > 0) {
        let modelSheetRule = "";
        if (isCharSheetActive) {
            const charSheetStyle = charSheetStyleSelect.value;
            if (charSheetStyle === 'pixar') {
                modelSheetRule = '- ÖNEMLİ: Bu bir 3D Pixar ve Disney tarzı Animasyon Karakter Tasarım Sayfasıdır (3D CGI Pixar Character Model Sheet). Sahneleri tek bir resim yerine, bu karakterleri son derece kaliteli 3D animasyon (highly detailed render, friendly Disney eyes, smooth vinyl textures) stilinde çoklu açılardan (ön, yan ve 3/4 profil) gösteren bir model paftası halinde tasarla. Arka planı düz nötr stüdyo arka planı yap.';
            } else if (charSheetStyle === 'anime') {
                modelSheetRule = '- ÖNEMLİ: Bu bir Anime ve Manga Tarzı Karakter Konsept Tasarım Sayfasıdır (Anime Character Concept Art Sheet). Sahneleri Makoto Shinkai veya Studio Ghibli tarzında el çizimi esintileriyle, temiz çizgi sanatı (clean line-art), pastel tonlar ve çoklu açılardan (ön profil, yan profil ve farklı sevimli yüz ifadeleri) gösteren bir konsept paftası olarak tasarla. Arka planı düz veya beyaz yap.';
            } else if (charSheetStyle === 'game3d') {
                modelSheetRule = '- ÖNEMLİ: Bu bir 3D Dijital Oyun Karakter Tasarım Sayfasıdır (3D Game Character Model Turnaround Sheet). Sahneleri Unreal Engine veya Unity oyun motoru için modellenmiş bir 3D asset gibi, nötr bir T-Pose veya A-Pose duruşunda, ön, yan ve arka profilden gösteren bir T-pose turnaround paftası halinde tasarla. Arka plan tamamen boş stüdyo stili gri/beyaz olmalıdır.';
            } else if (charSheetStyle === 'chibi') {
                modelSheetRule = '- ÖNEMLİ: Bu sevimli bir Chibi ve minyatür oyuncak karakter tasarım paftasıdır (Cute Chibi Figurine Model Sheet). Sahneleri kocaman gözlü, büyük kafalı, sevimli küçük gövdeli (chibi style, vinyl toy aesthetic) olarak ön profil, yan profil ve farklı mimiklerle gösteren bir karakter sayfası olarak tasarla. Arka planı düz veya tatlı pastel renkte yap.';
            } else {
                modelSheetRule = '- ÖNEMLİ: Bu bir Karakter Tasarım Sayfasıdır (Character Sheet / Model Sheet). Tek bir sahne yerine karakterleri çoklu açılardan (ön profil, yan profil, 3/4 açılı çekim ve farklı duygusal mimikler) gösteren bir model paftası oluştur. Arka planı tamamen düz veya beyaz yap.';
            }
        }

        let charDetailsList = activeCharacters.map((char, index) => {
            return `- Karakter #${index+1}: Adı: "${char.name}", Ayırt Edici Fiziksel Özellikleri: "${char.features}", Görsel Referans: "${char.url || 'Yok'}"`;
        }).join('\n');

        let crefLinks = activeCharacters.filter(c => c.hasImage).map(c => c.url).join(' ');
        let crefRule = "";
        
        if (crefLinks.length > 0) {
            if (generator === 'midjourney') {
                crefRule = `\n- Çizim motoru Midjourney v6 olduğundan, promptun en sonuna strictly tek bir \` --cref ${crefLinks} --cw ${charWeight}\` parametresini ekle. Tüm referans URL'lerini boşluklarla ayırarak tek bir --cref arkasına yığ.`;
            } else {
                let dalRefText = activeCharacters.filter(c => c.hasImage).map(c => `[Character Reference (${c.name}): ${c.url}]`).join(' ');
                crefRule = `\n- Çizim motoru ChatGPT veya diğer motorlar olduğundan, promptun en sonuna strictly şu teknik referans etiketlerini ekle: \` ${dalRefText} [Character Weight: ${charWeight}]\``;
            }
        } else {
            crefRule = `\n- Bu sahnede hiçbir karakter için görsel referans linki girilmemiştir, bu yüzden promptun sonuna kesinlikle \` --cref \` veya \` [Character Reference] \` parametreleri EKLEME! Sadece metinsel çapa özelliklerini kullanarak karakterlerin tutarlılığını sağla.`;
        }

        consistencyInstructions = `
Karakter Tutarlılık Motoru Kuralları (BUNLARI KESİNLİKLE UYGULA):
- Sahne içinde aşağıdaki karakterler yer almaktadır. Her karakteri ismiyle (Örn: "Asel", "Mert") prompt içinde konumlandırmalı, onlara ait fiziksel ayırt edici özellikleri (${targetLanguage === 'tr' ? 'Türkçe' : 'İngilizce'} dilde) prompt metnine akıcı ve tutarlı bir şekilde harmanlamalısın:
${charDetailsList}
- Karakterlerin fiziksel özelliklerinin değişmemesini (çapa özellikleri) sağla. Diğer sahneleri, pozu ve arka planı bu çapalar etrafında kurgula.
${modelSheetRule}
${crefRule}
`;
    }

    let charInputDetails = "";
    if (isConsistencyActive && activeCharacters && activeCharacters.length > 0) {
        charInputDetails = activeCharacters.map((c, i) => {
            return `- Karakter #${i+1}: Adı: "${c.name}", Özellikleri: "${c.features}", Görsel Referans: "${c.url || 'Yok'}"`;
        }).join('\n');
    } else {
        charInputDetails = "- Karakter Tanımlanmamıştır.";
    }

    return `Kullanıcının Türkçe olarak yazdığı basit bir çizim fikrini, görsel yapay zeka motorları (${generator}) için mükemmel derecede optimize edilmiş, son derece estetik, sanatsal detaylarla bezeli profesyonel bir prompt'a dönüştür. Ayrıca bu promptun duygu durumunu ve atmosfersel özelliklerini analiz et.

Girdi Bilgileri:
- Kullanıcı Fikri: "${prompt}"
- Sanat Tarzı: "${currentStyle}" (Bu sanatsal tarza ait anahtar kelimeleri prompta dahil et: ${currentStyleKeywords})
- Işık & Atmosfer: "${lighting}"
- Çizim Platformu: "${generator}"
- Boyut Oranı (Aspect Ratio): "${aspectRatio}"
- Karakter Tutarlılığı: "${isConsistencyActive ? 'Aktif' : 'Pasif'}"
- Karakter Tasarım Sayfası Modu: "${isCharSheetActive ? 'Aktif' : 'Pasif'}"
- Aktif Karakterlerin Detayları:
${charInputDetails}
- Karakter Ağırlığı (Midjourney cw): "${charWeight}"

Motor Tipi ve Medya Kuralı:
${mediumInstructions}

Dil Kuralı:
${langInstructions}

Akıllı Harmanlama ve Anlamsal Analiz (Semantic Blending):
- Kullanıcının girdiği fikri (${prompt}) anlamsal olarak analiz et. Kullanıcı kendi metninde zaten belirli bir tarz (örneğin 'gothic', 'cyberpunk', 'beksinski' vb.) veya ışıklandırma ('bioluminescent') belirtmiş olabilir. Seçilen arayüz ayarlarıyla (Sanat Tarzı: "${currentStyle}", Işık: "${lighting}") kullanıcının kendi fikirlerini mükemmel bir şekilde harmanla (blend).
- ÖNEMLİ: Asla kelime ve kavram tekrarı yapma. Örneğin, kullanıcı metninde zaten 'gothic' yazdıysa ve tarz olarak da 'Dark Gothic' seçildiyse, promptta mükerrer şekilde 'gothic gotik gothic horror' kelimelerini ardı ardına yığma. Bunun yerine anlamsal olarak birleştirilmiş, tek, akıcı ve son derece sanatsal bir kompozisyon oluştur. Tekrarları temizle.
${consistencyInstructions}

Boyut Oranı (Aspect Ratio) Kuralı:
- Seçilen en-boy oranı: ${aspectRatio}. Bu boyut oranını tüm çizim ve video motorları için çıktı promptunda KESİNLİKLE belirtmelisin!
- Eğer çizim motoru Midjourney ise: Promptun en sonuna strictly \` --ar ${aspectRatio} --v 6.0\` ekle.
- Eğer çizim motoru ChatGPT (DALL-E 3) veya diğer tüm motorlar ise: Hem prompt metninin içinde bu en-boy oranına uygun kompozisyonu betimsel olarak yaz (Örn: "in a wide 16:9 widescreen format", "in a square 1:1 portrait composition", "cinematic 21:9 ultra-wide view" vb.) hem de promptun en sonuna strictly \` [Aspect Ratio: ${aspectRatio}]\` ifadesini teknik etiket olarak ekle. En-boy oranının çıktıda yer aldığından emin ol!

Senden Çıktıyı SADECE VE SADECE aşağıdaki JSON şemasına birebir uyacak şekilde almamız gerekiyor. Yanıtında JSON dışında hiçbir açıklama, markdown kodu veya düz yazı olmasın:

{
  "optimized_prompt": "Zenginleştirilmiş, son derece estetik prompt. Cümleler akıcı, sanatsal kelimelerle dolu olmalı. Çizim motoru ${generator} kurallarına göre optimize edilmiş olmalı. Boyut oranı kuralına göre ${aspectRatio} değeri prompt metninin sonuna eklenmelidir. Hedef dilde (${targetLanguage === 'tr' ? 'Türkçe' : 'İngilizce'}) olmalıdır.",
  "vibe_mysterious": 85, // 0-100 arası tamsayı. Gizem, büyüleyicilik, ruhanilik, sürreal oranını temsil eder.
  "vibe_dynamic": 70, // 0-100 arası tamsayı. Canlılık, enerji, neon gücü oranını temsil eder.
  "vibe_dark": 40, // 0-100 arası tamsayı. Karanlık, dramatiklik, melankoli oranını temsil eder.
  "complexity": 90, // 0-100 arası tamsayı. Çizimin detay zenginliği, karmaşıklığı, mikroskobik inceliği.
  "dominant_vibe": "${targetLanguage === 'tr' ? 'Siberpunk' : 'Cyberpunk'}", // Baskın atmosferi temsil eden TEK BİR Türkçe veya İngilizce kelime (Örn: Siberpunk, Masalsı, Epik, Sürreal, Görkemli, Huzurlu, Gizemli, Melankolik)
  "color_palette": ["#1A1A2E", "#16213E", "#0F3460", "#E94560", "#FFFFFF"], // Görüntünün ruhuna uyan 5 harika ve estetik uyumlu renk HEX kodu.
  "magic_words": ${targetLanguage === 'tr' ? (isVideo ? '["sinematik kamera hareketi", "yavas pan", "4k sinematik video"]' : '["sinematik isik", "yuksek detay", "ultra gercekci"]') : (isVideo ? '["slow cinematic pan", "fluid motion", "hyper-realistic video physics", "24fps 4k"]' : '["octane render", "cinematic lighting", "unreal engine 5"]')} // Kullanıcının tek tıkla ekleyebileceği, bu tarza en uygun 3-4 adet zenginleştirici terim.
}

Unutma! Yanıtın sadece geçerli bir JSON olmalıdır.`;
}

// Helper to remove duplicate semantic words between user input and template keywords
function cleanOfflineRedundancies(coreText, templateText) {
    if (!templateText) return '';
    const coreWords = coreText.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, "").split(/\s+/);
    const templatePhrases = templateText.split(', ');
    
    const filteredPhrases = templatePhrases.filter(phrase => {
        const phraseWords = phrase.toLowerCase().split(/\s+/);
        // If a phrase contains a word longer than 3 characters that is already in core words, skip it
        const hasOverlap = phraseWords.some(w => {
            if (w.length < 3) return false; // Ignore short words like "ve", "de", "in", "to"
            return coreWords.some(cw => cw.includes(w) || w.includes(cw));
        });
        return !hasOverlap;
    });
    
    return filteredPhrases.join(', ');
}

// 9. Offline Local Engine Fallback (Heuristic & Dictionary based translation/enrichment)
function runOfflineGenerator(prompt, generator, lighting, aspectRatio, targetLanguage, isVideo, activeCharacters) {
    // Descriptive aspect ratio words
    let aspectDescEn = "widescreen format";
    let aspectDescTr = "geniş ekran formatında";
    if (aspectRatio === "16:9") { aspectDescEn = "widescreen 16:9 format"; aspectDescTr = "geniş ekran 16:9 formatında"; }
    else if (aspectRatio === "1:1") { aspectDescEn = "square 1:1 composition"; aspectDescTr = "kare 1:1 kompozisyonunda"; }
    else if (aspectRatio === "9:16") { aspectDescEn = "vertical 9:16 format"; aspectDescTr = "dikey 9:16 formatında"; }
    else if (aspectRatio === "4:3") { aspectDescEn = "classic 4:3 photo format"; aspectDescTr = "klasik 4:3 fotoğraf formatında"; }
    else if (aspectRatio === "21:9") { aspectDescEn = "cinematic ultra-wide 21:9 aspect ratio"; aspectDescTr = "sinematik ultra geniş 21:9 formatında"; }

    // Read Character Consistency inputs from DOM
    const isConsistencyActive = charConsistencyToggle.checked;
    const charWeight = charWeightSlider.value;
    const isCharSheetActive = charSheetToggle.checked;
    const hasImageRef = activeCharacters && activeCharacters.some(c => c.hasImage);

    if (targetLanguage === 'tr') {
        // Turkish Offline zenginleştirme (enrichment) - no translation, keeping keywords and appending beautiful Turkish modifiers
        const styleTrKeywords = {
            'Cyberpunk / Sci-Fi': 'siberpunk tarzı, fütüristik neon aydınlatma, yüksek teknoloji, unreal engine 5 render, karmaşık devreler, koyu synthwave havası',
            'Cinematic Fantasy': 'epik fantastik tarzı, hiper gerçekçi, dramatik karanlık fantastik ışıklandırma, unreal engine 5 render, son derece detaylı, efsanevi atmosfer',
            'Surrealism / Dreamlike': 'sürrealist yağlı boya tarzı, rüya gibi detaylar, salvador dali stili, büyüleyici renk paleti, havada süzülen elementler, gizemli hava',
            'Anime / Manga Illustration': 'harika anime arka plan sanatı, canlı renkler, makoto shinkai stili, temiz çizgi sanatı, stüdyo ghibli estetiği',
            'Classic Oil Painting': 'yağlı boya tablosu, kalın fırça darbeleri, dinamik van gogh dokusu, dramatik chiaroscuro ışıklandırması, klasik şaheser kalitesi',
            'Dark Gothic / Horror': 'karanlık gotik atmosfer, lovecraftian korku elementleri, yoğun sis, yüksek kontrastlı chiaroscuro, karmaşık gölgeler, tekinsiz derecede güzel hava',
            'Photorealistic / Realism': 'foto-realistik tarz, 8k çözünürlük, ultra detaylı, hiper gerçekçi, dramatik sinematik ışıklandırma, profesyonel fotoğraf kompozisyonu, keskin odak, doğal dokular'
        };

        const stopWords = ['çiz', 'tane', 'adet', 'böyle', 'olsun', 'şekilde', 'olarak'];
        let cleanedInput = prompt.toLowerCase()
            .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, " ")
            .replace(/\s+/g, " ")
            .trim();

        let tokens = cleanedInput.split(' ');
        let filteredTokens = tokens.filter(t => !stopWords.includes(t));
        let corePrompt = filteredTokens.join(' ');
        
        let rawStyleText = styleTrKeywords[currentStyle] || 'sanatsal stil';
        // Clean duplicates between user core input and style template
        let styleText = cleanOfflineRedundancies(corePrompt, rawStyleText);
        if (!styleText) styleText = rawStyleText; // Fallback if fully filtered
        
        // Clean duplicates with lighting
        let cleanLighting = cleanOfflineRedundancies(corePrompt, lighting.toLowerCase());
        if (!cleanLighting) cleanLighting = lighting.toLowerCase();

        // Karakter Tutarlılık Metinsel Çapa ve Sayfası
        let characterHeader = "";
        let characterCore = "";
        if (isConsistencyActive && activeCharacters && activeCharacters.length > 0) {
            // Build descriptions for all characters
            let charDescs = activeCharacters.map(c => {
                let cleanFeat = cleanOfflineRedundancies(corePrompt, c.features);
                let featStr = cleanFeat ? cleanFeat : c.features;
                return `${c.name} (${featStr})`;
            }).join(' ve ');
            
            characterCore = `${charDescs}, `;
            
            if (isCharSheetActive) {
                const charSheetStyle = charSheetStyleSelect.value;
                if (charSheetStyle === 'pixar') {
                    characterHeader = "3d pixar disney animasyon tarzı karakter tasarım sayfası, çoklu açılardan 3d cgi model çizimleri, friendly disney style, smooth render, düz stüdyo arka planı, ";
                } else if (charSheetStyle === 'anime') {
                    characterHeader = "anime manga tarzı karakter konsept tasarım sayfası, temiz çizgi sanatı ve pastel tonlar, çoklu açılardan eskizler, stüdyo ghibli stili, düz arka plan, ";
                } else if (charSheetStyle === 'game3d') {
                    characterHeader = "3d oyun karakteri turnaround paftası, unreal engine turnaround asset, ön yan ve arka profilden model, nötr t-pose duruşu, düz gri stüdyo arka planı, ";
                } else if (charSheetStyle === 'chibi') {
                    characterHeader = "sevimli chibi oyuncak karakter tasarım paftası, büyük kafalı tatlı mini chibi, çoklu açılardan sevimli model paftası, düz pastel arka plan, ";
                } else {
                    characterHeader = "karakter tasarım sayfası, çoklu açılardan model çizimleri, düz arka plan, ";
                }
            }
        }

        // Dynamic additions based on video vs image vs chatgpt
        let finalPrompt = "";
        if (isVideo) {
            finalPrompt = `sinematik video: ${characterHeader}${characterCore}${corePrompt}, ${styleText}, ${cleanLighting} ile aydınlatılmış, ${aspectDescTr}, yavaş sinematik kamera hareketi, akıcı pürüzsüz hareket, yüksek çözünürlüklü video, fotogerçekçi fizik, 24fps`;
        } else if (generator === 'chatgpt') {
            finalPrompt = `DALL-E 3 için zengin sahne betimlemesi: ${characterHeader}${characterCore}${corePrompt}, ${styleText} tarzında, ${cleanLighting} ile aydınlatılmış, ${aspectDescTr}, şaheser kalitesinde, son derece detaylı ve derin bir atmosfer sunan sanatsal bir kompozisyon.`;
        } else {
            finalPrompt = `${characterHeader}${characterCore}${corePrompt}, ${styleText}, ${cleanLighting} ile aydınlatılmış, ${aspectDescTr}, şaheser, son derece detaylı, görsel olarak göz alıcı`;
        }

        // Enforce Character Reference
        if (isConsistencyActive && activeCharacters && activeCharacters.length > 0) {
            let crefLinks = activeCharacters.filter(c => c.hasImage).map(c => c.url).join(' ');
            if (crefLinks.length > 0) {
                if (generator === 'midjourney') {
                    finalPrompt += ` --cref ${crefLinks} --cw ${charWeight}`;
                } else {
                    let dalRef = activeCharacters.filter(c => c.hasImage).map(c => `[Character Reference (${c.name}): ${c.url}]`).join(' ');
                    finalPrompt += ` ${dalRef} [Character Weight: ${charWeight}]`;
                }
            }
        }

        // Enforce Aspect Ratio formatting
        if (generator === 'midjourney') {
            finalPrompt += ` --ar ${aspectRatio} --v 6.0`;
        } else {
            finalPrompt += ` [Aspect Ratio: ${aspectRatio}]`;
        }

        // Mock parameters matching Turkish
        let vibeMysterious = 50, vibeDynamic = 50, vibeDark = 40, complexity = 70;
        let dominantVibe = isVideo ? 'Video' : 'Estetik';
        let palette = ['#0f172a', '#1e293b', '#334155', '#6366f1', '#a78bfa'];

        if (currentStyle.includes('Cyberpunk')) {
            vibeMysterious = 65; vibeDynamic = 90; vibeDark = 55; complexity = 85; dominantVibe = 'Siberpunk';
            palette = ['#0d0d1e', '#1a0b2e', '#e94560', '#d946ef', '#00f2fe'];
        } else if (currentStyle.includes('Fantasy')) {
            vibeMysterious = 80; vibeDynamic = 70; vibeDark = 45; complexity = 90; dominantVibe = 'Masalsı';
            palette = ['#0c0f1a', '#241b45', '#7a22a3', '#ff6b6b', '#ffd166'];
        } else if (currentStyle.includes('Surrealism')) {
            vibeMysterious = 95; vibeDynamic = 50; vibeDark = 60; complexity = 75; dominantVibe = 'Sürreal';
            palette = ['#081c15', '#1b4332', '#2d6a4f', '#d8f3dc', '#ffb703'];
        } else if (currentStyle.includes('Oil Painting')) {
            vibeMysterious = 60; vibeDynamic = 45; vibeDark = 50; complexity = 80; dominantVibe = 'Klasik';
            palette = ['#2c1a04', '#4a2c02', '#8c5201', '#dfc27d', '#f6e8c3'];
        } else if (currentStyle.includes('Dark Gothic')) {
            vibeMysterious = 85; vibeDynamic = 40; vibeDark = 90; complexity = 85; dominantVibe = 'Karanlık';
            palette = ['#020205', '#101015', '#240606', '#690505', '#d1d1d6'];
        } else if (currentStyle.includes('Realism') || currentStyle.includes('Photorealistic')) {
            vibeMysterious = 40; vibeDynamic = 60; vibeDark = 45; complexity = 90; dominantVibe = 'Gerçekçi';
            palette = ['#080f1a', '#14213d', '#fca311', '#e5e5e5', '#ffffff'];
        }

        return {
            optimized_prompt: finalPrompt,
            vibe_mysterious: vibeMysterious,
            vibe_dynamic: vibeDynamic,
            vibe_dark: vibeDark,
            complexity: complexity,
            dominant_vibe: dominantVibe,
            color_palette: palette,
            magic_words: isVideo ? ['akici hareket', 'yavas kamera kaymasi', 'fotogercekci hareket'] : ['hiper gercekci', 'sinematik parilti', 'yuksek cozunurluk', 'goz alici']
        };
    }

    // Advanced token-based Turkish-to-English dictionary mapper for common art concepts (English mode)
    const dict = {
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
        
        // Extended character traits translations
        'saçlı': 'hair', 'gözlü': 'eyed', 'göz': 'eyes', 'saç': 'hair', 'kızıl': 'red', 
        'sarı': 'blonde', 'siyah': 'black', 'kahverengi': 'brown', 'mavi': 'blue', 
        'yeşil': 'green', 'gri': 'grey', 'gümüş': 'silver', 'beyaz': 'white', 
        'kısa': 'short', 'uzun': 'long', 'küt': 'bob cut', 'dövme': 'tattoo', 
        'dövmeli': 'tattooed', 'yara': 'scar', 'iz': 'scar', 'izi': 'scar', 'olan': 'with'
    };

    // Words to completely filter out from the final translation output as they are Turkish grammar fillers
    const stopWords = ['olacak', 'bu', 'olsun', 'çiz', 'tane', 'adet', 'böyle', 'şekilde', 'olarak'];

    // Clean and split the prompt into lowercase tokens
    let cleanedInput = prompt.toLowerCase()
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, " ")
        .replace(/\s+/g, " ")
        .trim();

    let tokens = cleanedInput.split(' ');
    let englishParts = [];

    tokens.forEach(token => {
        if (stopWords.includes(token)) return; // Skip Turkish filler words
        
        if (dict[token]) {
            englishParts.push(dict[token]);
        } else {
            // If already English or numeric, keep it. Otherwise discard untranslated Turkish words to prevent mixing
            if (/^[a-zA-Z0-9\-]+$/.test(token)) {
                englishParts.push(token);
            }
        }
    });

    // Remove adjacent duplicates (e.g. "man man")
    let finalKeywords = [];
    englishParts.forEach(word => {
        if (finalKeywords.length === 0 || finalKeywords[finalKeywords.length - 1] !== word) {
            finalKeywords.push(word);
        }
    });

    // Reconstruct core prompt
    let basePrompt = finalKeywords.join(', ');
    if (!basePrompt) {
        basePrompt = `a beautiful artistic rendering of ${prompt}`;
    }

    let rawStyleText = currentStyleKeywords;
    // Clean duplicates between user core input and style template
    let styleText = cleanOfflineRedundancies(basePrompt, rawStyleText);
    if (!styleText) styleText = rawStyleText; // Fallback if fully filtered
    
    // Clean duplicates with lighting
    let cleanLighting = cleanOfflineRedundancies(basePrompt, lighting.toLowerCase());
    if (!cleanLighting) cleanLighting = lighting.toLowerCase();

    // Karakter Tutarlılık Çevirisi ve Sayfası
    let characterHeader = "";
    let characterCore = "";
    if (isConsistencyActive && activeCharacters && activeCharacters.length > 0) {
        let charDescsEn = activeCharacters.map(c => {
            // Translate features using our simple local mapper
            let anchorCleaned = c.features.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, " ").replace(/\s+/g, " ").trim();
            let anchorTokens = anchorCleaned.split(' ');
            let anchorEnglish = [];
            anchorTokens.forEach(token => {
                if (stopWords.includes(token)) return;
                if (dict[token]) {
                    anchorEnglish.push(dict[token]);
                } else if (/^[a-zA-Z0-9\-]+$/.test(token)) {
                    anchorEnglish.push(token);
                }
            });
            let translatedAnchor = anchorEnglish.join(' ');
            let cleanFeat = cleanOfflineRedundancies(corePrompt, translatedAnchor);
            let finalFeat = cleanFeat ? cleanFeat : translatedAnchor;
            
            return `${c.name} (${finalFeat || 'character'})`;
        }).join(' and ');
        
        characterCore = `${charDescsEn}, `;
        
        if (isCharSheetActive) {
            const charSheetStyle = charSheetStyleSelect.value;
            if (charSheetStyle === 'pixar') {
                characterHeader = "3d pixar disney cgi character model sheet, dynamic expression poses, highly detailed 3d render, smooth friendly disney face structure, plain neutral studio background, ";
            } else if (charSheetStyle === 'anime') {
                characterHeader = "anime manga character concept art sheet, clean line-art, makoto shinkai style, multiple sketch angles, flat plain background, ";
            } else if (charSheetStyle === 'game3d') {
                characterHeader = "3d game asset character turnaround sheet, T-pose, front view, side view, back view profiles, unreal engine game-ready model, neutral studio grey background, ";
            } else if (charSheetStyle === 'chibi') {
                characterHeader = "cute chibi vinyl figurine model sheet, big head cute tiny body chibi style, toy turnaround model, multiple angles, plain pastel background, ";
            } else {
                characterHeader = "character expression model sheet, multiple angles, front view, side view, 3/4 angle shots, plain flat background, ";
            }
        }
    }

    // Dynamic additions based on video vs image vs chatgpt (English)
    let finalPrompt = "";
    if (isVideo) {
        finalPrompt = `a cinematic video of ${characterHeader}${characterCore}${basePrompt}, ${styleText}, in a setting illuminated by ${cleanLighting}, ${aspectDescEn}, slow cinematic camera movement, smooth fluid motion, high-definition video, photorealistic physics, 24fps`;
    } else if (generator === 'chatgpt') {
        finalPrompt = `A detailed DALL-E 3 masterpiece depicting: ${characterHeader}${characterCore}${basePrompt}, styled as ${styleText}, in a setting illuminated by ${cleanLighting}, ${aspectDescEn}, highly aesthetic composition, rich visuals, detailed and stunning.`;
    } else {
        finalPrompt = `${characterHeader}${characterCore}${basePrompt}, ${styleText}, in a setting illuminated by ${cleanLighting}, ${aspectDescEn}, masterpiece, highly detailed, visually stunning`;
    }
    
    // Enforce Character Reference
    if (isConsistencyActive && activeCharacters && activeCharacters.length > 0) {
        let crefLinks = activeCharacters.filter(c => c.hasImage).map(c => c.url).join(' ');
        if (crefLinks.length > 0) {
            if (generator === 'midjourney') {
                finalPrompt += ` --cref ${crefLinks} --cw ${charWeight}`;
            } else {
                let dalRef = activeCharacters.filter(c => c.hasImage).map(c => `[Character Reference (${c.name}): ${c.url}]`).join(' ');
                finalPrompt += ` ${dalRef} [Character Weight: ${charWeight}]`;
            }
        }
    }

    // Enforce Aspect Ratio formatting
    if (generator === 'midjourney') {
        finalPrompt += ` --ar ${aspectRatio} --v 6.0`;
    } else {
        finalPrompt += ` [Aspect Ratio: ${aspectRatio}]`;
    }

    // Dynamic mock mood calculation based on style and lighting
    let vibeMysterious = 50, vibeDynamic = 50, vibeDark = 40, complexity = 70;
    let dominantVibe = isVideo ? 'Video' : 'Estetik';
    let palette = ['#0f172a', '#1e293b', '#334155', '#6366f1', '#a78bfa'];

    if (currentStyle.includes('Cyberpunk')) {
        vibeMysterious = 65; vibeDynamic = 90; vibeDark = 55; complexity = 85;
        dominantVibe = 'Siberpunk';
        palette = ['#0d0d1e', '#1a0b2e', '#e94560', '#d946ef', '#00f2fe'];
    } else if (currentStyle.includes('Fantasy')) {
        vibeMysterious = 80; vibeDynamic = 70; vibeDark = 45; complexity = 90;
        dominantVibe = 'Masalsı';
        palette = ['#0c0f1a', '#241b45', '#7a22a3', '#ff6b6b', '#ffd166'];
    } else if (currentStyle.includes('Surrealism')) {
        vibeMysterious = 95; vibeDynamic = 50; vibeDark = 60; complexity = 75;
        dominantVibe = 'Sürreal';
        palette = ['#081c15', '#1b4332', '#2d6a4f', '#d8f3dc', '#ffb703'];
    } else if (currentStyle.includes('Oil Painting')) {
        vibeMysterious = 60; vibeDynamic = 45; vibeDark = 50; complexity = 80;
        dominantVibe = 'Klasik';
        palette = ['#2c1a04', '#4a2c02', '#8c5201', '#dfc27d', '#f6e8c3'];
    } else if (currentStyle.includes('Dark Gothic')) {
        vibeMysterious = 85; vibeDynamic = 40; vibeDark = 90; complexity = 85;
        dominantVibe = 'Karanlık';
        palette = ['#020205', '#101015', '#240606', '#690505', '#d1d1d6'];
    } else if (currentStyle.includes('Realism') || currentStyle.includes('Photorealistic')) {
        vibeMysterious = 40; vibeDynamic = 60; vibeDark = 45; complexity = 90;
        dominantVibe = 'Gerçekçi';
        palette = ['#080f1a', '#14213d', '#fca311', '#e5e5e5', '#ffffff'];
    }

    return {
        optimized_prompt: finalPrompt,
        vibe_mysterious: vibeMysterious,
        vibe_dynamic: vibeDynamic,
        vibe_dark: vibeDark,
        complexity: complexity,
        dominant_vibe: dominantVibe,
        color_palette: palette,
        magic_words: isVideo ? ['slow cinematic pan', 'fluid motion', 'hyper-realistic video physics', '24fps 4k'] : ['8k resolution', 'hyper detailed', 'cinematic glow', 'trending on artstation']
    };
}

// 10. Dashboard Renderer
function renderDashboard(data, generator, aspectRatio) {
    // 1. Render Prompt Output
    optimizedPromptText.textContent = data.optimized_prompt;
    optimizedPromptText.classList.add('active');
    btnCopyPrompt.disabled = false;

    // 2. Set Badges
    artBadge.textContent = artGeneratorSelector.options[artGeneratorSelector.selectedIndex].text;

    // 3. Render Enhancer chips
    enhancerChipsContainer.innerHTML = '';
    if (data.magic_words && data.magic_words.length > 0) {
        enhancersArea.classList.remove('hidden');
        data.magic_words.forEach(word => {
            const chip = document.createElement('button');
            chip.className = 'enhancer-chip';
            chip.textContent = `+ ${word}`;
            chip.addEventListener('click', () => {
                let currentText = optimizedPromptText.textContent;
                
                // Smart parameter position management (for Midjourney tags like --ar)
                if (generator === 'midjourney' && currentText.includes('--')) {
                    const parts = currentText.split(' --');
                    parts[0] = `${parts[0].trim()}, ${word}`;
                    optimizedPromptText.textContent = parts.join(' --');
                } else {
                    optimizedPromptText.textContent = `${currentText.trim()}, ${word}`;
                }
                
                showToast(`"${word}" prompta eklendi!`, 'sparkles-outline');
                chip.remove(); // Remove once appended
            });
            enhancerChipsContainer.appendChild(chip);
        });
    } else {
        enhancersArea.classList.add('hidden');
    }

    // 4. Render Mood Metrics
    mainVibeName.textContent = data.dominant_vibe || 'Özel';
    
    // Select Vibe Icon dynamically based on dominant vibe
    let vibeIcon = 'sparkles-outline';
    const domVibeLower = (data.dominant_vibe || '').toLowerCase();
    if (domVibeLower.includes('cyber') || domVibeLower.includes('siber')) vibeIcon = 'planet-outline';
    else if (domVibeLower.includes('masal') || domVibeLower.includes('fantastik') || domVibeLower.includes('epik')) vibeIcon = 'sparkles-outline';
    else if (domVibeLower.includes('sürreal') || domVibeLower.includes('gizem')) vibeIcon = 'eye-outline';
    else if (domVibeLower.includes('karanlık') || domVibeLower.includes('gotik') || domVibeLower.includes('melankoli')) vibeIcon = 'moon-outline';
    else if (domVibeLower.includes('klasik') || domVibeLower.includes('yağlı')) vibeIcon = 'brush-outline';
    
    mainVibeIcon.innerHTML = `<ion-icon name="${vibeIcon}"></ion-icon>`;

    // Update Progress Bars
    animateProgressBar(barMysterious, valMysterious, data.vibe_mysterious || 0);
    animateProgressBar(barDynamic, valDynamic, data.vibe_dynamic || 0);
    animateProgressBar(barDark, valDark, data.vibe_dark || 0);
    animateProgressBar(barComplexity, valComplexity, data.complexity || 0);

    // 5. Render Color Palette bubbles
    paletteContainer.innerHTML = '';
    if (data.color_palette && data.color_palette.length > 0) {
        data.color_palette.forEach(color => {
            const block = document.createElement('div');
            block.className = 'palette-color-block';
            block.style.backgroundColor = color;
            
            const span = document.createElement('span');
            span.className = 'color-hex';
            span.textContent = color.toUpperCase();
            
            block.appendChild(span);
            
            block.addEventListener('click', () => {
                navigator.clipboard.writeText(color.toUpperCase());
                showToast(`Renk kodu kopyalandı: ${color.toUpperCase()}`, 'color-filter-outline');
            });
            
            paletteContainer.appendChild(block);
        });
    }

    // Add prompt to local history
    addPromptToHistory(data.optimized_prompt, generator, aspectRatio, turkishPromptInput.value.trim());
}

// Progress bar animation runner
function animateProgressBar(barElement, valElement, targetValue) {
    barElement.style.width = '0%';
    valElement.textContent = '0%';
    
    setTimeout(() => {
        barElement.style.width = `${targetValue}%`;
        
        // Counter animation
        let count = 0;
        const interval = setInterval(() => {
            if (count >= targetValue) {
                valElement.textContent = `${targetValue}%`;
                clearInterval(interval);
            } else {
                count++;
                valElement.textContent = `${count}%`;
            }
        }, 10);
    }, 100);
}

// 11. Copy to clipboard management
function copyPromptToClipboard() {
    const textToCopy = optimizedPromptText.textContent.trim();
    if (!textToCopy) return;

    navigator.clipboard.writeText(textToCopy).then(() => {
        showToast('Prompt panoya kopyalandı!', 'copy-outline');
        
        // Button Micro-animation feedback
        btnCopyPrompt.classList.add('btn-primary');
        btnCopyPrompt.classList.remove('btn-secondary');
        copyIcon.setAttribute('name', 'checkmark-outline');
        
        setTimeout(() => {
            btnCopyPrompt.classList.remove('btn-primary');
            btnCopyPrompt.classList.add('btn-secondary');
            copyIcon.setAttribute('name', 'copy-outline');
        }, 2000);
    }).catch(err => {
        console.error('Copy failed:', err);
    });
}

// 12. Elegant Toast System
function showToast(message, iconName = 'checkmark-circle-outline') {
    toast.querySelector('ion-icon').setAttribute('name', iconName);
    toastMessage.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// 13. Floating particles backgrounds decoration builder
function createParticles() {
    const container = document.getElementById('particles');
    const particleCount = 20;

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        
        // Random styling
        const size = Math.random() * 4 + 1;
        const posX = Math.random() * 100;
        const posY = Math.random() * 100;
        const opacity = Math.random() * 0.4 + 0.1;
        const delay = Math.random() * 5;
        const duration = Math.random() * 15 + 10;

        particle.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            background: white;
            border-radius: 50%;
            top: ${posY}%;
            left: ${posX}%;
            opacity: ${opacity};
            filter: blur(1px);
            animation: float-particle ${duration}s linear infinite;
            animation-delay: -${delay}s;
        `;
        container.appendChild(particle);
    }
}

// Write the dynamic animation keyframe directly into document head
const styleSheet = document.createElement("style");
styleSheet.innerText = `
@keyframes float-particle {
    0% { transform: translateY(0px) rotate(0deg); opacity: 0.1; }
    50% { opacity: 0.4; }
    100% { transform: translateY(-100px) rotate(360deg); opacity: 0; }
}
`;
document.head.appendChild(styleSheet);

// ==========================================
// 14. PROMPT HISTORY & FAVORITES MANAGEMENT
// ==========================================

function loadHistory() {
    try {
        const stored = localStorage.getItem('aether_prompt_history');
        if (stored) {
            promptHistory = JSON.parse(stored);
        } else {
            promptHistory = [];
        }
    } catch (e) {
        console.error('History load failed:', e);
        promptHistory = [];
    }
    renderHistory();
}

function saveHistory() {
    try {
        localStorage.setItem('aether_prompt_history', JSON.stringify(promptHistory));
    } catch (e) {
        console.error('History save failed:', e);
    }
}

function addPromptToHistory(optimizedPrompt, generator, aspectRatio, rawInput) {
    if (!optimizedPrompt) return;
    
    // Check if the exact prompt is already at the top of the history to prevent duplicates
    if (promptHistory.length > 0 && promptHistory[0].optimizedPrompt === optimizedPrompt) {
        return;
    }
    
    const timeString = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    
    const historyItem = {
        id: Date.now() + Math.random().toString(36).substr(2, 5),
        optimizedPrompt: optimizedPrompt,
        generator: generator,
        aspectRatio: aspectRatio,
        rawInput: rawInput || 'Varsayılan Çizim Fikri',
        date: timeString,
        isFavorite: false
    };
    
    // Max 50 items in history
    promptHistory.unshift(historyItem);
    if (promptHistory.length > 50) {
        // Keep favorites, remove old standard ones if possible
        const nonFavIndex = promptHistory.findLastIndex(item => !item.isFavorite);
        if (nonFavIndex !== -1) {
            promptHistory.splice(nonFavIndex, 1);
        } else {
            promptHistory.pop();
        }
    }
    
    saveHistory();
    renderHistory();
}

function renderHistory() {
    if (!historyList) return;
    
    // Remove existing history items (keeping the empty placeholder if empty)
    const items = historyList.querySelectorAll('.history-item');
    items.forEach(el => el.remove());
    
    if (promptHistory.length === 0) {
        historyEmpty.style.display = 'flex';
        return;
    }
    
    historyEmpty.style.display = 'none';
    
    // Sort so favorites are always at the top of the list
    const sortedHistory = [...promptHistory].sort((a, b) => (b.isFavorite ? 1 : 0) - (a.isFavorite ? 1 : 0));
    
    sortedHistory.forEach(item => {
        const itemEl = document.createElement('div');
        itemEl.className = 'history-item';
        if (item.isFavorite) {
            itemEl.style.borderColor = 'rgba(255, 183, 3, 0.2)';
            itemEl.style.background = 'rgba(255, 183, 3, 0.015)';
        }
        
        // Generator options mappings
        const generatorLabel = artGeneratorSelector.querySelector(`option[value="${item.generator}"]`)?.text || item.generator;
        
        itemEl.innerHTML = `
            <div class="history-item-top">
                <span class="badge-mini">${generatorLabel}</span>
                <span class="badge-mini badge-ratio">${item.aspectRatio}</span>
                <span class="history-item-date">${item.date}</span>
            </div>
            <div class="history-item-text" title="Arayüze geri yüklemek için tıklayın">${item.optimizedPrompt}</div>
            <div class="history-item-actions">
                <button class="action-btn btn-restore" title="Bu Promptu Arayüze Yükle">
                    <ion-icon name="arrow-undo-outline"></ion-icon>
                </button>
                <button class="action-btn btn-copy" title="Promptu Kopyala">
                    <ion-icon name="copy-outline"></ion-icon>
                </button>
                <button class="action-btn btn-fav ${item.isFavorite ? 'active' : ''}" title="Favorilere Ekle/Çıkar">
                    <ion-icon name="${item.isFavorite ? 'star' : 'star-outline'}"></ion-icon>
                </button>
                <button class="action-btn btn-delete" title="Geçmişten Sil">
                    <ion-icon name="trash-outline"></ion-icon>
                </button>
            </div>
        `;
        
        // Events
        const textEl = itemEl.querySelector('.history-item-text');
        const btnRestore = itemEl.querySelector('.btn-restore');
        const btnCopy = itemEl.querySelector('.btn-copy');
        const btnFav = itemEl.querySelector('.btn-fav');
        const btnDel = itemEl.querySelector('.btn-delete');
        
        // Restore actions
        const restoreHandler = () => {
            turkishPromptInput.value = item.rawInput;
            optimizedPromptText.textContent = item.optimizedPrompt;
            optimizedPromptText.classList.add('active');
            btnCopyPrompt.disabled = false;
            
            // Set generator dropdown and dispatch change for custom select sync
            if (artGeneratorSelector.querySelector(`option[value="${item.generator}"]`)) {
                artGeneratorSelector.value = item.generator;
                artGeneratorSelector.dispatchEvent(new Event('change'));
            }
            // Set aspect ratio dropdown and dispatch change for custom select sync
            if (aspectRatioSelect.querySelector(`option[value="${item.aspectRatio}"]`)) {
                aspectRatioSelect.value = item.aspectRatio;
                aspectRatioSelect.dispatchEvent(new Event('change'));
            }
            
            showToast('Prompt arayüze yüklendi!', 'arrow-undo-outline');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        };
        
        textEl.addEventListener('click', restoreHandler);
        btnRestore.addEventListener('click', restoreHandler);
        
        // Copy action
        btnCopy.addEventListener('click', () => {
            navigator.clipboard.writeText(item.optimizedPrompt).then(() => {
                showToast('Prompt panoya kopyalandı!', 'copy-outline');
                
                // Button micro-feedback
                const copyIconEl = btnCopy.querySelector('ion-icon');
                copyIconEl.setAttribute('name', 'checkmark-outline');
                setTimeout(() => copyIconEl.setAttribute('name', 'copy-outline'), 1500);
            });
        });
        
        // Toggle Fav action
        btnFav.addEventListener('click', () => {
            const originalItem = promptHistory.find(x => x.id === item.id);
            if (originalItem) {
                originalItem.isFavorite = !originalItem.isFavorite;
                saveHistory();
                renderHistory();
                showToast(originalItem.isFavorite ? 'Favorilere eklendi!' : 'Favorilerden çıkarıldı!', 'star');
            }
        });
        
        // Delete action
        btnDel.addEventListener('click', () => {
            const index = promptHistory.findIndex(x => x.id === item.id);
            if (index !== -1) {
                promptHistory.splice(index, 1);
                saveHistory();
                renderHistory();
                showToast('Prompt geçmişten silindi.', 'trash-outline');
            }
        });
        
        historyList.appendChild(itemEl);
    });
}

// 15. Dynamic Character Card Renderer & Gemini 2.5 Flash-Lite Micro AI Engine
function addCharacterCard(nameVal = '', anchorVal = '', imgVal = '', isLocal = false) {
    const cardId = `char-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    
    const cardEl = document.createElement('div');
    cardEl.className = 'char-card-item';
    cardEl.id = cardId;
    
    // Structure HTML inside the card
    cardEl.innerHTML = `
        <div class="char-card-header">
            <span class="char-card-title"><ion-icon name="person-outline"></ion-icon> <span class="char-index-text">Karakter</span></span>
            <button type="button" class="btn-delete-char" title="Karakteri Sil">
                <ion-icon name="trash-outline"></ion-icon>
            </button>
        </div>
        
        <div class="form-group">
            <div class="label-with-action">
                <label>Karakter Adı</label>
                <button type="button" class="btn-micro-ai btn-gen-char" title="Gemini ile Karakter ve Özellik Üret">
                    <span class="btn-micro-text"><ion-icon name="sparkles-outline"></ion-icon> Karakter Üret (Gemini)</span>
                    <div class="micro-spinner hidden"></div>
                </button>
            </div>
            <input type="text" class="form-control char-name-input" placeholder="Örn: Asel" value="${nameVal}">
        </div>
        
        <div class="form-group mt-3">
            <label>Ayırt Edici Özellikler (Çapa)</label>
            <textarea class="form-control char-features-input" placeholder="Örn: Kısa kızıl saçlı, mavi gözlü, siberpunk kıyafetli..." rows="2">${anchorVal}</textarea>
        </div>
        
        <div class="form-group mt-3">
            <label><ion-icon name="image-outline"></ion-icon> Görsel Referansı (İsteğe Bağlı)</label>
            <div class="char-image-container">
                <div class="image-upload-zone">
                    <ion-icon name="cloud-upload-outline" class="upload-icon"></ion-icon>
                    <span class="upload-text">Seç / Sürükle</span>
                    <input type="file" accept="image/*" class="hidden-file-input char-file-input">
                </div>
                <div class="image-url-zone">
                    <input type="text" class="form-control char-url-input" placeholder="Web görsel URL..." value="${isLocal ? '' : imgVal}">
                </div>
            </div>
            <div class="image-preview-wrapper ${imgVal || isLocal ? '' : 'hidden'}">
                <img src="${imgVal}" alt="Önizleme" class="char-preview-img">
                <button type="button" class="btn-remove-preview" title="Görseli Kaldır">
                    <ion-icon name="close-outline"></ion-icon>
                </button>
                <span class="preview-badge">${isLocal ? 'Yerel Dosya' : 'Web Görseli'}</span>
            </div>
        </div>
    `;
    
    characterListContainer.appendChild(cardEl);
    
    // Query inner elements of this dynamic card
    const nameInput = cardEl.querySelector('.char-name-input');
    const featuresInput = cardEl.querySelector('.char-features-input');
    const fileInput = cardEl.querySelector('.char-file-input');
    const urlInput = cardEl.querySelector('.char-url-input');
    const uploadZone = cardEl.querySelector('.image-upload-zone');
    const previewWrapper = cardEl.querySelector('.image-preview-wrapper');
    const previewImg = cardEl.querySelector('.char-preview-img');
    const removePreviewBtn = cardEl.querySelector('.btn-remove-preview');
    const badgeEl = cardEl.querySelector('.preview-badge');
    const btnDelete = cardEl.querySelector('.btn-delete-char');
    const btnGenChar = cardEl.querySelector('.btn-gen-char');
    
    const charObj = {
        id: cardId,
        cardEl: cardEl,
        nameInput: nameInput,
        featuresInput: featuresInput,
        fileInput: fileInput,
        urlInput: urlInput,
        imageBase64: isLocal ? imgVal : null,
        hasImageRef: imgVal.length > 0 || isLocal
    };
    
    characterCards.push(charObj);
    updateCharacterIndexes();
    
    // Drag and Drop files
    ['dragenter', 'dragover'].forEach(eventName => {
        uploadZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            uploadZone.classList.add('dragover');
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        uploadZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            uploadZone.classList.remove('dragover');
        }, false);
    });

    uploadZone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files && files.length > 0) {
            processFile(files[0]);
        }
    });

    uploadZone.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', () => {
        if (fileInput.files && fileInput.files.length > 0) {
            processFile(fileInput.files[0]);
        }
    });

    function processFile(file) {
        if (!file.type.startsWith('image/')) {
            showToast('Lütfen geçerli bir görsel dosyası seçin!', 'alert-circle-outline');
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            charObj.imageBase64 = e.target.result;
            charObj.hasImageRef = true;
            previewImg.src = charObj.imageBase64;
            previewWrapper.classList.remove('hidden');
            badgeEl.textContent = 'Yerel Dosya';
            badgeEl.style.background = 'rgba(217, 70, 239, 0.12)';
            badgeEl.style.borderColor = 'rgba(217, 70, 239, 0.2)';
            badgeEl.style.color = 'var(--neon-fuchsia)';
            urlInput.value = ''; // clear URL
            showToast('Karakter görseli yüklendi!', 'image-outline');
        };
        reader.readAsDataURL(file);
    }

    // URL paste / input
    urlInput.addEventListener('input', () => {
        const urlVal = urlInput.value.trim();
        if (urlVal.match(/\.(jpeg|jpg|gif|png|webp|svg|bmp)/i) || urlVal.startsWith('http')) {
            charObj.imageBase64 = null;
            charObj.hasImageRef = true;
            previewImg.src = urlVal;
            previewWrapper.classList.remove('hidden');
            badgeEl.textContent = 'Web Görseli';
            badgeEl.style.background = 'rgba(99, 102, 241, 0.12)';
            badgeEl.style.borderColor = 'rgba(99, 102, 241, 0.2)';
            badgeEl.style.color = 'var(--neon-indigo)';
        } else if (!urlVal) {
            if (!charObj.imageBase64) {
                charObj.hasImageRef = false;
                previewWrapper.classList.add('hidden');
            }
        }
    });

    // Remove preview
    removePreviewBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        charObj.imageBase64 = null;
        charObj.hasImageRef = false;
        fileInput.value = '';
        urlInput.value = '';
        previewWrapper.classList.add('hidden');
        previewImg.src = '';
        showToast('Referans görsel kaldırıldı.', 'trash-outline');
    });

    // Delete card
    btnDelete.addEventListener('click', () => {
        cardEl.remove();
        characterCards = characterCards.filter(x => x.id !== cardId);
        updateCharacterIndexes();
        showToast('Karakter silindi.', 'trash-outline');
    });

    // Gemini character assistant generator click
    btnGenChar.addEventListener('click', async () => {
        if (!apiKeys.gemini) {
            showToast('Lütfen önce API anahtarını yapılandırın!', 'key-outline');
            settingsPanel.classList.add('open');
            return;
        }

        const spinner = btnGenChar.querySelector('.micro-spinner');
        const btnText = btnGenChar.querySelector('.btn-micro-text');
        
        spinner.classList.remove('hidden');
        btnText.style.opacity = '0.5';
        btnGenChar.disabled = true;

        try {
            const systemPrompt = `Sen yaratıcı bir karakter tasarım asistanısın. Seçili olan şu sanat tarzına uygun, Midjourney/DALL-E promptlarında kullanılabilecek benzersiz bir Türkçe karakter ismi ve o karaktere ait son derece özgün 3-4 adet belirgin fiziksel özellik (saç rengi/stili, göz rengi, belirgin kıyafet detayları, yara izleri vb.) oluştur.
Seçili Sanat Tarzı: ${currentStyle}
Yanıtını SADECE aşağıdaki JSON şemasına birebir uyacak şekilde ver. Yanıtında JSON dışında hiçbir metin veya açıklama olmasın, \`\`\`json gibi kod blokları kullanma, sadece ham JSON çıktısı ver:
{
  "name": "Karakterin İsmi",
  "features": "Karakterin fiziksel özellikleri (tek cümle halinde)"
}`;
            const resultText = await callGeminiLiteDirect(systemPrompt, "");

            // Robust JSON extraction: strip markdown fences, then find outermost {} block
            let cleanedText = resultText
                .replace(/```json\s*/gi, '')
                .replace(/```\s*/g, '')
                .trim();

            // Fallback: extract the first {...} block via regex in case of leading/trailing text
            const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
            if (jsonMatch) cleanedText = jsonMatch[0];

            let parsed;
            try {
                parsed = JSON.parse(cleanedText);
            } catch (parseErr) {
                console.error('JSON parse hatası, ham metin:', cleanedText);
                throw new Error('JSON ayrıştırılamadı: ' + parseErr.message);
            }

            if (parsed.name && parsed.features) {
                typeWriterEffect(nameInput, parsed.name);
                setTimeout(() => typeWriterEffect(featuresInput, parsed.features), 80);
                showToast('Karakter başarıyla üretildi! ✨', 'sparkles-outline');
            } else {
                throw new Error('Geçersiz JSON yapısı: name veya features alanı eksik');
            }
        } catch (err) {
            console.error('Gemini Character assistant error:', err);
            // Gerçek hata mesajını göster (debug için)
            const shortMsg = err.message?.substring(0, 80) || 'Bilinmeyen hata';
            showToast(`Asistan hatası: ${shortMsg}`, 'alert-circle-outline');
        } finally {
            spinner.classList.add('hidden');
            btnText.style.opacity = '1';
            btnGenChar.disabled = false;
        }
    });
}

function updateCharacterIndexes() {
    const cards = characterListContainer.querySelectorAll('.char-card-item');
    cards.forEach((card, idx) => {
        const indexText = card.querySelector('.char-index-text');
        indexText.textContent = `Karakter #${idx + 1}`;
    });
}

// Embedded Gemini 2.5 Flash-Lite Micro AI assistant helper
async function callGeminiLiteDirect(systemInstruction, userInput) {
    if (!apiKeys.gemini) {
        throw new Error('Gemini API anahtarı girilmedi. Lütfen ayarları açın ve Gemini API Key girin.');
    }

    // Gemini 2.5 Flash-Lite → 2.5 Flash → 2.0 Flash (sırasıyla denenir)
    const models = [
        'gemini-2.5-flash-lite',
        'gemini-2.5-flash-lite-preview-06-17',
        'gemini-2.5-flash',
        'gemini-2.0-flash'
    ];
    let lastError = null;

    // Sistem talimatını ve kullanıcı girdisini tek bir mesajda birleştir
    const fullText = userInput
        ? `${systemInstruction}\n\nGirdi: ${userInput}`
        : systemInstruction;

    for (const modelId of models) {
        try {
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKeys.gemini}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{ text: fullText }]
                        }],
                        generationConfig: {
                            temperature: 0.9,
                            maxOutputTokens: 500
                        }
                    })
                }
            );

            if (!response.ok) {
                const errData = await response.json().catch(() => null);
                const errMsg = errData?.error?.message || `HTTP ${response.status}`;
                lastError = new Error(`[${modelId}] ${errMsg}`);
                console.warn(`Model ${modelId} başarısız:`, errMsg);
                continue; // bir sonraki modeli dene
            }

            const data = await response.json();
            const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!text) {
                lastError = new Error(`[${modelId}] Boş yanıt`);
                continue;
            }
            console.log(`✅ Mikro-asistan yanıtladı (${modelId})`);
            return text.trim();
        } catch (err) {
            lastError = err;
            console.warn(`Model ${modelId} exception:`, err);
        }
    }

    throw lastError || new Error('Tüm modeller başarısız oldu.');
}

// Smooth Typewriter effect for AI generated texts
function typeWriterEffect(element, text, callback) {
    element.value = '';
    let i = 0;
    const speed = 12; // Speed in ms per character
    function type() {
        if (i < text.length) {
            element.value += text.charAt(i);
            i++;
            setTimeout(type, speed);
        } else {
            // Trigger input/change event to fire any listeners
            element.dispatchEvent(new Event('input', { bubbles: true }));
            element.dispatchEvent(new Event('change', { bubbles: true }));
            if (callback) callback();
        }
    }
    type();
}

// 16. Premium Glassmorphic Custom Dropdown Selects Engine
function initCustomSelects() {
    const selects = document.querySelectorAll('select');
    
    selects.forEach(select => {
        // Create custom select container
        const container = document.createElement('div');
        container.className = 'custom-select-container';
        
        // Create trigger button
        const trigger = document.createElement('div');
        trigger.className = 'custom-select-trigger';
        
        const triggerText = document.createElement('span');
        const triggerIcon = document.createElement('ion-icon');
        triggerIcon.setAttribute('name', 'chevron-down-outline');
        
        trigger.appendChild(triggerText);
        trigger.appendChild(triggerIcon);
        container.appendChild(trigger);
        
        // Create options container
        const optionsContainer = document.createElement('div');
        optionsContainer.className = 'custom-select-options';
        container.appendChild(optionsContainer);
        
        // Populate options & groups
        function populateOptions() {
            optionsContainer.innerHTML = '';
            
            // Loop through children of select (can be optgroup or option)
            Array.from(select.children).forEach(child => {
                if (child.tagName.toLowerCase() === 'optgroup') {
                    // Create optgroup label
                    const groupLabel = document.createElement('div');
                    groupLabel.className = 'custom-select-optgroup';
                    groupLabel.textContent = child.label;
                    optionsContainer.appendChild(groupLabel);
                    
                    // Loop through options inside optgroup
                    Array.from(child.children).forEach(opt => {
                        createOptionElement(opt, optionsContainer);
                    });
                } else if (child.tagName.toLowerCase() === 'option') {
                    createOptionElement(child, optionsContainer);
                }
            });
            
            // Update trigger text
            const selectedOpt = select.options[select.selectedIndex];
            triggerText.textContent = selectedOpt ? selectedOpt.text : '';
        }
        
        function createOptionElement(nativeOption, parentEl) {
            const customOpt = document.createElement('div');
            customOpt.className = 'custom-option';
            customOpt.textContent = nativeOption.text;
            customOpt.dataset.value = nativeOption.value;
            
            if (nativeOption.selected) {
                customOpt.classList.add('selected');
            }
            
            customOpt.addEventListener('click', (e) => {
                e.stopPropagation();
                
                // Update native select
                select.value = nativeOption.value;
                
                // Dispatch change event to trigger existing listeners
                select.dispatchEvent(new Event('change', { bubbles: true }));
                
                // Close dropdown
                container.classList.remove('open');
            });
            
            parentEl.appendChild(customOpt);
        }
        
        populateOptions();
        
        // Insert custom select into DOM and hide native
        const wrapper = select.closest('.custom-select-wrapper');
        if (wrapper) {
            wrapper.style.display = 'none';
            wrapper.parentNode.insertBefore(container, wrapper.nextSibling);
        } else {
            select.style.display = 'none';
            select.parentNode.insertBefore(container, select.nextSibling);
        }
        
        // Toggle open/close on trigger click
        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            
            // Close other open custom selects first
            document.querySelectorAll('.custom-select-container').forEach(c => {
                if (c !== container) c.classList.remove('open');
            });
            
            container.classList.toggle('open');
        });
        
        // Watch for changes on the native select (useful for history restores and other events)
        select.addEventListener('change', () => {
            // Update selected option styling
            const customOpts = optionsContainer.querySelectorAll('.custom-option');
            customOpts.forEach(opt => {
                if (opt.dataset.value === select.value) {
                    opt.classList.add('selected');
                } else {
                    opt.classList.remove('selected');
                }
            });
            
            // Update trigger text
            const selectedOpt = select.options[select.selectedIndex];
            triggerText.textContent = selectedOpt ? selectedOpt.text : '';
        });
    });
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', () => {
        document.querySelectorAll('.custom-select-container').forEach(c => {
            c.classList.remove('open');
        });
    });
}
