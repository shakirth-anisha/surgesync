# SurgeSync

## Project Structure
- **Frontend (Vite + React)**: The user interface and client-side logic.
- **Backend (Python + OpenCV)**: Handles real-time people counting using OpenCV and an SSD-based object detection model.

## Features
- **Real-Time Sync**: Automatically updates changes across all connected devices.
- **Efficient Conflict Resolution**: Handles duplicate changes intelligently to avoid data loss.
- **People Counting System**: Detects and tracks people in real-time.
- **Real-Time Alert System**: Sends an alert if a location exceeds the allowed number of people.
- **Footfall Analysis & Logging**: Stores counting data for later review and business insights.
- **Scheduler & Timer**: Allows automation of the people-counting process.

## Installation
### Frontend (Vite + React)
1. Navigate to the `frontend` folder.
2. Install dependencies:
   ```sh
   npm install
   ```
3. Start the development server:
   ```sh
   npm run dev
   ```

### Backend (Python + OpenCV)
1. Navigate to the `backend` folder.
2. Install dependencies:
   ```sh
   pip install -r requirements.txt
   ```
3. Run the people counting system (Configure place name as required):
   ```sh
   python people_counter.py --prototxt detector/MobileNetSSD_deploy.prototxt --model detector/MobileNetSSD_deploy.caffemodel --place-name PES-ECC
   ```

## Configuration
SurgeSync supports configuration files for advanced settings.
- **Frontend Config**: Located in `frontend/config.json`.
- **Backend Config**: Located in `backend/utils/config.json`.
- Example backend config:
   ```json
   {
       "Email_Send": "",
       "Email_Receive": "",
       "Email_Password": "",
       "url": "",
       "ALERT": false,
       "Threshold": 10,
       "Thread": false,
       "Log": false,
       "Scheduler": false,
       "Timer": false
   }
   ```

## Usage
1. Set up people counting thresholds in the backend configuration.
2. Run the system and monitor real-time analytics.
