import { useAppStore } from './store';

let audioCtx: AudioContext | null = null;

/**
 * Play an iOS-like soft button click sound ("tock")
 */
export function playUIClick() {
  try {
    const isSoundEnabled = useAppStore.getState().soundEnabled;
    if (!isSoundEnabled) return;

    if (!audioCtx) {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    osc.type = 'sine';
    const now = audioCtx.currentTime;
    
    // Pitch sweep down: 650Hz to 120Hz
    osc.frequency.setValueAtTime(650, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.03);

    // Volume envelope
    gainNode.gain.setValueAtTime(0.06, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

    osc.start(now);
    osc.stop(now + 0.04);
  } catch (err) {
    console.warn('Click sound blocked or failed:', err);
  }
}

/**
 * Play a slightly higher pitched tap sound (for keyboard-like input fields)
 */
export function playUITap() {
  try {
    const isSoundEnabled = useAppStore.getState().soundEnabled;
    if (!isSoundEnabled) return;

    if (!audioCtx) {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    osc.type = 'sine';
    const now = audioCtx.currentTime;

    // Pitch sweep down: 850Hz to 200Hz
    osc.frequency.setValueAtTime(850, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.025);

    // Volume envelope (slightly softer and faster)
    gainNode.gain.setValueAtTime(0.04, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

    osc.start(now);
    osc.stop(now + 0.035);
  } catch (err) {
    console.warn('Tap sound blocked or failed:', err);
  }
}
