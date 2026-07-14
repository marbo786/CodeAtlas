CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE repos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    github_url TEXT NOT NULL,
    cloned_path TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'parsing', 'embedding', 'ready', 'failed')),
    architecture_pattern TEXT,
    architecture_reasoning TEXT,
    mermaid_sequence_diagram TEXT,   -- written by Workflow 3, read by Workflow 4/frontend
    mermaid_component_diagram TEXT,  -- written by Workflow 3, read by Workflow 4/frontend
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

DROP TRIGGER IF EXISTS set_timestamp_repos ON repos;
CREATE TRIGGER set_timestamp_repos
BEFORE UPDATE ON repos
FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TABLE files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    repo_id UUID REFERENCES repos(id) ON DELETE CASCADE,
    path TEXT NOT NULL,
    language TEXT,
    purpose TEXT,              -- optional, nullable — not populated by v1 workflows, safe to leave NULL
    complexity_score INT,       -- optional, nullable — not populated by v1 workflows, safe to leave NULL
    is_entry_point BOOLEAN DEFAULT false,  -- optional — not populated by v1 workflows, safe to leave false
    UNIQUE (repo_id, path)
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
    severity TEXT CHECK (severity IN ('critical', 'high', 'medium', 'low', 'info')),
    rule TEXT,
    line_number INT,
    remediation TEXT
);

CREATE INDEX idx_files_repo_id ON files(repo_id);
CREATE INDEX idx_file_deps_repo_id ON file_dependencies(repo_id);
CREATE INDEX idx_file_deps_from_file ON file_dependencies(from_file_id);
CREATE INDEX idx_file_deps_to_file ON file_dependencies(to_file_id);
CREATE INDEX idx_sec_findings_repo_id ON security_findings(repo_id);
CREATE INDEX idx_sec_findings_file_id ON security_findings(file_id);
