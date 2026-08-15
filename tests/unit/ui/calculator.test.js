import test from 'node:test';
import assert from 'node:assert/strict';
import { CalculatorController } from '../../../src/ui/controllers/CalculatorController.js';

function createMockInput(value = '') {
    const classList = new Set();
    return {
        value,
        classList: {
            add: (c) => classList.add(c),
            remove: (c) => classList.delete(c),
            contains: (c) => classList.has(c)
        },
        focus: () => {},
        dispatchEvent: () => {}
    };
}

test('ui/calculator - handleCalculate valida campo de precio vacío y muestra error visual', () => {
    const priceInput = createMockInput('');
    const priceError = createMockInput('');
    priceError.classList.add('hidden');

    CalculatorController.handleCalculate(priceInput, priceError);

    assert.ok(priceInput.classList.contains('border-rose-500'), 'Debe marcar el borde en rojo ante error');
    assert.equal(priceError.classList.contains('hidden'), false, 'Debe mostrar el mensaje de error');
});

test('ui/calculator - resetForm restablece precio y cantidades a 0', () => {
    const priceInput = createMockInput('10.50');
    const priceError = createMockInput('');
    const itemQty1 = createMockInput('3');
    const itemQty2 = createMockInput('5');

    const originalDoc = globalThis.document;
    globalThis.document = {
        getElementById: (id) => {
            if (id === 'box-price') return priceInput;
            if (id === 'price-error') return priceError;
            return null;
        },
        querySelectorAll: (sel) => {
            if (sel === '.item-qty') return [itemQty1, itemQty2];
            return [];
        }
    };

    try {
        CalculatorController.resetForm();
        assert.equal(priceInput.value, '');
        assert.equal(itemQty1.value, 0);
        assert.equal(itemQty2.value, 0);
    } finally {
        globalThis.document = originalDoc;
    }
});
