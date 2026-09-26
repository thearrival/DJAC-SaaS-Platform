## Description

<!-- Provide a clear and concise description of the changes in this PR. -->
<!-- Summarize the motivation and context for the change. -->
<!-- If it fixes an open issue, please link to the issue using `Closes #<issue-number>`. -->

## Type of Change

<!-- Mark the appropriate option with an "x" (e.g., [x]) -->

- [ ] 🐛 Bug fix (non-breaking change which fixes an issue)
- [ ] ✨ New feature (non-breaking change which adds functionality)
- [ ] 💥 Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] 📝 Documentation update
- [ ] 🎨 UI/UX improvement
- [ ] 🔧 Refactoring (code change with no functional impact)
- [ ] ⚡ Performance improvement
- [ ] 🛡️ Security fix
- [ ] 🧪 Test addition or update
- [ ] 🏗️ Infrastructure / CI/CD change
- [ ] 📦 Dependency update
- [ ] 🔍 Code analysis / linting fix

## Related Issue(s)

<!-- Link to related issues or PRs. Example: Closes #123, Fixes #456 -->

Closes #

## Changes Summary

<!-- Provide a concise summary of all changes made in this PR -->

- Change 1:
- Change 2:
- Change 3:

## Test Plan

<!-- Describe the tests you ran and how to verify the changes -->

### Manual Testing

- [ ] Tested locally with `pnpm dev`
- [ ] Verified the fix/feature works as expected
- [ ] Tested edge cases and error conditions

### Automated Testing

- [ ] New tests added (if applicable)
- [ ] Existing tests pass without modification
- [ ] Test coverage meets the 80% minimum threshold

### Test Commands

```bash
# Run all tests
pnpm test

# Run specific test file
npx vitest run path/to/test.ts

# Run all quality checks
pnpm verify:all
```

## Checklist

<!-- Mark each item as completed with an "x" (e.g., [x]) -->

### Code Quality

- [ ] Code follows the project's naming conventions and coding standards
- [ ] TypeScript types are correct (no `any` types)
- [ ] Zod validation is present on all tRPC procedure inputs
- [ ] No console.log or debugger statements left in code
- [ ] No unused imports or dead code
- [ ] All new code has appropriate test coverage (minimum 80%)

### Linting & Formatting

- [ ] `pnpm lint` passes without errors
- [ ] `pnpm check` (TypeScript) passes without errors
- [ ] `pnpm format:check` passes (code is properly formatted)
- [ ] Prettier formatting is applied to all modified files

### Security

- [ ] No hardcoded secrets, API keys, or credentials
- [ ] No new vulnerabilities introduced (run `pnpm audit` if applicable)
- [ ] All new tRPC procedures have proper authorization checks
- [ ] Database queries use parameterized/Drizzle ORM (no raw SQL injection)

### Documentation

- [ ] README or relevant docs updated if needed
- [ ] CHANGELOG entry added (if applicable)
- [ ] Any new environment variables documented in `.env.example`

### Database

- [ ] Database schema changes are documented
- [ ] Migrations generated with `pnpm drizzle-kit generate`
- [ ] Seed scripts updated if new reference data is needed
- [ ] Row-Level Security (RLS) policies are properly configured

### Architecture

- [ ] New code follows the tRPC router pattern
- [ ] No architectural violations (e.g., client importing server code directly)
- [ ] Multi-tenant data isolation is maintained (`orgId` scoping)

## Screenshots / Demo

<!-- If this PR includes UI changes, provide before/after screenshots or a demo link -->

| Before    | After    |
| --------- | -------- |
| ![Before] | ![After] |

## Deployment Notes

<!-- Any special instructions for deploying this change -->

- [ ] No database migration required
- [ ] New environment variables needed:
- [ ] Edge function deployment required
- [ ] Supabase migration required
- [ ] Vercel deployment required

## Reviewer Notes

<!-- Any specific areas reviewers should focus on -->

- Pay special attention to:

---

## PR Template Checklist Summary

### Before Merge

- [ ] All CI checks pass (lint, typecheck, test, build)
- [ ] At least one review approved
- [ ] No merge conflicts with `develop`
- [ ] Squash merge preferred
- [ ] Branch deleted after merge

---

**For security-related changes, please refer to [SECURITY.md](../SECURITY.md) before opening a PR.**
