import { ValuationService } from '../src/domain/services/ValuationService.js';
import { Category } from '../src/domain/valueObjects/Category.js';

export function getCategoryKey(item) {
    if (!item) return 'otros';
    return Category.normalizeKey(item.category || item.nameEs || item.name || item.name_es);
}

export function calculateResult(boxPrice, quantities, storeData, currentCurrency, currentLang = 'es') {
    return ValuationService.calculate(boxPrice, quantities, storeData, currentCurrency, currentLang);
}