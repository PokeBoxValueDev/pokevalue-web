const STORAGE_KEY = 'pokevalue_history';

export function getHistory() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        console.error('Error al leer el historial:', e);
        return [];
    }
}

export function saveCalculation(entry) {
    try {
        const history = getHistory();
        history.unshift({
            ...entry,
            timestamp: new Date().toISOString()
        });
        const trimmedHistory = history.slice(0, 10);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmedHistory));
    } catch (e) {
        console.error('Error al guardar en el historial:', e);
    }
}

export function clearHistory() {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
        console.error('Error al borrar el historial:', e);
    }
}