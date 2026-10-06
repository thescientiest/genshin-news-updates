    ---
description: Runs the automated test suite, boots the dev server, and performs verification.
---

# Verification Workflow

1. **Static Analysis & Linting:**
   - Execute project linting and format checkers.
   - Stop immediately and fix any syntax or typing violations before proceeding.

2. **Unit & Integration Tests:**
   - Run the local test runner with coverage tracking enabled.
   - If tests fail, isolate the regression in code, patch the issue, and rerun until all tests pass.

3. **Live Verification:**
   - If the task includes API or UI changes, launch the local development server.
   - Use `/browser` to open the local route, check HTTP status codes, and verify the UI renders without console errors.
   - Generate a summary artifact detailing test results and browser validation.