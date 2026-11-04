# Shared Package

This package contains contracts and utilities used by multiple TestMeMan applications.

## Contents

- `src/types.ts`: API request, response, language, difficulty, question, and submission contracts.
- `src/errors/`: shared application error types.

Shared contracts should remain framework-neutral and should not import Express, React, or provider-specific SDK types.
