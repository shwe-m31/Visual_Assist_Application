// History Manager - Handles detection history logging
export class HistoryManager {
    constructor() {
        this.history = [];
        this.maxHistorySize = 100;
        this.storageKey = 'visualAssistHistory';
    }

    async initialize() {
        await this.loadHistory();
    }

    async loadHistory() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                this.history = JSON.parse(stored);
            }
        } catch (error) {
            console.error('Failed to load history:', error);
            this.history = [];
        }
    }

    async saveHistory() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.history));
        } catch (error) {
            console.error('Failed to save history:', error);
        }
    }

    addDetection(detection) {
        const historyEntry = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            time: this.formatTime(new Date()),
            object: detection.class,
            direction: detection.direction,
            distance: detection.distance,
            confidence: detection.confidence,
            priority: detection.priority
        };

        this.history.unshift(historyEntry);
        
        // Trim history if it exceeds max size
        if (this.history.length > this.maxHistorySize) {
            this.history = this.history.slice(0, this.maxHistorySize);
        }

        this.saveHistory();
    }

    addMultipleDetections(detections) {
        detections.forEach(detection => {
            this.addDetection(detection);
        });
    }

    getHistory() {
        return [...this.history];
    }

    getRecentHistory(count = 10) {
        return this.history.slice(0, count);
    }

    getHistoryByObject(objectClass) {
        return this.history.filter(entry => entry.object === objectClass);
    }

    getHistoryByTimeRange(startTime, endTime) {
        return this.history.filter(entry => {
            const entryTime = new Date(entry.timestamp).getTime();
            return entryTime >= startTime && entryTime <= endTime;
        });
    }

    getHistoryStats() {
        const stats = {
            totalDetections: this.history.length,
            objectCounts: {},
            directionCounts: {},
            averageConfidence: 0,
            mostCommonObject: null,
            mostCommonDirection: null
        };

        if (this.history.length === 0) {
            return stats;
        }

        let totalConfidence = 0;

        this.history.forEach(entry => {
            // Count objects
            stats.objectCounts[entry.object] = (stats.objectCounts[entry.object] || 0) + 1;
            
            // Count directions
            if (entry.direction) {
                stats.directionCounts[entry.direction] = (stats.directionCounts[entry.direction] || 0) + 1;
            }
            
            // Sum confidence
            totalConfidence += entry.confidence;
        });

        // Calculate average confidence
        stats.averageConfidence = Math.round(totalConfidence / this.history.length);

        // Find most common object
        const objectEntries = Object.entries(stats.objectCounts);
        if (objectEntries.length > 0) {
            stats.mostCommonObject = objectEntries.sort((a, b) => b[1] - a[1])[0][0];
        }

        // Find most common direction
        const directionEntries = Object.entries(stats.directionCounts);
        if (directionEntries.length > 0) {
            stats.mostCommonDirection = directionEntries.sort((a, b) => b[1] - a[1])[0][0];
        }

        return stats;
    }

    clear() {
        this.history = [];
        this.saveHistory();
    }

    deleteEntry(id) {
        this.history = this.history.filter(entry => entry.id !== id);
        this.saveHistory();
    }

    deleteEntriesBefore(timestamp) {
        this.history = this.history.filter(entry => 
            new Date(entry.timestamp).getTime() >= timestamp
        );
        this.saveHistory();
    }

    formatTime(date) {
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    }

    formatDate(date) {
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    }

    exportHistory() {
        return JSON.stringify(this.history, null, 2);
    }

    importHistory(historyJson) {
        try {
            const imported = JSON.parse(historyJson);
            if (Array.isArray(imported)) {
                this.history = imported;
                this.saveHistory();
                return true;
            }
            return false;
        } catch (error) {
            console.error('Failed to import history:', error);
            return false;
        }
    }
}