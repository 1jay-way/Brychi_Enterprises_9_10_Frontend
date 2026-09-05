/*
=========================================================
BRYCHI ENTERPRISES — FIREBASE CONFIGURATION
=========================================================
This file connects the Brychi Enterprises admin panel
to your Firebase project.
Firebase services used:
- Firebase Authentication
- Cloud Firestore
IMAGE STORAGE:
- Product images are stored on Cloudinary.
- Firebase Storage is NOT used.
IMPORTANT:
The security rules also protect the database.
This file alone does NOT secure the admin panel.
=========================================================
*/
/*
=========================================================
FIREBASE SDK IMPORTS
=========================================================
*/
import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getAuth
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import {
  getFirestore
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
/*
=========================================================
YOUR FIREBASE PROJECT CONFIGURATION
=========================================================
*/
const firebaseConfig = {
  apiKey:
    "AIzaSyCM-JZA63wNyzYM4C3vaUiciwYOmWd6Vhc",
  authDomain:
    "brychim-enterprises2.firebaseapp.com",
  projectId:
    "brychim-enterprises2",
  storageBucket:
    "brychim-enterprises2.firebasestorage.app",
  messagingSenderId:
    "596161124096",
  appId:
    "1:596161124096:web:8f48278c43db2891a305e5"
};
/*
=========================================================
AUTHORIZED ADMIN USER IDs
=========================================================
These are the Firebase Authentication UIDs allowed
to use the admin panel.
DO NOT PUT EMAILS OR PASSWORDS HERE.
=========================================================
*/
const ADMIN_UIDS = [
  "ymO4HaL6qvfNZSjrNUT4GozVyh03",
  "aB3utioU6qbDq8N2xNaJm3cjTez2"
];
/*
=========================================================
CHECK IF FIREBASE HAS BEEN CONFIGURED
=========================================================
*/
const firebaseReady =
  Object.values(firebaseConfig).every(
    value =>
      value &&
      !String(value).startsWith("PASTE_")
  );
/*
=========================================================
INITIALIZE FIREBASE SERVICES
=========================================================
*/
let app = null;
let auth = null;
let db = null;
if(firebaseReady){
  /*
  ==============================================
  INITIALIZE FIREBASE
  ==============================================
  */
  app =
    initializeApp(
      firebaseConfig
    );
  /*
  ==============================================
  FIREBASE AUTHENTICATION
  ==============================================
  */
  auth =
    getAuth(
      app
    );
  /*
  ==============================================
  CLOUD FIRESTORE DATABASE
  ==============================================
  */
  db =
    getFirestore(
      app
    );
}
/*
=========================================================
CLOUDINARY CONFIGURATION
=========================================================
Product images are uploaded to Cloudinary.
IMPORTANT:
- The upload preset must be UNSIGNED.
- Never put your Cloudinary API Secret here.
=========================================================
*/
const CLOUDINARY_CLOUD_NAME =
  "xjhfkov6";
const CLOUDINARY_UPLOAD_PRESET =
  "Brychi enterprises";
/*
=========================================================
CLOUDINARY UPLOAD URL
=========================================================
*/
const CLOUDINARY_UPLOAD_URL =
  `https://api.cloudinary.com/v1_1/` +
  `${CLOUDINARY_CLOUD_NAME}/image/upload`;
/*
=========================================================
EXPORT EVERYTHING
=========================================================
*/
export {
  firebaseReady,
  firebaseConfig,
  ADMIN_UIDS,
  app,
  auth,
  db,
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_UPLOAD_PRESET,
  CLOUDINARY_UPLOAD_URL
};