// Audio utilities: Native Mandarin Speech (Youdao Online Audio primary, Web Speech API fallback) + Web Audio SFX

class SoundEffects {
  constructor() {
    this.ctx = null;
    this.soundEnabled = true;
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
 * Universal Mandarin Speech Player:
 * - Uses Youdao native audio by default (accurate tones, identical on Windows/Mac/iOS/Android).
 * - Debounces rapid clicks (prevents playing multiple times).
 * - Gracefully falls back to Web Speech API or Google TTS if offline.
 */
export const speakChinese = (text, rate = 0.9) => {
  if (typeof window === 'undefined') return;
  const cleanText = text ? text.trim() : '';
  if (!cleanText) return;

  const now = Date.now();
  // Anti-repeat debounce: ignore identical request if triggered within 300ms
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

  // 2. Play using Youdao Native Mandarin Audio
  try {
    const url = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(cleanText)}&le=zh`;
    const audio = new Audio(url);
    activeAudio = audio;

    let hasStarted = false;
    audio.onplay = () => {
      hasStarted = true;
    };

    // If online audio fails (e.g. offline mode), fallback to Web Speech API
    audio.onerror = () => {
      if (hasStarted) return;
      fallbackWebSpeech(cleanText, rate);
    };

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        // If autoplay was blocked by browser policy, try Web Speech API
        console.warn('Audio play prevented by browser, trying Web Speech:', err);
        fallbackWebSpeech(cleanText, rate);
      });
    }
  } catch (err) {
    fallbackWebSpeech(cleanText, rate);
  }
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

    utterance.onerror = () => {
      // Last-resort fallback to Google TTS
      try {
        const fallbackUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=zh-CN&client=tw-ob&q=${encodeURIComponent(text)}`;
        const gAudio = new Audio(fallbackUrl);
        activeAudio = gAudio;
        gAudio.play().catch(console.warn);
      } catch (e) {}
    };

    window.speechSynthesis.speak(utterance);
  } catch (e) {
    console.warn('Fallback WebSpeech error:', e);
  }
}
