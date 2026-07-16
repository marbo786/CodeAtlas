import { NextRequest, NextResponse } from 'next/server';

const N8N_BASE_URL = process.env.N8N_BASE_URL || 'http://localhost:5678';
const N8N_READ_API_PATH = process.env.N8N_READ_API_PATH || '/webhook/read-api';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string | string[] }> }
) {
  try {
    const paramsResolved = await params;
    const id = Array.isArray(paramsResolved.id) ? paramsResolved.id.join('/') : paramsResolved.id;
    
    // Call the n8n Read API webhook, passing the repo ID
    const n8nUrl = new URL(N8N_READ_API_PATH, N8N_BASE_URL);
    n8nUrl.searchParams.append('repo_id', id);

    const response = await fetch(n8nUrl.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      console.error(`n8n responded with status: ${response.status}`);
      return NextResponse.json(
        { error: 'Failed to fetch repository data from orchestrator.' },
        { status: response.status }
      );
    }

    const text = await response.text();
    try {
      const data = JSON.parse(text);
      return NextResponse.json(data);
    } catch (e) {
      // If n8n returns a raw string like "Workflow was started"
      return NextResponse.json({ message: text });
    }
    
  } catch (error) {
    console.error('Error proxying to n8n:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
