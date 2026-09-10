// Command Processor - Handles voice command recognition and processing
export class CommandProcessor {
    constructor() {
        this.recognition = null;
        this.isListening = false;
        this.commands = this.initializeCommands();
        this.dependencies = {};
    }

    initialize() {
        this.setupSpeechRecognition();
    }

    initializeCommands() {
        return {
            // Detection control
            'start detection': { action: 'startDetection', description: 'Begin continuous detection' },
            'stop detection': { action: 'stopDetection', description: 'Pause detection' },
            'pause detection': { action: 'stopDetection', description: 'Pause detection' },
            'resume detection': { action: 'startDetection', description: 'Resume detection' },
            
            // Information requests
            'what is around me': { action: 'describeSurroundings', description: 'Describe surroundings' },
            'what is ahead': { action: 'describeAhead', description: 'Describe objects in front' },
            'who is nearby': { action: 'detectPeople', description: 'Detect people only' },
            'what do you see': { action: 'describeSurroundings', description: 'Describe surroundings' },
            
            // Voice control
            'repeat': { action: 'repeat', description: 'Repeat last announcement' },
            'say that again': { action: 'repeat', description: 'Repeat last announcement' },
            'increase voice speed': { action: 'increaseSpeed', description: 'Make speech faster' },
            'decrease voice speed': { action: 'decreaseSpeed', description: 'Make speech slower' },
            'speak faster': { action: 'increaseSpeed', description: 'Make speech faster' },
            'speak slower': { action: 'decreaseSpeed', description: 'Make speech slower' },
            
            // Detection modes
            'enable continuous detection': { action: 'enableContinuous', description: 'Enable continuous mode' },
            'disable continuous detection': { action: 'disableContinuous', description: 'Disable continuous mode' },
            'read detected objects': { action: 'readObjects', description: 'Read all detected objects' },
            
            // Navigation
            'open settings': { action: 'openSettings', description: 'Open settings screen' },
            'go back': { action: 'goBack', description: 'Go to previous screen' },
            'close': { action: 'goBack', description: 'Go to previous screen' }
        };
    }

    setupSpeechRecognition() {
        // Check for browser support
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (!SpeechRecognition) {
            console.warn('Speech recognition not supported in this browser');
            return;
        }

        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.lang = 'en-US';

        this.recognition.onresult = (event) => {
            const command = event.results[0][0].transcript.toLowerCase().trim();
            console.log('Voice command recognized:', command);
            this.processCommand(command);
        };

        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            this.handleRecognitionError(event.error);
        };

