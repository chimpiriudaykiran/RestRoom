import { initializeApp } from 'firebase/app';
import {getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyBzj6UD3C-2bvB178WiW1rJsyJ279lBYnw",
    authDomain: "restroomlocator-eb091.firebaseapp.com",
    projectId: "restroomlocator-eb091",
    storageBucket: "restroomlocator-eb091.appspot.com",
    messagingSenderId: "315335335954",
    appId: "1:315335335954:web:e55f70d44391338af238cb",
    measurementId: "G-801X29DHD3"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db }