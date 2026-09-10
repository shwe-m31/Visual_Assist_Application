// Priority Engine - Determines announcement priority based on safety and relevance
export class PriorityEngine {
    constructor() {
        this.priorityLevels = this.initializePriorityLevels();
        this.objectPriorities = this.initializeObjectPriorities();
        this.distanceMultipliers = this.initializeDistanceMultipliers();
    }

    initializePriorityLevels() {
        return {
            CRITICAL: 10,    // Immediate safety threat
            HIGH: 8,        // Important safety information
            IMPORTANT: 5,   // Useful navigation information
            NORMAL: 3,      // General information
            LOW: 1          // Optional information
        };
    }

    initializeObjectPriorities() {
        return {
            // Critical safety objects
            car: this.priorityLevels.CRITICAL,
            truck: this.priorityLevels.CRITICAL,
            bus: this.priorityLevels.CRITICAL,
            motorcycle: this.priorityLevels.HIGH,
            bicycle: this.priorityLevels.HIGH,
            
            // Important navigation objects
            person: this.priorityLevels.IMPORTANT,
            chair: this.priorityLevels.IMPORTANT,
            couch: this.priorityLevels.NORMAL,
            dining table: this.priorityLevels.NORMAL,
            door: this.priorityLevels.IMPORTANT,
            stairs: this.priorityLevels.CRITICAL,
            
            // Traffic and safety
            traffic light: this.priorityLevels.HIGH,
            stop sign: this.priorityLevels.HIGH,
            fire hydrant: this.priorityLevels.NORMAL,
            
            // Informational objects
            bottle: this.priorityLevels.LOW,
            cup: this.priorityLevels.LOW,
            wine glass: this.priorityLevels.LOW,
            book: this.priorityLevels.LOW,
            laptop: this.priorityLevels.LOW,
            cell phone: this.priorityLevels.LOW,
            backpack: this.priorityLevels.NORMAL,
            handbag: this.priorityLevels.NORMAL,
            suitcase: this.priorityLevels.NORMAL,
            
            // Other common objects
            potted plant: this.priorityLevels.LOW,
            bed: this.priorityLevels.NORMAL,
            toilet: this.priorityLevels.NORMAL,
            tv: this.priorityLevels.LOW,
            remote: this.priorityLevels.LOW,
            keyboard: this.priorityLevels.LOW,
            mouse: this.priorityLevels.LOW
        };
    }

    initializeDistanceMultipliers() {
        return {
            critical: 1.5,      // Very close objects get priority boost
            important: 1.2,     // Close objects get slight boost
            informational: 1.0, // Normal distance
            far: 0.8           // Far objects get reduced priority
        };
    }

    getPriority(objectClass, distance) {
        // Get base priority for object class
        const basePriority = this.objectPriorities[objectClass] || this.priorityLevels.NORMAL;
        
        // Apply distance multiplier
        const distanceCategory = this.getDistanceCategory(distance);
        const distanceMultiplier = this.distanceMultipliers[distanceCategory] || 1.0;
        
        // Calculate final priority
        const finalPriority = Math.round(basePriority * distanceMultiplier);
        
        // Ensure priority stays within bounds
        return Math.min(Math.max(finalPriority, 1), 10);
    }

    getDistanceCategory(distance) {
        if (!distance) {
            return 'informational';
        }

        if (typeof distance === 'string') {
            if (distance.includes('very close') || distance.includes('less than')) {
                return 'critical';
            }
            if (distance.includes('one meter') || distance.includes('two meters')) {
                return 'important';
            }
            if (distance.includes('far')) {
                return 'far';
            }
            return 'informational';
        }

        // If distance is numeric
        const meters = parseFloat(distance);
        if (meters < 1.0) return 'critical';
        if (meters < 3.0) return 'important';
        if (meters > 10.0) return 'far';
        return 'informational';
    }

    // Get priority level description
    getPriorityLevel(priority) {
        if (priority >= 8) return 'CRITICAL';
        if (priority >= 5) return 'IMPORTANT';
        if (priority >= 3) return 'NORMAL';
        return 'LOW';
    }

    // Check if announcement should interrupt current speech
    shouldInterrupt(currentPriority, newPriority) {
        // Critical announcements always interrupt
        if (newPriority >= this.priorityLevels.CRITICAL) {
            return true;
        }
        
        // High priority interrupts normal/low
        if (newPriority >= this.priorityLevels.HIGH && 
            currentPriority < this.priorityLevels.IMPORTANT) {
            return true;
        }
        
        return false;
    }

    // Sort detections by priority
    sortByPriority(detections) {
        return [...detections].sort((a, b) => {
            const priorityA = a.priority || this.getPriority(a.class, a.distance);
            const priorityB = b.priority || this.getPriority(b.class, b.distance);
            return priorityB - priorityA;
        });
    }

    // Filter detections by minimum priority
    filterByPriority(detections, minPriority = this.priorityLevels.NORMAL) {
        return detections.filter(detection => {
            const priority = detection.priority || this.getPriority(detection.class, detection.distance);
            return priority >= minPriority;
        });
    }

    // Get top N priority detections
    getTopPriorityDetections(detections, count = 3) {
        const sorted = this.sortByPriority(detections);
        return sorted.slice(0, count);
    }

    // Check if object is safety-critical
    isSafetyCritical(objectClass) {
        const priority = this.objectPriorities[objectClass] || this.priorityLevels.NORMAL;
        return priority >= this.priorityLevels.HIGH;
    }

    // Get safety-critical objects from detections
    getSafetyCriticalDetections(detections) {
        return detections.filter(detection => 
            this.isSafetyCritical(detection.class)
        );
    }

    // Check if movement affects priority
    getMovementPriorityAdjustment(movement) {
        const adjustments = {
            'approaching': 1.3,      // Approaching objects get priority boost
            'moving': 1.1,          // Moving objects get slight boost
            'moving away': 0.9,     // Moving away gets reduced priority
            'stationary': 1.0       // No adjustment
        };
        
        return adjustments[movement] || 1.0;
    }

    // Calculate priority with movement consideration
    getPriorityWithMovement(objectClass, distance, movement) {
        const basePriority = this.getPriority(objectClass, distance);
        const movementMultiplier = this.getMovementPriorityAdjustment(movement);
        
        return Math.round(basePriority * movementMultiplier);
    }

    // Emergency mode priority adjustment
    applyEmergencyMode(detections) {
        return detections.map(detection => {
            const priority = detection.priority || this.getPriority(detection.class, detection.distance);
            
            // In emergency mode, boost all safety-critical and important objects
            if (priority >= this.priorityLevels.IMPORTANT) {
                return {
                    ...detection,
                    priority: Math.min(priority + 2, 10)
                };
            }
            
            return detection;
        });
    }

    // Get announcement queue order
    getAnnouncementOrder(detections) {
        const sorted = this.sortByPriority(detections);
        
        // Group by priority level
        const critical = sorted.filter(d => d.priority >= this.priorityLevels.CRITICAL);
        const important = sorted.filter(d => d.priority >= this.priorityLevels.IMPORTANT && d.priority < this.priorityLevels.CRITICAL);
        const normal = sorted.filter(d => d.priority >= this.priorityLevels.NORMAL && d.priority < this.priorityLevels.IMPORTANT);
        const low = sorted.filter(d => d.priority < this.priorityLevels.NORMAL);
        
        return [...critical, ...important, ...normal, ...low];
    }
}