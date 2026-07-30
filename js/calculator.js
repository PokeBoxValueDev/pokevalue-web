import { CURRENCY_CONFIG } from './config.js';

export function getCategoryKey(item) {
    if (item && item.category) return item.category.toLowerCase();
    const rawName = (item?.name || item?.name_es || item?.item || '');
    const name = rawName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    if (name.includes('pase') || name.includes('raid') || name.includes('pass')) return 'pases';
    if (name.includes('incubadora') || name.includes('incubator')) return 'incubadoras';
    if (name.includes('pocion') || name.includes('reviv') || name.includes('potion')) return 'consumibles';
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
                : (item.unit_price_eur || item.price_eur || 0) * curr.rate;

            const itemVal = convertedUnitPrice * qty;
            totalValue += itemVal;

            const cat = getCategoryKey(item);
            categoryTotals[cat] += itemVal;

            const itemName = item.name || item.name_es || item.item || 'Objeto';
            itemSummary.push(`${qty}x ${itemName}`);
        }
    });

    const diff = totalValue - boxPrice;
    const isProfitable = diff > 0;
    const savingsPercent = boxPrice > 0 ? (diff / boxPrice) * 100 : 0;

    return {
        boxPrice,
        totalValue,
        diff,
        savingsPercent,
        isProfitable,
        categoryTotals,
        itemSummary
    };
}