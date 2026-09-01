// ─────────────────────────────────────────────────────────────────────────────
// STEP 1: Go to https://console.firebase.google.com
//   → Create a new project (or use existing)
//   → Project settings → Your apps → Add Web App
//   → Copy the firebaseConfig object and paste it below
// ─────────────────────────────────────────────────────────────────────────────
const firebaseConfig = {
    apiKey:            "AIzaSyBs_SkNDkmNTBFqEYfd8EarqGCgTsHlrDk",
    authDomain:        "gsu-members.firebaseapp.com",
    // Realtime Database instance (gsu-members project) — holds the gated
    // rao9.csv dataset under protected-data/rao9_csv. See database.rules.json.
    databaseURL:       "https://gsu-members-default-rtdb.firebaseio.com",
    projectId:         "gsu-members",
    storageBucket:     "gsu-members.firebasestorage.app",
    messagingSenderId: "976274792755",
    appId:             "1:976274792755:web:4fd2f32efee29992f41e46",
    measurementId:     "G-T18G084C5S"
};

// ─────────────────────────────────────────────────────────────────────────────
// STEP 2: Cloudflare Worker URL (proxies Groq — API key stays server-side)
// ─────────────────────────────────────────────────────────────────────────────
const WORKER_URL   = "https://rao-dashboard-proxy.guduruadip.workers.dev";
// fallback if worker unavailable

// ─────────────────────────────────────────────────────────────────────────────
// Firebase initialisation (compat SDK loaded via CDN in HTML)
// ─────────────────────────────────────────────────────────────────────────────
firebase.initializeApp(firebaseConfig);
const auth      = firebase.auth();
const db        = firebase.firestore();
const analytics = (typeof firebase.analytics === 'function') ? firebase.analytics() : null;

// ── Analytics helpers — call these anywhere to log events ────────────────────
function logEvent(eventName, params) {
    if (analytics) analytics.logEvent(eventName, params || {});
}

// Convenience wrappers for the events we care about
const Analytics = {
    // Which tab was opened (overview, analysis, compare, rankings, analytics, insights)
    tabView:        (tabName)           => logEvent('tab_view',        { tab_name: tabName, user_role: currentUserRole || 'unregistered', plan: effectivePlan() || 'unregistered' }),
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
    lockScreenShown: (tabName)          => logEvent('lock_screen_shown', { tab_name: tabName, user_role: currentUserRole || 'unregistered', plan: effectivePlan() || 'unregistered' }),
    // Upgrade prompt surfaced — context is the tab/feature that triggered it
    upgradePrompt:  (context)           => logEvent('upgrade_prompt',  { context, plan: effectivePlan() || 'unregistered' }),
    // Customer submitted a Personal/Enterprise request
    planRequested:  (plan, count)       => logEvent('plan_requested',  { requested_plan: plan, country_count: count || 0 }),
    // Export action (PDF or Excel)
    export:         (format)            => logEvent('export',          { format }),
};

// ── Google provider ──────────────────────────────────────────────────────────
const googleProvider = new firebase.auth.GoogleAuthProvider();

// ── Current user state (updated by onAuthStateChanged) ───────────────────────
let currentUser      = null;
let currentUserRole  = null;  // semantic label: 'founder' | 'ops-lead' | 'cto' | 'cdo' | 'cso' | 'marketing-lead' | 'research-lead' | 'analyst' | 'associate' | 'developer' | 'consultant' | 'client' | 'free'
let currentUserLevel = null;  // access tier: null=not in DB (unregistered), 1=leadership, 2=executive, 3=employee, 4=client, 5=free; 6+ reserved

