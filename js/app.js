// Main Application Entry Point
import { ScreenManager } from './ui/screenManager.js';
import { CameraManager } from './camera/cameraManager.js';
import { VisionEngine } from './vision/visionEngine.js';
import { DetectionPipeline } from './detection/detectionPipeline.js';
import { DirectionEngine } from './direction/directionEngine.js';
import { DistanceEngine } from './distance/distanceEngine.js';
import { PriorityEngine } from './priority/priorityEngine.js';
import { VoiceEngine } from './voice/voiceEngine.js';
import { CommandProcessor } from './commands/commandProcessor.js';
import { SettingsManager } from './settings/settingsManager.js';
import { HistoryManager } from './history/historyManager.js';
import { AccessibilityManager } from './accessibility/accessibilityManager.js';

class VisualAssistApp {
    constructor() {
        this.screenManager = new ScreenManager();
        this.cameraManager = new CameraManager();
        this.visionEngine = new VisionEngine();
        this.detectionPipeline = new DetectionPipeline();
        this.directionEngine = new DirectionEngine();
        this.distanceEngine = new DistanceEngine();
        this.priorityEngine = new PriorityEngine();
        this.voiceEngine = new VoiceEngine();
        this.commandProcessor = new CommandProcessor();
        this.settingsManager = new SettingsManager();
        this.historyManager = new HistoryManager();
        this.accessibilityManager = new AccessibilityManager();
        
        this.isInitialized = false;
        this.isDetectionActive = false;
        this.currentDetections = [];
    }

    async initialize() {
        try {
            console.log('Initializing Visual Assist...');
            
            // Initialize managers
            await this.settingsManager.initialize();
            await this.accessibilityManager.initialize();
            await this.historyManager.initialize();
            
            // Initialize voice engine with settings
            this.voiceEngine.initialize(this.settingsManager.getVoiceSettings());
            
            // Setup screen manager
            this.screenManager.initialize();
            
            // Initialize camera manager
            this.cameraManager.initialize();
            
            // Initialize vision engine
            await this.visionEngine.initialize();
            
            // Initialize detection pipeline
            this.detectionPipeline.initialize({
                visionEngine: this.visionEngine,
                directionEngine: this.directionEngine,
                distanceEngine: this.distanceEngine,
                priorityEngine: this.priorityEngine,
                voiceEngine: this.voiceEngine,
                settingsManager: this.settingsManager
            });
            
            // Initialize command processor
            this.commandProcessor.initialize({
                voiceEngine: this.voiceEngine,
                detectionPipeline: this.detectionPipeline,
                screenManager: this.screenManager,
                settingsManager: this.settingsManager
            });
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Check if first launch
            if (this.settingsManager.isFirstLaunch()) {
                this.screenManager.showScreen('accessibility-screen');
            } else {
                this.screenManager.showScreen('welcome-screen');
            }
            
            this.isInitialized = true;
            console.log('Visual Assist initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize Visual Assist:', error);
            this.showError('Initialization Failed', error.message);
        }
    }

