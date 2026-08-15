import test from 'node:test';
import assert from 'node:assert/strict';
import { generateSocialCardCanvas } from '../../../src/ui/components/SocialCardGenerator.js';

test('ui/card-generator - Genera Blob PNG en formato 16:9 (Post) y 9:16 (Story)', async () => {
    let lastCanvasWidth = 0;
    let lastCanvasHeight = 0;
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
        get width() { return lastCanvasWidth; },
        set width(w) { lastCanvasWidth = w; },
        get height() { return lastCanvasHeight; },
        set height(h) { lastCanvasHeight = h; },
        getContext: () => mockContext,
        toBlob: (cb) => {
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
        // Test 1: Formato Post (16:9)
        const postBlob = await generateSocialCardCanvas({
            boxPrice: 5.99,
            totalValue: 12.50,
            diff: 6.51,
            isProfitable: true,
            grade: 'S',
            currencySymbol: '€',
            items: ['5x Pase de incursión'],
            format: 'post'
        });

        assert.ok(postBlob, 'Debe devolver Blob para post');
        assert.equal(postBlob.type, 'image/png');
        assert.equal(lastCanvasWidth, 600, 'Canvas post debe tener ancho 600');
        assert.equal(lastCanvasHeight, 440, 'Canvas post debe tener alto 440');

        // Test 2: Formato Story (9:16)
        const storyBlob = await generateSocialCardCanvas({
            boxPrice: 500,
            totalValue: 1250,
            diff: 750,
            isProfitable: true,
            grade: 'S',
            currencySymbol: '🟡',
            items: ['10x Pase de incursión remota', '5x Super Incubadora', '2x Huevo Suerte'],
            format: 'story'
        });

        assert.ok(storyBlob, 'Debe devolver Blob para story');
        assert.equal(storyBlob.type, 'image/png');
        assert.equal(lastCanvasWidth, 720, 'Canvas story debe tener ancho 720');
        assert.equal(lastCanvasHeight, 1280, 'Canvas story debe tener alto 1280');
    } finally {
        globalThis.document = originalDoc;
        globalThis.Image = originalImage;
    }
});
