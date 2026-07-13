import { Node, Edge } from '@xyflow/react';

export const MOCK_DIAGRAM_NODES: Node[] = [
  {
    id: 'api',
    position: { x: 250, y: 0 },
    data: { label: 'API Layer (api/v1)' },
    type: 'default',
    style: { background: 'hsl(var(--card))', color: 'hsl(var(--card-foreground))', border: '1px solid hsl(var(--border))', borderRadius: '8px', padding: '10px 20px' }
  },
  {
    id: 'agent',
    position: { x: 100, y: 100 },
    data: { label: 'Query Agent (services/agent)' },
    type: 'default',
    style: { background: 'hsl(var(--card))', color: 'hsl(var(--card-foreground))', border: '1px solid hsl(var(--border))', borderRadius: '8px', padding: '10px 20px' }
  },
  {
    id: 'ingest',
    position: { x: 400, y: 100 },
    data: { label: 'Ingestion Pipeline (services/ingest)' },
    type: 'default',
    style: { background: 'hsl(var(--card))', color: 'hsl(var(--card-foreground))', border: '1px solid hsl(var(--border))', borderRadius: '8px', padding: '10px 20px' }
  },
  {
    id: 'gemini',
    position: { x: 250, y: 200 },
    data: { label: 'Gemini Client' },
    type: 'default',
    style: { background: 'hsl(var(--card))', color: 'hsl(var(--card-foreground))', border: '1px solid hsl(var(--border))', borderRadius: '8px', padding: '10px 20px' }
  },
  {
    id: 'qdrant',
    position: { x: 100, y: 300 },
    data: { label: 'Qdrant (Vector DB)' },
    type: 'output',
    style: { background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))', border: '1px solid hsl(var(--border))', borderRadius: '8px', padding: '10px 20px' }
  },
  {
    id: 'postgres',
    position: { x: 400, y: 300 },
    data: { label: 'PostgreSQL (Metadata DB)' },
    type: 'output',
    style: { background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))', border: '1px solid hsl(var(--border))', borderRadius: '8px', padding: '10px 20px' }
  }
];

export const MOCK_DIAGRAM_EDGES: Edge[] = [
  { id: 'e1', source: 'api', target: 'agent', animated: true },
  { id: 'e2', source: 'api', target: 'ingest', animated: true },
  { id: 'e3', source: 'agent', target: 'gemini' },
  { id: 'e4', source: 'ingest', target: 'gemini' },
  { id: 'e5', source: 'agent', target: 'qdrant' },
  { id: 'e6', source: 'agent', target: 'postgres' },
  { id: 'e7', source: 'ingest', target: 'qdrant' },
  { id: 'e8', source: 'ingest', target: 'postgres' }
];
