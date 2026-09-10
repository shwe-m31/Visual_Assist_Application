// Haptic Manager - Handles haptic feedback for tactile responses
export class HapticManager {
    constructor() {
        this.isSupported = this.checkHapticSupport();
        this.isEnabled = true;
    }

    checkHapticSupport() {
        // Check for Vibration API support
        return 'vibrate' in navigator;
    }

    vibrate(pattern) {
        if (!this.isSupported || !this.isEnabled) {
            return;
        }

        try {
            navigator.vibrate(pattern);
        } catch (error) {
            console.error('Haptic feedback error:', error);
        }
    }

    // Predefined haptic patterns
    lightTap() {
        this.vibrate(10);
    }

    mediumTap() {
        this.vibrate(20);
    }

    heavyTap() {
        this.vibrate(30);
    }

    success() {
        this.vibrate([10, 50, 10]);
    }

    error() {
        this.vibrate([30, 50, 30, 50, 30]);
    }

    warning() {
        this.vibrate([20, 100, 20]);
    }

    notification() {
        this.vibrate([10, 30, 10, 30, 10]);
    }

    confirmation() {
        this.vibrate([15, 50, 15]);
    }

    // Detection feedback
    detectionConfirmed() {
        this.lightTap();
    }

    criticalObstacle() {
        this.error();
    }

    vehicleApproaching() {
        this.warning();
    }

    personDetected() {
        this.mediumTap();
    }

    // Voice command feedback
    voiceCommandAccepted() {
        this.confirmation();
    }

    voiceCommandRejected() {
        this.error();
    }

    // Navigation feedback
    screenChanged() {
        this.lightTap();
    }

    buttonPressed() {
        this.lightTap();
    }

    // Settings feedback
    settingChanged() {
        this.mediumTap();
    }

    // Long vibration for important events
    longNotification() {
        this.vibrate([50, 100, 50, 100, 50]);
    }

    // Pattern for SOS or emergency
    emergencyPattern() {
        this.vibrate([50, 50, 50, 50, 50, 50, 200, 200, 50, 50, 50, 50, 50, 50, 200, 200, 50, 50, 50, 50, 50, 50]);
    }

    // Custom pattern
    customPattern(pattern) {
        this.vibrate(pattern);
    }

    // Cancel ongoing vibration
    cancel() {
        if (this.isSupported) {
            navigator.vibrate(0);
        }
    }

    // Enable/disable haptic feedback
    setEnabled(enabled) {
        this.isEnabled = enabled;
    }

    // Check if haptic feedback is enabled
    isEnabledState() {
        return this.isEnabled;
    }

    // Check if device supports haptic feedback
    isSupportedState() {
        return this.isSupported;
    }
}