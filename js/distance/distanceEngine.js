// Distance Engine - Estimates distance to detected objects
export class DistanceEngine {
    constructor() {
        this.knownObjectSizes = this.initializeKnownSizes();
        this.focalLength = 800; // Approximate focal length for mobile cameras
    }

    initializeKnownSizes() {
        // Average real-world sizes in meters
        return {
            person: { height: 1.7, width: 0.5 },
            car: { height: 1.5, width: 1.8 },
            bus: { height: 3.5, width: 2.5 },
            truck: { height: 3.0, width: 2.2 },
            motorcycle: { height: 1.2, width: 0.8 },
            bicycle: { height: 1.1, width: 0.6 },
            chair: { height: 0.9, width: 0.5 },
            couch: { height: 0.8, width: 2.0 },
            dining table: { height: 0.75, width: 1.5 },
            bed: { height: 0.5, width: 1.4 },
            bottle: { height: 0.25, width: 0.08 },
            cup: { height: 0.1, width: 0.08 },
            laptop: { height: 0.3, width: 0.4 },
            cell phone: { height: 0.15, width: 0.07 },
            book: { height: 0.25, width: 0.18 },
            backpack: { height: 0.45, width: 0.3 },
            handbag: { height: 0.25, width: 0.2 },
            door: { height: 2.0, width: 0.9 },
            stairs: { height: 0.18, width: 1.0 }
        };
    }

    estimateDistance(bbox, objectClass, canvasHeight = 720) {
        if (!bbox || bbox.length < 4) {
            return null;
        }

        const [x, y, width, height] = bbox;
        
        // Get known size for this object class
        const knownSize = this.knownObjectSizes[objectClass];
        if (!knownSize) {
            return this.estimateGenericDistance(height, canvasHeight);
        }

        // Use height-based distance estimation (more accurate than width)
        const objectHeight = knownSize.height;
        const pixelHeight = height;
        
        // Distance = (focal_length * real_height) / pixel_height
        const distance = (this.focalLength * objectHeight) / pixelHeight;
        
        return this.formatDistance(distance);
    }

    estimateGenericDistance(pixelHeight, canvasHeight = 720) {
        // Generic distance estimation based on relative size
        const relativeSize = pixelHeight / canvasHeight;
        
        // Heuristic distance mapping
        if (relativeSize > 0.5) {
            return 'very close';
        } else if (relativeSize > 0.3) {
            return 'approximately one meter';
        } else if (relativeSize > 0.2) {
            return 'approximately two meters';
        } else if (relativeSize > 0.1) {
            return 'approximately three meters';
        } else if (relativeSize > 0.05) {
            return 'approximately five meters';
        } else {
            return 'far away';
        }
    }

    formatDistance(distance) {
        if (typeof distance === 'string') {
            return distance;
        }

        const meters = Math.round(distance * 10) / 10; // Round to 1 decimal
        
        if (meters < 0.5) {
            return 'very close';
        } else if (meters < 1.0) {
            return 'less than one meter';
        } else if (meters < 2.0) {
            return 'approximately one meter';
        } else if (meters < 3.0) {
            return 'approximately two meters';
        } else if (meters < 5.0) {
            return `approximately ${Math.round(meters)} meters`;
        } else if (meters < 10.0) {
            return `around ${Math.round(meters)} meters`;
        } else {
            return 'far away';
        }
    }

    // Get distance category for prioritization
    getDistanceCategory(bbox, objectClass, canvasHeight = 720) {
        const distance = this.estimateDistance(bbox, objectClass, canvasHeight);
        
        if (typeof distance === 'string') {
            if (distance.includes('very close')) return 'critical';
            if (distance.includes('less than one')) return 'critical';
            if (distance.includes('one meter')) return 'important';
            if (distance.includes('two meters')) return 'important';
            return 'informational';
        }

        // Numeric distance
        const meters = parseFloat(distance);
        if (meters < 1.0) return 'critical';
        if (meters < 3.0) return 'important';
        return 'informational';
    }

    // Calculate depth using multiple methods
    estimateDepth(bbox, objectClass, canvasWidth = 1280, canvasHeight = 720) {
        const [x, y, width, height] = bbox;
        
        // Method 1: Size-based estimation
        const sizeDistance = this.estimateDistance(bbox, objectClass, canvasHeight);
        
        // Method 2: Position-based estimation (objects lower in frame are closer)
        const positionFactor = y / canvasHeight;
        const positionAdjustment = this.getPositionAdjustment(positionFactor);
        
        // Method 3: Combine methods
        return this.combineEstimations(sizeDistance, positionAdjustment);
    }

    getPositionAdjustment(positionFactor) {
        // Objects lower in the frame are typically closer
        if (positionFactor > 0.7) return 'closer';
        if (positionFactor > 0.5) return 'at estimated distance';
        if (positionFactor > 0.3) return 'slightly farther';
        return 'farther';
    }

    combineEstimations(sizeDistance, positionAdjustment) {
        if (positionAdjustment === 'at estimated distance') {
            return sizeDistance;
        }

        // Simple combination logic
        if (typeof sizeDistance === 'string') {
            if (positionAdjustment === 'closer') {
                if (sizeDistance.includes('very close')) return sizeDistance;
                return 'closer than ' + sizeDistance;
            } else {
                return 'farther than ' + sizeDistance;
            }
        }

        return sizeDistance;
    }

    // Get distance confidence level
    getDistanceConfidence(objectClass) {
        // High confidence for objects with known, consistent sizes
        const highConfidenceObjects = [
            'person', 'car', 'bus', 'truck', 'door'
        ];

        // Medium confidence for common household objects
        const mediumConfidenceObjects = [
            'chair', 'couch', 'dining table', 'bed', 'bottle', 'cup'
        ];

        if (highConfidenceObjects.includes(objectClass)) {
            return 'high';
        } else if (mediumConfidenceObjects.includes(objectClass)) {
            return 'medium';
        } else {
            return 'low';
        }
    }

    // Check if distance estimation is reliable for this object
    isDistanceReliable(objectClass) {
        const confidence = this.getDistanceConfidence(objectClass);
        return confidence === 'high' || confidence === 'medium';
    }
}