// Voice Engine - Handles text-to-speech and voice feedback
export class VoiceEngine {
    constructor() {
        this.synthesis = window.speechSynthesis;
        this.currentUtterance = null;
        this.lastAnnouncement = null;
        this.isSpeaking = false;
        this.settings = {
            voice: null,
            rate: 1.0,
            pitch: 1.0,
            volume: 1.0
        };
        this.announcementQueue = [];
        this.isQueueProcessing = false;
    }

    initialize(settings = {}) {
        this.updateSettings(settings);
        this.loadVoices();
        
        // Handle voice loading (some browsers load voices asynchronously)
        if (this.synthesis.onvoiceschanged !== undefined) {
            this.synthesis.onvoiceschanged = () => this.loadVoices();
        }
    }

    loadVoices() {
        this.voices = this.synthesis.getVoices();
        console.log(`Loaded ${this.voices.length} voices`);
    }

    updateSettings(settings) {
        if (settings.voiceSpeed !== undefined) {
            this.settings.rate = this.getRateFromSpeed(settings.voiceSpeed);
        }
        if (settings.voiceVolume !== undefined) {
            this.settings.volume = settings.voiceVolume / 100;
        }
        if (settings.voice !== undefined) {
            this.settings.voice = settings.voice;
        }
    }

    getRateFromSpeed(speed) {
        const speeds = {
            'slow': 0.8,
            'normal': 1.0,
            'fast': 1.2
        };
        return speeds[speed] || 1.0;
    }

    async speak(text, options = {}) {
        if (!text || text.trim() === '') {
            return;
        }

        // Cancel current speech if options.interrupt is true
        if (options.interrupt && this.isSpeaking) {
            this.synthesis.cancel();
        }

        // Don't interrupt if already speaking unless specified
        if (this.isSpeaking && !options.interrupt) {
            // Add to queue instead
            this.announcementQueue.push({ text, options });
            this.processQueue();
            return;
        }

        // Store for repeat functionality
        this.lastAnnouncement = text;

        // Create utterance
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Apply settings
        utterance.rate = this.settings.rate;
        utterance.pitch = this.settings.pitch;
        utterance.volume = this.settings.volume;
        
        // Select voice
        if (this.settings.voice) {
            utterance.voice = this.getVoiceByName(this.settings.voice);
        } else {
            // Try to select a natural-sounding English voice
            utterance.voice = this.getBestVoice();
        }

        // Set up event handlers
        utterance.onstart = () => {
            this.isSpeaking = true;
            this.onSpeechStart?.();
        };

        utterance.onend = () => {
            this.isSpeaking = false;
            this.onSpeechEnd?.();
            this.processQueue();
        };

        utterance.onerror = (event) => {
            console.error('Speech synthesis error:', event.error);
            this.isSpeaking = false;
            this.onSpeechError?.(event.error);
            this.processQueue();
        };

        this.currentUtterance = utterance;
        this.synthesis.speak(utterance);
    }

    getVoiceByName(name) {
        return this.voices?.find(voice => voice.name === name);
    }

    getBestVoice() {
        if (!this.voices || this.voices.length === 0) {
            return null;
        }

        // Prefer English voices
        const englishVoices = this.voices.filter(voice => 
            voice.lang.startsWith('en')
        );

        if (englishVoices.length === 0) {
            return this.voices[0];
        }

        // Prefer natural-sounding voices (Google, Microsoft, Apple)
        const preferredVoices = englishVoices.filter(voice =>
            voice.name.includes('Google') ||
            voice.name.includes('Microsoft') ||
            voice.name.includes('Samantha') ||
            voice.name.includes('Daniel') ||
            voice.name.includes('Karen')
        );

        if (preferredVoices.length > 0) {
            return preferredVoices[0];
        }

        return englishVoices[0];
    }

    stop() {
        this.synthesis.cancel();
        this.isSpeaking = false;
        this.announcementQueue = [];
    }

