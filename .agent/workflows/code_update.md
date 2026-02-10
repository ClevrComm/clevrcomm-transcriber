---
description: Rule to follow whenever updating code
---

1. Match existing patterns: Before modifying any file, read similar files to understand the coding style and patterns.
2. Run E2E tests and check logs:
   - Run available end-to-end tests (e.g., `npm run test:e2e` if it exists).
   - Check application logs for errors after the fix.
   - **Note**: Do not explain these steps unless they fail.
3. Use the architect tool:
   - Verify no regressions using the architect tool.
   - **Note**: Do not explain this step unless it fails.
