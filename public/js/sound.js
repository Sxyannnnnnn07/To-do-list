/**
 * Web Audio API Sound Effects Engine
 * Pure synthesized audio effects for task completion & victory fanfare.
 * Works 100% offline with zero external audio files!
 */

class SoundEngine {
  constructor() {
    this.enabled = true;
    this.audioCtx = null;
  }

  initContext() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }

    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  toggleSound() {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  // 1. Single Task Complete Sound (Happy Upward Chime)
  playTaskComplete() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.audioCtx) return;

    const now = this.audioCtx.currentTime;
    
    // Note 1 (E5)
    const osc1 = this.audioCtx.createOscillator();
    const gain1 = this.audioCtx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, now);
    gain1.gain.setValueAtTime(0.15, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    
    osc1.connect(gain1);
    gain1.connect(this.audioCtx.destination);
    osc1.start(now);
    osc1.stop(now + 0.15);

    // Note 2 (B5)
    const osc2 = this.audioCtx.createOscillator();
    const gain2 = this.audioCtx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(987.77, now + 0.08);
    gain2.gain.setValueAtTime(0.2, now + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc2.connect(gain2);
    gain2.connect(this.audioCtx.destination);
    osc2.start(now + 0.08);
    osc2.stop(now + 0.3);
  }

  // 2. Victory Fanfare Sound (All Tasks Completed 🎉)
  playAllCompletedFanfare() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.audioCtx) return;

    const now = this.audioCtx.currentTime;

    // 4-Note Victory Arpeggio (C5 -> E5 -> G5 -> C6)
    const notes = [
      { freq: 523.25, duration: 0.12, delay: 0 },
      { freq: 659.25, duration: 0.12, delay: 0.12 },
      { freq: 783.99, duration: 0.12, delay: 0.24 },
      { freq: 1046.50, duration: 0.45, delay: 0.36 }
    ];

    notes.forEach(note => {
      const startTime = now + note.delay;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.freq, startTime);

      gain.gain.setValueAtTime(0.2, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + note.duration);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(startTime);
      osc.stop(startTime + note.duration);
    });
  }

  // 3. Task Uncheck Sound (Downward Soft Pop)
  playTaskUncomplete() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.audioCtx) return;

    const now = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.12);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start(now);
    osc.stop(now + 0.12);
  }
}

window.soundEngine = new SoundEngine();