// ── Commercial plan state (independent axis from the internal staff hierarchy) ─
//    role/level  = who you are inside GSU (drives admin.html, tracker.html, rules)
//    plan/…      = what you bought (drives what the dashboard will show you)
let currentUserPlan      = null;  // 'free' | 'personal' | 'enterprise' — null when signed out
let currentUserCountries = [];    // granted ISO3 list; only meaningful for 'personal'
let currentUserQuota     = 0;     // admin-set country allowance for 'personal'
let currentPlanStatus    = 'none';// 'none' | 'pending' | 'active' | 'declined'
let currentRequestedPlan = null;  // 'personal' | 'enterprise' while awaiting approval

// ── Campaign registrant state (e.g. BRICS 2026) — independent of plan/role ────
// role stays permanently on the doc as a lead marker; only planExpiresAt
// governs when the *access* actually lapses (see effectivePlan below).
let currentUserOrganization = '';
let currentUserDesignation  = '';
let currentPlanExpiresAt    = null; // firebase.firestore.Timestamp | null

// ── Access helpers (lower level number = more privilege) ──────────────────────
// levelAtMost(n): true if user has a DB record AND their level ≤ n
function levelAtMost(n) { return currentUserLevel !== null && currentUserLevel <= n; }
function isDirector()   { return currentUserLevel === 1; }
function isHead()       { return levelAtMost(2); }
function isEmployee()   { return levelAtMost(3); }
function isClient()     { return levelAtMost(4); }
function isFreeUser()   { return levelAtMost(5); }

// ── Plan helpers ──────────────────────────────────────────────────────────────
// Rank so tiers can be compared numerically. Higher = more access.
const PLAN_RANK = { free: 0, personal: 1, enterprise: 2 };

// The plan actually in force. GSU staff (level ≤3) and legacy level-4 clients
// are treated as enterprise so nothing about their experience changes.
function effectivePlan() {
    if (currentUserLevel === null) return null;   // signed out / unverified
    if (levelAtMost(4)) return 'enterprise';
    // A time-boxed grant (e.g. a conference campaign) lapses to free once its
    // window closes — checked purely client-side, no write-back needed. The
    // doc's role/plan fields are left untouched; only the *effective* access
    // changes, which is what every gate call site below actually reads.
    if (currentPlanExpiresAt && currentPlanExpiresAt.toMillis() < Date.now()) return 'free';
    return currentUserPlan || 'free';
}
function planAtLeast(tier) {
    const p = effectivePlan();
    if (!p) return false;
    return PLAN_RANK[p] >= (PLAN_RANK[tier] ?? 99);
}
function isEnterprise() { return effectivePlan() === 'enterprise'; }
function isPaidPlan()   { return planAtLeast('personal'); }

// Single source of truth for per-country entitlement. Every gated call site in
// the dashboard asks this rather than re-deriving the rule.
function canSeeCountry(iso) {
    const p = effectivePlan();
    if (p === 'enterprise') return true;
    if (p === 'personal')   return currentUserCountries.includes(iso);
    return false;
}
function entitledCountries() {
    return effectivePlan() === 'personal' ? currentUserCountries.slice() : null; // null = all
}

// ── Signup plan intent ────────────────────────────────────────────────────────
// The user doc is only created on first *verified* sign-in, which can be days
// after registration. Stash the plan choice locally and apply it at creation.
const PLAN_INTENT_KEY = 'gsu_plan_intent';
// extra: optional { role, organization, designation, src } for a campaign
// self-registration (e.g. brics2026.html) — orthogonal to plan/countries,
// which stay null/[] for that path.
function stashPlanIntent(email, plan, countries, extra) {
    try {
        localStorage.setItem(PLAN_INTENT_KEY, JSON.stringify({
            email: (email || '').toLowerCase(),
            plan:  plan || null,
            countries: countries || [],
            role:         extra?.role         || null,
            organization: extra?.organization || '',
            designation:  extra?.designation  || '',
            src:          extra?.src          || null
        }));
    } catch (e) { /* private browsing — request is simply lost, not fatal */ }
}
function readPlanIntent(email) {
    try {
        const raw = localStorage.getItem(PLAN_INTENT_KEY);
        if (!raw) return null;
        const intent = JSON.parse(raw);
        if (email && intent.email && intent.email !== email.toLowerCase()) return null;
        return intent;
    } catch (e) { return null; }
}
function clearPlanIntent() {
    try { localStorage.removeItem(PLAN_INTENT_KEY); } catch (e) { /* noop */ }
}

