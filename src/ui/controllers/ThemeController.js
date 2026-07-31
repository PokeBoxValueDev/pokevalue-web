export class ThemeController {
    static init() {
        const themeBtn = document.getElementById('theme-toggle-btn');
        const lightIcon = document.getElementById('theme-toggle-light-icon');
        const darkIcon = document.getElementById('theme-toggle-dark-icon');

        const savedTheme = localStorage.getItem('theme');
        const mediaQuery = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
        const prefersDark = mediaQuery ? mediaQuery.matches : false;
        
        let isDark = savedTheme ? savedTheme === 'dark' : prefersDark;
        
        ThemeController.applyTheme(isDark, lightIcon, darkIcon);

        if (mediaQuery && typeof mediaQuery.addEventListener === 'function') {
            mediaQuery.addEventListener('change', (e) => {
                if (!localStorage.getItem('theme')) {
                    ThemeController.applyTheme(e.matches, lightIcon, darkIcon);
                }
            });
        }

        if (themeBtn) {
            themeBtn.addEventListener('click', () => {
                isDark = !document.documentElement.classList.contains('dark');
                localStorage.setItem('theme', isDark ? 'dark' : 'light');
                ThemeController.applyTheme(isDark, lightIcon, darkIcon);
            });
        }
    }

    static applyTheme(isDark, lightIcon, darkIcon) {
        if (isDark) {
            document.documentElement.classList.add('dark');
            if (lightIcon) lightIcon.classList.remove('hidden');
            if (darkIcon) darkIcon.classList.add('hidden');
        } else {
            document.documentElement.classList.remove('dark');
            if (lightIcon) lightIcon.classList.add('hidden');
            if (darkIcon) darkIcon.classList.remove('hidden');
        }
    }
}
