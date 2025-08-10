export class SoundSystem {
    constructor() {
        this.audioContext = null;
        this.masterVolume = 0.5;
        this.soundEnabled = true;
        this.musicEnabled = true;
        this.sounds = {};
        this.musicLoop = null;
        this.init();
    }

    init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.setupSounds();
        } catch (error) {
            console.warn('Web Audio API not supported');
            this.soundEnabled = false;
        }
    }

    setupSounds() {
        this.sounds = {
            move: () => this.playTone(200, 0.05, 'square', 0.1),
            rotate: () => this.playTone(400, 0.05, 'sine', 0.1),
            drop: () => this.playTone(100, 0.1, 'sawtooth', 0.2),
            clear: () => this.playChord([523, 659, 784], 0.2, 'sine', 0.3),
            tetris: () => this.playArpeggio([523, 659, 784, 1047], 0.5, 'sine', 0.4),
            levelUp: () => this.playArpeggio([440, 554, 659, 880], 0.6, 'square', 0.3),
            gameOver: () => this.playDescending([440, 330, 220, 110], 0.8, 'sawtooth', 0.3),
            combo: () => this.playTone(880, 0.1, 'sine', 0.2),
            hold: () => this.playTone(300, 0.08, 'triangle', 0.15)
        };
    }

    playTone(frequency, duration, type = 'sine', volume = 0.1) {
        if (!this.soundEnabled || !this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        
        gainNode.gain.setValueAtTime(volume * this.masterVolume, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }

    playChord(frequencies, duration, type = 'sine', volume = 0.1) {
        if (!this.soundEnabled || !this.audioContext) return;

        frequencies.forEach(freq => {
            this.playTone(freq, duration, type, volume / frequencies.length);
        });
    }

    playArpeggio(frequencies, totalDuration, type = 'sine', volume = 0.1) {
        if (!this.soundEnabled || !this.audioContext) return;

        const noteDuration = totalDuration / frequencies.length;
        frequencies.forEach((freq, index) => {
            setTimeout(() => {
                this.playTone(freq, noteDuration * 0.9, type, volume);
            }, index * noteDuration * 1000);
        });
    }

    playDescending(frequencies, totalDuration, type = 'sawtooth', volume = 0.1) {
        if (!this.soundEnabled || !this.audioContext) return;

        const noteDuration = totalDuration / frequencies.length;
        frequencies.forEach((freq, index) => {
            setTimeout(() => {
                this.playTone(freq, noteDuration * 1.5, type, volume * (1 - index * 0.2));
            }, index * noteDuration * 1000);
        });
    }

    startMusic() {
        if (!this.musicEnabled || !this.audioContext || this.musicLoop) return;

        const playMusicLoop = () => {
            const notes = [130.81, 146.83, 164.81, 174.61, 196.00, 220.00, 246.94];
            const pattern = [0, 2, 4, 2, 0, 2, 4, 5, 4, 2, 0];
            let noteIndex = 0;

            this.musicLoop = setInterval(() => {
                if (this.musicEnabled) {
                    const freq = notes[pattern[noteIndex % pattern.length]];
                    this.playTone(freq, 0.1, 'triangle', 0.05);
                    noteIndex++;
                }
            }, 200);
        };

        playMusicLoop();
    }

    stopMusic() {
        if (this.musicLoop) {
            clearInterval(this.musicLoop);
            this.musicLoop = null;
        }
    }

    play(soundName) {
        if (this.sounds[soundName]) {
            this.sounds[soundName]();
        }
    }

    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        return this.soundEnabled;
    }

    toggleMusic() {
        this.musicEnabled = !this.musicEnabled;
        if (this.musicEnabled) {
            this.startMusic();
        } else {
            this.stopMusic();
        }
        return this.musicEnabled;
    }

    setVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
    }
}