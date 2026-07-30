import { JSON_URL, FALLBACK_JSON_URL } from '../../config/config.js';
import { ItemMapper } from '../mappers/ItemMapper.js';

/**
 * Repositorio de Infraestructura para la obtención de objetos de la tienda.
 * Implementa estrategia de tolerancia a fallos: Red (GitHub RAW) -> Service Worker Cache -> Fallback local.
 */
export class ItemsRepository {
    constructor(jsonUrl = JSON_URL, fallbackUrl = FALLBACK_JSON_URL) {
        this.jsonUrl = jsonUrl;
        this.fallbackUrl = fallbackUrl;
    }

    /**
     * Obtiene los objetos de la tienda mapeados a entidades de dominio.
     * @returns {Promise<{ items: Item[], lastUpdated: string }>}
     */
    async getItems() {
        let rawData = null;

        try {
            const response = await fetch(this.jsonUrl);
            if (!response.ok) throw new Error(`HTTP Error ${response.status}`);
            rawData = await response.json();
        } catch (netErr) {
            console.warn('Fallo al obtener items.json de la red, usando fallback local:', netErr);
            try {
                const fallbackRes = await fetch(this.fallbackUrl);
                if (!fallbackRes.ok) throw new Error(`HTTP Fallback Error ${fallbackRes.status}`);
                rawData = await fallbackRes.json();
            } catch (fallbackErr) {
                console.error('Error al cargar datos del respaldo local:', fallbackErr);
            }
        }

        const items = ItemMapper.toDomainList(rawData);
        const lastUpdated = rawData?.last_updated || rawData?.updated_at || '';

        return { items, lastUpdated };
    }
}
