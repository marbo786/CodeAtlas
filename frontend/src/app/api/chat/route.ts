import { NextRequest, NextResponse } from 'next/server';

const N8N_BASE_URL = process.env.N8N_BASE_URL || 'http://localhost:5678';
const N8N_CHAT_PATH = process.env.N8N_CHAT_PATH && process.env.N8N_CHAT_PATH !== '/webhook/chat' 
  ? process.env.N8N_CHAT_PATH 
  : '/webhook/63556229-4761-45c0-bdab-619a1b99f2de/chat';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const n8nUrl = new URL(N8N_CHAT_PATH, N8N_BASE_URL);

    // Fetch the latest repo ID to provide context to the AI
    let repoContext = "";
    try {
      const repoRes = await fetch(new URL('/api/repo/latest', request.url).toString(), { cache: 'no-store' });
      if (repoRes.ok) {
        const repoData = await repoRes.json();
        if (repoData && repoData.id) {
          repoContext = `[Context: The user is currently viewing the repository with ID: ${repoData.id}. If you need to search the database or vector store, prioritize this repository.]\n\n`;
        }
      }
    } catch (e) {
      console.error("Failed to fetch repo context for chat", e);
    }

    const payload = {
      action: "sendMessage",
      sessionId: body.sessionId || `codeatlas-session-${Date.now()}`, 
      chatInput: repoContext + body.query
    };

    // Forward the request to n8n
    const response = await fetch(n8nUrl.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error(`n8n responded with status: ${response.status}`);
      return NextResponse.json(
        { error: 'Failed to get chat response from orchestrator.' },
        { status: response.status }
      );
    }

    // Return the response body directly, which supports streaming if n8n provides it,
    // or standard JSON if it's a synchronous webhook.
    return new Response(response.body, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'application/json',
      }
    });
    
  } catch (error) {
    console.error('Error proxying chat request to n8n:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
