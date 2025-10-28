import { useRef, useCallback } from 'react';

type SoundType = 'eat' | 'goldenEat' | 'gameOver' | 'click' | 'countdownTick' | 'countdownGo';

export const useSounds = () => {
  const audioCtx = useRef<AudioContext | null>(null);
  const isInitialized = useRef(false);

  const initializeAudio = useCallback(() => {
    if (!isInitialized.current && typeof window !== 'undefined') {
      try {
        audioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        isInitialized.current = true;
      } catch (e) {
        console.error("Web Audio API is not supported in this browser");
      }
    }
    // If context is suspended, resume it
    if (audioCtx.current && audioCtx.current.state === 'suspended') {
      audioCtx.current.resume();
    }
  }, []);

  const playSound = useCallback((type: SoundType) => {
    initializeAudio();
    if (!audioCtx.current) return;

    const now = audioCtx.current.currentTime;
    let oscillator: OscillatorNode, gainNode: GainNode;

    const setupNodes = () => {
        oscillator = audioCtx.current!.createOscillator();
        gainNode = audioCtx.current!.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.current!.destination);
    };

    switch (type) {
      case 'eat':
        setupNodes();
        oscillator!.type = 'triangle';
        oscillator!.frequency.setValueAtTime(880, now);
        gainNode!.gain.setValueAtTime(0.1, now);
        gainNode!.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);
        oscillator!.start(now);
        oscillator!.stop(now + 0.1);
        break;
      
      case 'goldenEat':
        const frequencies = [660, 880, 1100];
        frequencies.forEach((freq, i) => {
            setupNodes();
            oscillator!.type = 'sine';
            oscillator!.frequency.setValueAtTime(freq, now + i * 0.07);
            gainNode!.gain.setValueAtTime(0.1, now + i * 0.07);
            gainNode!.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.07 + 0.1);
            oscillator!.start(now + i * 0.07);
            oscillator!.stop(now + i * 0.07 + 0.1);
        });
        break;

      case 'gameOver':
        const gameOverFreqs = [440, 330, 220, 110];
        gameOverFreqs.forEach((freq, i) => {
            setupNodes();
            oscillator!.type = 'sawtooth';
            oscillator!.frequency.setValueAtTime(freq, now + i * 0.1);
            gainNode!.gain.setValueAtTime(0.15, now + i * 0.1);
            gainNode!.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.1 + 0.2);
            oscillator!.start(now + i * 0.1);
            oscillator!.stop(now + i * 0.1 + 0.2);
        });
        break;

      case 'click':
        setupNodes();
        oscillator!.type = 'sine';
        oscillator!.frequency.setValueAtTime(440, now);
        gainNode!.gain.setValueAtTime(0.05, now);
        gainNode!.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);
        oscillator!.start(now);
        oscillator!.stop(now + 0.1);
        break;

      case 'countdownTick':
        setupNodes();
        oscillator!.type = 'square';
        oscillator!.frequency.setValueAtTime(1200, now);
        gainNode!.gain.setValueAtTime(0.08, now);
        gainNode!.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);
        oscillator!.start(now);
        oscillator!.stop(now + 0.1);
        break;

      case 'countdownGo':
        setupNodes();
        oscillator!.type = 'square';
        oscillator!.frequency.setValueAtTime(1500, now);
        gainNode!.gain.setValueAtTime(0.1, now);
        gainNode!.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
        oscillator!.start(now);
        oscillator!.stop(now + 0.2);
        break;
    }
  }, [initializeAudio]);

  return {
    playEatSound: () => playSound('eat'),
    playGoldenEatSound: () => playSound('goldenEat'),
    playGameOverSound: () => playSound('gameOver'),
    playClickSound: () => playSound('click'),
    playCountdownTickSound: () => playSound('countdownTick'),
    playCountdownGoSound: () => playSound('countdownGo'),
  };
};