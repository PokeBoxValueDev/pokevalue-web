/**
 * Configuración de modales de la interfaz.
 */
export function setupModals() {
    const btnLegal = document.getElementById('btn-legal');
    const btnPrivacy = document.getElementById('btn-privacy');
    const legalModal = document.getElementById('legal-modal');
    const privacyModal = document.getElementById('privacy-modal');

    // 1. Abrir Modal Legal
    if (btnLegal && legalModal) {
        btnLegal.addEventListener('click', (e) => {
            e.preventDefault();
            legalModal.classList.remove('hidden');
        });
    }

    // 2. Abrir Modal Privacidad
    if (btnPrivacy && privacyModal) {
        btnPrivacy.addEventListener('click', (e) => {
            e.preventDefault();
            privacyModal.classList.remove('hidden');
        });
    }

    // 3. Cerrar modales al pulsar cualquier botón que esté dentro de la modal
    const closeButtons = document.querySelectorAll('#legal-modal button, #privacy-modal button, .btn-close-modal');
    closeButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            if (legalModal) legalModal.classList.add('hidden');
            if (privacyModal) privacyModal.classList.add('hidden');
        });
    });

    // 4. Cerrar modales al hacer clic en el fondo oscuro
    window.addEventListener('click', (e) => {
        if (e.target === legalModal) legalModal.classList.add('hidden');
        if (e.target === privacyModal) privacyModal.classList.add('hidden');
    });

    // 5. Cerrar modales al pulsar la tecla Escape (Accesibilidad por teclado)
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (legalModal && !legalModal.classList.contains('hidden')) legalModal.classList.add('hidden');
            if (privacyModal && !privacyModal.classList.contains('hidden')) privacyModal.classList.add('hidden');
        }
    });
}
