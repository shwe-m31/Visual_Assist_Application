// Detection Pipeline - Orchestrates the complete detection workflow
export class DetectionPipeline {
    constructor() {
        this.isActive = false;
        this.detectionInterval = null;
        this.currentDetections = [];
        this.trackedObjects = new Map();
        this.lastAnnouncement = null;
        this.announcementCooldown = 3000; // 3 seconds cooldown
        this.frameSkip = 0;
        this.maxFrameSkip = 2; // Process every 3rd frame for performance
    }

    initialize(dependencies) {
        this.visionEngine = dependencies.visionEngine;
        this.directionEngine = dependencies.directionEngine;
        this.distanceEngine = dependencies.distanceEngine;
        this.priorityEngine = dependencies.priorityEngine;
        this.voiceEngine = dependencies.voiceEngine;
        this.settingsManager = dependencies.settingsManager;
    }

    start() {
        if (this.isActive) {
            return;
        }

        this.isActive = true;
        this.startDetectionLoop();
    }

    stop() {
        if (!this.isActive) {
            return;
        }

        this.isActive = false;
        if (this.detectionInterval) {
            clearInterval(this.detectionInterval);
            this.detectionInterval = null;
        }
    }

    startDetectionLoop() {
        // Run detection at approximately 2-3 FPS for battery efficiency
        const intervalMs = this.settingsManager?.getDetectionInterval() || 500;
        
        this.detectionInterval = setInterval(async () => {
            if (!this.isActive) {
                return;
            }

            await this.processDetection();
        }, intervalMs);
    }

    async processDetection() {
        try {
            const videoElement = document.getElementById('camera-feed');
            if (!videoElement || !this.visionEngine?.isModelLoaded()) {
                return;
            }

            // Frame skipping for performance
            this.frameSkip++;
            if (this.frameSkip < this.maxFrameSkip) {
                return;
            }
            this.frameSkip = 0;

            // Get raw predictions
            const predictions = await this.visionEngine.detectObjects(videoElement);
            
            // Process predictions through the pipeline
            const processedDetections = await this.processPredictions(predictions);
            
            // Update current detections
            this.currentDetections = processedDetections;
            
            // Update UI
            this.updateDetectionUI(processedDetections);
            
            // Generate voice announcements
            await this.generateAnnouncements(processedDetections);
            
            // Track objects for movement detection
            this.trackObjects(processedDetections);
            
        } catch (error) {
            console.error('Detection pipeline error:', error);
        }
    }

    async processPredictions(predictions) {
        const settings = this.settingsManager?.getDetectionSettings() || {};
        
        // Filter by confidence threshold
        const confidenceThreshold = settings.confidenceThreshold || 0.6;
        const filtered = predictions.filter(p => p.score >= confidenceThreshold);
        
        // Filter by enabled categories
        const enabledCategories = this.getEnabledCategories(settings);
        const categoryFiltered = filtered.filter(p => 
            enabledCategories.includes(p.class)
        );
        
        // Add spatial information
        const enriched = await Promise.all(categoryFiltered.map(async prediction => {
            const direction = this.directionEngine?.getDirection(prediction.bbox);
            const distance = this.distanceEngine?.estimateDistance(prediction.bbox, prediction.class);
            const priority = this.priorityEngine?.getPriority(prediction.class, distance);
            
            return {
                ...prediction,
                direction,
                distance,
                priority,
                timestamp: Date.now()
            };
        }));
        
        // Sort by priority
        enriched.sort((a, b) => b.priority - a.priority);
        
        return enriched;
    }

    getEnabledCategories(settings) {
        const categories = [];
        
        if (settings.personDetection !== false) {
            categories.push('person');
        }
        
        if (settings.vehicleDetection !== false) {
            categories.push('car', 'truck', 'bus', 'motorcycle', 'bicycle');
        }
        
        // Add other common categories
        categories.push(
            'chair', 'couch', 'dining table', 'bed', 'toilet',
            'bottle', 'cup', 'wine glass',
            'book', 'laptop', 'cell phone',
            'backpack', 'handbag', 'suitcase',
            'door', 'stairs'
        );
        
        return categories;
    }

    updateDetectionUI(detections) {
        const overlaysContainer = document.getElementById('detection-overlays');
        const canvas = document.getElementById('detection-canvas');
        
        if (!overlaysContainer || !canvas) {
            return;
        }

        // Clear previous overlays
        overlaysContainer.innerHTML = '';
        
        // Clear canvas
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw detection overlays
        detections.forEach(detection => {
            this.drawDetectionOverlay(ctx, detection);
            this.createDetectionOverlay(overlaysContainer, detection);
        });
        
        // Update detection info
        this.updateDetectionInfo(detections);
    }

    drawDetectionOverlay(ctx, detection) {
        const [x, y, width, height] = detection.bbox;
        
        // Draw bounding box
        ctx.strokeStyle = this.getPriorityColor(detection.priority);
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);
        
        // Draw label background
        const label = `${detection.class} ${detection.confidence}%`;
        ctx.font = '14px Inter';
        const textWidth = ctx.measureText(label).width;
        
        ctx.fillStyle = this.getPriorityColor(detection.priority);
        ctx.fillRect(x, y - 24, textWidth + 10, 24);
        
