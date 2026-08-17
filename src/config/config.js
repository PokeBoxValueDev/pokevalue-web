export const APP_VERSION = '1.34.8';
export const JSON_URL = 'https://raw.githubusercontent.com/PokeBoxValueDev/pokevalue-data/refs/heads/main/items.json';
export const FALLBACK_JSON_URL = 'src/assets/items-fallback.json';

export const CURRENCY_CONFIG = {
    EUR: { rate: 1, symbol: '€', label: 'Euros' },
    USD: { rate: 1.08, symbol: '$', label: 'Dólares' },
    POKECOINS: { rate: 1 / 0.009083, symbol: '🟡', label: 'Pokémonedas' }
};

export const CATEGORY_CONFIG = {
    pases: {
        color: 'bg-indigo-500',
        label: 'Pases de Incursión',
        bg: 'bg-indigo-50/90 dark:bg-indigo-950/60',
        text: 'text-indigo-700 dark:text-indigo-300',
        border: 'border-indigo-200/80 dark:border-indigo-800/60',
        containerBg: 'bg-indigo-50/30 dark:bg-indigo-950/20',
        containerBorder: 'border-indigo-200 dark:border-indigo-800/50'
    },
    incubadoras: {
        color: 'bg-amber-500',
        label: 'Incubadoras',
        bg: 'bg-amber-50/90 dark:bg-amber-950/60',
        text: 'text-amber-700 dark:text-amber-300',
        border: 'border-amber-200/80 dark:border-amber-800/60',
        containerBg: 'bg-amber-50/30 dark:bg-amber-950/20',
        containerBorder: 'border-amber-200 dark:border-amber-800/50'
    },
    potenciadores: {
        color: 'bg-purple-500',
        label: 'Potenciadores',
        bg: 'bg-purple-50/90 dark:bg-purple-950/60',
        text: 'text-purple-700 dark:text-purple-300',
        border: 'border-purple-200/80 dark:border-purple-800/60',
        containerBg: 'bg-purple-50/30 dark:bg-purple-950/20',
        containerBorder: 'border-purple-200 dark:border-purple-800/50'
    },
    mejoras: {
        color: 'bg-emerald-500',
        label: 'Mejoras',
        bg: 'bg-emerald-50/90 dark:bg-emerald-950/60',
        text: 'text-emerald-700 dark:text-emerald-300',
        border: 'border-emerald-200/80 dark:border-emerald-800/60',
        containerBg: 'bg-emerald-50/30 dark:bg-emerald-950/20',
        containerBorder: 'border-emerald-200 dark:border-emerald-800/50'
    },
    combates: {
        color: 'bg-rose-500',
        label: 'Combates',
        bg: 'bg-rose-50/90 dark:bg-rose-950/60',
        text: 'text-rose-700 dark:text-rose-300',
        border: 'border-rose-200/80 dark:border-rose-800/60',
        containerBg: 'bg-rose-50/30 dark:bg-rose-950/20',
        containerBorder: 'border-rose-200 dark:border-rose-800/50'
    },
    consumibles: {
        color: 'bg-cyan-500',
        label: 'Consumibles',
        bg: 'bg-cyan-50/90 dark:bg-cyan-950/60',
        text: 'text-cyan-700 dark:text-cyan-300',
        border: 'border-cyan-200/80 dark:border-cyan-800/60',
        containerBg: 'bg-cyan-50/30 dark:bg-cyan-950/20',
        containerBorder: 'border-cyan-200 dark:border-cyan-800/50'
    },
    otros: {
        color: 'bg-sky-500',
        label: 'Otros',
        bg: 'bg-sky-50/90 dark:bg-sky-950/60',
        text: 'text-sky-700 dark:text-sky-300',
        border: 'border-sky-200/80 dark:border-sky-800/60',
        containerBg: 'bg-sky-50/30 dark:bg-sky-950/20',
        containerBorder: 'border-sky-200 dark:border-sky-800/50'
    }
};

export const state = {
    storeData: [], // Armazena objetos de dominio Item[]
    currentCurrency: (typeof localStorage !== 'undefined' && localStorage.getItem('currency')) || 'EUR',
    currentLang: (typeof localStorage !== 'undefined' && localStorage.getItem('lang')) || ((typeof navigator !== 'undefined' && navigator.language?.startsWith('es')) ? 'es' : 'en'),
    lastCalculationText: '',
    lastResult: null,
    lastBoxPrice: null,

    // Métodos de mutación y acceso encapsulados
    setStoreData(items) {
        this.storeData = Array.isArray(items) ? items : [];
    },
    getStoreData() {
        return this.storeData;
    },
    setCurrency(currency) {
        if (CURRENCY_CONFIG[currency]) {
            this.currentCurrency = currency;
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem('currency', currency);
            }
        }
    },
    getCurrency() {
        return this.currentCurrency;
    },
    setLanguage(lang) {
        if (lang === 'es' || lang === 'en') {
            this.currentLang = lang;
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem('lang', lang);
            }
        }
    },
    getLanguage() {
        return this.currentLang;
    },
    setCalculationResult(result, boxPrice) {
        this.lastResult = result;
        this.lastBoxPrice = boxPrice;
    },
    clearCalculationResult() {
        this.lastResult = null;
        this.lastBoxPrice = null;
    },
    getLastResult() {
        return this.lastResult;
    },
    getLastBoxPrice() {
        return this.lastBoxPrice;
    }
};
