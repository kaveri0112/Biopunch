// Offline Vibration, Audio Synthesizer and Wake Lock Engine

let audioCtx: AudioContext | null = null;
let wakeLockSentinel: any = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function triggerVibration(
  type: 'punch-in' | 'punch-out' | 'snooze' | 'success',
  strength: 'gentle' | 'standard' | 'urgent' = 'standard'
) {
  if (typeof window === 'undefined' || !navigator.vibrate) {
    console.log('[Alert Engine] Vibration API not supported on this device/browser');
    return false;
  }

  try {
    let pattern: number[] = [];

    if (type === 'success') {
      pattern = [80, 50, 120];
    } else if (type === 'snooze') {
      pattern = [150, 100, 150];
    } else if (strength === 'gentle') {
      pattern = type === 'punch-in' ? [250, 150, 250] : [200, 100, 200, 100, 200];
    } else if (strength === 'urgent') {
      pattern =
        type === 'punch-in'
          ? [500, 100, 500, 100, 500, 100, 900]
          : [600, 120, 600, 120, 800];
    } else {
      // standard
      pattern =
        type === 'punch-in'
          ? [350, 120, 350, 120, 600]
          : [400, 150, 400, 150, 700];
    }

    navigator.vibrate(pattern);
    return true;
  } catch (err) {
    console.warn('[Alert Engine] Vibration failed:', err);
    return false;
  }
}

export function playSynthesizedChime(type: 'punch-in' | 'punch-out' | 'success') {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const gainNode = ctx.createGain();
    gainNode.connect(ctx.destination);

    if (type === 'punch-in') {
      // Energetic high chime: 880Hz (A5) -> 1174.66Hz (D6)
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();

      osc1.type = 'sine';
      osc2.type = 'triangle';

      osc1.frequency.setValueAtTime(880, now);
      osc1.frequency.exponentialRampToValueAtTime(1174.66, now + 0.15);

      osc2.frequency.setValueAtTime(440, now);
      osc2.frequency.exponentialRampToValueAtTime(587.33, now + 0.15);

      gainNode.gain.setValueAtTime(0.001, now);
      gainNode.gain.exponentialRampToValueAtTime(0.3, now + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      osc1.connect(gainNode);
      osc2.connect(gainNode);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.65);
      osc2.stop(now + 0.65);
    } else if (type === 'punch-out') {
      // Warm end bell: 1046.5Hz (C6) -> 783.99Hz (G5) -> 523.25Hz (C5)
      const osc = ctx.createOscillator();
      osc.type = 'sine';

      osc.frequency.setValueAtTime(1046.5, now);
      osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.2);
      osc.frequency.exponentialRampToValueAtTime(523.25, now + 0.4);

      gainNode.gain.setValueAtTime(0.001, now);
      gainNode.gain.exponentialRampToValueAtTime(0.35, now + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

      osc.connect(gainNode);
      osc.start(now);
      osc.stop(now + 0.75);
    } else {
      // Success tri-tone chord
      [523.25, 659.25, 783.99].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        const chordGain = ctx.createGain();
        chordGain.gain.setValueAtTime(0.001, now + idx * 0.08);
        chordGain.gain.exponentialRampToValueAtTime(0.15, now + idx * 0.08 + 0.04);
        chordGain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.5);

        osc.connect(chordGain);
        chordGain.connect(ctx.destination);

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.55);
      });
    }
  } catch (err) {
    console.warn('[Alert Engine] Audio chime failed:', err);
  }
}

export async function requestScreenWakeLock() {
  if (typeof window === 'undefined' || !('wakeLock' in navigator)) return null;
  try {
    if (!wakeLockSentinel) {
      wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
      wakeLockSentinel.addEventListener('release', () => {
        wakeLockSentinel = null;
      });
    }
    return wakeLockSentinel;
  } catch (err) {
    console.warn('[Alert Engine] Wake lock request error:', err);
    return null;
  }
}

export async function releaseScreenWakeLock() {
  try {
    if (wakeLockSentinel) {
      await wakeLockSentinel.release();
      wakeLockSentinel = null;
    }
  } catch (err) {
    console.warn('[Alert Engine] Wake lock release error:', err);
  }
}
