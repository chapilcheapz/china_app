// Audio utilities: Ultra-reliable Mandarin Speech (Google TTS Proxy/Direct + Baidu TTS + Web Speech fallback) + Web Audio SFX

class SoundEffects {
  constructor() {
    this.ctx = null;
    let saved = true;
    if (typeof window !== 'undefined') {
      const val = localStorage.getItem('china_app_sound');
      if (val !== null) saved = val === 'true';
    }
    this.soundEnabled = saved;
  }

  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
  }

  playTone(freq, type = 'sine', duration = 0.15, gainVal = 0.15) {
    if (!this.soundEnabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      console.warn('Audio playback error', e);
    }
  }

  playSuccess() {
    if (!this.soundEnabled) return;
    try {
      this.init();
      [523.25, 659.25, 783.99].forEach((freq, idx) => {
        setTimeout(() => {
          this.playTone(freq, 'triangle', 0.2, 0.12);
        }, idx * 70);
      });
    } catch (e) {}
  }

  playError() {
    if (!this.soundEnabled) return;
    try {
      this.init();
      this.playTone(180, 'sawtooth', 0.25, 0.15);
    } catch (e) {}
  }

  playFlip() {
    if (!this.soundEnabled) return;
    try {
      this.init();
      this.playTone(400, 'sine', 0.08, 0.05);
    } catch (e) {}
  }

  playStreak() {
    if (!this.soundEnabled) return;
    try {
      this.init();
      [440, 554.37, 659.25, 880].forEach((freq, idx) => {
        setTimeout(() => {
          this.playTone(freq, 'sine', 0.25, 0.15);
        }, idx * 60);
      });
    } catch (e) {}
  }
}

export const sfx = new SoundEffects();

// Single active audio tracker to prevent overlapping/echo
let activeAudio = null;
let lastSpokenText = '';
let lastSpokenTime = 0;

/**
 * Stop any currently playing audio or speech immediately
 */
export const stopAllAudio = () => {
  if (activeAudio) {
    try {
      activeAudio.pause();
      activeAudio.removeAttribute('src');
      activeAudio = null;
    } catch (e) {}
  }
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    try {
      window.speechSynthesis.cancel();
    } catch (e) {}
  }
};

/**
 * Clean Chinese text before speech:
 * Removes grammatical annotations like "（助词）" or parenthetical aliases
 */
export function cleanChineseTextForSpeech(raw) {
  if (!raw) return '';
  let str = String(raw).trim();
  // Remove grammatical notes like （助动词）, （助词）, （名）
  str = str.replace(/[（\(][^）\)]*(?:词|语|音|例)[^）\)]*[）\)]/g, '').trim();
  // Remove alternate notation in parenthesis for speech clarity, e.g. "哪里 (哪儿)" -> "哪里"
  str = str.replace(/\s*\([^\)]*\)/g, '').trim();
  return str || String(raw).trim();
}

/**
 * Universal Mandarin Speech Player:
 * - 100% covers all words (including 本, thành ngữ, câu ví dụ).
 * - Multi-tiered fallback: Vite Proxy -> Google TTS (no-referrer) -> Baidu TTS -> Web Speech API (offline).
 * - Respects Master Sound Toggle (sfx.soundEnabled).
 * - Debounces rapid clicks to prevent duplicate speech.
 */
export const speakChinese = (text, rate = 0.9) => {
  if (typeof window === 'undefined') return;

  // Master Sound Toggle Check: If sound is muted at the top, NEVER speak!
  if (!sfx.soundEnabled) {
    stopAllAudio();
    return;
  }

  const cleanText = cleanChineseTextForSpeech(text);
  if (!cleanText) return;

  const now = Date.now();
  // Anti-repeat debounce: ignore duplicate trigger within 300ms
  if (cleanText === lastSpokenText && (now - lastSpokenTime) < 300) {
    return;
  }
  lastSpokenText = cleanText;
  lastSpokenTime = now;

  // 1. Immediately cut off any previous audio and Web Speech
  if (activeAudio) {
    try {
      activeAudio.pause();
      activeAudio.removeAttribute('src');
      activeAudio = null;
    } catch (e) {}
  }

  if (window.speechSynthesis) {
    try {
      window.speechSynthesis.cancel();
    } catch (e) {}
  }

  // 2. Build multi-tier online TTS cascade
  const encoded = encodeURIComponent(cleanText);
  const isLocal = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.startsWith('192.168.'));

  const sources = [
    // Tier 1 (Dev): Local Vite proxy to bypass all browser referrer/CORS restrictions
    ...(isLocal ? [`/api/tts?ie=UTF-8&tl=zh-CN&client=tw-ob&q=${encoded}`] : []),
    // Tier 2 (Prod): Direct Google Translate Mandarin TTS (allowed via <meta name="referrer" content="no-referrer">)
    `https://translate.google.com/translate_tts?ie=UTF-8&tl=zh-CN&client=tw-ob&q=${encoded}`,
    // Tier 3: Baidu Fanyi Mandarin TTS
    `https://fanyi.baidu.com/gettts?lan=zh&text=${encoded}&spd=5&source=web`,
  ];

  let currentSourceIndex = 0;

  function tryNextAudioSource() {
    if (currentSourceIndex >= sources.length) {
      // All online sources exhausted (e.g. completely offline) -> use browser SpeechSynthesis
      fallbackWebSpeech(cleanText, rate);
      return;
    }

    const url = sources[currentSourceIndex++];
    const audio = new Audio(url);
    activeAudio = audio;

    let hasStarted = false;
    audio.onplay = () => {
      hasStarted = true;
    };

    audio.onerror = () => {
      if (hasStarted) return;
      tryNextAudioSource();
    };

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        console.warn('Audio play restricted, trying next source:', err);
        tryNextAudioSource();
      });
    }
  }

  tryNextAudioSource();
};

function fallbackWebSpeech(text, rate = 0.9) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;

  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = rate;

    const voices = window.speechSynthesis.getVoices() || [];
    const zhVoice = voices.find(v => {
      const l = (v.lang || '').toLowerCase();
      return l.includes('zh') || l.includes('cmn');
    });

    if (zhVoice) {
      utterance.voice = zhVoice;
    }

    window.speechSynthesis.speak(utterance);
  } catch (e) {
    console.warn('Fallback WebSpeech error:', e);
  }
}
