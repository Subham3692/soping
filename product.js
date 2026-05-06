import { db, $, navigateTo, get, ref } from './main.js';
import { get as dbGet, ref as dbRef } from 'firebase/database';

export async function loadProductsPage() {
    const { cat, subcat, sort } = getProductsParams();
    const productsSnap = await dbGet(dbRef(db, 'products'));
    let products = [];
    if (productsSnap.exists()) {
        products = Object.entries(productsSnap.val()).map(([id, p]) => ({ id, ...p }));
    }
    if (cat) products = products.filter(p => p.cat_id === cat);
    if (subcat) products = products.filter(p => p.subcat_id === subcat);
    if (sort === 'price_asc') products.sort((a,b) => parseFloat(a.price) - parseFloat(b.price));
    else if (sort === 'price_desc') products.sort((a,b) => parseFloat(b.price) - parseFloat(a.price));
    else products.sort((a,b) => b.id.localeCompare(a.id));

    $('sortSelect').value = sort || 'newest';
    renderProductsGrid(products);
    // Update title
    let title = 'All Products';
    if (cat) {
        const catSnap = await dbGet(dbRef(db, `categories/${cat}`));
        title = catSnap.exists() ? catSnap.val().name : 'Products';
    } else if (subcat) {
        const subSnap = await dbGet(dbRef(db, `subcategories/${subcat}`));
        title = subSnap.exists() ? subSnap.val().name : 'Products';
    }
    $('productsPageTitle').innerHTML = `<span class="w-1.5 h-6 lg:h-7 bg-gradient-to-b from-amber-400 to-yellow-500 rounded-full"></span> ${title}`;
}

function getProductsParams() {
    const params = new URLSearchParams(window.location.hash.split('?')[1] || '');
    return {
        cat: params.get('cat') || '',
        subcat: params.get('subcat') || '',
        sort: params.get('sort') || 'newest'
    };
}

window.applySort = function() {
    const sort = $('sortSelect').value;
    const params = getProductsParams();
    params.sort = sort || 'newest';
    navigateTo('products', params);
};

function renderProductsGrid(products) {
    const grid = $('productsGrid');
    if (products.length === 0) {
        grid.innerHTML = '<p class="text-gray-500 col-span-full text-center py-10">No products found.</p>';
        return;
    }
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
