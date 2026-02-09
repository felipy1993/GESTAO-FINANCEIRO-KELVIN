import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCGLTx0UhZoz_VQ9_1nD8Ejnh231xOvc0k",
  authDomain: "financeiro-kelvin.firebaseapp.com",
  projectId: "financeiro-kelvin",
  storageBucket: "financeiro-kelvin.firebasestorage.app",
  messagingSenderId: "529032433513",
  appId: "1:529032433513:web:b30f6e0770859a1f0337f8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
