# Digital Twin integration

This branch adds a career chat widget to all six existing HTML pages. The original site stays on GitHub Pages. The AI request is handled by a separately hosted Next.js application; GitHub Pages cannot run its private server code.

## Server configuration

The backend is deployed at `https://gbanjah-digital-twin.vercel.app`. The widget is configured to call its `/api/chat` endpoint. Use the following procedure when moving to another backend:

1. Deploy the Next.js `SITE` project to Vercel. Do not deploy this static repository as the AI backend.
2. Set server environment variables in Vercel: `OPENROUTER_API_KEY` (secret), `OPENROUTER_MODEL=liquid/lfm-2.5-2.6b:free`, and `CHAT_ALLOWED_ORIGINS=https://gbanja.github.io`.
3. In `js/digital-twin-config.js`, set `window.DIGITAL_TWIN_ENDPOINT` to the stable production URL followed by `/api/chat`.
4. Test a real answer, follow-up, unknown fact, Stop and Clear. Confirm CORS allows the GitHub origin and rejects unrelated origins.
5. Publish the tested branch using the repository's existing Pages publishing configuration.

The endpoint URL is public. The OpenRouter key must never be added to JavaScript, HTML, GitHub Pages files or commit history. An empty endpoint intentionally leaves the widget hidden until the server is ready.

## Files and behavior

- `js/digital-twin.js`: UI and HTTP requests, isolated in a Shadow DOM so existing page styles and form handlers do not collide with the chat.
- `css/digital-twin.css`: dark panel with the original portfolio's navy/gold accents, responsive layout and visible keyboard focus.
- `js/digital-twin-config.js`: only the public server endpoint.
- All six HTML pages load the configuration followed by the shared script. Blog pages use `../js/` paths.

Answers render as text, not HTML. Only completed exchanges enter follow-up history. Stop/Close cancel pending requests; Clear erases the local conversation and ignores late replies. No browser storage is used. Because this is a multipage site, navigating to another page starts a fresh chat.

Recent history is bounded to six exchanges plus the new question, 24,000 characters and 32,000 UTF-8 bytes. Individual questions allow 1,500 characters. Request timeout is 50 seconds. Errors offer retry and direct email contact.

## Current release state

The widget is configured for the production Vercel backend. Vercel's active firewall rule limits POST requests to `/api/chat` to 12 per minute per IP, in addition to the app's per-process budget. Production selects `liquid/lfm-2.5-2.6b:free`, verified with the account after the general free router returned an unusable moderation-label answer. Free-provider availability and limits still apply. An IP limit is not a global daily cap. The Next.js workspace holds the automated tests and full deployment guide. Publishing this repository through its existing `main` branch / root GitHub Pages source activates the widget on all six pages.

## Practice

Find the three starter questions in `js/digital-twin.js`. Change one, then explain why changing a suggestion does not change the career facts held on the server.
