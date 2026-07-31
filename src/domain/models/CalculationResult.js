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
        itemSummary = [],
        grade = 'F',
        keyMetrics = []
    }) {
        this.boxPrice = Number(boxPrice) || 0;
        this.totalValue = Number(totalValue) || 0;
        this.diff = Number(diff) || 0;
        this.savingsPercent = Number(savingsPercent) || 0;
        this.isProfitable = Boolean(isProfitable);
        this.categoryTotals = { ...categoryTotals };
        this.itemSummary = [...itemSummary];
        this.grade = grade || this.calculateGrade(this.savingsPercent, this.isProfitable);
        this.keyMetrics = keyMetrics || [];
    }

    /**
     * Calcula la letra del rango de oferta según el porcentaje de ahorro.
     */
    calculateGrade(savingsPercent, isProfitable) {
        if (!isProfitable || savingsPercent < 5) return 'F';
        if (savingsPercent >= 40) return 'S';
        if (savingsPercent >= 20) return 'A';
        return 'B';
    }
}
