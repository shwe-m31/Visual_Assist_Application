# 👁️ VisionAssist Pro

VisionAssist Pro is a browser-based real-time object detection application designed to assist users by identifying objects through a device camera and providing audio feedback. The application uses TensorFlow.js and the COCO-SSD pre-trained model to detect common objects and announce them using speech synthesis.

## 🚀 Features

* 📷 Real-time camera access through the browser
* 🤖 AI-powered object detection using TensorFlow.js COCO-SSD model
* 🔊 Voice feedback for detected objects
* 🧍 Special handling for person detection
* 🔍 Manual object analysis option
* ⚡ Automatic detection every 3 seconds
* 🎨 Modern and responsive user interface
* 🌐 Runs entirely in the browser without a backend server

## 🛠️ Technologies Used

* HTML5
* CSS3
* JavaScript (ES6)
* TensorFlow.js
* COCO-SSD Pre-trained Object Detection Model
* Web Camera API (`getUserMedia`)
* Web Speech API (`SpeechSynthesis`)

## 📂 Project Structure

```text
VisionAssist-Pro/
│
├── index.html        # Main application file
├── README.md         # Project documentation
```

## ⚙️ How It Works

1. The application loads the TensorFlow.js COCO-SSD model.
2. Camera access is requested from the user.
3. The live video feed is captured from the device camera.
4. Every 3 seconds, the model analyzes the current frame.
5. If an object is detected:

   * Displays the object name on the screen.
   * Provides voice feedback.
   * Displays a relevant icon.
6. If no object is detected, the application informs the user accordingly.

## ▶️ Installation and Setup

### Clone the Repository

```bash
git clone https://github.com/your-username/VisionAssist-Pro.git
cd VisionAssist-Pro
```

### Run the Application

Since the project is a pure frontend application, simply open the `index.html` file in your browser.

Or use VS Code Live Server:

1. Install the Live Server extension.
2. Open the project folder.
3. Right-click `index.html`.
4. Select **Open with Live Server**.

## 📸 Usage

1. Launch the application.
2. Click **Start Camera**.
3. Allow camera permissions when prompted.
4. Point the camera toward an object.
5. The application automatically detects objects every 3 seconds.
6. Click **Analyze Now** to perform an immediate scan.
7. Click **Read Aloud** to hear the latest detection result.

## 🎯 Example Outputs

* `Person detected in front of you.`
* `Object detected: bottle`
* `Object detected: laptop`
* `No object detected.`

## 🔮 Future Enhancements

* Draw bounding boxes around detected objects
* Support multiple object detection announcements
* Add distance estimation for detected objects
* Provide multilingual voice assistance
* Add image capture and history tracking
* Develop a mobile-friendly Progressive Web App (PWA)

## 🤝 Contributing

Contributions are welcome. Feel free to fork the repository, improve the project, and submit a pull request.

## 📄 License

This project is licensed under the MIT License.

---

**VisionAssist Pro** – Empowering users with real-time computer vision and voice-assisted object recognition.
