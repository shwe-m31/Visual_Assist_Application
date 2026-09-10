// Demo Manager - Handles demo mode with simulated detections
export class DemoManager {
    constructor() {
        this.isDemoMode = false;
        this.demoInterval = null;
        this.demoObjects = this.getDemoObjects();
        this.currentIndex = 0;
    }

    getDemoObjects() {
        return [
            { class: 'person', direction: 'front', distance: 'approximately two meters', confidence: 95 },
            { class: 'chair', direction: 'right', distance: 'approximately one meter', confidence: 88 },
            { class: 'car', direction: 'left', distance: 'approximately five meters', confidence: 92 },
            { class: 'bottle', direction: 'front', distance: 'approximately one meter', confidence: 85 },
            { class: 'door', direction: 'front', distance: 'approximately three meters', confidence: 90 },
            { class: 'laptop', direction: 'center', distance: 'approximately one meter', confidence: 87 },
            { class: 'backpack', direction: 'left', distance: 'approximately two meters', confidence: 83 },
            { class: 'table', direction: 'right', distance: 'approximately two meters', confidence: 91 },
            { class: 'cell phone', direction: 'front', distance: 'very close', confidence: 89 },
            { class: 'person', direction: 'far left', distance: 'approximately four meters', confidence: 94 }
        ];
    }

    startDemoMode(callback) {
        if (this.isDemoMode) {
            return;
        }

        this.isDemoMode = true;
        console.log('Starting demo mode');

        // Simulate detections every 3 seconds
        this.demoInterval = setInterval(() => {
            const demoDetection = this.getNextDemoDetection();
            callback(demoDetection);
        }, 3000);
    }

    stopDemoMode() {
        if (!this.isDemoMode) {
            return;
        }

        this.isDemoMode = false;
        if (this.demoInterval) {
            clearInterval(this.demoInterval);
            this.demoInterval = null;
        }
        console.log('Stopping demo mode');
    }

    getNextDemoDetection() {
        const demoObject = this.demoObjects[this.currentIndex];
        this.currentIndex = (this.currentIndex + 1) % this.demoObjects.length;
        
        return {
            ...demoObject,
            bbox: [100, 100, 200, 200], // Simulated bounding box
            score: demoObject.confidence / 100,
            priority: this.calculatePriority(demoObject.class),
            timestamp: Date.now()
        };
    }

    calculatePriority(objectClass) {
        const criticalObjects = ['car', 'truck', 'bus', 'motorcycle'];
        const importantObjects = ['person', 'door', 'stairs'];
        
        if (criticalObjects.includes(objectClass)) {
            return 10;
        } else if (importantObjects.includes(objectClass)) {
            return 5;
        } else {
            return 3;
        }
    }

    isDemoActive() {
        return this.isDemoMode;
    }

    getDemoStatus() {
        return {
            active: this.isDemoMode,
            objectCount: this.demoObjects.length,
            currentIndex: this.currentIndex
        };
    }
}