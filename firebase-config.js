// ================================
// Firebase Configuration
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

// Firebase services (using Realtime Database, not Firestore)
const auth = firebase.auth();
const database = firebase.database();

// Simple encryption for API keys
const EncryptionHelper = {
    encrypt(text) {
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
window.firebaseDatabase = database;
window.encryptionHelper = EncryptionHelper;
