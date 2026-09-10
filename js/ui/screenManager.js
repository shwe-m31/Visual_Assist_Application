// Screen Manager - Handles screen navigation and transitions
export class ScreenManager {
    constructor() {
        this.currentScreen = null;
        this.screens = {};
        this.screenHistory = [];
    }

    initialize() {
        // Cache all screen elements
        document.querySelectorAll('.screen').forEach(screen => {
            this.screens[screen.id] = screen;
        });
    }

    showScreen(screenId) {
        const screen = this.screens[screenId];
        if (!screen) {
            console.error(`Screen not found: ${screenId}`);
            return;
        }

        // Hide current screen
        if (this.currentScreen) {
            this.currentScreen.classList.remove('active');
            this.currentScreen.classList.add('hidden');
        }

        // Show new screen
        screen.classList.remove('hidden');
        screen.classList.add('active');
        
        // Update history
        if (this.currentScreen && this.currentScreen.id !== screenId) {
            this.screenHistory.push(this.currentScreen.id);
        }

        this.currentScreen = screen;
        
        // Announce screen change for accessibility
        this.announceScreenChange(screenId);
    }

    goBack() {
        if (this.screenHistory.length > 0) {
            const previousScreenId = this.screenHistory.pop();
            this.showScreen(previousScreenId);
        }
    }

    getCurrentScreen() {
        return this.currentScreen;
    }

    announceScreenChange(screenId) {
        // Generate screen announcement for screen readers
        const screenName = this.getScreenName(screenId);
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('class', 'sr-only');
        announcement.textContent = `Screen changed to ${screenName}`;
        document.body.appendChild(announcement);
        
        setTimeout(() => {
            document.body.removeChild(announcement);
        }, 1000);
    }

    getScreenName(screenId) {
        const names = {
            'welcome-screen': 'Welcome',
            'accessibility-screen': 'Accessibility Setup',
            'vision-screen': 'Vision Assistance',
            'details-screen': 'Detection Details',
            'settings-screen': 'Settings',
            'history-screen': 'Detection History',
            'help-screen': 'Help',
            'about-screen': 'About',
            'error-screen': 'Error',
            'permission-screen': 'Permission'
        };
        return names[screenId] || screenId;
    }
}