import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDAY1SxXd-portfc8OZSn3ftkPztQfOK4I",
  authDomain: "skillbridge-febca.firebaseapp.com",
  projectId: "skillbridge-febca",
  storageBucket: "skillbridge-febca.firebasestorage.app",
  messagingSenderId: "551626330082",
  appId: "1:551626330082:web:eda490f5fc55ec8cbcb3bb"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);