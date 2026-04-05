# 🌴 CocolisapScan

An AI-powered web application for detecting **Cocolisap (*Aspidiotus rigidus*)** — coconut scale insects — using **YOLOv11 Instance Segmentation** and a **Mamdani Fuzzy Logic** inference system.

Built for coconut pest management research in the Philippines in partnership with the **Philippine Coconut Authority (PCA) CALABARZON**.

---

## About

CocolisapScan allows users to upload photos of coconut leaves to detect cocolisap infestations using a trained YOLOv11 model, and assess infestation risk using a fuzzy logic engine that processes real-time weather data. Detection and assessment records are saved to Firebase Firestore and visualized on an interactive map dashboard. The system also includes a wind-driven spread visualization to estimate potential infestation spread based on current weather conditions.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite + TailwindCSS + Lucide React |
| Backend | Flask + Google Cloud Run (Docker) |
| AI Model | YOLOv11 Instance Segmentation Medium (Roboflow) |
| Fuzzy Logic | Mamdani Inference System (81 expert-validated rules) |
| Database | Firebase Firestore |
| Hosting | GitHub Pages |
| APIs | Open-Meteo, Roboflow, Nominatim, Semaphore SMS |

---

## Getting Started

### Prerequisites
- Node.js (already installed)
- A Firebase project with Firestore enabled
- A Roboflow account with a trained YOLOv11 model
- A Google Cloud Run backend deployed

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/Masanori730/CocolisapDetector.git
cd CocolisapDetector
```

2. **Install dependencies**
```bash
npm install
```

3. **Create `src/firebase.js`** with your Firebase config
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

4. **Run the app**
```bash
npm run dev
```

---

## Features

- 🔍 AI-based cocolisap detection from uploaded coconut leaf images
- 🧠 Fuzzy logic infestation risk assessment using real-time weather data
- 🗺️ Interactive map dashboard with GPS-tagged detections
- 🌬️ Wind-driven spread visualization showing potential infestation spread cone
- 📍 Geolocation support (GPS and manual entry with auto-geocoding)
- 📊 Data export in Excel (.xlsx) and text (.txt) formats
- 💬 Automated SMS alerts via Semaphore for Moderate/High risk
- 🕒 Detection and assessment history saved to Firebase Firestore

---

## Model Info

| Parameter | Value |
|---|---|
| Model | YOLOv11 Instance Segmentation Medium |
| Training Images | 670 annotated images |
| mAP@50 | 89.9% |
| F1 Score | 87.6% |
| Precision | 87.7% |
| Recall | 87.5% |
| Confidence Threshold | 34% |
| Hosted on | Roboflow + Google Cloud Run |

---

## Pages

| Page | Description |
|---|---|
| Home | Landing page with system overview and navigation |
| Image Detection | Upload coconut leaf photo for AI-based cocolisap detection |
| Map Dashboard | Interactive map of all GPS-tagged detection records |
| Fuzzy Logic | Real-time infestation risk assessment with spread visualization |
| Data Export | Download filtered detection and assessment records as Excel files |

---

## Acknowledgements

- [Philippine Coconut Authority (PCA) CALABARZON](https://pca.da.gov.ph)
- [Roboflow](https://roboflow.com)
- [Google Cloud](https://cloud.google.com)
- [Open-Meteo](https://open-meteo.com)
- [Semaphore SMS](https://semaphore.co)
- [Nominatim / OpenStreetMap](https://nominatim.openstreetmap.org)
