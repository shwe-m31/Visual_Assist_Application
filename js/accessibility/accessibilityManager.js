// Accessibility Manager - Handles accessibility features and screen reader support
export class AccessibilityManager {
    constructor() {
        this.isEnabled = true;
        this.settings = {
            screenReaderEnabled: true,
            largeTextEnabled: false,
            highContrastEnabled: false,
            reducedMotionEnabled: false
        };
    }

    async initialize() {
        this.loadAccessibilitySettings();
        this.applyAccessibilitySettings();
        this.setupKeyboardNavigation();
        this.setupFocusManagement();
    }

    loadAccessibilitySettings() {
        try {
            const stored = localStorage.getItem('visualAssistAccessibility');
            if (stored) {
                const parsed = JSON.parse(stored);
                this.settings = { ...this.settings, ...parsed };
            }
        } catch (error) {
            console.error('Failed to load accessibility settings:', error);
        }
    }

    saveAccessibilitySettings() {
        try {
            localStorage.setItem('visualAssistAccessibility', JSON.stringify(this.settings));
        } catch (error) {
            console.error('Failed to save accessibility settings:', error);
        }
    }

    applyAccessibilitySettings() {
        this.applyLargeText(this.settings.largeTextEnabled);
        this.applyHighContrast(this.settings.highContrastEnabled);
        this.applyReducedMotion(this.settings.reducedMotionEnabled);
    }

    applyLargeText(enabled) {
        const root = document.documentElement;
        if (enabled) {
            root.style.fontSize = '20px';
            root.setAttribute('data-large-text', 'true');
        } else {
            root.style.fontSize = '16px';
            root.removeAttribute('data-large-text');
        }
    }

    applyHighContrast(enabled) {
        const body = document.body;
        if (enabled) {
            body.classList.add('high-contrast');
            body.setAttribute('data-high-contrast', 'true');
        } else {
            body.classList.remove('high-contrast');
            body.removeAttribute('data-high-contrast');
        }
    }

    applyReducedMotion(enabled) {
        const body = document.body;
        if (enabled) {
            body.classList.add('reduced-motion');
            body.setAttribute('data-reduced-motion', 'true');
        } else {
            body.classList.remove('reduced-motion');
            body.removeAttribute('data-reduced-motion');
        }
    }

