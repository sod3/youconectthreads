// Import the necessary Firebase modules
import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";

// Firebase configuration object containing your project's API key, storage bucket, and other details
const firebaseConfig = {
    apiKey: "AIzaSyAaYaQwdnJ9pCqN67k12gLO0DvsASA3gkk",
    authDomain: "youconect-f4c07.firebaseapp.com",
    projectId: "youconect-f4c07",
    storageBucket: "youconect-f4c07.appspot.com",
    messagingSenderId: "1007240393186",
    appId: "1:1007240393186:web:5c5512c511d11ee77489bb",
    measurementId: "G-VHQMVZQMFF"
  };

// Initialize Firebase with the configuration above
const app = initializeApp(firebaseConfig);

// Initialize Firebase Storage and export it for use in other parts of the app
const storage = getStorage(app);

export { storage };
