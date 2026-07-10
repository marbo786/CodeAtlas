/**
 * CodeAtlas — API Integration
 * Handles fetching repo summaries, chat interactions, and git ingestion.
 */

export async function fetchRepoSummary() {
    const repoStatusSuccess = document.querySelector('.repo-status-success');
    if (repoStatusSuccess) {
        repoStatusSuccess.textContent = 'Scanning repository...';
        repoStatusSuccess.style.color = 'var(--muted)';
    }

    try {
        const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
        const apiKey = import.meta.env.VITE_API_KEY || 'dev_api_key_123';
        const summaryWebhook = import.meta.env.VITE_N8N_SUMMARY_WEBHOOK;
        
        let response;
        if (summaryWebhook) {
            response = await fetch(summaryWebhook, {
                method: 'GET'
            });
        } else {
            response = await fetch(`${apiBase}/summary`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': apiKey
                },
                body: JSON.stringify({ repo_path: 'codeatlas' }) // Fallback mock repo_path
            });
        }

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

export async function sendChatMessage(text) {
    const webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL;
            
    if (!webhookUrl) {
        return {
            delayMs: 800,
            text: '**Not Configured:** The AI Query Agent is currently disabled. Please set `VITE_N8N_WEBHOOK_URL` in your environment to enable real RAG queries.'
        };
    }

    const response = await fetch(webhookUrl, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ message: text, repo_id: 'codeatlas' })
    });
    
    if (!response.ok) throw new Error('Webhook failed');
    
    const data = await response.json();
    return { text: data.output || 'No response output provided.' };
}
