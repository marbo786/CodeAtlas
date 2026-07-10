"""Initial schema and indexes

Revision ID: 8516d9f06a5a
Revises: 
Create Date: 2026-07-10 16:31:24.181726

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8516d9f06a5a'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create updated_at trigger function
    op.execute("""
    CREATE OR REPLACE FUNCTION trigger_set_timestamp()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    """)

    # 2. Create tables
    op.execute("""
    CREATE TABLE IF NOT EXISTS repos (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        github_url TEXT NOT NULL,
        cloned_path TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'parsing', 'embedding', 'ready', 'failed')),
        architecture_pattern TEXT,
        architecture_reasoning TEXT,
        mermaid_sequence_diagram TEXT,
        mermaid_component_diagram TEXT,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
    );
    
    DROP TRIGGER IF EXISTS set_timestamp_repos ON repos;
    CREATE TRIGGER set_timestamp_repos
    BEFORE UPDATE ON repos
    FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

    CREATE TABLE IF NOT EXISTS files (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        repo_id UUID REFERENCES repos(id) ON DELETE CASCADE,
        path TEXT NOT NULL,
        language TEXT,
        purpose TEXT,
        complexity_score INT,
        is_entry_point BOOLEAN DEFAULT false,
        UNIQUE (repo_id, path)
    );

    CREATE TABLE IF NOT EXISTS file_dependencies (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        repo_id UUID REFERENCES repos(id) ON DELETE CASCADE,
        from_file_id UUID REFERENCES files(id) ON DELETE CASCADE,
        to_file_id UUID REFERENCES files(id) ON DELETE CASCADE,
        relationship_type TEXT
    );

    CREATE TABLE IF NOT EXISTS security_findings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        repo_id UUID REFERENCES repos(id) ON DELETE CASCADE,
        file_id UUID REFERENCES files(id) ON DELETE CASCADE,
        severity TEXT CHECK (severity IN ('critical', 'high', 'medium', 'low', 'info')),
        rule TEXT,
        line_number INT,
        remediation TEXT
    );
    """)

    # 3. Create indexes
    op.execute("""
    CREATE INDEX IF NOT EXISTS idx_files_repo_id ON files(repo_id);
    CREATE INDEX IF NOT EXISTS idx_file_dependencies_repo_id ON file_dependencies(repo_id);
    CREATE INDEX IF NOT EXISTS idx_file_dependencies_from ON file_dependencies(from_file_id);
    CREATE INDEX IF NOT EXISTS idx_file_dependencies_to ON file_dependencies(to_file_id);
    CREATE INDEX IF NOT EXISTS idx_security_findings_repo_id ON security_findings(repo_id);
    CREATE INDEX IF NOT EXISTS idx_security_findings_file_id ON security_findings(file_id);
    """)


def downgrade() -> None:
    op.execute("""
    DROP TABLE IF EXISTS security_findings CASCADE;
    DROP TABLE IF EXISTS file_dependencies CASCADE;
    DROP TABLE IF EXISTS files CASCADE;
    DROP TABLE IF EXISTS repos CASCADE;
    DROP FUNCTION IF EXISTS trigger_set_timestamp() CASCADE;
    """)
