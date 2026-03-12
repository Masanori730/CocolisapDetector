# 🌴 CocolisapDetector

An AI-powered web application for detecting **Cocolisap** (Aspidiotus rigidus) — coconut scale insects — using YOLOv11 Instance Segmentation.

Built for coconut pest management research in the Philippines.

## About

This app allows users to upload photos of coconut leaves and detect cocolisap infestations using a trained YOLOv11 model deployed on Google Cloud Run. Detection results are saved to Firebase Firestore.

## Tech Stack

- **Frontend:** React + Vite + TailwindCSS
- **AI Model:** YOLOv11 Instance Segmentation (trained on Roboflow)
- **Backend:** Flask + Google Cloud Run
- **Database:** Firebase Firestore
- **Hosting:** GitHub Pages

## Getting Started

### Prerequisites
- Node.js 18+
- A Firebase project with Firestore enabled

### Installation

1. Clone the repository
```bash
   git clone https://github.com/Masanori730/CocolisapDetector.git
   cd CocolisapDetector
```

2. Install dependencies
```bash
   npm install
```

3. Create `src/firebase.js` with your Firebase config
```js
   import { initializeApp } from "firebase/app";
   import { getFirestore } from "firebase/firestore";

   const firebaseConfig = {
     apiKey: "your_api_key",
     authDomain: "your_auth_domain",
     projectId: "your_project_id",
     storageBucket: "your_storage_bucket",
     messagingSenderId: "your_messaging_sender_id",
     appId: "your_app_id"
   };

   const app = initializeApp(firebaseConfig);
   export const db = getFirestore(app);
```

4. Run the app
```bash
   npm run dev
```

## Features

- 🔍 Single image detection
- 📦 Batch image processing
- 🗺️ Map dashboard with GPS tracking
- 📊 Analytics and reports
- 🕒 Detection history saved to Firebase
- 📍 Location capture (province, municipality, barangay)

## Model Info

- **Model:** YOLOv11 Instance Segmentation Medium
- **Dataset:** 1608 images
- **mAP:** 87.4%
- **Hosted on:** Roboflow + Google Cloud Run

## Acknowledgements

- Philippine Coconut Authority
- Roboflow
- Google Cloud
