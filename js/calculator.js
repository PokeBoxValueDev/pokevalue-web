// js/calculator.js
import { CATEGORY_CONFIG, CURRENCY_CONFIG, state } from './config.js';

export function getCategoryKey(item) {
    const name = item.name.toLowerCase();
    if (name.includes('pase') || name.includes('raid')) return 'pases';
    if (name.includes('incubadora')) return 'incubadoras';
    if (name.includes('poción') || name.includes('pocion') || name.includes('revivir')) return 'consumibles';
    return 'otros';
}

export function performCalculation(boxPrice) {
    const curr = CURRENCY_CONFIG[state.currentCurrency];
    let totalValue = 0;
    const selectedItems = [];
    const itemQuantitiesMap = {};
    const categoryTotals = { pases: 0, incubadoras: 0, consumibles: 0, otros: 0 };

    document.querySelectorAll('.item-qty').forEach(input => {
        const qty = parseInt(input.value) || 0;
        const itemId = input.getAttribute('data-id');
        const item = state.storeData.find(i => i.id === itemId);

        if (item && qty > 0) {
            const itemVal = (item.unit_price_eur * curr.rate) * qty;
            totalValue += itemVal;

            const cat = getCategoryKey(item);
            categoryTotals[cat] += itemVal;

            selectedItems.push(`${qty}x ${item.name}`);
            itemQuantitiesMap[itemId] = qty;
        }
    });

    const diff = totalValue - boxPrice;
    const isProfitable = diff > 0;

    return {
        boxPrice,
        totalValue,
        diff,
        isProfitable,
        categoryTotals,
        selectedItems,
        itemQuantitiesMap,
        curr
    };
}