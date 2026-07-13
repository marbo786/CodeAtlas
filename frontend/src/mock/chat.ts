export const MOCK_CHAT_RESPONSES: Record<string, string> = {
  default: `I've analyzed the codebase context. 

Based on the parsed structure, the \`AuthenticationService\` is primarily located in \`src/services/auth.ts\`. It uses JWT tokens and depends on the \`UserRepository\` for user lookups.

Here is an example of how the login function is implemented:
\`\`\`typescript
async function login(credentials: LoginDto) {
  const user = await userRepository.findByEmail(credentials.email);
  if (!user || !verifyPassword(credentials.password, user.passwordHash)) {
    throw new UnauthorizedError('Invalid credentials');
  }
  return generateTokens(user);
}
\`\`\`

Let me know if you need to trace any specific function calls from here!`,
  'architecture': `The backend is a FastAPI application structured around domain-driven design.

**Core Layers:**
1. **API Routers:** \`api/v1/endpoints/\`
2. **Services (Business Logic):** \`services/\`
3. **Repositories (Data Access):** \`repositories/\`
4. **Models (SQLAlchemy):** \`models/\`

The dependency injection is handled using FastAPI's \`Depends\` system, passing repositories into services, and services into routers.`,
};

export async function mockStreamResponse(query: string, onChunk: (chunk: string) => void) {
  const lowercaseQuery = query.toLowerCase();
  let responseText = MOCK_CHAT_RESPONSES.default;
  
  if (lowercaseQuery.includes('architecture') || lowercaseQuery.includes('structure')) {
    responseText = MOCK_CHAT_RESPONSES.architecture;
  }

  // Simulate streaming by splitting into words/chunks
  const chunks = responseText.match(/.{1,4}/g) || [];
  
  for (const chunk of chunks) {
    onChunk(chunk);
    await new Promise(r => setTimeout(r, 20 + Math.random() * 30));
  }
}
