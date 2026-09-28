# Automated Workflow Application

The **Automated Workflow Application** is an AI-powered studio dashboard and visual workflow composer designed to let users compose custom applications, database schemas, and authentication flows using the pre-built modules from the 4 primary enterprise applications.

## Key Features

1. **Studio Dashboard (`StudioOverview`)**: Softr-inspired team workspace, active workflow counters, quick stats, and integrated app launchers.
2. **Automated Workflow Builder (`WorkflowBuilder`)**: Visual drag-and-drop composer containing all 36 active modules from the 4 primary applications.
3. **Vernika Copilot AI (`VernikaCopilotView`)**: AI bot that assists in generating database schemas, user login pages, and automated workflow triggers.
4. **Portfolio Showcase & Vercel Launcher (`PortfolioShowcase`)**: Central hub displaying all 4 applications, included active modules, internal studio launch triggers, and configurable external Vercel deployment links.

## Hybrid Database Synchronization

This application connects to the shared **Hybrid Cloud Database Engine** (`hybridDB`), synchronizing across:
- **Google Drive**: `1eP5r5iQVcTqgzWTkgXdqEPgphjJzsIKp`
- **Google Spreadsheets**: Automated export and formula evaluator matrices.
- **Supabase Cloud**: `cymfxzavswcfwzhttgfu.supabase.co`
- **Firebase Firestore**: `ai-studio-vernikaapp-8707d070-17aa-4c19-ac02-f2098c36884f`

## Vercel Deployment

This application can be deployed as a standalone web application on Vercel or Render.
- Deployment Build Command: `npm run build`
- Output Directory: `dist`
