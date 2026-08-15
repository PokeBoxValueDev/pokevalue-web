import test from 'node:test';
import assert from 'node:assert/strict';
import { IOSDeviceDetector } from '../../../src/ui/ios/IOSDeviceDetector.js';

test('ui/ios - IOSDeviceDetector identifica iPhone, iPad y simuladores correctamente', () => {
    // iPhone
    const iphoneWin = { navigator: { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)', platform: 'iPhone', vendor: 'Apple Computer, Inc.', maxTouchPoints: 5 } };
    assert.equal(IOSDeviceDetector.isIOS(iphoneWin), true);

    // iPad
    const ipadWin = { navigator: { userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)', platform: 'iPad', vendor: 'Apple Computer, Inc.', maxTouchPoints: 5 } };
    assert.equal(IOSDeviceDetector.isIOS(ipadWin), true);

    // iPadOS en modo escritorio (Macintosh con maxTouchPoints > 1)
    const ipadosWin = { navigator: { userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', platform: 'MacIntel', vendor: 'Apple Computer, Inc.', maxTouchPoints: 5 } };
    assert.equal(IOSDeviceDetector.isIOS(ipadosWin), true);

    // Escritorio macOS real (maxTouchPoints = 0)
    const macWin = { navigator: { userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', platform: 'MacIntel', vendor: 'Apple Computer, Inc.', maxTouchPoints: 0 } };
    assert.equal(IOSDeviceDetector.isIOS(macWin), false);

    // Android
    const androidWin = { navigator: { userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8)', platform: 'Linux armv8l', vendor: 'Google Inc.', maxTouchPoints: 5 } };
    assert.equal(IOSDeviceDetector.isIOS(androidWin), false);
});

test('ui/ios - applyIOSClassIfNeeded aplica clase .is-ios al documento', () => {
    const classList = new Set();
    const mockDocument = {
        documentElement: {
            classList: {
                add: (c) => classList.add(c),
                remove: (c) => classList.delete(c),
                toggle: (c, force) => force ? classList.add(c) : classList.delete(c)
            }
        }
    };

    const iphoneWin = { navigator: { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)', platform: 'iPhone', vendor: 'Apple Computer, Inc.', maxTouchPoints: 5 } };
    const originalWin = globalThis.window;
    globalThis.window = iphoneWin;

    try {
        IOSDeviceDetector.applyIOSClassIfNeeded(mockDocument);
        assert.ok(classList.has('is-ios'));
    } finally {
        globalThis.window = originalWin;
    }
});
