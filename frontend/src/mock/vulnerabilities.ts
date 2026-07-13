export type Severity = 'Critical' | 'High' | 'Medium' | 'Low';

export interface VulnerabilityFinding {
  id: string;
  file: string;
  line: number;
  description: string;
  severity: Severity;
  suggestedFix: string;
  snippet: string;
}

export const MOCK_VULNERABILITIES: VulnerabilityFinding[] = [
  {
    id: 'VULN-001',
    file: 'src/services/auth.ts',
    line: 45,
    severity: 'Critical',
    description: 'Hardcoded JWT secret key found in authentication service.',
    suggestedFix: 'Extract the secret key to an environment variable and inject it via configuration.',
    snippet: `export const generateTokens = (user: User) => {
  // Hardcoded secret key
  const secret = "super-secret-key-12345";
  return jwt.sign({ sub: user.id }, secret, { expiresIn: '1h' });
};`
  },
  {
    id: 'VULN-002',
    file: 'src/api/v1/endpoints/users.py',
    line: 112,
    severity: 'High',
    description: 'Potential SQL injection via unsanitized raw query.',
    suggestedFix: 'Use SQLAlchemy ORM parameterized queries instead of executing raw SQL with f-strings.',
    snippet: `def get_user_by_name(name: str, db: Session = Depends(get_db)):
    # Vulnerable raw query
    query = f"SELECT * FROM users WHERE name = '{name}'"
    return db.execute(query).fetchall()`
  },
  {
    id: 'VULN-003',
    file: 'package.json',
    line: 14,
    severity: 'Medium',
    description: 'Outdated dependency: lodash < 4.17.21 contains prototype pollution vulnerability.',
    suggestedFix: 'Update lodash to version 4.17.21 or later.',
    snippet: `"dependencies": {
  "express": "^4.18.2",
  "lodash": "^4.17.15",
  "mongoose": "^7.0.3"
}`
  },
  {
    id: 'VULN-004',
    file: 'docker-compose.yml',
    line: 22,
    severity: 'Low',
    description: 'PostgreSQL database container running without a healthcheck.',
    suggestedFix: 'Add a healthcheck to ensure dependent services wait for the DB to be ready.',
    snippet: `  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: \${DB_PASSWORD}`
  }
];
