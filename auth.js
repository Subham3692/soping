import { auth, googleProvider, currentUser, $, navigateTo, showLoader, hideLoader, updateCartBadgeFromFirebase } from './main.js';
import { signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth';

export function initAuth() {
    onAuthStateChanged(auth, async (user) => {
        // Update global currentUser (imported binding works because it's an object reference)
        import('./main.js').then(m => m.currentUser = user);
        renderAuthUI(user);
        // Show the correct page (and enforce auth gating)
        const page = window.location.hash.replace('#', '') || 'home';
        const authRequired = ['cart', 'orders', 'profile'];
        if (authRequired.includes(page) && !user) {
            navigateTo('login');
        } else {
            import('./main.js').then(m => m.showPage(page));
        }
    });

    // Google login button
    $('btn-google-login')?.addEventListener('click', async () => {
        try {
            $('login-error').textContent = '';
            showLoader();
            await signInWithPopup(auth, googleProvider);
            navigateTo('home');
        } catch (err) {
            $('login-error').textContent = err.message || 'Google Sign‑In failed.';
        } finally {
            hideLoader();
        }
    });
}

export function renderAuthUI(user) {
    const desktopAuth = $('desktop-auth');
    const mobileLinks = $('mobile-sidebar-links');

    const commonLinks = `
        <a href="#home" class="flex items-center gap-4 px-4 py-3.5 rounded-2xl text-gray-300 hover:text-amber-300 hover:bg-gray-800/50 transition-all font-medium sidebar-link" data-page="home"><span class="w-9 h-9 flex items-center justify-center rounded-xl bg-amber-500/10 text-amber-400"><i class="fas fa-home"></i></span> Home</a>
        <a href="#products" class="flex items-center gap-4 px-4 py-3.5 rounded-2xl text-gray-300 hover:text-amber-300 hover:bg-gray-800/50 transition-all font-medium sidebar-link" data-page="products"><span class="w-9 h-9 flex items-center justify-center rounded-xl bg-amber-500/10 text-yellow-400"><i class="fas fa-th-large"></i></span> Products</a>
        <a href="#cart" class="flex items-center gap-4 px-4 py-3.5 rounded-2xl text-gray-300 hover:text-amber-300 hover:bg-gray-800/50 transition-all font-medium sidebar-link" data-page="cart"><span class="w-9 h-9 flex items-center justify-center rounded-xl bg-amber-500/10 text-amber-300"><i class="fas fa-shopping-cart"></i></span> Cart</a>
        <a href="#orders" class="flex items-center gap-4 px-4 py-3.5 rounded-2xl text-gray-300 hover:text-amber-300 hover:bg-gray-800/50 transition-all font-medium sidebar-link" data-page="orders"><span class="w-9 h-9 flex items-center justify-center rounded-xl bg-amber-500/10 text-amber-500"><i class="fas fa-box"></i></span> Orders</a>
        <a href="#profile" class="flex items-center gap-4 px-4 py-3.5 rounded-2xl text-gray-300 hover:text-amber-300 hover:bg-gray-800/50 transition-all font-medium sidebar-link" data-page="profile"><span class="w-9 h-9 flex items-center justify-center rounded-xl bg-amber-500/10 text-amber-400"><i class="fas fa-user"></i></span> Profile</a>
        <hr class="my-5 border-gray-700">
        <a href="#about" class="flex items-center gap-4 px-4 py-3.5 rounded-2xl text-gray-300 hover:text-amber-300 hover:bg-gray-800/50 transition-all font-medium"><span class="w-9 h-9 flex items-center justify-center rounded-xl bg-amber-500/10 text-amber-400"><i class="fas fa-info-circle"></i></span> About</a>
        <a href="#terms" class="flex items-center gap-4 px-4 py-3.5 rounded-2xl text-gray-300 hover:text-amber-300 hover:bg-gray-800/50 transition-all font-medium"><span class="w-9 h-9 flex items-center justify-center rounded-xl bg-amber-500/10 text-amber-400"><i class="fas fa-file-contract"></i></span> Terms</a>
        <a href="#contact" class="flex items-center gap-4 px-4 py-3.5 rounded-2xl text-gray-300 hover:text-amber-300 hover:bg-gray-800/50 transition-all font-medium"><span class="w-9 h-9 flex items-center justify-center rounded-xl bg-amber-500/10 text-amber-400"><i class="fas fa-envelope"></i></span> Contact</a>
    `;

    if (user) {
        desktopAuth.innerHTML = `
            <span class="text-amber-400 text-sm mr-2 hidden xl:inline">${user.email}</span>
            <button id="btn-logout" class="text-red-400 hover:text-red-300 text-xs font-semibold ml-2">Logout</button>`;
        $('btn-logout')?.addEventListener('click', async () => { await signOut(auth); });

        if (mobileLinks) {
            mobileLinks.innerHTML = commonLinks + `
                <hr class="my-5 border-gray-700">
                <div class="px-4 text-gray-400 text-sm">${user.email}</div>
                <button id="btn-logout-mobile" class="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-red-400 hover:bg-red-500/10 transition-all font-medium"><span class="w-9 h-9 flex items-center justify-center rounded-xl bg-red-500/10"><i class="fas fa-sign-out-alt"></i></span> Logout</button>`;
            $('btn-logout-mobile')?.addEventListener('click', async () => { await signOut(auth); });
        }
    } else {
        desktopAuth.innerHTML = `<a href="#login" class="px-3 py-2 rounded-xl bg-gray-800 text-gray-300 hover:text-amber-300 transition font-medium">Login</a>`;
        if (mobileLinks) {
            mobileLinks.innerHTML = commonLinks + `
                <hr class="my-5 border-gray-700">
                <a href="#login" class="flex items-center gap-4 px-4 py-3.5 rounded-2xl text-gray-300 hover:text-amber-300 hover:bg-gray-800/50 transition-all font-medium"><span class="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-800"><i class="fas fa-sign-in-alt"></i></span> Login</a>`;
        }
    }

    updateCartBadgeFromFirebase();

    // Sidebar link navigation (close sidebar)
    document.querySelectorAll('.sidebar-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.dataset.page;
            import('./main.js').then(m => {
                m.navigateTo(page);
                m.closeSidebar();
            });
        });
    });
}
