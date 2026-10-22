# Metamind marketing website

A responsive public marketing website for Metamind, an AI agent for Meta advertising audience discovery and controlled campaign management.

## Run locally

Requires Node.js 20 or newer. No third-party packages are required.

```bash
npm run dev
```

Open `http://localhost:4173`.

## Validate and build

```bash
npm test
npm run build
```

The build command creates a static site in `dist/`. The local Node server also provides the optional demo-request endpoint.

## Demo request configuration

Copy `.env.example` to `.env` in a hosting environment that loads environment variables, then set:

```text
DEMO_REQUEST_WEBHOOK_URL=https://your-secure-form-handler.example/endpoint
```

The website posts to `/api/demo-request`. The included server validates and limits requests before forwarding only the required fields. It does not log lead payloads. Without `DEMO_REQUEST_WEBHOOK_URL`, the form returns a visible configuration message and does not claim success or store the submission.

For static-only hosting, connect the form to an equivalent serverless handler before launch. Do not put webhook secrets or private credentials in browser code.

## Content and capability configuration

`site-config.js` records capabilities and launch blockers that require owner confirmation. Marketing analytics are intentionally disabled, and no Meta Pixel or Conversions API integration is installed on this marketing website.

The sample audience metrics are illustrative and internally consistent:

- Gift planner: 500 visitors, 30 purchases, 6.0% observed rate.
- Gift guide: 500 visitors, 15 purchases, 3.0% observed rate.
- Corporate gifts: insufficient data.

## Accessibility and interaction

- Semantic landmarks and a skip link
- Keyboard and Escape support for the mobile navigation
- Accessible tabs with arrow, Home, and End key navigation
- Native FAQ disclosure controls
- Visible labels, inline form errors, and live status messages
- Responsive layouts and reduced-motion support

## Launch blockers

- Confirm product feature availability and change unsupported claims to “planned.”
- Supply approved logo and brand assets.
- Confirm the production domain before adding canonical, sitemap, and Open Graph URLs.
- Supply approved privacy policy, legal entity, and contact details.
- Configure and test the demo request destination.
- Review consent, category restrictions, eligibility, billing, and attribution language with the appropriate owners.
- Confirm scheduled report preparation with approval before client delivery.

## Publication boundary

This build is for local review. It does not call Meta, publish audience sites, buy domains, spend money, connect a CRM, or deploy publicly.
