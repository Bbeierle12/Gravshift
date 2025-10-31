// Audio Manager using Web Audio API
export class AudioManager {
    constructor() {
        this.context = null;
        this.masterGain = null;
        this.sounds = {};
        this.enabled = true;
        this.volume = 0.5;
        
        this.initialize();
    }

    initialize() {
        try {
            // Create audio context on first user interaction
            window.addEventListener('click', () => this.createContext(), { once: true });
            window.addEventListener('keydown', () => this.createContext(), { once: true });
        } catch (e) {
            console.warn('Web Audio API not supported');
            this.enabled = false;
        }
    }

    createContext() {
        if (this.context) return;
        
        try {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.context.createGain();
            this.masterGain.gain.value = this.volume;
            this.masterGain.connect(this.context.destination);
            
            // Resume context if suspended
            if (this.context.state === 'suspended') {
                this.context.resume();
            }
        } catch (e) {
            console.warn('Failed to create audio context:', e);
            this.enabled = false;
        }
    }

    // Synthesize absorption sound
    playAbsorption(mass = 1) {
        if (!this.enabled || !this.context) return;
        
        const now = this.context.currentTime;
        
        // Oscillator for the "pop" sound
        const osc = this.context.createOscillator();
        const gainNode = this.context.createGain();
        
        // Frequency based on mass (higher mass = lower pitch)
        const baseFreq = 400 - Math.min(mass * 10, 200);
        osc.frequency.setValueAtTime(baseFreq * 2, now);
        osc.frequency.exponentialRampToValueAtTime(baseFreq, now + 0.1);
        
        // Quick attack and decay
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        
        osc.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        osc.start(now);
        osc.stop(now + 0.15);
    }

    // Synthesize tier up sound
    playTierUp(tier) {
        if (!this.enabled || !this.context) return;
        
        const now = this.context.currentTime;
        
        // Rising arpeggio
        const notes = [220, 277, 330, 440]; // A3, C#4, E4, A4
        
        notes.forEach((freq, i) => {
            const osc = this.context.createOscillator();
            const gainNode = this.context.createGain();
            
            osc.frequency.value = freq;
            osc.type = 'sine';
            
            const startTime = now + i * 0.08;
            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(0.2, startTime + 0.02);
            gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);
            
            osc.connect(gainNode);
            gainNode.connect(this.masterGain);
            
            osc.start(startTime);
            osc.stop(startTime + 0.3);
        });
        
        // Add a bright "sparkle" sound
        const noise = this.context.createOscillator();
        const noiseGain = this.context.createGain();
        const filter = this.context.createBiquadFilter();
        
        noise.frequency.value = 2000;
        noise.type = 'square';
        
        filter.type = 'highpass';
        filter.frequency.value = 1000;
        
        noiseGain.gain.setValueAtTime(0.15, now + 0.2);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
        
        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(this.masterGain);
        
        noise.start(now + 0.2);
        noise.stop(now + 0.6);
    }

    // Synthesize recycle sound
    playRecycle() {
        if (!this.enabled || !this.context) return;
        
        const now = this.context.currentTime;
        
        // Descending swoosh
        const osc = this.context.createOscillator();
        const gainNode = this.context.createGain();
        const filter = this.context.createBiquadFilter();
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.5);
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2000, now);
        filter.frequency.exponentialRampToValueAtTime(300, now + 0.5);
        
        gainNode.gain.setValueAtTime(0.2, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        
        osc.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        osc.start(now);
        osc.stop(now + 0.5);
        
        // Add some shimmer
        for (let i = 0; i < 3; i++) {
            const shimmer = this.context.createOscillator();
            const shimmerGain = this.context.createGain();
            
            shimmer.frequency.value = 1000 + i * 500;
            shimmer.type = 'sine';
            
            const startTime = now + i * 0.1;
            shimmerGain.gain.setValueAtTime(0.1, startTime);
            shimmerGain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2);
            
            shimmer.connect(shimmerGain);
            shimmerGain.connect(this.masterGain);
            
            shimmer.start(startTime);
            shimmer.stop(startTime + 0.2);
        }
    }

    // Synthesize boost sound
    playBoost() {
        if (!this.enabled || !this.context) return;
        
        const now = this.context.currentTime;
        
        // Whoosh sound
        const osc = this.context.createOscillator();
        const gainNode = this.context.createGain();
        const filter = this.context.createBiquadFilter();
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.2);
        
        filter.type = 'bandpass';
        filter.frequency.value = 500;
        filter.Q.value = 5;
        
        gainNode.gain.setValueAtTime(0.15, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        
        osc.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        osc.start(now);
        osc.stop(now + 0.25);
    }

    // Synthesize collision sound
    playCollision(intensity = 1) {
        if (!this.enabled || !this.context) return;
        
        const now = this.context.currentTime;
        
        // Thud sound
        const osc = this.context.createOscillator();
        const gainNode = this.context.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.1);
        
        const volume = 0.2 * intensity;
        gainNode.gain.setValueAtTime(volume, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        
        osc.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        osc.start(now);
        osc.stop(now + 0.15);
    }

    // Synthesize achievement unlock sound
    playAchievement() {
        if (!this.enabled || !this.context) return;
        
        const now = this.context.currentTime;
        
        // Triumphant chord
        const frequencies = [261.63, 329.63, 392.00]; // C, E, G
        
        frequencies.forEach((freq, i) => {
            const osc = this.context.createOscillator();
            const gainNode = this.context.createGain();
            
            osc.frequency.value = freq;
            osc.type = 'sine';
            
            const startTime = now + i * 0.05;
            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(0.15, startTime + 0.05);
            gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.8);
            
            osc.connect(gainNode);
            gainNode.connect(this.masterGain);
            
            osc.start(startTime);
            osc.stop(startTime + 0.8);
        });
    }

    // Synthesize mission complete sound
    playMissionComplete() {
        if (!this.enabled || !this.context) return;
        
        const now = this.context.currentTime;
        
        // Quick success jingle
        const melody = [523.25, 659.25, 783.99]; // C5, E5, G5
        
        melody.forEach((freq, i) => {
            const osc = this.context.createOscillator();
            const gainNode = this.context.createGain();
            
            osc.frequency.value = freq;
            osc.type = 'square';
            
            const startTime = now + i * 0.12;
            gainNode.gain.setValueAtTime(0.12, startTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.25);
            
            osc.connect(gainNode);
            gainNode.connect(this.masterGain);
            
            osc.start(startTime);
            osc.stop(startTime + 0.25);
        });
    }

    // Ambient background hum
    startAmbient() {
        if (!this.enabled || !this.context || this.ambientOsc) return;
        
        this.ambientOsc = this.context.createOscillator();
        this.ambientGain = this.context.createGain();
        
        this.ambientOsc.type = 'sine';
        this.ambientOsc.frequency.value = 55; // Low A
        
        this.ambientGain.gain.value = 0.05;
        
        this.ambientOsc.connect(this.ambientGain);
        this.ambientGain.connect(this.masterGain);
        
        this.ambientOsc.start();
    }

    stopAmbient() {
        if (this.ambientOsc) {
            this.ambientOsc.stop();
            this.ambientOsc = null;
        }
    }

    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        if (this.masterGain) {
            this.masterGain.gain.value = this.volume;
        }
    }

    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }

    pause() {
        if (this.context && this.context.state === 'running') {
            this.context.suspend();
        }
    }

    resume() {
        if (this.context && this.context.state === 'suspended') {
            this.context.resume();
        }
    }
}
