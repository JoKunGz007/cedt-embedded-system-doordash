// lib/firebaseConfig.ts
import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics"; // *** เพิ่ม isSupported ***
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyB960m8JU94pZY3n6ABClpJCcqsPsQ5jaM",
  authDomain: "smartdoor-92dc1.firebaseapp.com",
  databaseURL: "https://smartdoor-92dc1-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "smartdoor-92dc1",
  storageBucket: "smartdoor-92dc1.firebasestorage.app",
  messagingSenderId: "633489996534",
  appId: "1:633489996534:web:1d0d4136c30c33fa8e0ad7",
  measurementId: "G-YW8LLXH3JF"
};

const app = initializeApp(firebaseConfig);

// *** Initialize Analytics เฉพาะใน Browser Environment ที่รองรับ ***
let analytics;
if (typeof window !== 'undefined') { // ตรวจสอบว่าเป็น Client-side (Browser)
  isSupported().then(yes => {
    if (yes) {
      analytics = getAnalytics(app);
      console.log("Firebase Analytics initialized.");
    } else {
      console.warn("Firebase Analytics is not supported in this environment (e.g., SSR or unsupported browser features).");
    }
  }).catch(e => {
    console.error("Error checking Analytics support:", e);
  });
}
// ******************************************************************

export const db = getDatabase(app);
export const auth = getAuth(app);
