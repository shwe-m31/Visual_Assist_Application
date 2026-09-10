// Camera Manager - Handles camera access and video feed
export class CameraManager {
    constructor() {
        this.stream = null;
        this.videoElement = null;
        this.canvasElement = null;
        this.isInitialized = false;
    }

    initialize() {
        this.videoElement = document.getElementById('camera-feed');
        this.canvasElement = document.getElementById('detection-canvas');
        this.isInitialized = true;
    }

    async startCamera() {
        if (!this.isInitialized) {
            throw new Error('Camera manager not initialized');
        }

        try {
            const constraints = {
                video: {
                    facingMode: 'environment', // Prefer back camera
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            };

            this.stream = await navigator.mediaDevices.getUserMedia(constraints);
            this.videoElement.srcObject = this.stream;
            
            return new Promise((resolve, reject) => {
                this.videoElement.onloadedmetadata = () => {
                    this.videoElement.play();
                    this.setupCanvas();
                    resolve(this.stream);
                };
                this.videoElement.onerror = reject;
            });

        } catch (error) {
            console.error('Failed to start camera:', error);
            throw new Error('Camera access denied or unavailable');
        }
    }

    stopCamera() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        if (this.videoElement) {
            this.videoElement.srcObject = null;
        }
    }

    setupCanvas() {
        if (this.canvasElement && this.videoElement) {
            this.canvasElement.width = this.videoElement.videoWidth;
            this.canvasElement.height = this.videoElement.videoHeight;
        }
    }

    getVideoElement() {
        return this.videoElement;
    }

    getCanvasElement() {
        return this.canvasElement;
    }

    getCanvasContext() {
        return this.canvasElement?.getContext('2d');
    }

    captureFrame() {
        if (!this.canvasElement || !this.videoElement) {
            return null;
        }

        const context = this.getCanvasContext();
        context.drawImage(this.videoElement, 0, 0, this.canvasElement.width, this.canvasElement.height);
        
        return this.canvasElement;
    }

    isCameraActive() {
        return this.stream !== null && this.videoElement?.srcObject !== null;
    }

    getCameraCapabilities() {
        if (!this.stream) {
            return null;
        }

        const videoTrack = this.stream.getVideoTracks()[0];
        return videoTrack?.getCapabilities();
    }
}