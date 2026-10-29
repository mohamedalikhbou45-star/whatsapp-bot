# Agent instructions: whatsapp-bot

Context for AI coding agents (Claude Code, Codex, etc.) working in this repository.

## Project
Node.js/Express webhook for the Meta WhatsApp Cloud API. It walks job applicants through the questionnaire in `flow.js` and stores the answers in Google Sheets (`sheets.js`). Deployed on Railway with the Dockerfile.

## Commands
- `npm run dev`: run locally with auto-reload
- `docker build -t whatsapp-bot . && docker run --env-file .env -p 3000:3000 whatsapp-bot`
- CI checks syntax, builds the image and calls `/health`; keep `/health` working without credentials.

## Rules
- Applicants' answers are personal data: never log phone numbers unmasked (use `mask()`), never log answers.
- `POST /webhook` must answer 200 quickly and keep the signature check (`hasValidSignature`).
- Questionnaire text is German and addresses applicants with "du". Change questions only in `flow.js`; the sheet columns in `sheets.js` must stay in the same order as the steps.
- Credentials only through environment variables; add new ones to `.env.example`.

## Before finishing
Run `node --check` on changed files and describe what you changed and why.
