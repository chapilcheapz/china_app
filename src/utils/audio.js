// Audio utilities: Web Speech API (offline) + Online High-Quality Native Mandarin Audio Fallback + Web Audio API SFX

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

// Voice detection & caching
let chineseVoices = [];
let voicesInitialized = false;

function detectChineseVoices() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return [];
  const voices = window.speechSynthesis.getVoices() || [];
  chineseVoices = voices.filter(v => {
    const lang = (v.lang || '').toLowerCase();
    return lang.includes('zh') || lang.includes('cmn') || lang.startsWith('zh-cn') || lang.startsWith('zh-tw');
  });
  if (voices.length > 0) {
    voicesInitialized = true;
  }
  return chineseVoices;
}

if (typeof window !== 'undefined' && window.speechSynthesis) {
  detectChineseVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    detectChineseVoices();
  };
}

// Active online audio instance to stop previous sound when new one is played
let activeAudio = null;

// Online Chinese audio fallback (works 100% on any machine without Chinese voice pack)
export const playOnlineChinese = (text) => {
  try {
    if (activeAudio) {
      activeAudio.pause();
      activeAudio.currentTime = 0;
    }

    const cleanText = text ? text.trim() : '';
    if (!cleanText) return;

    // Youdao Native Mandarin voice endpoint
    const url = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(cleanText)}&le=zh`;
    const audio = new Audio(url);
    activeAudio = audio;

    audio.onerror = () => {
      // Fallback to Google Translate TTS if Youdao fails
      const fallbackUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=zh-CN&client=tw-ob&q=${encodeURIComponent(cleanText)}`;
      const fallbackAudio = new Audio(fallbackUrl);
      activeAudio = fallbackAudio;
      fallbackAudio.play().catch(e => console.warn('Fallback audio error:', e));
    };

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(err => {
        console.warn('Audio playback error (browser autoplay policy):', err);
      });
    }
  } catch (err) {
    console.error('playOnlineChinese error:', err);
  }
};

// Unified Chinese Mandarin Speech: Auto-detects device capability
export const speakChinese = (text, rate = 0.9) => {
  if (typeof window === 'undefined') return;
  const cleanText = text ? text.trim() : '';
  if (!cleanText) return;

  // Stop previous speech or online audio
  if (activeAudio) {
    activeAudio.pause();
    activeAudio.currentTime = 0;
  }

  detectChineseVoices();
  const hasLocalChineseVoice = chineseVoices.length > 0;

  // If the browser has a local Chinese voice installed, try Web Speech API
  if (window.speechSynthesis && hasLocalChineseVoice) {
    try {
      window.speechSynthesis.cancel();
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = 'zh-CN';
      utterance.rate = rate;

      // Prefer zh-CN voice if available
      const cnVoice = chineseVoices.find(v => v.lang.toLowerCase().includes('cn')) || chineseVoices[0];
      if (cnVoice) {
        utterance.voice = cnVoice;
      }

      let speechStarted = false;
      utterance.onstart = () => {
        speechStarted = true;
      };

      utterance.onerror = (e) => {
        console.warn('Web Speech API failed, falling back to online audio:', e);
        playOnlineChinese(cleanText);
      };

      // Safety timeout: if browser doesn't start speaking within 500ms (common silent failure on Windows), play online
      setTimeout(() => {
        if (!speechStarted) {
          playOnlineChinese(cleanText);
        }
      }, 500);

      window.speechSynthesis.speak(utterance);
      return;
    } catch (err) {
      console.warn('SpeechSynthesis error, falling back:', err);
    }
  }

  // Default fallback: play authentic online native Mandarin audio
  playOnlineChinese(cleanText);
};
