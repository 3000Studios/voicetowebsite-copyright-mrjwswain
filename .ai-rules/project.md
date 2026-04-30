# AI Assistant Rules for VoiceToWebsite

## Golden Rule

**Everything must be configured for maximum automation and minimum cost using free AI alternatives (Ollama local, Gemini free tier) whenever possible.**

## Always Do

- Use TypeScript for new code
- Add types to all functions and variables
- Use async/await over callbacks
- Keep functions under 50 lines
- Add JSDoc comments for public APIs
- Run `npm run lint` to check code style
- Run `npm run test` before major changes
- Use semantic variable names
- Handle errors with try/catch

## Never Do

- Never commit secrets or API keys
- Never modify Cloudflare credentials
- Never delete tests without approval
- Never push broken builds to main
- Never use `any` type in TypeScript
- Never add large dependencies without discussion
- Never ignore ESLint warnings

## Code Style

- 2 spaces for indentation
- Single quotes for strings
- Semicolons required
- 100 character line width
- LF line endings
- Trailing commas in objects/arrays

## Free-First AI Strategy

When generating code or content:

1. Try Ollama (local) first
2. Use Gemini free tier for cloud
3. Use OpenRouter free models
4. Only use OpenAI if quality requires it

## Preferred Patterns

```typescript
// Use this pattern
const fetchData = async (id: string): Promise<Data> => {
  try {
    const response = await api.get(`/data/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch data for ${id}:`, error);
    throw new Error(`Data fetch failed: ${error.message}`);
  }
};

// Not this pattern
function fetchData(id, callback) {
  api.get("/data/" + id, function (err, res) {
    if (err) {
      console.log(err);
      callback(err);
    } else {
      callback(null, res.data);
    }
  });
}
```

## Testing

- Write unit tests for utilities
- Test API endpoints with mock data
- Verify builds pass before commit
- Use existing test patterns

## Performance

- Lazy load heavy components
- Use React.memo for static components
- Implement proper error boundaries
- Cache API responses when possible

## Security

- Validate all user inputs
- Sanitize data before display
- Use HTTPS for all API calls
- Keep dependencies updated

## Helpful Skills

- `/vtw-dev` - Development help
- `/vtw-deploy` - Deployment help
- `/vtw-content` - AI content help
- `/vtw-api` - API/backend help
- `/vtw-fullstack` - Complete workflow
- `/vtw-automation` - CI/CD help
- `/vtw-optimization` - Cost optimization
