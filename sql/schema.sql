CREATE TABLE repos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    github_url TEXT NOT NULL,
    cloned_path TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, parsing, embedding, ready, failed
    architecture_pattern TEXT,
    architecture_reasoning TEXT,
    mermaid_sequence_diagram TEXT,   -- written by Workflow 3, read by Workflow 4/frontend
    mermaid_component_diagram TEXT,  -- written by Workflow 3, read by Workflow 4/frontend
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    repo_id UUID REFERENCES repos(id) ON DELETE CASCADE,
    path TEXT NOT NULL,
    language TEXT,
    purpose TEXT,              -- optional, nullable — not populated by v1 workflows, safe to leave NULL
    complexity_score INT,       -- optional, nullable — not populated by v1 workflows, safe to leave NULL
    is_entry_point BOOLEAN DEFAULT false  -- optional — not populated by v1 workflows, safe to leave false
);

CREATE TABLE file_dependencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    repo_id UUID REFERENCES repos(id) ON DELETE CASCADE,
    from_file_id UUID REFERENCES files(id) ON DELETE CASCADE,
    to_file_id UUID REFERENCES files(id) ON DELETE CASCADE,
    relationship_type TEXT -- import, calls, extends
);

CREATE TABLE security_findings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    repo_id UUID REFERENCES repos(id) ON DELETE CASCADE,
    file_id UUID REFERENCES files(id) ON DELETE CASCADE,
    severity TEXT, -- critical, high, medium, low
    rule TEXT,
    line_number INT,
    remediation TEXT
);