        // Draw label text
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(label, x + 5, y - 7);
    }

    createDetectionOverlay(container, detection) {
        const overlay = document.createElement('div');
        overlay.className = 'detection-overlay';
        overlay.style.left = `${detection.bbox[0]}px`;
        overlay.style.top = `${detection.bbox[1] - 30}px`;
        overlay.textContent = detection.class;
        container.appendChild(overlay);
    }

    updateDetectionInfo(detections) {
        const infoContainer = document.getElementById('current-detection');
        
        if (!infoContainer) {
            return;
        }

        if (detections.length === 0) {
            infoContainer.innerHTML = `
                <div class="detection-item">
                    <span class="detection-label">No objects detected</span>
                </div>
            `;
            return;
        }

        // Show top 3 most important detections
        const topDetections = detections.slice(0, 3);
        infoContainer.innerHTML = topDetections.map(detection => `
            <div class="detection-item">
                <span class="detection-label">
                    ${this.formatDetectionText(detection)}
                </span>
            </div>
        `).join('');
    }

    formatDetectionText(detection) {
        let text = detection.class;
        
        if (detection.direction) {
            text += ` on your ${detection.direction}`;
        }
        
        if (detection.distance) {
            text += ` approximately ${detection.distance}`;
        }
        
        return text;
    }

    async generateAnnouncements(detections) {
        if (detections.length === 0) {
            return;
        }

        const settings = this.settingsManager?.getVoiceSettings() || {};
        
        // Check announcement cooldown
        if (this.lastAnnouncement && 
            Date.now() - this.lastAnnouncement < this.announcementCooldown) {
            return;
        }

        // Get highest priority detection
        const topDetection = detections[0];
        
        // Check if this is a critical safety announcement
        if (topDetection.priority >= 8) {
            // Critical - announce immediately
            this.lastAnnouncement = Date.now();
            await this.voiceEngine.speak(this.generateAnnouncementText(topDetection));
            return;
        }

        // Check announcement frequency settings
        if (settings.announcementFrequency === 'low') {
            // Only announce high-priority items
            if (topDetection.priority < 5) {
                return;
            }
        }

        // Generate and speak announcement
        this.lastAnnouncement = Date.now();
        await this.voiceEngine.speak(this.generateAnnouncementText(topDetection));
    }

    generateAnnouncementText(detection) {
        let text = '';
        
        // Object name
        text += detection.class;
        
        // Direction
        if (detection.direction) {
            text += ` on your ${detection.direction}`;
        }
        
        // Distance
        if (detection.distance) {
            text += ` approximately ${detection.distance}`;
        }
        
        // Movement (if available)
        if (detection.movement) {
            text += ` ${detection.movement}`;
        }
        
        return text;
    }

    trackObjects(detections) {
        // Simple object tracking based on position
        detections.forEach(detection => {
            const objectId = this.generateObjectId(detection);
            
            if (this.trackedObjects.has(objectId)) {
                const tracked = this.trackedObjects.get(objectId);
                detection.movement = this.detectMovement(tracked, detection);
                this.trackedObjects.set(objectId, {
                    ...detection,
                    firstSeen: tracked.firstSeen
                });
            } else {
                this.trackedObjects.set(objectId, {
                    ...detection,
                    firstSeen: Date.now()
                });
            }
        });
        
        // Clean up old tracked objects
        this.cleanupTrackedObjects();
    }

    generateObjectId(detection) {
        const [x, y] = detection.bbox;
        return `${detection.class}-${Math.round(x / 50)}-${Math.round(y / 50)}`;
    }

    detectMovement(previous, current) {
        const prevCenter = this.getBoundingBoxCenter(previous.bbox);
        const currCenter = this.getBoundingBoxCenter(current.bbox);
        
        const dx = currCenter.x - prevCenter.x;
        const dy = currCenter.y - prevCenter.y;
        
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 10) {
            return 'stationary';
        } else if (dy > 20) {
            return 'approaching';
        } else if (dy < -20) {
            return 'moving away';
        } else {
            return 'moving';
        }
    }

    getBoundingBoxCenter(bbox) {
        const [x, y, width, height] = bbox;
        return {
            x: x + width / 2,
            y: y + height / 2
        };
    }

    cleanupTrackedObjects() {
        const maxAge = 5000; // 5 seconds
        const now = Date.now();
        
        for (const [id, tracked] of this.trackedObjects) {
            if (now - tracked.timestamp > maxAge) {
                this.trackedObjects.delete(id);
            }
        }
    }

    async describeSurroundings() {
        if (this.currentDetections.length === 0) {
            await this.voiceEngine.speak('No objects detected in your surroundings.');
            return;
        }

        // Generate comprehensive description
        const description = this.generateSurroundingsDescription(this.currentDetections);
        await this.voiceEngine.speak(description);
    }

    generateSurroundingsDescription(detections) {
        // Group by direction
        const byDirection = {
            left: [],
            center: [],
            right: []
        };

        detections.forEach(detection => {
            const direction = detection.direction || 'center';
            if (byDirection[direction]) {
                byDirection[direction].push(detection);
            }
        });

        // Generate natural language description
        const parts = [];

        if (byDirection.center.length > 0) {
            parts.push(this.formatDirectionGroup('ahead', byDirection.center));
        }

        if (byDirection.left.length > 0) {
            parts.push(this.formatDirectionGroup('on your left', byDirection.left));
        }

        if (byDirection.right.length > 0) {
            parts.push(this.formatDirectionGroup('on your right', byDirection.right));
        }

        if (parts.length === 0) {
            return 'No objects detected in your surroundings.';
        }

        return parts.join('. ');
    }

    formatDirectionGroup(direction, detections) {
        const count = detections.length;
        const objects = detections.map(d => d.class).slice(0, 3).join(', ');
        
        if (count === 1) {
            return `One ${objects} ${direction}`;
        } else {
            return `${count} objects including ${objects} ${direction}`;
        }
    }

    getPriorityColor(priority) {
        if (priority >= 8) {
            return '#F87171'; // Red for critical
        } else if (priority >= 5) {
            return '#FB923C'; // Orange for important
        } else {
            return '#FACC15'; // Yellow for informational
        }
    }

    getCurrentDetections() {
        return this.currentDetections;
    }
}