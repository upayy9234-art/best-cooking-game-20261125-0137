// All sound is synthesised with WebAudio: no audio files are shipped, and the
// game stays silent until the player first interacts (browsers require that).
// Each effect is a short envelope over one or two oscillators; the wok keeps a
// soft filtered-noise sizzle while anything fries.
export function createAudio() {
  let context = null;
  let master = null;
  let sizzle = null;
  let muted = false;

  function ensure() {
    if (context) return true;
    try {
      const AudioContext = window.AudioContext ?? window.webkitAudioContext;
      if (!AudioContext) return false;
      context = new AudioContext();
      master = context.createGain();
      master.gain.value = 0.25;
      master.connect(context.destination);
    } catch {
      return false;
    }
    return true;
  }

  function tone(freq, seconds, type, volume, slideTo) {
    if (!ensure() || muted) return;
    if (context.state === 'suspended') void context.resume();
    const now = context.currentTime;
    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, now + seconds);
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + seconds);
    osc.connect(gain);
    gain.connect(master);
    osc.start(now);
    osc.stop(now + seconds + 0.02);
  }

  function noise(seconds, volume, filterFreq) {
    if (!ensure() || muted) return;
    if (context.state === 'suspended') void context.resume();
    const length = Math.max(1, Math.floor(context.sampleRate * seconds));
    const buffer = context.createBuffer(1, length, context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    const source = context.createBufferSource();
    source.buffer = buffer;
    const filter = context.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = filterFreq;
    const gain = context.createGain();
    gain.gain.value = volume;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    source.start();
  }

  return {
    unlock() {
      ensure();
    },
    toggleMute() {
      muted = !muted;
      if (sizzle) this.setSizzle(false);
      return muted;
    },
    isMuted() {
      return muted;
    },
    click() {
      tone(660, 0.06, 'triangle', 0.25);
    },
    drop() {
      tone(320, 0.08, 'sine', 0.3, 180);
    },
    cooked() {
      tone(880, 0.09, 'sine', 0.3);
      setTimeout(() => tone(1174, 0.12, 'sine', 0.3), 90);
    },
    serve() {
      tone(523, 0.1, 'triangle', 0.35);
      setTimeout(() => tone(659, 0.1, 'triangle', 0.35), 90);
      setTimeout(() => tone(784, 0.18, 'triangle', 0.4), 180);
    },
    error() {
      tone(160, 0.18, 'square', 0.18, 110);
    },
    expire() {
      tone(220, 0.25, 'sawtooth', 0.12, 140);
    },
    burn() {
      noise(0.35, 0.3, 900);
      tone(140, 0.3, 'sawtooth', 0.15, 70);
    },
    bell() {
      tone(1046, 0.3, 'sine', 0.3);
      setTimeout(() => tone(1568, 0.4, 'sine', 0.22), 120);
    },
    setSizzle(on) {
      if (!ensure()) return;
      if (on && !sizzle) {
        const length = context.sampleRate;
        const buffer = context.createBuffer(1, length, context.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;
        const source = context.createBufferSource();
        source.buffer = buffer;
        source.loop = true;
        const filter = context.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 2400;
        const gain = context.createGain();
        gain.gain.value = 0.05;
        source.connect(filter);
        filter.connect(gain);
        gain.connect(master);
        source.start();
        sizzle = { source, gain };
      } else if (!on && sizzle) {
        try {
          sizzle.gain.gain.setTargetAtTime(0, context.currentTime, 0.05);
          sizzle.source.stop(context.currentTime + 0.3);
        } catch {
          // Already stopped.
        }
        sizzle = null;
      }
    },
  };
}
