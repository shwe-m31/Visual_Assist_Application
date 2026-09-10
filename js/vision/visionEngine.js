// Vision Engine - Handles TensorFlow.js model loading and inference
export class VisionEngine {
    constructor() {
        this.model = null;
        this.isLoaded = false;
        this.isLoading = false;
        this.modelName = 'COCO-SSD';
    }

    async initialize() {
        if (this.isLoaded || this.isLoading) {
            return;
        }

        this.isLoading = true;
        console.log('Loading vision model...');

        try {
            // Load COCO-SSD model from TensorFlow.js
            this.model = await cocoSsd.load({
                base: 'lite_mobilenet_v2' // Use lightweight model for mobile performance
            });
            
            this.isLoaded = true;
            this.isLoading = false;
            console.log('Vision model loaded successfully');
            
        } catch (error) {
            this.isLoading = false;
            console.error('Failed to load vision model:', error);
            throw new Error('Vision model initialization failed');
        }
    }

    async detectObjects(videoElement) {
        if (!this.isLoaded || !this.model) {
            throw new Error('Vision model not loaded');
        }

        if (!videoElement) {
            throw new Error('Video element not provided');
        }

        try {
            const predictions = await this.model.detect(videoElement);
            return this.processPredictions(predictions);
        } catch (error) {
            console.error('Object detection failed:', error);
            return [];
        }
    }

    processPredictions(predictions) {
        // Filter and process predictions
        const processed = predictions.map(prediction => ({
            class: prediction.class,
            score: prediction.score,
            bbox: prediction.bbox,
            confidence: Math.round(prediction.score * 100)
        }));

        // Sort by confidence
        processed.sort((a, b) => b.confidence - a.confidence);

        return processed;
    }

    isModelLoaded() {
        return this.isLoaded;
    }

    isLoadingModel() {
        return this.isLoading;
    }

    getModelInfo() {
        return {
            name: this.modelName,
            loaded: this.isLoaded,
            loading: this.isLoading
        };
    }

    // Object categories that COCO-SSD can detect
    getSupportedClasses() {
        return [
            'person', 'bicycle', 'car', 'motorcycle', 'airplane', 'bus', 'train', 'truck', 'boat',
            'traffic light', 'fire hydrant', 'stop sign', 'parking meter', 'bench', 'bird', 'cat',
            'dog', 'horse', 'sheep', 'cow', 'elephant', 'bear', 'zebra', 'giraffe', 'backpack',
            'umbrella', 'handbag', 'tie', 'suitcase', 'frisbee', 'skis', 'snowboard', 'sports ball',
            'kite', 'baseball bat', 'baseball glove', 'skateboard', 'surfboard', 'tennis racket',
            'bottle', 'wine glass', 'cup', 'fork', 'knife', 'spoon', 'bowl', 'banana', 'apple',
            'sandwich', 'orange', 'broccoli', 'carrot', 'hot dog', 'pizza', 'donut', 'cake',
            'chair', 'couch', 'potted plant', 'bed', 'dining table', 'toilet', 'tv', 'laptop',
            'mouse', 'remote', 'keyboard', 'cell phone', 'microwave', 'oven', 'toaster', 'sink',
            'refrigerator', 'book', 'clock', 'vase', 'scissors', 'teddy bear', 'hair drier',
            'toothbrush'
        ];
    }

    // Get object categories for safety prioritization
    getSafetyCriticalClasses() {
        return [
            'car', 'truck', 'bus', 'motorcycle', 'bicycle', 'traffic light', 'stop sign'
        ];
    }

    // Get object categories that are important for navigation
    getNavigationClasses() {
        return [
            'person', 'chair', 'couch', 'dining table', 'door', 'stairs'
        ];
    }

    // Get informational object categories
    getInformationalClasses() {
        return [
            'bottle', 'cup', 'book', 'laptop', 'cell phone', 'backpack', 'handbag'
        ];
    }
}