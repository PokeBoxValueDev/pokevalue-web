import { CURRENCY_CONFIG } from './config.js';

export function getCategoryKey(item) {
    const name = (item.name || '').toLowerCase();
    if (name.includes('pase') || name.includes('raid')) return 'pases';
    if (name.includes('incubadora')) return 'incubadoras';
    if (name.includes('poción') || name.includes('pocion') || name.includes('revivir')) return 'consumibles';
    return 'otros';
}

export function calculateResult(boxPrice, quantities, storeData, currentCurrency) {
    const curr = CURRENCY_CONFIG[currentCurrency] || { rate: 1, symbol: '€' };
    let totalValue = 0;
    const itemSummary = [];
    const categoryTotals = { pases: 0, incubadoras: 0, consumibles: 0, otros: 0 };

    Object.keys(quantities).forEach(itemId => {
        const qty = quantities[itemId];
        const item = storeData.find(i => String(i.id) === String(itemId));

        if (item && qty > 0) {
            const convertedUnitPrice = (item.unit_price_usd && currentCurrency === 'USD')
                ? item.unit_price_usd
                : item.unit_price_eur * curr.rate;

            const itemVal = convertedUnitPrice * qty;
            totalValue += itemVal;

            const cat = getCategoryKey(item);
            categoryTotals[cat] += itemVal;

            itemSummary.push(`${qty}x ${item.name}`);
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
        itemSummary
    };
}