// Applied to a signed-in user; used both at doc creation and by the in-app
// upgrade modal, so post-signup upgrades run through the same pipeline.
async function requestPlan(plan, countries) {
    if (!currentUser) throw new Error('Not signed in');
    await db.collection('users').doc(currentUser.uid).update({
        requestedPlan:      plan,
        requestedCountries: countries || [],
        planStatus:         'pending',
        planRequestedAt:    firebase.firestore.FieldValue.serverTimestamp()
    });
}

// ── Auth state listener ───────────────────────────────────────────────────────
function _resetUserState() {
    currentUserRole      = null;
    currentUserLevel     = null;
    currentUserPlan      = null;
    currentUserCountries = [];
    currentUserQuota     = 0;
    currentPlanStatus    = 'none';
    currentRequestedPlan = null;
    currentUserOrganization = '';
    currentUserDesignation  = '';
    currentPlanExpiresAt    = null;
}

function _applyUserDoc(data) {
    currentUserRole      = data.role  || 'free';
    currentUserLevel     = data.level || null;
    currentUserPlan      = data.plan  || 'free';
    currentUserCountries = Array.isArray(data.allowedCountries) ? data.allowedCountries : [];
    currentUserQuota     = typeof data.countryQuota === 'number' ? data.countryQuota : 0;
    currentPlanStatus    = data.planStatus    || 'none';
    currentRequestedPlan = data.requestedPlan || null;
    currentUserOrganization = data.organization  || '';
    currentUserDesignation  = data.designation   || '';
    currentPlanExpiresAt    = data.planExpiresAt || null;
}

// Live listener on the caller's own user doc, so an admin approving a plan
// unlocks the dashboard without the customer reloading (and a revoke bites
// immediately too).
let _userDocUnsub = null;
function _stopUserDocListener() {
    if (_userDocUnsub) { _userDocUnsub(); _userDocUnsub = null; }
}

auth.onAuthStateChanged(async (user) => {
    currentUser = user;
    _stopUserDocListener();

    if (!user) {
        _resetUserState();
        if (typeof onAuthReady === 'function') onAuthReady(null);
        return;
    }

    // Email/password accounts must verify their email before getting access
    if (!user.emailVerified && user.providerData[0]?.providerId === 'password') {
        _resetUserState();
        if (typeof onAuthReady === 'function') onAuthReady(user);
        return;
    }

    const ref = db.collection('users').doc(user.uid);
    try {
        const snap = await ref.get();
        if (!snap.exists) {
            // First sign-in after verification: create the doc at free tier and
            // carry over any plan the user picked at registration as a request.
            const intent = readPlanIntent(user.email) || {};
            if (intent.role) {
                // Campaign self-registration (e.g. brics2026.html) — grants a
                // config-driven country set immediately, no approval step.
                await _createCampaignUserDoc(ref, user, intent);
            } else {
                const wantsPaid = intent.plan === 'personal' || intent.plan === 'enterprise';
                await ref.set({
                    email:              user.email,
                    displayName:        user.displayName || user.email.split('@')[0],
                    role:               'free',
                    level:              5,
                    plan:               'free',
                    allowedCountries:   [],
                    countryQuota:       0,
                    requestedPlan:      wantsPaid ? intent.plan : null,
                    requestedCountries: wantsPaid ? (intent.countries || []) : [],
                    planStatus:         wantsPaid ? 'pending' : 'none',
                    planRequestedAt:    wantsPaid ? firebase.firestore.FieldValue.serverTimestamp() : null,
                    createdAt:          firebase.firestore.FieldValue.serverTimestamp()
                });
            }
            clearPlanIntent();
        }
    } catch (e) {
        console.error('Error initialising user profile:', e);
    }

    _userDocUnsub = ref.onSnapshot(
        (snap) => {
            if (snap.exists) _applyUserDoc(snap.data());
            else { currentUserRole = 'free'; currentUserLevel = 5; currentUserPlan = 'free'; }
            if (typeof onAuthReady === 'function') onAuthReady(auth.currentUser);
        },
        (err) => {
            console.error('Error watching user profile:', err);
            currentUserRole = 'free'; currentUserLevel = 5; currentUserPlan = 'free';
            if (typeof onAuthReady === 'function') onAuthReady(auth.currentUser);
        }
    );
});

