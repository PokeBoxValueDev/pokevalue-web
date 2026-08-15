import test from 'node:test';
import assert from 'node:assert/strict';
import { generateSocialCardCanvas } from '../../../src/ui/components/SocialCardGenerator.js';

test('ui/card-generator - Genera Blob PNG mediante Canvas y simula dimensiones y degradados', async () => {
    let toBlobCalled = false;
    const mockContext = {
        createLinearGradient: () => ({ addColorStop: () => {} }),
        fillRect: () => {},
        strokeRect: () => {},
        beginPath: () => {},
        roundRect: () => {},
        stroke: () => {},
        fill: () => {},
        moveTo: () => {},
        lineTo: () => {},
        measureText: () => ({ width: 150 }),
        fillText: () => {},
        drawImage: () => {}
    };

    const mockCanvas = {
        width: 0,
        height: 0,
        getContext: () => mockContext,
        toBlob: (cb) => {
            toBlobCalled = true;
            cb(new Blob(['mock-png'], { type: 'image/png' }));
        }
    };

    const originalDoc = globalThis.document;
    const originalImage = globalThis.Image;

    globalThis.document = {
        createElement: (tag) => {
            if (tag === 'canvas') return mockCanvas;
            return {};
        }
    };

    globalThis.Image = class {
        constructor() {
            setTimeout(() => {
                this.naturalHeight = 100;
                this.complete = true;
                if (this.onload) this.onload();
            }, 10);
        }
    };

    try {
        const blob = await generateSocialCardCanvas({
            boxPrice: 5.99,
            totalValue: 12.50,
            diff: 6.51,
            isProfitable: true,
            grade: 'S',
            currencySymbol: '€',
            items: ['5x Pase de incursión']
        });

        assert.ok(blob, 'Debe devolver un objeto Blob');
        assert.equal(blob.type, 'image/png');
        assert.equal(toBlobCalled, true, 'toBlob debe ser invocado');
    } finally {
        globalThis.document = originalDoc;
        globalThis.Image = originalImage;
    }
});
