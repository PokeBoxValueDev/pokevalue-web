import test from 'node:test';
import assert from 'node:assert/strict';
import { CalculatorController } from '../../../src/ui/controllers/CalculatorController.js';
import { state } from '../../../src/config/config.js';

function createMockLiveDOM() {
    const doc = {
        elements: {},
        getElementById(id) {
            if (!this.elements[id]) {
                const el = {
                    id,
                    value: '',
                    innerText: '',
                    innerHTML: '',
                    className: '',
                    classList: {
                        classes: new Set(),
                        add(...cls) { cls.forEach(c => this.classes.add(c)); },
                        remove(...cls) { cls.forEach(c => this.classes.delete(c)); },
                        contains(cls) { return this.classes.has(cls); }
                    },
                    listeners: {},
                    addEventListener(evt, fn) {
                        this.listeners[evt] = this.listeners[evt] || [];
                        this.listeners[evt].push(fn);
                    },
                    dispatchEvent(evt) {
                        const fns = this.listeners[evt.type] || [];
                        fns.forEach(fn => fn(evt));
                    },
                    focus() {}
                };
                this.elements[id] = el;
            }
            return this.elements[id];
        },
        querySelectorAll(sel) {
            if (sel === '.item-qty') {
                return this._mockInputs || [];
            }
            return [];
        }
    };
    return doc;
}

test('ui/live-bar - updateLiveSummary muestra la barra flotante con grado y valor cuando precio y cantidad > 0', () => {
    const mockDoc = createMockLiveDOM();
    global.document = mockDoc;

    mockDoc.getElementById('box-price').value = '5.00';
    mockDoc.getElementById('live-sticky-bar').classList.add('translate-y-28', 'opacity-0', 'pointer-events-none');

    const mockInput = {
        value: '2',
        getAttribute(attr) { if (attr === 'data-id') return 'item-1'; return null; }
    };
    mockDoc._mockInputs = [mockInput];

    state.storeData = [
        { id: 'item-1', name_es: 'Pase Remoto', price_eur: 1.95 }
    ];
    state.currentCurrency = 'EUR';
    state.currentLang = 'es';

    CalculatorController.updateLiveSummary();

    const stickyBar = mockDoc.getElementById('live-sticky-bar');
    const liveTotalVal = mockDoc.getElementById('live-total-val');
    const liveGradeBadge = mockDoc.getElementById('live-grade-badge');

    assert.equal(stickyBar.classList.contains('translate-y-28'), false, 'La barra flotante debe hacerse visible');
    assert.ok(liveTotalVal.innerText.includes('3.90'), 'El valor total debe calcularse en vivo');
    assert.ok(liveGradeBadge.innerText.length > 0, 'Debe mostrar el badge de calificación');
});

test('ui/live-bar - updateLiveSummary oculta la barra flotante si el precio es 0 o no hay items seleccionados', () => {
    const mockDoc = createMockLiveDOM();
    global.document = mockDoc;

    mockDoc.getElementById('box-price').value = '';
    mockDoc._mockInputs = [];

    CalculatorController.updateLiveSummary();

    const stickyBar = mockDoc.getElementById('live-sticky-bar');
    assert.equal(stickyBar.classList.contains('translate-y-28'), true, 'La barra flotante debe ocultarse');
});
