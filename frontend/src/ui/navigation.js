const TAB_LABELS = {
    query:        'AI Query',
    architecture: 'Architecture',
    security:     'Security Analysis'
};

export function initNavigation() {
    const tabBtns = document.querySelectorAll('.nav-tab');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.dataset.tab;

            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const currentView = document.querySelector('.view.active');
            const newView     = document.getElementById(`${targetTab}-view`);

            if (currentView === newView) return;

            if (currentView) {
                currentView.style.opacity   = '0';
                currentView.style.transform = 'translateY(-20px) scale(0.95)';
                currentView.style.filter    = 'blur(8px)';
            }

            setTimeout(() => {
                if (currentView) {
                    currentView.classList.remove('active');
                    currentView.style.opacity   = '';
                    currentView.style.transform = '';
                    currentView.style.filter    = '';
                }

                if (newView) {
                    newView.style.opacity   = '0';
                    newView.style.transform = 'translateY(30px) scale(0.96)';
                    newView.style.filter    = 'blur(4px)';
                    newView.classList.add('active');

                    requestAnimationFrame(() => {
                        newView.style.transition = 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
                        newView.style.opacity   = '1';
                        newView.style.transform = 'translateY(0) scale(1)';
                        newView.style.filter    = 'blur(0px)';
                    });
                }

                updateBreadcrumb(targetTab);

                if (targetTab === 'architecture' && typeof mermaid !== 'undefined' && mermaid.run) {
                    const unprocessed = document.querySelectorAll('.mermaid:not([data-processed="true"])');
                    if (unprocessed.length > 0) {
                        setTimeout(() => mermaid.run({ querySelector: '.mermaid:not([data-processed="true"])' }), 300);
                    }
                }
            }, 200);
        });
    });
}

function updateBreadcrumb(tab) {
    const breadcrumb = document.getElementById('breadcrumb-label');
    if (breadcrumb) {
        breadcrumb.textContent = TAB_LABELS[tab] || tab;
    }
}
