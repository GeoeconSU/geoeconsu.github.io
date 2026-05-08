// ─────────────────────────────────────────────────────────────────────────────
// STEP 1: Go to https://console.firebase.google.com
//   → Create a new project (or use existing)
//   → Project settings → Your apps → Add Web App
//   → Copy the firebaseConfig object and paste it below
// ─────────────────────────────────────────────────────────────────────────────
const firebaseConfig = {
    apiKey:            "AIzaSyBs_SkNDkmNTBFqEYfd8EarqGCgTsHlrDk",
    authDomain:        "gsu-members.firebaseapp.com",
    projectId:         "gsu-members",
    storageBucket:     "gsu-members.firebasestorage.app",
    messagingSenderId: "976274792755",
    appId:             "1:976274792755:web:4fd2f32efee29992f41e46",
    measurementId:     "G-T18G084C5S"
};

// ─────────────────────────────────────────────────────────────────────────────
// STEP 2: Groq API key for the AI chatbot
//   Get your key from https://console.groq.com → API Keys
//   The key is visible in source but the chatbot is gated behind login,
//   so only registered users can trigger API calls.
// ─────────────────────────────────────────────────────────────────────────────
const GROQ_API_KEY = "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";

// ─────────────────────────────────────────────────────────────────────────────
// Firebase initialisation (compat SDK loaded via CDN in HTML)
// ─────────────────────────────────────────────────────────────────────────────
firebase.initializeApp(firebaseConfig);
const auth      = firebase.auth();
const db        = firebase.firestore();
const analytics = firebase.analytics();

// ── Analytics helpers — call these anywhere to log events ────────────────────
function logEvent(eventName, params) {
    analytics.logEvent(eventName, params || {});
}

// Convenience wrappers for the events we care about
const Analytics = {
    // Which tab was opened (overview, analysis, compare, rankings, analytics, insights)
    tabView:        (tabName)           => logEvent('tab_view',        { tab_name: tabName, user_role: currentUserRole || 'unregistered' }),
    // User signed in — method: 'email' | 'google'
    login:          (method)            => logEvent('login',           { method }),
    // New user registered
    signUp:         (method)            => logEvent('sign_up',         { method }),
    // User signed out
    logout:         ()                  => logEvent('logout',          { user_role: currentUserRole }),
    // Chatbot query sent
    chatQuery:      ()                  => logEvent('chat_query',      { user_role: currentUserRole }),
    // Country opened in Analysis tab
    countryView:    (country)           => logEvent('country_view',    { country_name: country }),
    // Compare preset selected (e.g. "G7", "BRICS")
    comparePreset:  (preset)            => logEvent('compare_preset',  { preset_name: preset }),
    // Methodology page viewed (employees only — useful for engagement tracking)
    methodologyView: ()                 => logEvent('methodology_view',{ user_role: currentUserRole }),
    // Task created (director only)
    taskCreated:    (priority)          => logEvent('task_created',    { priority }),
    // Task status updated
    taskUpdated:    (status)            => logEvent('task_status_update', { new_status: status }),
    // User role changed by director (admin action)
    roleChanged:    (newRole)           => logEvent('role_changed',    { new_role: newRole }),
    // Lock screen shown (user hit a tab they can't access)
    lockScreenShown: (tabName)          => logEvent('lock_screen_shown', { tab_name: tabName, user_role: currentUserRole || 'unregistered' }),
    // Export action (PDF or Excel)
    export:         (format)            => logEvent('export',          { format }),
};

// ── Google provider ──────────────────────────────────────────────────────────
const googleProvider = new firebase.auth.GoogleAuthProvider();

// ── Current user state (updated by onAuthStateChanged) ───────────────────────
let currentUser     = null;
let currentUserRole = null;   // 'director' | 'employee' | 'free' | null
let currentUserLevel = 0;     // 1-5 for employees, 0 otherwise

// Role helpers
const ROLE_WEIGHT = { director: 3, employee: 2, free: 1 };
function roleAtLeast(role) {
    if (!currentUserRole) return false;
    return (ROLE_WEIGHT[currentUserRole] || 0) >= (ROLE_WEIGHT[role] || 0);
}
function isDirector()  { return currentUserRole === 'director'; }
function isEmployee()  { return roleAtLeast('employee'); }
function isFreeUser()  { return roleAtLeast('free'); }

// ── Auth state listener ───────────────────────────────────────────────────────
auth.onAuthStateChanged(async (user) => {
    currentUser = user;
    if (user) {
        try {
            const snap = await db.collection('users').doc(user.uid).get();
            if (snap.exists) {
                const data = snap.data();
                currentUserRole  = data.role  || 'free';
                currentUserLevel = data.level || 0;
            } else {
                // First sign-in: create user document with 'free' role
                await db.collection('users').doc(user.uid).set({
                    email:       user.email,
                    displayName: user.displayName || user.email.split('@')[0],
                    role:        'free',
                    level:       0,
                    createdAt:   firebase.firestore.FieldValue.serverTimestamp()
                });
                currentUserRole  = 'free';
                currentUserLevel = 0;
            }
        } catch (e) {
            console.error('Error loading user profile:', e);
            currentUserRole = 'free';
        }
    } else {
        currentUserRole  = null;
        currentUserLevel = 0;
    }
    // Notify the dashboard that auth state has changed
    if (typeof onAuthReady === 'function') onAuthReady(user);
});

// ── Sign in / out helpers ─────────────────────────────────────────────────────
async function signInWithEmail(email, password) {
    return auth.signInWithEmailAndPassword(email, password);
}

async function signUpWithEmail(email, password, displayName) {
    const cred = await auth.createUserWithEmailAndPassword(email, password);
    await cred.user.updateProfile({ displayName });
    return cred;
}

async function signInWithGoogle() {
    return auth.signInWithPopup(googleProvider);
}

async function signOut() {
    return auth.signOut();
}

// ── Password reset ────────────────────────────────────────────────────────────
async function sendPasswordReset(email) {
    return auth.sendPasswordResetEmail(email);
}
