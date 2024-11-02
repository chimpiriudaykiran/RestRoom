import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
const analytics = getAnalytics(app);