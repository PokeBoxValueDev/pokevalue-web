// js/config.js
export const APP_VERSION = "1.5.0";
export const JSON_URL = 'https://raw.githubusercontent.com/alejandrrolc/pokevalue-data/main/items.json';

export const CURRENCY_CONFIG = {
    EUR: { symbol: '€', rate: 1.0 },
    USD: { symbol: '$', rate: 1.08 }
};

export const state = {
    storeData: [],
    currentCurrency: localStorage.getItem('currency') || 'EUR',
    lastCalculationText: ''
};