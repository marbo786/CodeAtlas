import { NextRequest, NextResponse } from 'next/server';

const N8N_BASE_URL = process.env.N8N_BASE_URL || 'http://localhost:5678';
const N8N_INGEST_PATH = process.env.N8N_INGEST_PATH || '/webhook/ingest';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const n8nUrl = new URL(N8N_INGEST_PATH, N8N_BASE_URL);

    const response = await fetch(n8nUrl.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      console.error(`n8n responded with status: ${response.status}`);
      const errorText = await response.text();
      let errorMessage = 'Failed to trigger ingestion workflow.';
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.message || errorData.detail || errorData.error || errorText;
      } catch (e) {
        if (errorText) errorMessage = errorText;
      }
      return NextResponse.json(
        { error: errorMessage },
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
    console.error('Error proxying ingest request to n8n:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
