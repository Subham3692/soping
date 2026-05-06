import { db, $ } from './main.js';
import { get, ref } from 'firebase/database';

export async function performSearch() {
    const params = new URLSearchParams(window.location.hash.split('?')[1] || '');
    const query = params.get('q')?.trim() || '';
    if (!query) {
        $('searchTitle').innerHTML = `<span class="w-1.5 h-6 lg:h-7 bg-gradient-to-b from-amber-400 to-yellow-500 rounded-full"></span> Search`;
        document.querySelectorAll('#searchCategoriesSection, #searchSubcategoriesSection, #searchProductsSection, #noSearchResults').forEach(el => el.classList.add('hidden'));
        return;
    }
    $('searchTitle').innerHTML = `<span class="w-1.5 h-6 lg:h-7 bg-gradient-to-b from-amber-400 to-yellow-500 rounded-full"></span> Results for "<span class="text-white">${query}</span>"`;
    $('noResultsQuery').textContent = query;
    const lowerQuery = query.toLowerCase();
    const [catSnap, subSnap, prodSnap] = await Promise.all([
        get(ref(db, 'categories')), get(ref(db, 'subcategories')), get(ref(db, 'products'))
    ]);
    const categories = catSnap.exists() ? Object.entries(catSnap.val()).map(([id, c]) => ({ id, ...c })) : [];
    const subcategories = subSnap.exists() ? Object.entries(subSnap.val()).map(([id, s]) => ({ id, ...s })) : [];
    const products = prodSnap.exists() ? Object.entries(prodSnap.val()).map(([id, p]) => ({ id, ...p })) : [];

    const matchedCategories = categories.filter(c => c.name.toLowerCase().includes(lowerQuery));
    const matchedSubcategories = subcategories.filter(s => s.name.toLowerCase().includes(lowerQuery));
    const matchedProducts = products.filter(p => p.name.toLowerCase().includes(lowerQuery) || (p.description && p.description.toLowerCase().includes(lowerQuery)));

    renderSearchList('searchCategoriesSection', 'searchCategoriesList', matchedCategories, 'cat');
    renderSearchList('searchSubcategoriesSection', 'searchSubcategoriesList', matchedSubcategories, 'subcat');
    renderSearchProductList(matchedProducts);

    const anyResult = matchedCategories.length > 0 || matchedSubcategories.length > 0 || matchedProducts.length > 0;
    $('noSearchResults').classList.toggle('hidden', anyResult);
}

function renderSearchList(sectionId, listId, items, paramName) {
    const section = $(sectionId);
    const list = $(listId);
    if (items.length === 0) { section.classList.add('hidden'); return; }
    section.classList.remove('hidden');
    list.innerHTML = items.map(item => `
        <a href="#products?${paramName}=${item.id}" class="flex-shrink-0 flex flex-col items-center px-4 py-3 lg:px-6 lg:py-4 rounded-2xl bg-gray-900 border border-amber-500/20 hover:border-amber-400/50 transition-all duration-300 active:scale-95">
            <div class="w-14 h-14 lg:w-20 lg:h-20 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center mb-2 border border-amber-500/30">
                <img src="${item.image_url || 'https://via.placeholder.com/80'}" class="w-10 h-10 lg:w-14 lg:h-14 object-cover rounded-full" onerror="this.style.display='none'">
            </div>
            <span class="text-xs lg:text-sm font-semibold text-gray-300 text-center">${item.name}</span>
        </a>
    `).join('');
}

function renderSearchProductList(products) {
    const section = $('searchProductsSection');
    const list = $('searchProductsList');
    if (products.length === 0) { section.classList.add('hidden'); return; }
    section.classList.remove('hidden');
    list.innerHTML = products.map(p => `
        <a href="#product_detail?id=${p.id}" class="bg-gray-900 border border-amber-500/20 rounded-3xl p-3 lg:p-4 flex flex-col group card-hover">
            <img src="${p.image_url || 'https://via.placeholder.com/300'}" class="w-full h-36 lg:h-48 rounded-2xl object-cover bg-gray-800 group-hover:scale-105 transition-transform duration-700">
            <h3 class="text-sm lg:text-base font-bold text-gray-200 truncate mt-3">${p.name}</h3>
            <div class="flex items-baseline gap-1 mt-1">
                <span class="text-amber-400 font-extrabold text-lg lg:text-xl">₹${parseFloat(p.price).toFixed(2)}</span>
            </div>
            ${p.mrp ? `<span class="text-gray-500 text-xs line-through">₹${parseFloat(p.mrp).toFixed(2)}</span>` : ''}
        </a>
    `).join('');
}
