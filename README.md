# WhatsApp Bewerbungsbot

A WhatsApp chatbot that pre-screens job applicants for a security services company. Applicants answer a short guided questionnaire in WhatsApp (for example whether they hold the Sachkundeprüfung under §34a GewO), and every completed application is written to a Google Sheet for the recruiting team.

![CI](https://github.com/mohamedalikhbou45-star/whatsapp-bot/actions/workflows/ci.yml/badge.svg)

## How it works

```
Applicant (WhatsApp) ──► Meta WhatsApp Cloud API ──► Webhook (this server) ──► Google Sheets API
                     ◄── buttons / text replies ◄──
```

1. Meta sends every incoming message to `POST /webhook`.
2. The server keeps a short session per phone number and walks the applicant through the steps in `flow.js` (button answers and validated free-text answers).
3. When the questionnaire is complete, the answers are appended as one row in Google Sheets.
4. Phone numbers that already applied are recognised and get a short "already done" reply instead of a second questionnaire.

## Tech stack

- Node.js, Express
- Meta WhatsApp Cloud API (webhooks, interactive button messages)
- Google Sheets API with a service account
- Docker, GitHub Actions, deployed on Railway

## Security and privacy

- Webhook requests are verified with Meta's `X-Hub-Signature-256` HMAC signature when `META_APP_SECRET` is set.
- Phone numbers are masked in the logs, and answers are never logged. Full payload logging is only available locally through `DEBUG_WEBHOOK=true`.
- All credentials come from environment variables; see `.env.example`.
- The container runs as an unprivileged user and exposes a `/health` endpoint.

## Project structure

| File | Purpose |
| --- | --- |
| `index.js` | Express server, webhook verification, conversation logic |
| `flow.js` | The questionnaire: steps, buttons, validation, final messages |
| `whatsapp.js` | Sending text and button messages via the Cloud API |
| `sheets.js` | Google Sheets access: duplicate check, append row, headers |

## Run locally

```bash
cp .env.example .env   # fill in your own values
npm install
npm run dev
```

## Run with Docker

```bash
docker build -t whatsapp-bot .
docker run --env-file .env -p 3000:3000 whatsapp-bot
curl http://localhost:3000/health
```

## Continuous integration

Every push runs a GitHub Actions workflow that installs the dependencies, checks all files for syntax errors, builds the Docker image and starts it to check the `/health` endpoint.

## How I work with AI

I build with AI coding agents (Claude Code) and treat them like a fast junior developer that needs clear direction:

- **Context first:** [AGENTS.md](AGENTS.md) gives the agent the rules of this project (masked phone numbers, signature check, questionnaire and sheet columns kept in sync), so it doesn't have to guess.
- **Small, reviewable steps:** one feature or fix per change, and I read every diff before committing.
- **I own the decisions:** I designed the questionnaire with the recruiting team's needs in mind. The agent helps implement, and I test with real WhatsApp messages.
- **Automated checks:** CI (syntax check, Docker build, health check) runs on every push, so mistakes from me or the agent are caught early.

## About

Built by Mohamed Ali Khbou, Computational Engineering Science student at TU Berlin.
