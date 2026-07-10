import { fetchRepoSummary } from './api.js';
import { initChat } from './ui/chat.js';
import { initSecurity } from './ui/security.js';
import { initNavigation } from './ui/navigation.js';

document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    const hasLucide  = typeof lucide  !== 'undefined' && lucide.createIcons;
    const hasMermaid = typeof mermaid !== 'undefined' && mermaid.initialize;

    if (hasLucide) {
        lucide.createIcons();
    }

    if (hasMermaid) {
        mermaid.initialize({
            startOnLoad: true,
            theme: 'dark',
            themeVariables: {
                primaryColor:       '#00bba7',
                primaryTextColor:   '#ffffff',
                primaryBorderColor: '#009689',
                lineColor:          '#314158',
                secondaryColor:     '#1e2939',
                tertiaryColor:      '#18181b',
                fontFamily:         'Inter, sans-serif'
            }
        });
    }

    animateOnLoad();
    fetchRepoSummary();
    
    initNavigation();
    initChat();
    initSecurity();

    function animateOnLoad() {
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.style.opacity   = '0';
            mainContent.style.transform = 'translateY(20px) scale(0.98)';

            setTimeout(() => {
                mainContent.style.transition = 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)';
                mainContent.style.opacity   = '1';
                mainContent.style.transform = 'translateY(0) scale(1)';
            }, 200);
        }
    }
});
