// js/config.js
export const APP_VERSION = "1.4.1";
export const JSON_URL = 'https://raw.githubusercontent.com/alejandrrolc/pokevalue-data/main/items.json';

export const CATEGORY_CONFIG = {
    pases: {
        title: 'Pases de Incursión',
        bg: 'bg-emerald-100 dark:bg-emerald-950/40',
        text: 'text-emerald-700 dark:text-emerald-300',
        border: 'border-l-4 border-l-emerald-500'
    },
    incubadoras: {
        title: 'Incubadoras',
        bg: 'bg-sky-100 dark:bg-sky-950/40',
        text: 'text-sky-700 dark:text-sky-300',
        border: 'border-l-4 border-l-sky-500'
    },
    consumibles: {
        title: 'Consumibles (Pociones / Revivir)',
        bg: 'bg-amber-100 dark:bg-amber-950/40',
        text: 'text-amber-700 dark:text-amber-300',
        border: 'border-l-4 border-l-amber-500'
    },
    otros: {
        title: 'Otros Objetos',
        bg: 'bg-gray-100 dark:bg-gray-700',
        text: 'text-gray-600 dark:text-gray-300',
        border: 'border-l-4 border-l-gray-400'
    }
};

export const state = {
    storeData: [],
    lastCalculationText: ""
};