    setupEventListeners() {
        // Welcome screen
        document.getElementById('start-assistance-btn')?.addEventListener('click', () => {
            this.startAssistance();
        });

        document.getElementById('accessibility-setup-btn')?.addEventListener('click', () => {
            this.screenManager.showScreen('accessibility-screen');
        });

        // Accessibility setup
        document.getElementById('save-accessibility-btn')?.addEventListener('click', () => {
            this.saveAccessibilitySettings();
        });

        document.getElementById('skip-accessibility-btn')?.addEventListener('click', () => {
            this.screenManager.showScreen('vision-screen');
        });

        // Vision screen
        document.getElementById('activate-camera-btn')?.addEventListener('click', () => {
            this.activateCamera();
        });

        document.getElementById('pause-detection-btn')?.addEventListener('click', () => {
            this.toggleDetection();
        });

        document.getElementById('repeat-btn')?.addEventListener('click', () => {
            this.repeatLastAnnouncement();
        });

        document.getElementById('what-around-btn')?.addEventListener('click', () => {
            this.describeSurroundings();
        });

        document.getElementById('menu-btn')?.addEventListener('click', () => {
            this.screenManager.showScreen('settings-screen');
        });

        // Settings screen
        document.getElementById('back-from-settings-btn')?.addEventListener('click', () => {
            this.screenManager.showScreen('vision-screen');
        });

        // Detection details
        document.getElementById('back-to-vision-btn')?.addEventListener('click', () => {
            this.screenManager.showScreen('vision-screen');
        });

        document.getElementById('speak-details-btn')?.addEventListener('click', () => {
            this.speakDetectionDetails();
        });

        // History screen
        document.getElementById('back-from-history-btn')?.addEventListener('click', () => {
            this.screenManager.showScreen('vision-screen');
        });

        document.getElementById('clear-history-btn')?.addEventListener('click', () => {
            this.historyManager.clear();
            this.updateHistoryDisplay();
        });

        // Help screen
        document.getElementById('back-from-help-btn')?.addEventListener('click', () => {
            this.screenManager.showScreen('vision-screen');
        });

        // About screen
        document.getElementById('back-from-about-btn')?.addEventListener('click', () => {
            this.screenManager.showScreen('vision-screen');
        });

        // Error screen
        document.getElementById('error-action-btn')?.addEventListener('click', () => {
            this.screenManager.showScreen('welcome-screen');
        });

        // Permission screen
        document.getElementById('grant-permission-btn')?.addEventListener('click', () => {
            this.handlePermissionGranted();
        });

        document.getElementById('deny-permission-btn')?.addEventListener('click', () => {
            this.handlePermissionDenied();
        });

        // Settings navigation
        document.querySelectorAll('.settings-nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.handleSettingsNavigation(e.target.dataset.section);
            });
        });

        // Segmented controls
        document.querySelectorAll('.segmented-control').forEach(control => {
            control.querySelectorAll('.segment-button').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    this.handleSegmentedControl(control, e.target);
                });
            });
        });

        // Volume controls
        document.querySelectorAll('.volume-control').forEach(control => {
            control.querySelectorAll('.volume-button').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    this.handleVolumeControl(control, e.target.dataset.action);
                });
            });
        });

        // Toggle switches
        document.querySelectorAll('.toggle-label input').forEach(toggle => {
            toggle.addEventListener('change', (e) => {
                this.handleToggleChange(e.target);
            });
        });
    }

    async startAssistance() {
        try {
            await this.requestCameraPermission();
        } catch (error) {
            this.showError('Camera Error', 'Unable to access camera. Please grant permission.');
        }
    }

    async requestCameraPermission() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            stream.getTracks().forEach(track => track.stop());
            this.screenManager.showScreen('vision-screen');
            await this.activateCamera();
        } catch (error) {
            this.screenManager.showScreen('permission-screen');
            throw error;
        }
    }

    async activateCamera() {
        try {
            await this.cameraManager.startCamera();
            document.getElementById('camera-placeholder').classList.add('hidden');
            this.startDetection();
        } catch (error) {
            this.showError('Camera Error', error.message);
        }
    }

    startDetection() {
        if (!this.isDetectionActive) {
            this.isDetectionActive = true;
            this.detectionPipeline.start();
            this.updateDetectionStatus('LIVE DETECTION');
            document.getElementById('pause-detection-btn').textContent = 'PAUSE';
        }
    }

    stopDetection() {
        if (this.isDetectionActive) {
            this.isDetectionActive = false;
            this.detectionPipeline.stop();
            this.updateDetectionStatus('PAUSED');
            document.getElementById('pause-detection-btn').textContent = 'RESUME';
        }
    }

    toggleDetection() {
        if (this.isDetectionActive) {
            this.stopDetection();
        } else {
            this.startDetection();
        }
    }

    updateDetectionStatus(status) {
        const statusElement = document.getElementById('detection-status');
        statusElement.textContent = status;
        statusElement.className = 'status-text';
        
        if (status === 'PAUSED') {
            statusElement.classList.add('paused');
        } else if (status.includes('ERROR')) {
            statusElement.classList.add('error');
        }
    }

    repeatLastAnnouncement() {
        this.voiceEngine.repeatLast();
    }

    describeSurroundings() {
        this.detectionPipeline.describeSurroundings();
    }

    speakDetectionDetails() {
        const details = this.getCurrentDetectionDetails();
        this.voiceEngine.speak(details);
    }

    getCurrentDetectionDetails() {
        // Generate detailed description of current detections
        if (this.currentDetections.length === 0) {
            return 'No objects currently detected.';
        }

        const details = this.currentDetections.map(detection => {
            return `${detection.object} ${detection.direction ? 'on your ' + detection.direction : ''} ${detection.distance ? 'approximately ' + detection.distance : ''}`;
        }).join(', ');

        return `Detected: ${details}`;
    }

    saveAccessibilitySettings() {
        const settings = this.collectAccessibilitySettings();
        this.settingsManager.saveAccessibilitySettings(settings);
        this.voiceEngine.updateSettings(settings);
        this.screenManager.showScreen('vision-screen');
    }

    collectAccessibilitySettings() {
        return {
            voiceSpeed: this.getSelectedSegmentValue('voice-speed'),
            voiceVolume: this.getVolumeValue(),
            announcementFrequency: this.getSelectedSegmentValue('announcement-frequency'),
            detectionSensitivity: this.getSelectedSegmentValue('detection-sensitivity'),
            personDetection: document.getElementById('person-detection')?.checked || false,
            vehicleDetection: document.getElementById('vehicle-detection')?.checked || false,
            obstacleWarnings: document.getElementById('obstacle-warnings')?.checked || false,
            distanceAnnouncements: document.getElementById('distance-announcements')?.checked || false,
            directionalAnnouncements: document.getElementById('directional-announcements')?.checked || false,
            continuousDetection: document.getElementById('continuous-detection')?.checked || false,
            batteryOptimization: document.getElementById('battery-optimization')?.checked || false,
            emergencySafetyMode: document.getElementById('emergency-safety-mode')?.checked || false
        };
    }

    getSelectedSegmentValue(controlName) {
        const control = document.querySelector(`[data-control="${controlName}"]`);
        if (control) {
            const activeButton = control.querySelector('.segment-button.active');
            return activeButton?.dataset.value || 'normal';
        }
        return 'normal';
    }

    getVolumeValue() {
        const volumeElement = document.querySelector('.volume-value');
        return parseInt(volumeElement?.textContent || '100');
    }

    handleSegmentedControl(control, button) {
        control.querySelectorAll('.segment-button').forEach(btn => {
            btn.classList.remove('active');
        });
        button.classList.add('active');
    }

    handleVolumeControl(control, action) {
        const volumeElement = control.querySelector('.volume-value');
        let currentVolume = parseInt(volumeElement.textContent);
        
        if (action === 'increase') {
            currentVolume = Math.min(150, currentVolume + 10);
        } else {
            currentVolume = Math.max(50, currentVolume - 10);
        }
        
        volumeElement.textContent = currentVolume + '%';
    }

    handleToggleChange(toggle) {
        // Toggle change is handled by accessibility settings collection
        console.log('Toggle changed:', toggle.id, toggle.checked);
    }

    handleSettingsNavigation(section) {
        document.querySelectorAll('.settings-nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-section="${section}"]`).classList.add('active');
        this.renderSettingsSection(section);
    }

    renderSettingsSection(section) {
        const content = document.getElementById('settings-content');
        // Render section-specific settings
        switch (section) {
            case 'voice':
                content.innerHTML = this.renderVoiceSettings();
                break;
            case 'vision':
                content.innerHTML = this.renderVisionSettings();
                break;
            case 'safety':
                content.innerHTML = this.renderSafetySettings();
                break;
            case 'accessibility':
                content.innerHTML = this.renderAccessibilitySettings();
                break;
            case 'privacy':
                content.innerHTML = this.renderPrivacySettings();
                break;
        }
    }

    renderVoiceSettings() {
        return `
            <div class="settings-section">
                <h2 class="section-title">Voice Settings</h2>
                <div class="setting-group">
                    <label class="setting-label">Voice Speed</label>
                    <div class="segmented-control" data-control="voice-speed">
                        <button class="segment-button" data-value="slow">SLOW</button>
                        <button class="segment-button active" data-value="normal">NORMAL</button>
                        <button class="segment-button" data-value="fast">FAST</button>
                    </div>
                </div>
                <div class="setting-group">
                    <label class="setting-label">Voice Volume</label>
                    <div class="volume-control">
                        <button class="volume-button" data-action="decrease">LOWER</button>
                        <span class="volume-value">100%</span>
                        <button class="volume-button" data-action="increase">HIGHER</button>
                    </div>
                </div>
            </div>
        `;
    }

    renderVisionSettings() {
        return `
            <div class="settings-section">
                <h2 class="section-title">Vision Settings</h2>
                <div class="setting-group">
                    <label class="setting-label">Detection Sensitivity</label>
                    <div class="segmented-control" data-control="detection-sensitivity">
                        <button class="segment-button" data-value="low">LOW</button>
                        <button class="segment-button active" data-value="normal">NORMAL</button>
                        <button class="segment-button" data-value="high">HIGH</button>
                    </div>
                </div>
                <div class="setting-group">
                    <label class="toggle-label">
                        <input type="checkbox" id="person-detection" checked>
                        <span class="toggle-text">Person Detection</span>
                    </label>
                </div>
                <div class="setting-group">
                    <label class="toggle-label">
                        <input type="checkbox" id="vehicle-detection" checked>
                        <span class="toggle-text">Vehicle Detection</span>
                    </label>
                </div>
            </div>
        `;
    }

    renderSafetySettings() {
        return `
            <div class="settings-section">
                <h2 class="section-title">Safety Settings</h2>
                <div class="setting-group">
                    <label class="toggle-label">
                        <input type="checkbox" id="obstacle-warnings" checked>
                        <span class="toggle-text">Obstacle Warnings</span>
                    </label>
                </div>
                <div class="setting-group">
                    <label class="toggle-label">
                        <input type="checkbox" id="emergency-safety-mode">
                        <span class="toggle-text">Emergency Safety Mode</span>
                    </label>
                </div>
            </div>
        `;
    }

    renderAccessibilitySettings() {
        return `
            <div class="settings-section">
                <h2 class="section-title">Accessibility Settings</h2>
                <div class="setting-group">
                    <label class="toggle-label">
                        <input type="checkbox" id="screen-reader" checked>
                        <span class="toggle-text">Screen Reader Support</span>
                    </label>
                </div>
                <div class="setting-group">
                    <label class="toggle-label">
                        <input type="checkbox" id="large-text">
                        <span class="toggle-text">Large Text</span>
                    </label>
                </div>
                <div class="setting-group">
                    <label class="toggle-label">
                        <input type="checkbox" id="high-contrast">
                        <span class="toggle-text">High Contrast</span>
                    </label>
                </div>
            </div>
        `;
    }

    renderPrivacySettings() {
        return `
            <div class="settings-section">
                <h2 class="section-title">Privacy Settings</h2>
                <div class="setting-group">
                    <label class="setting-label">Camera Processing</label>
                    <div class="segmented-control">
                        <button class="segment-button active">ON DEVICE</button>
                        <button class="segment-button">CLOUD</button>
                    </div>
                </div>
                <div class="setting-group">
                    <label class="toggle-label">
                        <input type="checkbox" id="detection-history" checked>
                        <span class="toggle-text">Detection History</span>
                    </label>
                </div>
                <div class="setting-group">
                    <label class="toggle-label">
                        <input type="checkbox" id="data-storage">
                        <span class="toggle-text">Data Storage</span>
                    </label>
                </div>
            </div>
        `;
    }

    handlePermissionGranted() {
        this.screenManager.showScreen('vision-screen');
        this.activateCamera();
    }

    handlePermissionDenied() {
        this.showError('Permission Required', 'Camera access is required for visual assistance');
    }

    showError(title, message) {
        document.getElementById('error-title').textContent = title;
        document.getElementById('error-message').textContent = message;
        this.screenManager.showScreen('error-screen');
    }

    updateHistoryDisplay() {
        const history = this.historyManager.getHistory();
        const historyList = document.getElementById('history-list');
        
        if (history.length === 0) {
            historyList.innerHTML = `
                <div class="history-empty">
                    <span class="empty-text">No detection history</span>
                </div>
            `;
            return;
        }

        historyList.innerHTML = history.map(item => `
            <div class="history-item">
                <span class="history-time">${item.time}</span>
                <span class="history-detection">${item.detection}</span>
            </div>
        `).join('');
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new VisualAssistApp();
    app.initialize();
});