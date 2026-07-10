export function initSecurity() {
    const runScanBtn = document.getElementById('btn-run-scan');
    
    if (runScanBtn) {
        runScanBtn.addEventListener('click', handleRunScan);
    }
}

function handleRunScan() {
    const btn   = document.getElementById('btn-run-scan');
    const tbody = document.getElementById('security-tbody');
    if (!tbody || !btn) return;

    btn.disabled  = true;
    btn.setAttribute('aria-busy', 'true');
    btn.innerHTML = '<i data-lucide="loader-2" class="spin"></i> Scanning (Sample Data)\u2026';
    
    if (typeof lucide !== 'undefined') lucide.createIcons();

    tbody.innerHTML = `
        <tr>
            <td colspan="4" class="empty-state">
                <div class="shimmer-bar"></div>
            </td>
        </tr>
    `;

    setTimeout(() => {
        const findings = [
            {
                severity: 'high',
                rule:     'express-open-redirect (Sample)',
                file:     'lib/response.js:42',
                message:  '[DEMO DATA] Potential open redirect via user-controlled input in res.redirect()'
            },
            {
                severity: 'medium',
                rule:     'regex-dos (Sample)',
                file:     'lib/utils.js:78',
                message:  '[DEMO DATA] Regular expression susceptible to catastrophic backtracking (ReDoS)'
            },
            {
                severity: 'low',
                rule:     'info-disclosure (Sample)',
                file:     'lib/express.js:12',
                message:  '[DEMO DATA] X-Powered-By header enabled by default reveals technology stack'
            }
        ];

        tbody.innerHTML = '';
        
        const warningRow = document.createElement('tr');
        warningRow.innerHTML = `<td colspan="4" style="text-align: center; color: var(--warning); padding: 8px; font-weight: 500; font-size: 0.85rem;"><i data-lucide="alert-triangle" style="width: 14px; height: 14px; display: inline; vertical-align: middle;"></i> Note: These are simulated sample findings. Real backend scan integration is pending.</td>`;
        tbody.appendChild(warningRow);

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

            requestAnimationFrame(() => {
                setTimeout(() => {
                    row.style.transition = 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
                    row.style.opacity   = '1';
                    row.style.transform = 'translateX(0) scale(1)';
                    row.style.filter    = 'blur(0px)';
                }, i * 100);
            });
        });

        btn.disabled  = false;
        btn.removeAttribute('aria-busy');
        btn.innerHTML = '<i data-lucide="shield-alert"></i> Run Scan (Sample Data)';
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }, 2000);
}
