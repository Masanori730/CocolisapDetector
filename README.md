🌴 CocolisapScan
An AI-powered web application for detecting Cocolisap (Aspidiotus rigidus) — coconut scale insects — using YOLOv11 Instance Segmentation and Mamdani Fuzzy Logic.
Built for coconut pest management research in the Philippines in partnership with the Philippine Coconut Authority (PCA) CALABARZON.
About
CocolisapScan allows users to upload photos of coconut leaves to detect cocolisap infestations using a trained YOLOv11 model, and assess infestation risk using a fuzzy logic engine that processes real-time weather data. Detection and assessment records are saved to Firebase Firestore and visualized on an interactive map dashboard.
Tech Stack

Frontend: React + Vite + TailwindCSS + Lucide React
Backend: Flask + Google Cloud Run (Docker)
AI Model: YOLOv11 Instance Segmentation Medium (Roboflow)
Fuzzy Logic: Mamdani Inference System (81 expert-validated rules)
Database: Firebase Firestore
Hosting: GitHub Pages
APIs: Open-Meteo, Nominatim, Semaphore SMS

Getting Started
Prerequisites

Node.js
A Firebase project with Firestore enabled

Installation

Clone the repository

bash   git clone https://github.com/Masanori730/CocolisapDetector.git
   cd CocolisapDetector

Install dependencies

bash   npm install

Create src/firebase.js with your Firebase config

js   import { initializeApp } from "firebase/app";
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

Run the app

bash   npm run dev
Features

🔍 AI-based cocolisap detection from uploaded leaf images
🧠 Fuzzy logic infestation risk assessment using real-time weather data
🗺️ Interactive map dashboard with GPS-tagged detections
📍 Geolocation support (GPS and manual entry)
📊 Data export in Excel (.xlsx) and text (.txt) formats
💬 Automated SMS alerts via Semaphore for Moderate/High risk
🕒 Detection and assessment history saved to Firebase Firestore

Model Info

Model: YOLOv11 Instance Segmentation Medium
Training Images: 670 annotated images
mAP@50: 89.9%
F1 Score: 87.6% | Precision: 87.7% | Recall: 87.5%
Confidence Threshold: 34%
Hosted on: Roboflow + Google Cloud Run

Acknowledgements

Philippine Coconut Authority (PCA) CALABARZON
Roboflow
Google Cloud
Open-Meteo
Semaphore SMS
