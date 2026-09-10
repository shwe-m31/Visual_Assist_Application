// Settings Manager - Handles application settings and preferences
export class SettingsManager {
    constructor() {
        this.settings = this.getDefaultSettings();
        this.storageKey = 'visualAssistSettings';
    }

    async initialize() {
        await this.loadSettings();
    }

    getDefaultSettings() {
        return {
            // Voice settings
            voiceSpeed: 'normal',
            voiceVolume: 100,
            voiceLanguage: 'en-US',
            announcementFrequency: 'normal',
            
            // Detection settings
            detectionSensitivity: 'normal',
            confidenceThreshold: 0.6,
            personDetection: true,
            vehicleDetection: true,
            obstacleWarnings: true,
            distanceAnnouncements: true,
            directionalAnnouncements: true,
            
            // Safety settings
            continuousDetection: true,
            batteryOptimization: true,
            emergencySafetyMode: false,
            
            // Accessibility settings
            screenReaderSupport: true,
            largeText: false,
            highContrast: false,
            reducedMotion: false,
            
            // Privacy settings
            cameraProcessing: 'on-device',
            detectionHistory: true,
            dataStorage: false,
            
            // Performance settings
            detectionInterval: 500,
            frameSkip: 2,
            
            // First launch flag
            isFirstLaunch: true
        };
    }

    async loadSettings() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                const parsed = JSON.parse(stored);
                this.settings = { ...this.getDefaultSettings(), ...parsed };
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
            this.settings = this.getDefaultSettings();
        }
    }

    async saveSettings() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.settings));
        } catch (error) {
            console.error('Failed to save settings:', error);
        }
    }

    getSettings() {
        return { ...this.settings };
    }

    getVoiceSettings() {
        return {
            voiceSpeed: this.settings.voiceSpeed,
            voiceVolume: this.settings.voiceVolume,
            voiceLanguage: this.settings.voiceLanguage
        };
    }

    getDetectionSettings() {
        return {
            detectionSensitivity: this.settings.detectionSensitivity,
            confidenceThreshold: this.settings.confidenceThreshold,
            personDetection: this.settings.personDetection,
            vehicleDetection: this.settings.vehicleDetection,
            obstacleWarnings: this.settings.obstacleWarnings,
            distanceAnnouncements: this.settings.distanceAnnouncements,
            directionalAnnouncements: this.settings.directionalAnnouncements
        };
    }

    getSafetySettings() {
        return {
            continuousDetection: this.settings.continuousDetection,
            batteryOptimization: this.settings.batteryOptimization,
            emergencySafetyMode: this.settings.emergencySafetyMode
        };
    }

    getAccessibilitySettings() {
        return {
            screenReaderSupport: this.settings.screenReaderSupport,
            largeText: this.settings.largeText,
            highContrast: this.settings.highContrast,
            reducedMotion: this.settings.reducedMotion
        };
    }

    getPrivacySettings() {
        return {
            cameraProcessing: this.settings.cameraProcessing,
            detectionHistory: this.settings.detectionHistory,
            dataStorage: this.settings.dataStorage
        };
    }

    getPerformanceSettings() {
        return {
            detectionInterval: this.settings.detectionInterval,
            frameSkip: this.settings.frameSkip
        };
    }

    getDetectionInterval() {
        // Adjust interval based on battery optimization
        if (this.settings.batteryOptimization) {
            return 1000; // Slower detection for battery saving
        }
        return this.settings.detectionInterval;
    }

    saveAccessibilitySettings(settings) {
        Object.assign(this.settings, settings);
        this.settings.isFirstLaunch = false;
        this.saveSettings();
    }

    updateSetting(key, value) {
        this.settings[key] = value;
        this.saveSettings();
    }

    setVoiceSpeed(speed) {
        this.settings.voiceSpeed = speed;
        this.saveSettings();
    }

    setVoiceVolume(volume) {
        this.settings.voiceVolume = volume;
        this.saveSettings();
    }

    setContinuousDetection(enabled) {
        this.settings.continuousDetection = enabled;
        this.saveSettings();
    }

    setDetectionSensitivity(sensitivity) {
        this.settings.detectionSensitivity = sensitivity;
        
        // Adjust confidence threshold based on sensitivity
        switch (sensitivity) {
            case 'low':
                this.settings.confidenceThreshold = 0.7;
                break;
            case 'normal':
                this.settings.confidenceThreshold = 0.6;
                break;
            case 'high':
                this.settings.confidenceThreshold = 0.5;
                break;
        }
        
        this.saveSettings();
    }

    setEmergencyMode(enabled) {
        this.settings.emergencySafetyMode = enabled;
        this.saveSettings();
    }

    setBatteryOptimization(enabled) {
        this.settings.batteryOptimization = enabled;
        this.saveSettings();
    }

    setLargeText(enabled) {
        this.settings.largeText = enabled;
        this.applyLargeText(enabled);
        this.saveSettings();
    }

    setHighContrast(enabled) {
        this.settings.highContrast = enabled;
        this.applyHighContrast(enabled);
        this.saveSettings();
    }

    setReducedMotion(enabled) {
        this.settings.reducedMotion = enabled;
        this.applyReducedMotion(enabled);
        this.saveSettings();
    }

    applyLargeText(enabled) {
        if (enabled) {
            document.documentElement.style.fontSize = '18px';
        } else {
            document.documentElement.style.fontSize = '16px';
        }
    }

    applyHighContrast(enabled) {
        if (enabled) {
            document.body.classList.add('high-contrast');
        } else {
            document.body.classList.remove('high-contrast');
        }
    }

    applyReducedMotion(enabled) {
        if (enabled) {
            document.body.classList.add('reduced-motion');
        } else {
            document.body.classList.remove('reduced-motion');
        }
    }

    isFirstLaunch() {
        return this.settings.isFirstLaunch;
    }

    resetSettings() {
        this.settings = this.getDefaultSettings();
        this.settings.isFirstLaunch = false;
        this.saveSettings();
    }

    exportSettings() {
        return JSON.stringify(this.settings, null, 2);
    }

    importSettings(settingsJson) {
        try {
            const imported = JSON.parse(settingsJson);
            this.settings = { ...this.getDefaultSettings(), ...imported };
            this.saveSettings();
            return true;
        } catch (error) {
            console.error('Failed to import settings:', error);
            return false;
        }
    }
}