// ── Sign in / out helpers ─────────────────────────────────────────────────────
async function signInWithEmail(email, password) {
    return auth.signInWithEmailAndPassword(email, password);
}

// plan/countries are optional: the chosen tier is stashed locally and turned
// into a pending request when the verified user doc is first created.
async function signUpWithEmail(email, password, displayName, plan, countries) {
    if (plan && plan !== 'free') stashPlanIntent(email, plan, countries);
    const cred = await auth.createUserWithEmailAndPassword(email, password);
    await cred.user.updateProfile({ displayName });
    await cred.user.sendEmailVerification();
    return cred;
}

async function signInWithGoogle() {
    return auth.signInWithPopup(googleProvider);
}

// ── Campaign self-registration (e.g. BRICS 2026, brics2026.html) ─────────────
// Grants a fixed-country, time-boxed 'personal' plan driven entirely by the
// named config/{docId} doc, so a director can retune the country list,
// expiry window, or on-off switch without any redeploy. Falls back to a
// normal free account if the campaign is inactive/missing by the time this
// runs (brics2026.html already checks this before showing its form — this
// is only a defensive backstop for the gap between registering and, for the
// email/password path, verifying).
async function _createCampaignUserDoc(ref, user, intent) {
    const configSnap = await db.collection('config').doc('brics_event').get();
    const config = configSnap.exists ? configSnap.data() : null;
    const base = {
        email:              user.email,
        displayName:        user.displayName || user.email.split('@')[0],
        level:              5,
        requestedPlan:      null,
        requestedCountries: [],
        planStatus:         'none',
        planRequestedAt:    null,
        createdAt:          firebase.firestore.FieldValue.serverTimestamp()
    };

    if (!config || !config.active || config.role !== intent.role) {
        await ref.set({ ...base, role: 'free', plan: 'free', allowedCountries: [], countryQuota: 0 });
        return;
    }

    const expiresAt = firebase.firestore.Timestamp.fromMillis(Date.now() + config.expiresInDays * 86400000);
    await ref.set({
        ...base,
        role:             config.role,
        plan:             'personal',
        allowedCountries: config.allowedCountries,
        countryQuota:     config.allowedCountries.length,
        organization:     intent.organization || '',
        designation:      intent.designation  || '',
        signupSource:     intent.src || null,
        planExpiresAt:    expiresAt
    });
}

// email/password path for a campaign landing page. Mirrors signUpWithEmail,
// but stashes campaign identity instead of a plan/countries choice — applied
// at doc-creation time above, same "stash now, apply once verified" pattern.
async function signUpForCampaign(email, password, displayName, role, organization, designation, src) {
    stashPlanIntent(email, null, [], { role, organization, designation, src });
    const cred = await auth.createUserWithEmailAndPassword(email, password);
    await cred.user.updateProfile({ displayName });
    await cred.user.sendEmailVerification();
    return cred;
}

async function signOut() {
    return auth.signOut();
}

// ── Password reset ────────────────────────────────────────────────────────────
async function sendPasswordReset(email) {
    return auth.sendPasswordResetEmail(email);
}
