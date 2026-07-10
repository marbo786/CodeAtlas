/* ============================================================================
   CodeAtlas — Frontend Application
   Premium interactive UI for AI-powered codebase exploration.
   ============================================================================ */

import { animate, stagger } from 'motion';

document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    // ── Library Guards ────────────────────────────────────────────────────
    const hasLucide  = typeof lucide  !== 'undefined' && lucide.createIcons;
    const hasMermaid = typeof mermaid !== 'undefined' && mermaid.initialize;

    // ── 1. Initialization ─────────────────────────────────────────────────
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

    // Kick off entrance animations
    animateOnLoad();
    fetchRepoSummary();

    async function fetchRepoSummary() {
        const repoStatusSuccess = document.querySelector('.repo-status-success');
        if (repoStatusSuccess) {
            repoStatusSuccess.textContent = 'Scanning repository...';
            repoStatusSuccess.style.color = 'var(--muted)';
        }

        try {
            const response = await fetch('http://localhost:8000/summary', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ repo_path: '/projects/codeatlas' }) // Local Docker mount
            });

            if (!response.ok) throw new Error('Failed to fetch summary');
            const data = await response.json();

            const eLanguage = document.getElementById('summary-language');
            const eRuntime = document.getElementById('summary-runtime');
            const eFramework = document.getElementById('summary-framework');
            const eModules = document.getElementById('summary-modules');
            const eComponents = document.getElementById('summary-components');

            if (eLanguage) eLanguage.textContent = data.language || 'Unknown';
            if (eRuntime) eRuntime.textContent = data.runtime || 'Unknown';
            if (eFramework) eFramework.textContent = data.framework || 'None';
            if (eModules) eModules.textContent = data.total_modules || '0';
            if (eComponents) eComponents.textContent = (data.total_functions + data.total_classes) || '0';

            if (repoStatusSuccess) {
                repoStatusSuccess.textContent = 'Repository indexed successfully.';
                repoStatusSuccess.style.color = 'var(--success)';
            }
        } catch (error) {
            console.error('Error fetching repo summary:', error);
            if (repoStatusSuccess) {
                repoStatusSuccess.textContent = 'Failed to index repository. Backend unreachable.';
                repoStatusSuccess.style.color = 'var(--error)';
            }
        }
    }

    // ── 2. Load Animations ────────────────────────────────────────────────

    /**
     * Fade-in main content on first load.
     */
    function animateOnLoad() {

        // Main content: subtle fade-up with scale
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.style.opacity   = '0';
            mainContent.style.transform = 'translateY(20px) scale(0.98)';

            setTimeout(() => {
                mainContent.style.transition =
                    'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)';
                mainContent.style.opacity   = '1';
                mainContent.style.transform = 'translateY(0) scale(1)';
            }, 200);
        }

    }


    // ── 3. Tab Navigation with Animated Transitions ───────────────────────

    const tabBtns = document.querySelectorAll('.nav-tab');
    const views   = document.querySelectorAll('.view');

    /** Map of tab keys → human-readable breadcrumb labels. */
    const TAB_LABELS = {
        query:        'AI Query',
        architecture: 'Architecture',
        security:     'Security Analysis'
    };

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.dataset.tab;

            // Highlight active sidebar button
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const currentView = document.querySelector('.view.active');
            const newView     = document.getElementById(`${targetTab}-view`);

            // Bail early if already on this tab
            if (currentView === newView) return;

            // ── Enhanced cross-fade transition with direction awareness ──
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
                        newView.style.transition =
                            'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
                        newView.style.opacity   = '1';
                        newView.style.transform = 'translateY(0) scale(1)';
                        newView.style.filter    = 'blur(0px)';
                    });
                }

                // Update top-bar breadcrumb
                updateBreadcrumb(targetTab);

                // Re-render Mermaid diagrams when switching to the architecture tab
                if (targetTab === 'architecture' && hasMermaid) {
                    // Only run on unprocessed mermaid elements to prevent SVG parsing errors
                    const unprocessed = document.querySelectorAll('.mermaid:not([data-processed="true"])');
                    if (unprocessed.length > 0) {
                        setTimeout(() => mermaid.run({ querySelector: '.mermaid:not([data-processed="true"])' }), 300);
                    }
                }
            }, 200);
        });
    });

    /**
     * Set the breadcrumb label in the top bar.
     * @param {string} tab — The active tab key.
     */
    function updateBreadcrumb(tab) {
        const breadcrumb = document.getElementById('breadcrumb-label');
        if (breadcrumb) {
            breadcrumb.textContent = TAB_LABELS[tab] || tab;
        }
    }


    // ── 4. Chat Functionality with Animations ─────────────────────────────

    const chatInput   = document.getElementById('chat-input');
    const chatHistory = document.getElementById('chat-history');
    const chatForm    = document.getElementById('chat-form');

    /**
     * Append a chat bubble and animate it into view.
     * @param {string} text   — Message body.
     * @param {string} sender — 'user' | 'system'.
     */
    function appendMessage(text, sender) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `chat-message ${sender === 'user' ? 'chat-message--user' : ''}`;

        // Pre-animation state
        msgDiv.style.opacity   = '0';
        msgDiv.style.transform = 'translateY(24px) scale(0.95)';
        msgDiv.style.filter    = 'blur(4px)';

        // Avatar
        const avatar = document.createElement('div');
        avatar.className = sender === 'user' ? 'chat-avatar' : 'chat-avatar chat-avatar--ai';
        avatar.innerHTML = sender === 'user'
            ? '<i data-lucide="user"></i>'
            : '<i data-lucide="bot"></i>';

        // Bubble
        const bubble = document.createElement('div');
        bubble.className = 'chat-bubble';
        
        // Add border trail to AI bubbles
        if (sender !== 'user') {
            bubble.style.position = 'relative';
            const trail = document.createElement('div');
            trail.className = 'border-trail';
            trail.style.inset = '-1px'; // Overlap the bubble's static border
            bubble.appendChild(trail);
        }

        const textSpan = document.createElement('span');
        textSpan.style.position = 'relative';
        textSpan.style.zIndex = '1';
        textSpan.textContent = text;
        bubble.appendChild(textSpan);

        msgDiv.appendChild(avatar);
        msgDiv.appendChild(bubble);
        chatHistory.appendChild(msgDiv);

        // Refresh Lucide icons for the newly added elements
        if (hasLucide) lucide.createIcons();

        // Trigger entrance animation on next frame
        requestAnimationFrame(() => {
            msgDiv.style.transition =
                'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
            msgDiv.style.opacity   = '1';
            msgDiv.style.transform = 'translateY(0) scale(1)';
            msgDiv.style.filter    = 'blur(0px)';
        });

        // Smooth-scroll to latest message
        setTimeout(() => {
            chatHistory.scrollTo({
                top:      chatHistory.scrollHeight,
                behavior: 'smooth'
            });
        }, 100);
    }

    /**
     * Show an animated three-dot "typing…" indicator.
     */
    function showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'chat-message';
        typingDiv.id        = 'typing-indicator';

        typingDiv.style.opacity   = '0';
        typingDiv.style.transform = 'translateY(20px) scale(0.9)';

        typingDiv.innerHTML = `
            <div class="chat-avatar chat-avatar--ai"><i data-lucide="bot"></i></div>
            <div class="chat-bubble typing" style="position: relative;">
                <div class="border-trail" style="inset: -1px;"></div>
                <div style="position: relative; z-index: 1; display: flex; align-items: center; gap: 5px;">
                    <span class="dot"></span>
                    <span class="dot"></span>
                    <span class="dot"></span>
                </div>
            </div>
        `;

        chatHistory.appendChild(typingDiv);
        if (hasLucide) lucide.createIcons();

        requestAnimationFrame(() => {
            typingDiv.style.transition =
                'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
            typingDiv.style.opacity   = '1';
            typingDiv.style.transform = 'translateY(0) scale(1)';
        });

        setTimeout(() => {
            chatHistory.scrollTo({
                top:      chatHistory.scrollHeight,
                behavior: 'smooth'
            });
        }, 100);
    }

    /**
     * Gracefully remove the typing indicator with a fade-up exit.
     */
    function removeTypingIndicator() {
        const indicator = document.getElementById('typing-indicator');
        if (!indicator) return;

        indicator.style.opacity   = '0';
        indicator.style.transform = 'translateY(-12px) scale(0.9)';
        indicator.style.filter    = 'blur(4px)';
        setTimeout(() => indicator.remove(), 400);
    }

    /**
     * Handle form submission: show user message, call the backend, display response.
     * @param {Event} e — Submit event.
     */
    async function sendMessage(e) {
        e.preventDefault();

        const text = chatInput.value.trim();
        if (!text) return;

        appendMessage(text, 'user');
        chatInput.value = '';

        showTypingIndicator();

        try {
            // ── n8n Webhook Integration ──────────────────────────────
            // TODO: Replace the simulated response below with an actual
            //       fetch call to your n8n chatbot webhook, e.g.:
            //
            // const response = await fetch('http://localhost:5678/webhook/chat', {
            //     method:  'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body:    JSON.stringify({ message: text })
            // });
            // const data = await response.json();
            // removeTypingIndicator();
            // appendMessage(data.output, 'system');

            // Simulated response for demo / offline development
            setTimeout(() => {
                removeTypingIndicator();
                appendMessage(
                    'I have received your query. Connect the n8n Chatbot ' +
                    'webhook URL in app.js to get live RAG responses from ' +
                    'the Express.js codebase!',
                    'system'
                );
            }, 1800);
        } catch (error) {
            removeTypingIndicator();
            appendMessage(
                'Connection error. Make sure n8n is running and the ' +
                'webhook URL is configured.',
                'system'
            );
        }
    }

    if (chatForm) {
        chatForm.addEventListener('submit', sendMessage);
    }


    // ── 5. Security Scan with Table Animation ─────────────────────────────

    const runScanBtn = document.getElementById('run-scan-btn');

    if (runScanBtn) {
        runScanBtn.addEventListener('click', () => {
            const btn   = runScanBtn;
            const tbody = document.getElementById('security-tbody');
            if (!tbody) return;

            // Disable & show loading spinner
            btn.disabled  = true;
            btn.setAttribute('aria-busy', 'true');
            btn.innerHTML =
                '<i data-lucide="loader-2" class="spin"></i> Scanning\u2026';
            if (hasLucide) lucide.createIcons();

            // Placeholder shimmer row
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="empty-state">
                        <div class="shimmer-bar"></div>
                    </td>
                </tr>
            `;

            // Simulate scan results after a realistic delay
            setTimeout(() => {
                const findings = [
                    {
                        severity: 'high',
                        rule:     'express-open-redirect',
                        file:     'lib/response.js:42',
                        message:  'Potential open redirect via user-controlled ' +
                                  'input in res.redirect()'
                    },
                    {
                        severity: 'medium',
                        rule:     'regex-dos',
                        file:     'lib/utils.js:78',
                        message:  'Regular expression susceptible to catastrophic ' +
                                  'backtracking (ReDoS)'
                    },
                    {
                        severity: 'low',
                        rule:     'info-disclosure',
                        file:     'lib/express.js:12',
                        message:  'X-Powered-By header enabled by default reveals ' +
                                  'technology stack'
                    }
                ];

                tbody.innerHTML = '';

                findings.forEach((f, i) => {
                    const row = document.createElement('tr');
                    row.style.opacity   = '0';
                    row.style.transform = 'translateX(-20px) scale(0.95)';
                    row.style.filter    = 'blur(2px)';

                    row.innerHTML = `
                        <td>
                            <span class="severity-badge severity-${f.severity}">
                                ${f.severity.toUpperCase()}
                            </span>
                        </td>
                        <td><code class="rule-id">${f.rule}</code></td>
                        <td><code class="file-path">${f.file}</code></td>
                        <td>${f.message}</td>
                    `;

                    tbody.appendChild(row);

                    // Stagger each row's entrance with spring animation
                    setTimeout(() => {
                        row.style.transition =
                            'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
                        row.style.opacity   = '1';
                        row.style.transform = 'translateX(0) scale(1)';
                        row.style.filter    = 'blur(0px)';
                    }, i * 100);
                });

                // Animate stat counters
                animateCounter('stat-critical-value', 1);
                animateCounter('stat-warnings-value', 1);
                animateCounter('stat-passed-value',   309);

                // Show success state briefly before re-enabling
                btn.disabled  = false;
                btn.setAttribute('aria-busy', 'false');
                btn.innerHTML =
                    '<i data-lucide="check-circle"></i> Scan Complete';
                btn.style.background = 'var(--success)';
                btn.style.borderColor = 'rgba(0, 201, 80, 0.3)';
                if (hasLucide) lucide.createIcons();

                setTimeout(() => {
                    btn.innerHTML =
                        '<i data-lucide="shield-alert"></i> Run Semgrep Scan';
                    btn.style.background = '';
                    btn.style.borderColor = '';
                    if (hasLucide) lucide.createIcons();
                }, 2000);
            }, 2500);
        });
    }

    /**
     * Smoothly count up to a target number inside an element.
     * @param {string} elementId — DOM id of the counter element.
     * @param {number} target    — The value to count up to.
     */
    function animateCounter(elementId, target) {
        const el = document.getElementById(elementId);
        if (!el) return;

        let current = 0;
        const duration = 1500; // ms
        const steps = 60;
        const increment = target / steps;
        const stepTime = duration / steps;

        const interval = setInterval(() => {
            current += increment;
            if (current >= target) {
                current = target;
                clearInterval(interval);
                // Add a small bounce effect when counter completes
                el.style.transition = 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';
                el.style.transform = 'scale(1.1)';
                setTimeout(() => {
                    el.style.transform = 'scale(1)';
                }, 300);
            }
            el.textContent = Math.floor(current);
        }, stepTime);
    }


    // ── 6. Micro-interactions ─────────────────────────────────────────────

    // ── 6a. Material-style Ripple Effect ──────────────────────────────────

    /**
     * Attach a ripple effect to every element matching the selector.
     * @param {string} selector — CSS selector for ripple-enabled elements.
     */
    function initRipple(selector) {
        document.querySelectorAll(selector).forEach(el => {
            el.style.position = el.style.position || 'relative';
            el.style.overflow = 'hidden';

            el.addEventListener('click', function (e) {
                const rect   = this.getBoundingClientRect();
                const ripple = document.createElement('span');

                const size = Math.max(rect.width, rect.height);
                const x    = e.clientX - rect.left - size / 2;
                const y    = e.clientY - rect.top  - size / 2;

                Object.assign(ripple.style, {
                    position:        'absolute',
                    width:           `${size}px`,
                    height:          `${size}px`,
                    left:            `${x}px`,
                    top:             `${y}px`,
                    borderRadius:    '50%',
                    background:      'rgba(255, 255, 255, 0.15)',
                    transform:       'scale(0)',
                    pointerEvents:   'none',
                    animation:       'ripple-wave 0.6s ease-out forwards'
                });

                this.appendChild(ripple);
                ripple.addEventListener('animationend', () => ripple.remove());
            });
        });
    }

    // Inject the ripple keyframes once
    (function injectRippleKeyframes() {
        if (document.getElementById('ripple-keyframes')) return;
        const style   = document.createElement('style');
        style.id      = 'ripple-keyframes';
        style.textContent = `
            @keyframes ripple-wave {
                to { transform: scale(4); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    })();

    // Activate ripples on all interactive buttons
    initRipple('.nav-tab, .btn-primary, #run-scan-btn, .chat-send-btn, .quick-prompt');


    // ── 6b. Intersection Observer — Animate Cards on Scroll ──────────────

    /**
     * Cards and panels fade-in when they enter the viewport.
     */
    function initScrollAnimations() {
        const observerOptions = {
            root:       null,
            threshold:  0.1,
            rootMargin: '0px 0px -60px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const target = entry.target;
                    target.style.transition =
                        'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)';
                    target.style.opacity   = '1';
                    target.style.transform = 'translateY(0) scale(1)';
                    target.style.filter    = 'blur(0px)';
                    observer.unobserve(target);
                }
            });
        }, observerOptions);

        document.querySelectorAll(
            '.card, .stat-card, .diagram-grid > *, .readme-content'
        ).forEach(card => {
            card.style.opacity   = '0';
            card.style.transform = 'translateY(30px) scale(0.95)';
            card.style.filter    = 'blur(4px)';
            observer.observe(card);
        });
    }

    initScrollAnimations();


    // ── 6c. Keyboard Shortcuts ───────────────────────────────────────────

    document.addEventListener('keydown', (e) => {
        // / (when not already in an input) → focus chat input
        const isFocusShortcut = (e.key === '/' && !isEditableTarget(e.target));

        if (isFocusShortcut) {
            e.preventDefault();
            if (chatInput) {
                // Make sure we're on the query tab first
                const queryBtn = document.querySelector('.nav-tab[data-tab="query"]');
                if (queryBtn && !queryBtn.classList.contains('active')) {
                    queryBtn.click();
                }

                // Small delay to let the tab animation finish
                setTimeout(() => {
                    chatInput.focus();
                    // Add a subtle pulse effect when focused via shortcut
                    chatInput.style.transition = 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';
                    chatInput.style.transform = 'scale(1.02)';
                    setTimeout(() => {
                        chatInput.style.transform = 'scale(1)';
                    }, 300);
                }, 300);
            }
        }
    });

    /**
     * Check whether the target element is an editable field.
     * @param {HTMLElement} target
     * @returns {boolean}
     */
    function isEditableTarget(target) {
        const tag = target.tagName.toLowerCase();
        return (
            tag === 'input'    ||
            tag === 'textarea' ||
            tag === 'select'   ||
            target.isContentEditable
        );
    }


    // ── 7. Parallax Effect on Mouse Move ──────────────────────────────────

    /**
     * Add subtle parallax movement to cards based on mouse position.
     */
    function initParallaxEffect() {
        const cards = document.querySelectorAll('.card, .stat-card');

        document.addEventListener('mousemove', (e) => {
            const mouseX = e.clientX / window.innerWidth - 0.5;
            const mouseY = e.clientY / window.innerHeight - 0.5;

            cards.forEach((card, index) => {
                const speed = (index % 3 + 1) * 2; // Vary speed by card
                const x = mouseX * speed;
                const y = mouseY * speed;

                card.style.transform = `translate(${x}px, ${y}px)`;
            });
        });
    }

    // Uncomment to enable parallax effect (can be performance-intensive)
    // initParallaxEffect();


    // ── 8. Enhanced Button Feedback ───────────────────────────────────────

    /**
     * Add haptic-like visual feedback to all buttons.
     */
    document.querySelectorAll('button, .btn, .btn-primary, .btn-outline').forEach(btn => {
        btn.addEventListener('click', function(e) {
            // Create a quick scale pulse
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = '';
            }, 100);
        });
    });

    // ── 9. Text Effects (Per-Char Animations) ─────────────────────────────

    /**
     * Replaces text in elements with staggered animated spans.
     * Mirrors the motion-primitives TextEffect component.
     */
    function initTextEffects() {
        const elements = document.querySelectorAll('.text-effect');

        elements.forEach(el => {
            const text = el.textContent.trim();
            if (!text) return;
            
            const per = el.dataset.per || 'char'; 
            const preset = el.dataset.preset || 'fade';
            const staggerTime = parseFloat(el.dataset.stagger) || 0.02;

            el.textContent = '';
            el.style.opacity = '1';

            let targets = [];

            if (per === 'char') {
                const chars = text.split('');
                chars.forEach((char) => {
                    const span = document.createElement('span');
                    span.className = 'text-effect-target';
                    span.textContent = char === ' ' ? '\u00A0' : char; 
                    el.appendChild(span);
                    targets.push(span);
                });
            } else if (per === 'word') {
                const words = text.split(' ');
                words.forEach((word) => {
                    const span = document.createElement('span');
                    span.className = 'text-effect-target'; 
                    span.textContent = word + ' ';
                    el.appendChild(span);
                    targets.push(span);
                });
            }

            if (targets.length > 0) {
                // Apply initial states
                targets.forEach(t => {
                    t.style.display = 'inline-block';
                    t.style.willChange = 'opacity, transform, filter';
                    if (preset === 'slide') {
                        t.style.opacity = 0;
                        t.style.transform = 'translateY(12px) scale(0.95)';
                        t.style.filter = 'blur(4px)';
                    } else {
                        t.style.opacity = 0;
                        t.style.filter = 'blur(4px)';
                    }
                });

                // Animate using motion
                if (preset === 'slide') {
                    animate(
                        targets,
                        { opacity: 1, transform: 'none', filter: 'blur(0px)' },
                        { 
                            delay: stagger(staggerTime),
                            duration: 0.6,
                            easing: [0.34, 1.56, 0.64, 1]
                        }
                    );
                } else {
                    animate(
                        targets,
                        { opacity: 1, filter: 'blur(0px)' },
                        { 
                            delay: stagger(staggerTime),
                            duration: 0.8,
                            easing: [0.16, 1, 0.3, 1]
                        }
                    );
                }
            }
        });
    }

    function initTextRoll() {
        const elements = document.querySelectorAll('.text-roll');

        elements.forEach(el => {
            if (el.hasAttribute('data-text-roll-init')) return;
            el.setAttribute('data-text-roll-init', 'true');
            
            const text = el.textContent.trim();
            if (!text) return;
            
            el.textContent = '';
            el.style.display = 'inline-flex';
            el.style.position = 'relative';
            el.style.overflow = 'hidden'; // clip the roll

            const chars = text.split('');
            const topTargets = [];
            const bottomTargets = [];

            chars.forEach((char) => {
                const wrapper = document.createElement('span');
                wrapper.style.display = 'inline-flex';
                wrapper.style.flexDirection = 'column';
                wrapper.style.position = 'relative';
                
                // Visible char
                const topSpan = document.createElement('span');
                topSpan.style.display = 'inline-block';
                topSpan.style.transform = 'translateY(0%)';
                topSpan.textContent = char === ' ' ? '\u00A0' : char; 

                // Hidden char (below)
                const bottomSpan = document.createElement('span');
                bottomSpan.style.display = 'inline-block';
                bottomSpan.style.position = 'absolute';
                bottomSpan.style.top = '100%';
                bottomSpan.style.left = '0';
                bottomSpan.style.transform = 'translateY(0%)';
                bottomSpan.textContent = char === ' ' ? '\u00A0' : char; 

                wrapper.appendChild(topSpan);
                wrapper.appendChild(bottomSpan);
                el.appendChild(wrapper);
                
                topTargets.push(topSpan);
                bottomTargets.push(bottomSpan);
            });

            // Hover animation
            el.addEventListener('mouseenter', () => {
                animate(topTargets, { y: '-100%' }, { delay: stagger(0.015), duration: 0.4, easing: [0.34, 1.56, 0.64, 1] });
                animate(bottomTargets, { y: '-100%' }, { delay: stagger(0.015), duration: 0.4, easing: [0.34, 1.56, 0.64, 1] });
            });

            el.addEventListener('mouseleave', () => {
                animate(topTargets, { y: '0%' }, { delay: stagger(0.015), duration: 0.4, easing: [0.34, 1.56, 0.64, 1] });
                animate(bottomTargets, { y: '0%' }, { delay: stagger(0.015), duration: 0.4, easing: [0.34, 1.56, 0.64, 1] });
            });
        });
    }

    // ── 11. Interactive Fluid Background ──────────────────────────────────────
    const interactiveOrb = document.getElementById('interactive-orb');
    if (interactiveOrb) {
        let mouseX = window.innerWidth / 2;
        let mouseY = window.innerHeight / 2;
        let orbX = mouseX;
        let orbY = mouseY;
        let orbDirty = true;

        window.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            orbDirty = true;
        });

        function animateOrb() {
            if (orbDirty) {
                orbX += (mouseX - orbX) * 0.05;
                orbY += (mouseY - orbY) * 0.05;

                // Stop updating once close enough to target
                if (Math.abs(mouseX - orbX) < 0.5 && Math.abs(mouseY - orbY) < 0.5) {
                    orbDirty = false;
                }

                interactiveOrb.style.transform = `translate(calc(-50% + ${orbX}px), calc(-50% + ${orbY}px))`;
            }
            requestAnimationFrame(animateOrb);
        }

        animateOrb();
    }

    // ── 12. macOS Dock Magnification ──────────────────────────────────────────
    const dock = document.getElementById('dock');
    const dockItems = document.querySelectorAll('.dock-item');

    if (dock) {
        dock.addEventListener('mousemove', (e) => {
            dockItems.forEach(item => {
                const rect = item.getBoundingClientRect();
                const center = rect.left + rect.width / 2;
                const distance = Math.abs(e.clientX - center);
                
                const maxScale = 1.4;
                const range = 120;
                
                let scale = 1;
                if (distance < range) {
                    scale = 1 + (maxScale - 1) * (1 - distance / range);
                }
                
                item.style.setProperty('--scale', scale);
            });
        });

        dock.addEventListener('mouseleave', () => {
            dockItems.forEach(item => {
                item.style.setProperty('--scale', 1);
            });
        });
    }

    // ── 13. Tilt Effect (3D Card Hover) ───────────────────────────────────────
    function initTilt() {
        const tiltElements = document.querySelectorAll('.tilt-element');
        
        tiltElements.forEach(el => {
            const rotationFactor = parseFloat(el.dataset.tiltFactor) || 8;
            const isReverse = el.dataset.tiltReverse === 'true';

            // We need a wrapper to maintain layout while inner tilts
            // But if we tilt the element itself, we must ensure it has transform-style
            el.style.transformStyle = 'preserve-3d';
            el.style.willChange = 'transform';

            el.addEventListener('mousemove', (e) => {
                const rect = el.getBoundingClientRect();
                const x = (e.clientX - rect.left) / rect.width - 0.5;
                const y = (e.clientY - rect.top) / rect.height - 0.5;

                const multiplier = isReverse ? -1 : 1;
                
                // Standard magic numbers for a nice rotation based on factor 8
                const rotateX = multiplier * (y * rotationFactor * -2); 
                const rotateY = multiplier * (x * rotationFactor * 2);

                el.style.transition = 'none';
                el.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
            });

            el.addEventListener('mouseleave', () => {
                el.style.transition = 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
                el.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
            });
        });
    }

    // Initialize text effects after a small delay to sync with other entrance animations
    setTimeout(() => {
        initTextEffects();
        initTextRoll();
        initTilt();
    }, 100);

});
