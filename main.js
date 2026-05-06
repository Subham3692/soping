import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { initAuth, renderAuthUI } from './auth.js';
import { loadHomeBanners, loadHomeCategories, loadHomeProducts } from './home.js';
import { loadCategoriesPage, selectCategory } from './categories.js';
import { loadProductsPage, applySort } from './product.js';
import { performSearch, navigateToSearch } from './search.js';

// ---------- FIREBASE CONFIG ----------
const firebaseConfig = {
    apiKey: "AIzaSyBIrOovwfq96b8zeGPx51NaqcCvDkQt_tE",
    authDomain: "shopping-a9708.firebaseapp.com",
    databaseURL: "https://shopping-a9708-default-rtdb.firebaseio.com",
    projectId: "shopping-a9708",
    storageBucket: "shopping-a9708.firebasestorage.app",
    messagingSenderId: "954509482293",
    appId: "1:954509482293:web:c75432784cfe8374bdd47c"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
export const googleProvider = new GoogleAuthProvider();
export let currentUser = null;

export const $ = (id) => document.getElementById(id);

// ---------- GLOBAL HELPERS ----------
export function showLoader() { $('loader').style.display = 'flex'; }
export function hideLoader() { $('loader').style.display = 'none'; }

function updateCartBadge(count) {
    document.querySelectorAll('#cartCount, #cartCountMobile').forEach(b => b.textContent = count || '0');
}

export async function updateCartBadgeFromFirebase() {
    if (!currentUser) { updateCartBadge(0); return; }
    const snap = await get(ref(db, `users/${currentUser.uid}/cart`));
    let count = 0;
    if (snap.exists()) count = Object.keys(snap.val()).length;
    updateCartBadge(count);
}

// ---------- ROUTING ----------
export function getCurrentPage() {
    const hash = window.location.hash.replace('#', '') || 'home';
    return ['home','categories','products','search','login','cart','orders','profile'].includes(hash) ? hash : 'home';
}

export function navigateTo(page, params = '') {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    window.location.hash = page + query;
}

function showPage(page) {
    // Auth required pages: redirect to login if not signed in
    const authRequired = ['cart', 'orders', 'profile'];
    if (authRequired.includes(page) && !currentUser) {
        navigateTo('login');
        return;
    }

    document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
    const section = $(`page-${page}`);
    if (section) section.classList.add('active');

    // Update nav active state
    document.querySelectorAll('.nav-link, .bottom-nav-link').forEach(link => {
        link.classList.remove('text-amber-300', 'bg-gray-800/50');
        if (link.dataset.page === page) link.classList.add('text-amber-300', 'bg-gray-800/50');
    });

    // Load page-specific data
    switch (page) {
        case 'home':
            loadHomeBanners();
            loadHomeCategories();
            loadHomeProducts();
            break;
        case 'categories':
            loadCategoriesPage();
            break;
        case 'products':
            loadProductsPage();
            break;
        case 'search':
            performSearch();
            break;
        case 'profile':
            if (currentUser) $('profileEmail').textContent = currentUser.email;
            break;
    }
}

window.addEventListener('hashchange', () => showPage(getCurrentPage()));

// ---------- SIDEBAR & SEARCH ----------
window.openSidebar = () => {
    $('sidebar').classList.add('open');
    $('overlay').classList.remove('hidden');
};
window.closeSidebar = () => {
    $('sidebar').classList.remove('open');
    $('overlay').classList.add('hidden');
};
$('menuBtnMobile')?.addEventListener('click', openSidebar);
$('searchToggleMobile')?.addEventListener('click', () => {
    $('searchBarMobile').classList.toggle('hidden');
    if (!$('searchBarMobile').classList.contains('hidden')) $('searchInputMobile').focus();
});

// ---------- SEARCH FORM HANDLERS ----------
const searchHandler = (form) => {
    const input = form.querySelector('input[name="q"]');
    if (input && input.value.trim()) {
        navigateTo('search', { q: input.value.trim() });
    }
};
$('mobileSearchBtn')?.addEventListener('click', () => searchHandler($('mobileSearchForm')));
$('desktopSearchBtn')?.addEventListener('click', () => searchHandler($('desktopSearchForm')));
// Also attach for Enter key
['mobileSearchForm', 'desktopSearchForm'].forEach(id => {
    const form = $(id);
    form?.addEventListener('submit', (e) => {
        e.preventDefault();
        searchHandler(form);
    });
});

// ---------- INITIALISE AUTH LISTENER ----------
initAuth();  // sets up onAuthStateChanged which calls renderAuthUI and then initial page show
