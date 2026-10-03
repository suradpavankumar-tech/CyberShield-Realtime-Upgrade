# CyberShield URL Guard

A Manifest V3 browser extension that analyzes the current HTTP(S) page URL using CyberShield's existing authenticated URL analysis endpoint.

## Architecture

The extension does not implement a second phishing engine. It sends:

POST {API_BASE_URL}/analysis/url

with an input_type of URL and the current tab URL.

The backend remains authoritative for URL normalization, validation, lexical/rule analysis, ML signals, DNS/TLS/HTTP evidence, redirects, reputation and final risk assessment.

## Authentication

No backend API key, signing secret, database credential or other server secret is embedded in the extension.

The user supplies:
- CyberShield API base URL
- their own CyberShield JWT session token

These values are stored in Chrome extension local storage. Treat the JWT as a sensitive user credential and remove it from the extension settings when no longer needed.

## Loading locally in Chrome

1. Open chrome://extensions.
2. Enable Developer mode.
3. Choose Load unpacked.
4. Select the repository's extension/ directory.
5. Open Extension settings and configure the deployed CyberShield API URL and an authenticated JWT.
6. Browse to an HTTP(S) page and click the CyberShield extension icon.
7. Select Analyze current URL.

The extension declares HTTP(S) host permissions so its extension context can call the configured CyberShield backend. Keep the configured backend restricted to the intended CyberShield deployment.

## Failure handling

The popup reports unsupported browser pages, missing configuration, authentication failures, API validation/rejection and network failures.

It never substitutes a local or fabricated risk result when the backend is unavailable.

## Security boundaries

The extension:
- analyzes only the URL exposed by the active tab
- does not read page passwords, form fields or cookies
- does not collect credentials
- does not inject malware or persistence
- does not attempt exploitation or evasion
- does not contain backend secrets