    pause() {
        if (this.isSpeaking) {
            this.synthesis.pause();
        }
    }

    resume() {
        this.synthesis.resume();
    }

    repeatLast() {
        if (this.lastAnnouncement) {
            this.speak(this.lastAnnouncement, { interrupt: true });
        }
    }

    processQueue() {
        if (this.isQueueProcessing || this.announcementQueue.length === 0) {
            return;
        }

        this.isQueueProcessing = true;
        
        const next = this.announcementQueue.shift();
        this.speak(next.text, { ...next.options, interrupt: true });
        
        setTimeout(() => {
            this.isQueueProcessing = false;
            this.processQueue();
        }, 100);
    }

    // Natural language generation helpers
    generateObjectAnnouncement(object, direction, distance) {
        let text = object;
        
        if (direction) {
            text += ` on your ${direction}`;
        }
        
        if (distance) {
            text += ` approximately ${distance}`;
        }
        
        return text;
    }

    generateMultipleObjectAnnouncement(objects) {
        if (objects.length === 0) {
            return 'No objects detected.';
        }

        if (objects.length === 1) {
            return this.generateObjectAnnouncement(
                objects[0].class,
                objects[0].direction,
                objects[0].distance
            );
        }

        // Group similar objects
        const grouped = this.groupSimilarObjects(objects);
        const parts = [];

        for (const [objectClass, group] of Object.entries(grouped)) {
            const count = group.length;
            const sample = group[0];
            
            if (count === 1) {
                parts.push(this.generateObjectAnnouncement(objectClass, sample.direction, sample.distance));
            } else {
                parts.push(`${count} ${objectClass}s`);
            }
        }

        return parts.join(', ');
    }

    groupSimilarObjects(objects) {
        const grouped = {};
        
        for (const obj of objects) {
            if (!grouped[obj.class]) {
                grouped[obj.class] = [];
            }
            grouped[obj.class].push(obj);
        }
        
        return grouped;
    }

    generateSafetyAnnouncement(object, direction, distance) {
        const urgency = this.getUrgencyLevel(distance);
        
        switch (urgency) {
            case 'critical':
                return `Attention! ${object} ${direction ? 'on your ' + direction : ''} ${distance || 'very close'}`;
            case 'high':
                return `Caution: ${object} ${direction ? 'on your ' + direction : ''} ${distance || 'nearby'}`;
            default:
                return `${object} ${direction ? 'on your ' + direction : ''} ${distance || 'detected'}`;
        }
    }

    getUrgencyLevel(distance) {
        if (!distance) return 'normal';
        
        if (typeof distance === 'string') {
            if (distance.includes('very close') || distance.includes('less than')) {
                return 'critical';
            }
            if (distance.includes('one meter')) {
                return 'high';
            }
        }
        
        return 'normal';
    }

    // Voice feedback states
    speakState(state) {
        const stateMessages = {
            'detection-started': 'Detection started',
            'detection-paused': 'Detection paused',
            'detection-resumed': 'Detection resumed',
            'camera-disconnected': 'Camera connection lost',
            'low-light': 'Lighting is low',
            'model-loading': 'Loading vision model',
            'model-ready': 'Vision model ready',
            'error': 'An error occurred'
        };

        const message = stateMessages[state];
        if (message) {
            this.speak(message);
        }
    }

    // Callbacks for UI integration
    onSpeechStart(callback) {
        this.onSpeechStart = callback;
    }

    onSpeechEnd(callback) {
        this.onSpeechEnd = callback;
    }

    onSpeechError(callback) {
        this.onSpeechError = callback;
    }

    // Get available voices
    getAvailableVoices() {
        return this.voices || [];
    }

    // Get current settings
    getSettings() {
        return { ...this.settings };
    }

    // Check if speaking
    isCurrentlySpeaking() {
        return this.isSpeaking;
    }

    // Clear queue
    clearQueue() {
        this.announcementQueue = [];
    }
}