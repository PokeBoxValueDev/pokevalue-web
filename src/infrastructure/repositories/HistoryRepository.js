const STORAGE_KEY = 'pokevalue_history';
const MAX_HISTORY_ITEMS = 10;

/**
 * Repositorio de Infraestructura para el historial de cálculos almacenado localmente.
 */
export class HistoryRepository {
    /**
     * Lee la lista de cálculos guardados.
     * @returns {Array} Array de registros de historial.
     */
    static getHistory() {
        try {
            if (typeof localStorage === 'undefined') return [];
            const data = localStorage.getItem(STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Error al leer el historial:', e);
            return [];
        }
    }

    /**
     * Guarda un cálculo en el historial del usuario.
     * @param {Object} entry Registro a guardar.
     */
    static saveCalculation(entry) {
        try {
            if (typeof localStorage === 'undefined') return;
            const history = this.getHistory();
            history.unshift({
                ...entry,
                timestamp: new Date().toISOString()
            });
            const trimmedHistory = history.slice(0, MAX_HISTORY_ITEMS);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmedHistory));
        } catch (e) {
            console.error('Error al guardar en el historial:', e);
        }
    }

    /**
     * Guarda la lista completa de historial.
     * @param {Array} history Array de registros.
     */
    static saveHistory(history) {
        try {
            if (typeof localStorage === 'undefined') return;
            const trimmedHistory = (history || []).slice(0, MAX_HISTORY_ITEMS);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmedHistory));
        } catch (e) {
            console.error('Error al guardar lista de historial:', e);
        }
    }

    /**
     * Elimina un registro individual del historial según su índice.
     * @param {number} index Índice del elemento a eliminar.
     * @returns {boolean} True si se eliminó con éxito.
     */
    static deleteCalculation(index) {
        try {
            if (typeof localStorage === 'undefined') return false;
            const history = this.getHistory();
            const numIndex = Number(index);
            if (numIndex >= 0 && numIndex < history.length) {
                history.splice(numIndex, 1);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
                return true;
            }
            return false;
        } catch (e) {
            console.error('Error al eliminar elemento del historial:', e);
            return false;
        }
    }

    /**
     * Limpia completamente el historial del almacenamiento local.
     */
    static clearHistory() {
        try {
            if (typeof localStorage === 'undefined') return;
            localStorage.removeItem(STORAGE_KEY);
        } catch (e) {
            console.error('Error al borrar el historial:', e);
        }
    }
}