    setupKeyboardNavigation() {
        // Add keyboard navigation support
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardNavigation(e);
        });
    }

    handleKeyboardNavigation(event) {
        // Handle common keyboard shortcuts
        switch (event.key) {
            case 'Escape':
                // Go back to previous screen
                document.getElementById('back-from-settings-btn')?.click();
                document.getElementById('back-to-vision-btn')?.click();
                document.getElementById('back-from-history-btn')?.click();
                break;
                
            case ' ':
                // Space to toggle detection
                if (event.target.tagName !== 'BUTTON' && event.target.tagName !== 'INPUT') {
                    event.preventDefault();
                    document.getElementById('pause-detection-btn')?.click();
                }
                break;
                
            case 'r':
            case 'R':
                // R to repeat
                if (event.target.tagName !== 'INPUT' && event.target.tagName !== 'TEXTAREA') {
                    document.getElementById('repeat-btn')?.click();
                }
                break;
                
            case 's':
            case 'S':
                // S to describe surroundings
                if (event.target.tagName !== 'INPUT' && event.target.tagName !== 'TEXTAREA') {
                    document.getElementById('what-around-btn')?.click();
                }
                break;
                
            case 'm':
            case 'M':
                // M to open menu
                if (event.target.tagName !== 'INPUT' && event.target.tagName !== 'TEXTAREA') {
                    document.getElementById('menu-btn')?.click();
                }
                break;
        }
    }

    setupFocusManagement() {
        // Ensure focus is visible
        const style = document.createElement('style');
        style.textContent = `
            *:focus-visible {
                outline: 3px solid var(--accent) !important;
                outline-offset: 2px !important;
            }
            
            button:focus-visible,
            a:focus-visible,
            input:focus-visible {
                outline: 3px solid var(--accent) !important;
                outline-offset: 2px !important;
            }
        `;
        document.head.appendChild(style);
    }

    announce(message) {
        if (!this.settings.screenReaderEnabled) {
            return;
        }

        // Create ARIA live region for announcements
        let liveRegion = document.getElementById('accessibility-live-region');
        
        if (!liveRegion) {
            liveRegion = document.createElement('div');
            liveRegion.id = 'accessibility-live-region';
            liveRegion.setAttribute('aria-live', 'polite');
            liveRegion.setAttribute('aria-atomic', 'true');
            liveRegion.className = 'sr-only';
            document.body.appendChild(liveRegion);
        }

        liveRegion.textContent = message;
        
        // Clear after announcement
        setTimeout(() => {
            liveRegion.textContent = '';
        }, 1000);
    }

    announceScreenChange(screenName) {
        this.announce(`Screen changed to ${screenName}`);
    }

    announceStateChange(state) {
        this.announce(state);
    }

    announceError(message) {
        const liveRegion = document.getElementById('accessibility-live-region') || this.createLiveRegion();
        liveRegion.setAttribute('aria-live', 'assertive');
        liveRegion.textContent = `Error: ${message}`;
        
        setTimeout(() => {
            liveRegion.setAttribute('aria-live', 'polite');
            liveRegion.textContent = '';
        }, 3000);
    }

    createLiveRegion() {
        const liveRegion = document.createElement('div');
        liveRegion.id = 'accessibility-live-region';
        liveRegion.setAttribute('aria-live', 'polite');
        liveRegion.setAttribute('aria-atomic', 'true');
        liveRegion.className = 'sr-only';
        document.body.appendChild(liveRegion);
        return liveRegion;
    }

    setLargeText(enabled) {
        this.settings.largeTextEnabled = enabled;
        this.applyLargeText(enabled);
        this.saveAccessibilitySettings();
    }

    setHighContrast(enabled) {
        this.settings.highContrastEnabled = enabled;
        this.applyHighContrast(enabled);
        this.saveAccessibilitySettings();
    }

    setReducedMotion(enabled) {
        this.settings.reducedMotionEnabled = enabled;
        this.applyReducedMotion(enabled);
        this.saveAccessibilitySettings();
    }

    setScreenReaderEnabled(enabled) {
        this.settings.screenReaderEnabled = enabled;
        this.saveAccessibilitySettings();
    }

    getSettings() {
        return { ...this.settings };
    }

    // Check if user prefers reduced motion
    prefersReducedMotion() {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    // Check if user prefers high contrast
    prefersHighContrast() {
        return window.matchMedia('(prefers-contrast: high)').matches;
    }

    // Apply system preferences
    applySystemPreferences() {
        if (this.prefersReducedMotion()) {
            this.setReducedMotion(true);
        }
        
        if (this.prefersHighContrast()) {
            this.setHighContrast(true);
        }
    }

    // Get accessible focusable elements
    getFocusableElements(container = document) {
        const focusableSelectors = [
            'button:not([disabled])',
            'a[href]',
            'input:not([disabled])',
            'select:not([disabled])',
            'textarea:not([disabled])',
            '[tabindex]:not([tabindex="-1"])'
        ].join(', ');

        return Array.from(container.querySelectorAll(focusableSelectors));
    }

    // Trap focus in a container (for modals)
    trapFocus(container) {
        const focusableElements = this.getFocusableElements(container);
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        container.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                if (e.shiftKey) {
                    if (document.activeElement === firstElement) {
                        e.preventDefault();
                        lastElement.focus();
                    }
                } else {
                    if (document.activeElement === lastElement) {
                        e.preventDefault();
                        firstElement.focus();
                    }
                }
            }
        });
    }

    // Release focus trap
    releaseFocus(container) {
        // Remove event listeners (simplified - in production, store listener references)
    }
}