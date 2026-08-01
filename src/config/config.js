export const APP_VERSION = '1.18.5';
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
        label: 'Pases',
        bg: 'bg-indigo-100 dark:bg-indigo-900/50',
        text: 'text-indigo-700 dark:text-indigo-300',
        border: 'border-indigo-100 dark:border-indigo-900/30'
    },
    incubadoras: {
        color: 'bg-amber-500',
        label: 'Incubadoras',
        bg: 'bg-amber-100 dark:bg-amber-900/50',
        text: 'text-amber-700 dark:text-amber-300',
        border: 'border-amber-100 dark:border-amber-900/30'
    },
    potenciadores: {
        color: 'bg-purple-500',
        label: 'Potenciadores',
        bg: 'bg-purple-100 dark:bg-purple-900/50',
        text: 'text-purple-700 dark:text-purple-300',
        border: 'border-purple-100 dark:border-purple-900/30'
    },
    mejoras: {
        color: 'bg-emerald-500',
        label: 'Mejoras',
        bg: 'bg-emerald-100 dark:bg-emerald-900/50',
        text: 'text-emerald-700 dark:text-emerald-300',
        border: 'border-emerald-100 dark:border-emerald-900/30'
    },
    combates: {
        color: 'bg-rose-500',
        label: 'Combates',
        bg: 'bg-rose-100 dark:bg-rose-900/50',
        text: 'text-rose-700 dark:text-rose-300',
        border: 'border-rose-100 dark:border-rose-900/30'
    },
    consumibles: {
        color: 'bg-cyan-500',
        label: 'Consumibles',
        bg: 'bg-cyan-100 dark:bg-cyan-900/50',
        text: 'text-cyan-700 dark:text-cyan-300',
        border: 'border-cyan-100 dark:border-cyan-900/30'
    },
    otros: {
        color: 'bg-sky-500',
        label: 'Otros',
        bg: 'bg-sky-100 dark:bg-sky-900/50',
        text: 'text-sky-700 dark:text-sky-300',
        border: 'border-sky-100 dark:border-sky-900/30'
    }
};

export const state = {
    storeData: [], // Armazena objetos de dominio Item[]
    currentCurrency: (typeof localStorage !== 'undefined' && localStorage.getItem('currency')) || 'EUR',
    currentLang: (typeof localStorage !== 'undefined' && localStorage.getItem('lang')) || ((typeof navigator !== 'undefined' && navigator.language?.startsWith('es')) ? 'es' : 'en'),
    lastCalculationText: ''
};
