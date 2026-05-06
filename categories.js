import { db, $, get, ref } from './main.js';
import { get as dbGet, ref as dbRef } from 'firebase/database';

let allCategories = {};
let allSubcategories = {};
let activeCategoryId = null;

export async function loadCategoriesPage() {
    const catSnap = await dbGet(dbRef(db, 'categories'));
    const subSnap = await dbGet(dbRef(db, 'subcategories'));
    allCategories = catSnap.exists() ? catSnap.val() : {};
    allSubcategories = subSnap.exists() ? subSnap.val() : {};
    renderCategoryStrip();
    const firstCatId = Object.keys(allCategories)[0];
    if (firstCatId && !activeCategoryId) selectCategory(firstCatId);
}

function renderCategoryStrip() {
    const strip = $('categoryStrip');
    if (Object.keys(allCategories).length === 0) {
        strip.innerHTML = '<p class="text-gray-500 text-sm">No categories yet.</p>';
        return;
    }
    strip.innerHTML = Object.keys(allCategories).map(id => {
        const cat = allCategories[id];
        return `<button onclick="selectCategory('${id}')" data-id="${id}" class="category-btn flex-shrink-0 flex flex-col items-center px-5 py-4 rounded-2xl transition-all duration-300 bg-gray-800/80 text-gray-400 hover:text-amber-300 border border-transparent active:scale-95 ${activeCategoryId===id?'active':''}">
            <div class="w-16 h-16 lg:w-20 lg:h-20 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center mb-3 border border-amber-500/20 shadow-lg">
                <img src="${cat.image_url || 'https://via.placeholder.com/80'}" class="w-12 h-12 lg:w-14 lg:h-14 object-cover rounded-full" onerror="this.style.display='none'">
            </div>
            <span class="text-sm font-semibold text-center whitespace-nowrap lg:text-base">${cat.name}</span>
        </button>`;
    }).join('');
}

window.selectCategory = function(catId) {
    activeCategoryId = catId;
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.id === catId) btn.classList.add('active');
    });
    const filtered = Object.entries(allSubcategories)
        .filter(([id, sub]) => sub.cat_id === catId)
        .map(([id, sub]) => ({ id, ...sub }));
    const grid = $('subcategoryGrid');
    const placeholder = $('placeholderMsg');
    if (filtered.length === 0) {
        grid.innerHTML = `<div class="col-span-full text-center py-16"><i class="fas fa-folder-open text-4xl text-amber-500/60 mb-4"></i><p class="text-gray-400 font-medium text-lg">No subcategories found</p></div>`;
        placeholder.classList.add('hidden');
    } else {
        placeholder.classList.add('hidden');
        grid.innerHTML = filtered.map(sc => `
            <a href="#products?subcat=${sc.id}" class="bg-gray-900 border border-amber-500/20 rounded-2xl p-4 lg:p-5 flex flex-col items-center text-center hover:border-amber-400/50 transition-all duration-300 active:scale-95 group">
                <div class="w-16 h-16 lg:w-20 lg:h-20 rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center mb-3 border border-amber-500/30 group-hover:border-amber-400/60 transition-all">
                    ${sc.image_url ? `<img src="${sc.image_url}" class="w-10 h-10 lg:w-12 lg:h-12 object-cover rounded-lg" onerror="this.style.display='none'">` : '<i class="fas fa-folder text-amber-500/70 text-2xl lg:text-3xl"></i>'}
                </div>
                <span class="text-sm lg:text-base font-semibold text-gray-300 group-hover:text-amber-300">${sc.name}</span>
            </a>
        `).join('');
    }
};
