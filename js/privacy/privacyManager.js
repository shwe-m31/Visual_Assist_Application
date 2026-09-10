// Privacy Manager - Handles privacy settings and data protection
export class PrivacyManager {
    constructor() {
        this.settings = {
            cameraProcessing: 'on-device',
            detectionHistory: true,
            dataStorage: false,
            analyticsEnabled: false,
            crashReportingEnabled: false
        };
    }

    async initialize() {
        this.loadPrivacySettings();
    }

    loadPrivacySettings() {
        try {
            const stored = localStorage.getItem('visualAssistPrivacy');
            if (stored) {
                const parsed = JSON.parse(stored);
                this.settings = { ...this.settings, ...parsed };
            }
        } catch (error) {
            console.error('Failed to load privacy settings:', error);
        }
    }

    savePrivacySettings() {
        try {
            localStorage.setItem('visualAssistPrivacy', JSON.stringify(this.settings));
        } catch (error) {
            console.error('Failed to save privacy settings:', error);
        }
    }

    getCameraProcessingMode() {
        return this.settings.cameraProcessing;
    }

    setCameraProcessingMode(mode) {
        this.settings.cameraProcessing = mode;
        this.savePrivacySettings();
    }

    isDetectionHistoryEnabled() {
        return this.settings.detectionHistory;
    }

    setDetectionHistoryEnabled(enabled) {
        this.settings.detectionHistory = enabled;
        this.savePrivacySettings();
    }

    isDataStorageEnabled() {
        return this.settings.dataStorage;
    }

    setDataStorageEnabled(enabled) {
        this.settings.dataStorage = enabled;
        this.savePrivacySettings();
    }

    clearAllData() {
        // Clear all stored data
        localStorage.removeItem('visualAssistSettings');
        localStorage.removeItem('visualAssistHistory');
        localStorage.removeItem('visualAssistPrivacy');
        localStorage.removeItem('visualAssistAccessibility');
    }

    getPrivacySummary() {
        return {
            cameraProcessing: this.settings.cameraProcessing,
            dataCollection: this.settings.detectionHistory || this.settings.dataStorage,
            analytics: this.settings.analyticsEnabled,
            crashReporting: this.settings.crashReportingEnabled
        };
    }
}