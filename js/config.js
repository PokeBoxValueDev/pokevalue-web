export const APP_VERSION = '1.6.0';
export const JSON_URL = 'https://raw.githubusercontent.com/alejandrrolc/pokevalue-data/refs/heads/main/items.json';

export const CURRENCY_CONFIG = {
    EUR: { symbol: '€', rate: 1.0 },
    USD: { symbol: '$', rate: 1.08 }
};

export const CATEGORY_CONFIG = {
    pases: { key: 'catPases', bg: 'bg-indigo-100 dark:bg-indigo-900/50', text: 'text-indigo-700 dark:text-indigo-300', border: 'border-indigo-100 dark:border-indigo-900/30' },
    incubadoras: { key: 'catIncubadoras', bg: 'bg-amber-100 dark:bg-amber-900/50', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-100 dark:border-amber-900/30' },
    consumibles: { key: 'catConsumibles', bg: 'bg-emerald-100 dark:bg-emerald-900/50', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-100 dark:border-emerald-900/30' },
    otros: { key: 'catOtros', bg: 'bg-sky-100 dark:bg-sky-900/50', text: 'text-sky-700 dark:text-sky-300', border: 'border-sky-100 dark:border-sky-900/30' }
};

export const state = {
    storeData: [],
    currentCurrency: localStorage.getItem('currency') || 'EUR',
    currentLang: localStorage.getItem('lang') || (navigator.language.startsWith('es') ? 'es' : 'en'),
    lastCalculationText: ''
};