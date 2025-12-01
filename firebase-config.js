// ================================
// Firebase Configuration
// Replace with your Firebase project credentials
// ================================

const firebaseConfig = {
    apiKey: "AIzaSyCGVPqbTZCQ3Hrs9sFIJm_PR32FP_CVXSw",
    authDomain: "esv-bible-6dffb.firebaseapp.com",
    databaseURL: "https://esv-bible-6dffb-default-rtdb.firebaseio.com",
    projectId: "esv-bible-6dffb",
    storageBucket: "esv-bible-6dffb.firebasestorage.app",
    messagingSenderId: "824462651620",
    appId: "1:824462651620:web:5f46fe033ac46d2329bcf1"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Firebase services
const auth = firebase.auth();
const db = firebase.firestore();

// Optional: Simple encryption for API keys
// You can use your own key here
const ENCRYPTION_KEY = 'your-personal-encryption-key-32chars';

const EncryptionHelper = {
    encrypt(text) {
        // Simple Base64 encoding (replace with proper encryption if needed)
        return btoa(text);
    },

    decrypt(ciphertext) {
        try {
            return atob(ciphertext);
        } catch (e) {
            return '';
        }
    }
};

// Export for use in app
window.firebaseAuth = auth;
window.firebaseDb = db;
window.encryptionHelper = EncryptionHelper;