import { Item } from '../../domain/models/Item.js';
import { Category } from '../../domain/valueObjects/Category.js';

/**
 * Data Mapper de Infraestructura.
 * Transforma DTOs crudos de JSON (remotos o de fallback) en entidades inmutables del Dominio Item.
 * Aísla a la aplicación de variaciones o cambios en el esquema del JSON de origen.
 */
export class ItemMapper {
    /**
     * Convierte una respuesta de datos crudos (JSON) en un array de entidades Item.
     * Soporta múltiples variaciones de esquema DTO (objetos, items, store_items, storeData, etc.).
     * @param {Object|Array} rawData - Objeto JSON o Array devuelto por el servidor/fallback.
     * @returns {Item[]} Array de entidades Item.
     */
    static toDomainList(rawData) {
        if (!rawData) return [];

        let list = [];
        if (Array.isArray(rawData)) {
            list = rawData;
        } else if (typeof rawData === 'object') {
            list = rawData.objetos || rawData.store_items || rawData.items || rawData.storeData || [];
        }

        return list.map((dto, index) => this.toDomain(dto, index));
    }

    /**
     * Sanitiza cadenas SVG eliminando etiquetas de script, manejadores de eventos (on*) y URLs javascript:.
     * @param {string} svgString - Código SVG sin procesar.
     * @returns {string} SVG limpio y seguro.
     */
    static sanitizeSvg(svgString) {
        if (!svgString || typeof svgString !== 'string') return '';
        return svgString
            .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
            .replace(/on\w+\s*=\s*(['"]).*?\1/gi, '')
            .replace(/on\w+\s*=\s*[^ >]+/gi, '')
            .replace(/href\s*=\s*(['"])javascript:.*?\1/gi, '')
            .replace(/src\s*=\s*(['"])javascript:.*?\1/gi, '');
    }

    /**
     * Convierte un objeto DTO crudo a una entidad Item del Dominio.
     * @param {Object} dto - Objeto DTO.
     * @param {number} index - Índice de respaldo.
     * @returns {Item}
     */
    static toDomain(dto, index = 0) {
        if (!dto) {
            return new Item({ id: `item-${index}` });
        }

        const id = dto.id || dto.key || dto.item_id || `item-${index}`;
        const nameEs = dto.name_es || dto.name || dto.item || dto.nombre || 'Objeto';
        const nameEn = dto.name_en || dto.name || dto.item || dto.nombre || nameEs;
        const category = Category.normalizeKey(dto.category || dto.categoria || dto.cat || nameEs);

        const unitPriceEur = dto.unit_price_eur ?? dto.price_eur ?? dto.unit_price ?? dto.precio_eur ?? 0;
        const unitPriceUsd = dto.unit_price_usd ?? dto.price_usd ?? dto.precio_usd ?? null;
        const unitPriceCoins = dto.unit_price_coins ?? dto.price_coins ?? dto.precio_coins ?? null;

        return new Item({
            id,
            nameEs,
            nameEn,
            category,
            unitPriceEur,
            unitPriceUsd,
            unitPriceCoins,
            svg: this.sanitizeSvg(dto.svg)
        });
    }
}
