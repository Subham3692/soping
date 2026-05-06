import { db, $, showLoader, hideLoader, get, ref } from './main.js';
import { getDatabase, ref as dbRef, get as dbGet } from 'firebase/database';

let sliderImages = [];
let currentSlide = 0;
let autoSlideInterval;

export async function loadHomeBanners() {
    const snap = await dbGet(dbRef(db, 'banners'));
    const track = $('sliderTrack');
    const dotsContainer = $('sliderDots');
    if (!snap.exists()) {
        track.innerHTML = `<div class="w-full flex-shrink-0 relative"><div class="w-full h-44 sm:h-56 lg:h-72 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center"><span class="text-amber-400 font-serif text-2xl">UpdatesAll</span></div></div>`;
        return;
    }
    const banners = Object.values(snap.val()).filter(b => b.image_url);
    sliderImages = banners;
    currentSlide = 0;
    renderSlider();
    if (banners.length > 1) startAutoSlide();
}

function renderSlider() {
    const track = $('sliderTrack');
    const dotsContainer = $('sliderDots');
    if (!track || !dotsContainer) return;
    track.innerHTML = sliderImages.map((b, i) => `
        <div class="w-full flex-shrink-0 relative">
            <a href="${b.link || '#'}">
                <img src="${b.image_url}" class="w-full h-44 sm:h-56 lg:h-72 object-cover">
                <div class="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent"></div>
                <div class="absolute bottom-5 left-5">
                    <h3 class="font-serif text-2xl lg:text-3xl font-black text-amber-300">${b.title || ''}</h3>
                </div>
            </a>
        </div>`).join('');
    dotsContainer.innerHTML = sliderImages.map((_, i) => `
        <span class="dot w-2 h-2 lg:w-3 lg:h-3 rounded-full transition-all duration-300 cursor-pointer ${i === currentSlide ? 'bg-amber-400 scale-125' : 'bg-gray-500'}" data-index="${i}"></span>`).join('');
    document.querySelectorAll('.dot').forEach(d => {
        d.addEventListener('click', () => goToSlide(parseInt(d.dataset.index)));
    });
    goToSlide(currentSlide);
}

function goToSlide(index) {
    const track = $('sliderTrack');
    if (!track) return;
    currentSlide = index;
    track.style.transform = `translateX(-${index * 100}%)`;
    document.querySelectorAll('.dot').forEach((d, i) => {
        d.classList.toggle('bg-amber-400', i === index);
        d.classList.toggle('scale-125', i === index);
        d.classList.toggle('bg-gray-500', i !== index);
    });
}
function nextSlide() { goToSlide((currentSlide + 1) % sliderImages.length); }
function prevSlide() { goToSlide((currentSlide - 1 + sliderImages.length) % sliderImages.length); }
function startAutoSlide() { clearInterval(autoSlideInterval); autoSlideInterval = setInterval(nextSlide, 4500); }
function stopAutoSlide() { clearInterval(autoSlideInterval); }

$('nextSlide')?.addEventListener('click', nextSlide);
$('prevSlide')?.addEventListener('click', prevSlide);
const heroSlider = $('heroSlider');
let startX = 0;
heroSlider?.addEventListener('touchstart', e => { startX = e.touches[0].clientX; stopAutoSlide(); }, {passive: true});
heroSlider?.addEventListener('touchend', e => {
    const diff = startX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) diff > 0 ? nextSlide() : prevSlide();
    startAutoSlide();
});
heroSlider?.addEventListener('mouseenter', stopAutoSlide);
heroSlider?.addEventListener('mouseleave', startAutoSlide);

export async function loadHomeCategories() {
    const snap = await dbGet(dbRef(db, 'categories'));
    const container = $('homeCategories');
    if (!snap.exists()) { container.innerHTML = '<p class="text-gray-500 text-sm">No categories yet.</p>'; return; }
    const cats = snap.val();
    container.innerHTML = Object.entries(cats).map(([id, c]) => `
        <a href="#products?cat=${id}" class="flex-shrink-0 w-20 lg:w-24 text-center group">
            <div class="w-16 h-16 lg:w-20 lg:h-20 mx-auto rounded-full bg-gradient-to-br from-gray-800 to-gray-900 p-0.5 shadow-lg group-active:scale-95 transition">
                <div class="w-full h-full rounded-full overflow-hidden border-2 border-amber-500/30">
                    <img src="${c.image_url || 'https://via.placeholder.com/80'}" class="w-full h-full object-cover">
                </div>
            </div>
            <p class="text-xs lg:text-sm mt-2 font-semibold text-gray-400 group-hover:text-amber-300 truncate">${c.name}</p>
        </a>
    `).join('');
}

export async function loadHomeProducts() {
    const snap = await dbGet(dbRef(db, 'products'));
    const grid = $('homeProducts');
    if (!snap.exists()) { grid.innerHTML = '<p class="text-gray-500 col-span-full text-center py-10">No products available.</p>'; return; }
    const products = Object.entries(snap.val()).map(([id, p]) => ({ id, ...p })).slice(0, 8);
    grid.innerHTML = products.map(p => `
        <a href="#product_detail?id=${p.id}" class="bg-gray-900 border border-amber-500/20 rounded-3xl p-3 lg:p-4 flex flex-col group card-hover">
            <img src="${p.image_url || 'https://via.placeholder.com/300'}" class="w-full h-40 lg:h-52 rounded-2xl object-cover bg-gray-800 group-hover:scale-105 transition-transform duration-700">
            <h3 class="text-sm lg:text-base font-bold text-gray-200 truncate mt-3">${p.name}</h3>
            <div class="flex items-baseline gap-1 mt-1">
                <span class="text-amber-400 font-extrabold text-lg lg:text-xl">₹${parseFloat(p.price).toFixed(2)}</span>
            </div>
            ${p.mrp ? `<span class="text-gray-500 text-xs line-through">₹${parseFloat(p.mrp).toFixed(2)}</span>` : ''}
        </a>
    `).join('');
}
