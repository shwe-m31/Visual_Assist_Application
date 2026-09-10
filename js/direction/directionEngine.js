// Direction Engine - Determines spatial direction of detected objects
export class DirectionEngine {
    constructor() {
        this.zones = this.initializeZones();
    }

    initializeZones() {
        return {
            farLeft: { min: 0, max: 0.2 },
            left: { min: 0.2, max: 0.4 },
            center: { min: 0.4, max: 0.6 },
            right: { min: 0.6, max: 0.8 },
            farRight: { min: 0.8, max: 1.0 }
        };
    }

    getDirection(bbox, canvasWidth = 1280) {
        if (!bbox || bbox.length < 4) {
            return 'center';
        }

        const [x, y, width, height] = bbox;
        const centerX = x + width / 2;
        const normalizedX = centerX / canvasWidth;

        return this.getDirectionFromNormalized(normalizedX);
    }

    getDirectionFromNormalized(normalizedX) {
        for (const [zoneName, zone] of Object.entries(this.zones)) {
            if (normalizedX >= zone.min && normalizedX < zone.max) {
                return this.formatDirectionName(zoneName);
            }
        }

        return 'center';
    }

    formatDirectionName(zoneName) {
        const names = {
            farLeft: 'far left',
            left: 'left',
            center: 'front',
            right: 'right',
            farRight: 'far right'
        };
        return names[zoneName] || zoneName;
    }

    getDetailedDirection(bbox, canvasWidth = 1280, canvasHeight = 720) {
        if (!bbox || bbox.length < 4) {
            return { horizontal: 'center', vertical: 'center' };
        }

        const [x, y, width, height] = bbox;
        const centerX = x + width / 2;
        const centerY = y + height / 2;

        const normalizedX = centerX / canvasWidth;
        const normalizedY = centerY / canvasHeight;

        return {
            horizontal: this.getDirectionFromNormalized(normalizedX),
            vertical: this.getVerticalDirection(normalizedY)
        };
    }

    getVerticalDirection(normalizedY) {
        if (normalizedY < 0.33) {
            return 'above';
        } else if (normalizedY > 0.66) {
            return 'below';
        } else {
            return 'at eye level';
        }
    }

    // Get direction in natural language format
    getNaturalDirection(bbox, canvasWidth = 1280) {
        const direction = this.getDirection(bbox, canvasWidth);
        
        const naturalFormats = {
            'far left': 'far to your left',
            'left': 'on your left',
            'front': 'directly ahead',
            'right': 'on your right',
            'far right': 'far to your right'
        };

        return naturalFormats[direction] || direction;
    }

    // Get spatial zone for tracking
    getSpatialZone(bbox, canvasWidth = 1280, canvasHeight = 720) {
        const detailed = this.getDetailedDirection(bbox, canvasWidth, canvasHeight);
        return `${detailed.horizontal}-${detailed.vertical}`;
    }

    // Calculate angular direction (in degrees from center)
    getAngularDirection(bbox, canvasWidth = 1280) {
        if (!bbox || bbox.length < 4) {
            return 0;
        }

        const [x, y, width, height] = bbox;
        const centerX = x + width / 2;
        const normalizedX = (centerX / canvasWidth) - 0.5; // -0.5 to 0.5
        
        // Convert to degrees (-90 to 90)
        return Math.round(normalizedX * 180);
    }

    // Get compass-style direction
    getCompassDirection(bbox, canvasWidth = 1280) {
        const angle = this.getAngularDirection(bbox, canvasWidth);
        
        if (angle < -30) return 'left';
        if (angle > 30) return 'right';
        return 'ahead';
    }
}