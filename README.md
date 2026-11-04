# TestMeMan

TestMeMan is an AI-assisted coding practice platform inspired by HackerRank. It provides a focused problem-solving workspace with an online code editor, test-case panel, submission results, and an AI tutor interface.

## Features

- HackerRank-style split-screen coding workspace
- AI-generated problem presentation
- Support for Python, JavaScript, Java, and C++
- Monaco-style text editor interface
- Visible test cases with expected output
- Run and submit result states
- Submission status and runtime statistics
- AI Tutor sidebar
- Generate-new-question interaction

> This repository currently contains the frontend implementation. AI generation, secure code execution, authentication, hidden test cases, and persistent submissions require backend services.

## Tech Stack

- React 19
- TypeScript
- Vite
- Lucide React icons

## Getting Started

### Prerequisites

- Node.js 18 or newer
- npm

### Installation

```powershell
cd z:\TestMeMan\AI-Interview
npm.cmd install
```

### Start the Development Server

```powershell
npm.cmd run dev
```

Open `http://127.0.0.1:5173/` in your browser.

### Create a Production Build

```powershell
npm.cmd run build
```

Build output is generated in the `dist/` directory.

## Available Scripts

| Command | Description |
|---|---|
| `npm.cmd run dev` | Start the Vite development server |
| `npm.cmd run build` | Type-check and create a production build |
| `npm.cmd run preview` | Preview the production build locally |

## Project Structure

```text
AI-Interview/
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   └── styles.css
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.app.json
└── AI-Coding-Practice-Platform-Plan.md
```

## Planned Backend

The frontend is designed to connect with the following services:

- AI question-generation API
- Structured reference solution validation
- Visible and hidden test-case generation
- Isolated container-based code execution
- Submission queue and result processing
- Authentication and submission history
- AI hints and post-submission explanations

The complete architecture and implementation roadmap are documented in [AI-Coding-Practice-Platform-Plan.md](AI-Coding-Practice-Platform-Plan.md).

## License

No license has been added yet. All rights are reserved unless a license is explicitly added.
