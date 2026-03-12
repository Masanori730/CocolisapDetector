import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDAm7Z5AFBnKJpPrMuSW9BPNTmWDfo-j_4",
  authDomain: "cocolisap-detector.firebaseapp.com",
  projectId: "cocolisap-detector",
  storageBucket: "cocolisap-detector.firebasestorage.app",
  messagingSenderId: "575531161091",
  appId: "1:575531161091:web:6e685e6ce0b221357f2036",
  measurementId: "G-81DPG4W22S"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
