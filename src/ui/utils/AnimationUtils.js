/**
 * Anima un valor numérico desde un valor inicial hasta el valor final (count-up effect).
 */
export function animateValue(element, start, end, duration = 800, prefix = '', suffix = '', decimals = 2) {
    if (!element) return;

    if (element._animFrameId) {
        cancelAnimationFrame(element._animFrameId);
    }

    const startTime = performance.now();

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Curva de desaceleración suave (easeOutCubic)
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        const current = start + (end - start) * easeProgress;

        const formattedNumber = decimals === 0 ? Math.round(current) : current.toFixed(decimals);
        element.innerText = `${prefix}${formattedNumber}${suffix}`;

        if (progress < 1) {
            element._animFrameId = requestAnimationFrame(update);
        } else {
            element._animFrameId = null;
        }
    }

    element._animFrameId = requestAnimationFrame(update);
}

/**
 * Lanza un efecto visual de confeti de celebración.
 */
export function triggerConfetti() {
    if (typeof window.confetti !== 'function') return;

    const count = 200;
    const defaults = {
        origin: { y: 0.7 }
    };

    function fire(particleRatio, opts) {
        window.confetti({
            ...defaults,
            ...opts,
            particleCount: Math.floor(count * particleRatio)
        });
    }

    fire(0.25, {
        spread: 26,
        startVelocity: 55,
    });
    fire(0.2, {
        spread: 60,
    });
    fire(0.35, {
        spread: 100,
        decay: 0.91,
        scalar: 0.8
    });
    fire(0.1, {
        spread: 120,
        startVelocity: 25,
        decay: 0.92,
        scalar: 1.2
    });
    fire(0.1, {
        spread: 120,
        startVelocity: 45,
    });
}
