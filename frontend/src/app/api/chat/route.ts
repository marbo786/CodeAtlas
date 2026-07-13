import { NextRequest, NextResponse } from 'next/server';

const N8N_BASE_URL = process.env.N8N_BASE_URL || 'http://localhost:5678';
const N8N_CHAT_PATH = process.env.N8N_CHAT_PATH || '/webhook/chat';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const n8nUrl = new URL(N8N_CHAT_PATH, N8N_BASE_URL);

    // The frontend sends { query: "...", sessionId: "..." }
    // We use the client's sessionId to maintain conversational memory for the duration
    // of their page visit. If they refresh, they get a new ID and fresh memory.
    const payload = {
      action: "sendMessage",
      sessionId: body.sessionId || `codeatlas-session-${Date.now()}`, 
      chatInput: body.query
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
