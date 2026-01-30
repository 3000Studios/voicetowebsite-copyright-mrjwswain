import { handlePayPalPurchase } from './commerce.js';

document.addEventListener('DOMContentLoaded', () => {
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.purchase-btn');
        if (btn) {
            e.preventDefault();
            const product = btn.dataset.product;
            const price = parseFloat(btn.dataset.price);
            const url = btn.dataset.url;
            handlePayPalPurchase(product, price, url);
        }
    });
});
