# Production environment variables

Set these in Vercel Project Settings -> Environment Variables.

## Required for real virtual fitting
- FASHN_API_KEY=your FASHN Developer API key
- Optional: FASHN_TRYON_MODEL=tryon-max

## Required for Firebase password reset
Use one of:
- FIREBASE_SERVICE_ACCOUNT_JSON
or:
- FIREBASE_PROJECT_ID
- FIREBASE_CLIENT_EMAIL
- FIREBASE_PRIVATE_KEY

## Email
- EMAIL_USER
- EMAIL_PASS
- Optional: BRAND_NAME
- Optional: BRAND_LOGO_URL
- Optional: SUPPORT_EMAIL

## AI concierge
- GEMINI_API_KEY
- Optional: GEMINI_TEXT_MODEL=gemini-2.5-flash

## Database
- MONGODB_URI