        this.recognition.onend = () => {
            if (this.isListening) {
                // Restart if still supposed to be listening
                setTimeout(() => {
                    if (this.isListening) {
                        this.recognition.start();
                    }
                }, 100);
            }
        };
    }

    startListening() {
        if (!this.recognition) {
            console.warn('Speech recognition not available');
            return;
        }

        try {
            this.isListening = true;
            this.recognition.start();
            console.log('Started listening for voice commands');
        } catch (error) {
            console.error('Failed to start speech recognition:', error);
        }
    }

    stopListening() {
        if (this.recognition) {
            this.isListening = false;
            this.recognition.stop();
            console.log('Stopped listening for voice commands');
        }
    }

    processCommand(command) {
        // Find matching command
        const matchedCommand = this.findMatchingCommand(command);
        
        if (matchedCommand) {
            console.log('Executing command:', matchedCommand.action);
            this.executeCommand(matchedCommand.action);
        } else {
            console.log('No matching command found for:', command);
            this.handleUnknownCommand(command);
        }
    }

    findMatchingCommand(command) {
        // Direct match
        if (this.commands[command]) {
            return this.commands[command];
        }

        // Partial match
        for (const [key, cmd] of Object.entries(this.commands)) {
            if (command.includes(key) || key.includes(command)) {
                return cmd;
            }
        }

        // Fuzzy match
        const commandWords = command.split(' ');
        for (const [key, cmd] of Object.entries(this.commands)) {
            const keyWords = key.split(' ');
            const matchCount = commandWords.filter(word => 
                keyWords.some(keyWord => keyWord.includes(word) || word.includes(keyWord))
            ).length;
            
            if (matchCount >= Math.min(commandWords.length, keyWords.length) * 0.7) {
                return cmd;
            }
        }

        return null;
    }

    executeCommand(action) {
        switch (action) {
            case 'startDetection':
                this.dependencies.detectionPipeline?.start();
                this.dependencies.voiceEngine?.speak('Detection started');
                break;
                
            case 'stopDetection':
                this.dependencies.detectionPipeline?.stop();
                this.dependencies.voiceEngine?.speak('Detection paused');
                break;
                
            case 'describeSurroundings':
                this.dependencies.detectionPipeline?.describeSurroundings();
                break;
                
            case 'describeAhead':
                this.describeAhead();
                break;
                
            case 'detectPeople':
                this.detectPeople();
                break;
                
            case 'repeat':
                this.dependencies.voiceEngine?.repeatLast();
                break;
                
            case 'increaseSpeed':
                this.adjustVoiceSpeed(0.1);
                break;
                
            case 'decreaseSpeed':
                this.adjustVoiceSpeed(-0.1);
                break;
                
            case 'enableContinuous':
                this.dependencies.settingsManager?.setContinuousDetection(true);
                this.dependencies.voiceEngine?.speak('Continuous detection enabled');
                break;
                
            case 'disableContinuous':
                this.dependencies.settingsManager?.setContinuousDetection(false);
                this.dependencies.voiceEngine?.speak('Continuous detection disabled');
                break;
                
            case 'readObjects':
                this.readDetectedObjects();
                break;
                
            case 'openSettings':
                this.dependencies.screenManager?.showScreen('settings-screen');
                this.dependencies.voiceEngine?.speak('Settings opened');
                break;
                
            case 'goBack':
                this.dependencies.screenManager?.goBack();
                break;
                
            default:
                console.log('Unknown action:', action);
        }
    }

    describeAhead() {
        const detections = this.dependencies.detectionPipeline?.getCurrentDetections() || [];
        const aheadDetections = detections.filter(d => 
            !d.direction || d.direction === 'front' || d.direction === 'center'
        );
        
        if (aheadDetections.length === 0) {
            this.dependencies.voiceEngine?.speak('Nothing detected directly ahead');
            return;
        }

        const description = this.dependencies.voiceEngine?.generateMultipleObjectAnnouncement(aheadDetections);
        this.dependencies.voiceEngine?.speak(description || 'Objects detected ahead');
    }

    detectPeople() {
        const detections = this.dependencies.detectionPipeline?.getCurrentDetections() || [];
        const people = detections.filter(d => d.class === 'person');
        
        if (people.length === 0) {
            this.dependencies.voiceEngine?.speak('No people detected nearby');
            return;
        }

        const description = this.dependencies.voiceEngine?.generateMultipleObjectAnnouncement(people);
        this.dependencies.voiceEngine?.speak(description || 'People detected');
    }

    adjustVoiceSpeed(delta) {
        const currentSettings = this.dependencies.voiceEngine?.getSettings() || {};
        const newRate = Math.max(0.5, Math.min(2.0, currentSettings.rate + delta));
        
        this.dependencies.voiceEngine?.updateSettings({ rate: newRate });
        this.dependencies.voiceEngine?.speak(`Voice speed ${newRate > currentSettings.rate ? 'increased' : 'decreased'}`);
    }

    readDetectedObjects() {
        const detections = this.dependencies.detectionPipeline?.getCurrentDetections() || [];
        
        if (detections.length === 0) {
            this.dependencies.voiceEngine?.speak('No objects currently detected');
            return;
        }

        const objectNames = detections.map(d => d.class).join(', ');
        this.dependencies.voiceEngine?.speak(`Detected objects: ${objectNames}`);
    }

    handleRecognitionError(error) {
        let message = 'Speech recognition error';
        
        switch (error) {
            case 'no-speech':
                message = 'No speech detected';
                break;
            case 'audio-capture':
                message = 'Microphone not available';
                break;
            case 'not-allowed':
                message = 'Microphone permission denied';
                break;
            case 'network':
                message = 'Network error for speech recognition';
                break;
            default:
                message = `Speech recognition error: ${error}`;
        }

        console.error(message);
        this.dependencies.voiceEngine?.speak(message);
    }

    handleUnknownCommand(command) {
        // Provide helpful feedback
        this.dependencies.voiceEngine?.speak('Command not recognized. Try saying "what is around me" or "repeat"');
    }

    isListeningActive() {
        return this.isListening;
    }

    getAvailableCommands() {
        return Object.keys(this.commands);
    }

    getCommandDescription(command) {
        return this.commands[command]?.description || '';
    }
}