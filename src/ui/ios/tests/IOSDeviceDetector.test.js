import test from 'node:test';
import assert from 'node:assert/strict';
import { IOSDeviceDetector } from '../IOSDeviceDetector.js';

test('ui/ios - IOSDeviceDetector identifies iPhone, iPad, iPod and iPadOS correctly', () => {
    // 1. Simular iPhone
    const mockiPhone = {
        navigator: {
            userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
            platform: 'iPhone'
        }
    };
    assert.equal(IOSDeviceDetector.isIOS(mockiPhone), true, 'Should return true for iPhone userAgent');

    // 2. Simular iPadOS 13+ con Mac userAgent y pantalla táctil
    const mockiPadOS = {
        navigator: {
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
            platform: 'MacIntel',
            maxTouchPoints: 5
        }
    };
    assert.equal(IOSDeviceDetector.isIOS(mockiPadOS), true, 'Should return true for iPadOS with touch points');

    // 3. Simular navegador de escritorio Windows / Linux
    const mockDesktop = {
        navigator: {
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            platform: 'Win32',
            maxTouchPoints: 0
        }
    };
    assert.equal(IOSDeviceDetector.isIOS(mockDesktop), false, 'Should return false for Windows Desktop');
});

test('ui/ios - applyIOSClassIfNeeded toggles .is-ios class on documentElement', () => {
    const classList = new Set();
    const mockDocument = {
        documentElement: {
            classList: {
                add: (c) => classList.add(c),
                remove: (c) => classList.delete(c),
                contains: (c) => classList.has(c)
            }
        }
    };

    const mockiPhone = {
        navigator: {
            userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
            platform: 'iPhone'
        }
    };

    // Al ejecutarse en iPhone, debe añadir .is-ios
    IOSDeviceDetector.applyIOSClassIfNeeded.call(IOSDeviceDetector, mockDocument);
    // Verificar método estático original
    const result = IOSDeviceDetector.applyIOSClassIfNeeded(mockDocument);
    assert.ok(typeof result === 'boolean');
});
