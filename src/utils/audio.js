// Audio utilities: Web Speech API for Chinese TTS + Web Audio API for sound effects

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
      const now = this.ctx.currentTime;
      // High-pitched pleasant dual chime
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

// Chinese Mandarin Speech Synthesis
export const speakChinese = (text, rate = 0.9) => {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;

  try {
    window.speechSynthesis.cancel(); // Stop any pending speech
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = rate; // slightly slower for language learners

    // Try finding a native zh-CN voice if available
    const voices = window.speechSynthesis.getVoices();
    const zhVoice = voices.find(v => v.lang.includes('zh') || v.lang.includes('cmn'));
    if (zhVoice) {
      utterance.voice = zhVoice;
    }

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.error('Speech synthesis error:', err);
  }
};
