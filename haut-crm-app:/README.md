# Haut CGI — Client Ledger

A small CRM app connected to a Google Sheet as its database. No secrets are stored in
this code — everything sensitive is read from environment variables you set on Vercel.

## What you already have
- A Google Sheet with a header row matching the fields below.
- A Google Cloud service account JSON key (you already created and downloaded this;
  keep that file private, don't upload it anywhere public or paste it into chat).
- The Sheet has been shared with the service account's email as an Editor.

## Deploy steps

### 1. Put this code on GitHub
1. Create a free account at github.com if you don't have one.
2. Create a new empty repository, e.g. `haut-crm-app`.
3. Upload all the files in this folder to that repository (GitHub's web
   "Add file → Upload files" works fine — drag the whole folder in).

### 2. Import into Vercel
1. Go to vercel.com → sign up/log in (you can use your GitHub account to sign in,
   which also makes step 3 automatic).
2. Click "Add New… → Project" → select the `haut-crm-app` repository you just created.
3. Vercel will detect it's a Next.js app automatically. Don't click Deploy yet —
   first add the environment variables (next step), then deploy.

### 3. Add environment variables (this is where your secret goes — safely)
In the Vercel project setup screen, find "Environment Variables" and add these one at a time:

| Name | Value |
|---|---|
| `GOOGLE_SHEET_ID` | The ID from your sheet's URL (the long string between `/d/` and `/edit`) |
| `GOOGLE_CLIENT_EMAIL` | The `client_email` value from your service account JSON file |
| `GOOGLE_PRIVATE_KEY` | The full `private_key` value from that JSON file, including the `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----` lines |
| `GOOGLE_SHEET_TAB` | The name of the tab/sheet inside the spreadsheet (usually `Sheet1`) |

This is the ONE place your private key should ever be pasted — Vercel's environment
variables are encrypted and never appear in your public code or in any chat log.

### 4. Deploy
Click Deploy. Vercel will build the app and give you a live URL like
`haut-crm-app.vercel.app` — that's your permanent CRM link, works on any device.

### 5. First load
Open the URL. The app will automatically write a header row to your sheet if it's
empty, matching the columns:
`id, name, email, phone, company, contactType, industry, leadSource, stage, clientHistory, productInterest, occasion, linkedinUrl, linkedinStatus, notes`

If your sheet's header row already has different column names, either rename them
to match this list exactly, or clear the first row and let the app create it fresh.

## Fields reference

- **Industry**: Beauty & Fashion, Luxury, Consumer Electronics, Automotive, Hospitality, Retail, Real Estate, Other
- **Contact Type**: Brand, Agency
- **Lead Source**: Sahal, Google Ads, Cold Outreach — Email, Cold Outreach — LinkedIn, Referral, Other
- **Pipeline Stage**: Price Inquiry, Concept Presented, Won — First Sale, Won — Repeat Sale, Lost — After Inquiry, Lost — After Concept
- **Client History**: Not Purchased Yet, First Sale, Repeat Client
- **Product Interest**: Full CGI, FOOH, AI, 3D / Other
- **Occasion**: Product Launch, Event / Activation, Holiday / Seasonal, Other
- **LinkedIn Status**: Not Found, Found — Not Connected, Connection Sent, Connected

## If something breaks
The app shows a "Sync error" message with details if it can't reach the sheet —
usually this means one of the environment variables is missing or the sheet
wasn't shared with the service account email. Double-check step 3 and that the
sheet was shared as Editor with the exact `client_email` address.
