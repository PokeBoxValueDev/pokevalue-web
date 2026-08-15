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
     * Acceso estático rápido para obtener items mapeados a entidades de dominio.
     * @returns {Promise<{ items: Item[], lastUpdated: string }>}
     */
    static async getItems(jsonUrl = JSON_URL, fallbackUrl = FALLBACK_JSON_URL) {
        const repo = new ItemsRepository(jsonUrl, fallbackUrl);
        return repo.getItems();
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
            console.warn('Fallo al obtener items.json de la red, usando fallback local:', netErr?.message || netErr);
            try {
                if (typeof window === 'undefined') {
                    // Entorno Node.js (Pruebas unitarias): Cargar fallback mediante fs
                    const fs = await import('node:fs');
                    const path = await import('node:path');
                    const filePath = path.resolve(this.fallbackUrl);
                    const fileContent = fs.readFileSync(filePath, 'utf8');
                    rawData = JSON.parse(fileContent);
                } else {
                    // Entorno Navegador / ServiceWorker: Asegurar ruta absoluta desde la raíz del origen
                    const cleanPath = this.fallbackUrl.replace(/^\.?\//, '');
                    const resolvedFallbackUrl = `${window.location.origin}/${cleanPath}`;
                    const fallbackRes = await fetch(resolvedFallbackUrl);
                    if (!fallbackRes.ok) throw new Error(`HTTP Fallback Error ${fallbackRes.status}`);
                    rawData = await fallbackRes.json();
                }
            } catch (fallbackErr) {
                console.error('Error al cargar datos del respaldo local:', fallbackErr?.message || fallbackErr);
            }
        }

        const items = ItemMapper.toDomainList(rawData);
        const lastUpdated = rawData?.last_updated || rawData?.updated_at || '';

        return { items, lastUpdated };
    }
}
