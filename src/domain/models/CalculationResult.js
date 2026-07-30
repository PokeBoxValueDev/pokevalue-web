/**
 * Value Object que representa el resultado inmutable de la valoración de una caja.
 */
export class CalculationResult {
    constructor({
        boxPrice,
        totalValue,
        diff,
        savingsPercent,
        isProfitable,
        categoryTotals = {},
        itemSummary = []
    }) {
        this.boxPrice = Number(boxPrice) || 0;
        this.totalValue = Number(totalValue) || 0;
        this.diff = Number(diff) || 0;
        this.savingsPercent = Number(savingsPercent) || 0;
        this.isProfitable = Boolean(isProfitable);
        this.categoryTotals = { ...categoryTotals };
        this.itemSummary = [...itemSummary];
    }
}
