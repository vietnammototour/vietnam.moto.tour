# Contact Form Email Integration — Design Spec

## Overview

Add working email functionality to the existing contact form on `/contact`. When a user submits the form, two emails are sent via Gmail SMTP: one inquiry notification to the business, and one confirmation to the sender. Cloudflare Turnstile provides bot protection.

## Approach

All-in-one Next.js API route (`/api/contact`). No queues, no external email services. Nodemailer sends via Gmail SMTP directly from the VPS.

## Data Flow

```
User fills form → clicks submit
  → Turnstile widget generates token
  → Frontend POST /api/contact { name, email, phone, tourInterest, message, turnstileToken }
  → API route:
      1. Validate fields (required, email format)
      2. Verify Turnstile token with Cloudflare API
      3. Send email to easyridermotorbiketour@gmail.com (full inquiry)
      4. Send confirmation email to sender
      5. Return { success: true }
  → Frontend shows inline success message, hides form
  → On error: show error message, form stays filled
```

## New Dependencies

- `nodemailer` — SMTP email sending
- `@marsidev/react-turnstile` — React component for Cloudflare Turnstile widget

## Environment Variables (`.env.local`)

- `GMAIL_USER` — `easyridermotorbiketour@gmail.com`
- `GMAIL_APP_PASSWORD` — Gmail App Password (not regular password)
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` — from Cloudflare dashboard (public, exposed client-side via Next.js `NEXT_PUBLIC_` prefix)
- `TURNSTILE_SECRET_KEY` — from Cloudflare dashboard (server-side only)

## Form Fields

| Field         | Type            | Required | Validation                 |
| ------------- | --------------- | -------- | -------------------------- |
| Name          | text input      | yes      | min 2 chars                |
| Email         | email input     | yes      | email format regex         |
| Phone         | tel input       | yes      | min 6 chars                |
| Tour Interest | select dropdown | yes      | must match predefined list |
| Message       | textarea        | yes      | min 10 chars               |

### Tour Interest Options (translated via next-intl)

- Ha Giang Loop
- Central Highlands
- Ho Chi Minh Trail
- Coastal Route
- Custom Tour
- General Question

### Validation

Client-side for UX (instant feedback), server-side for security (never trust client). Same rules both sides.

### Turnstile Widget

Rendered below message field, above submit button. Invisible mode — no user interaction unless Cloudflare flags suspicious activity.

## Email Templates

### Email to Business (`easyridermotorbiketour@gmail.com`)

```
Subject: New Contact Inquiry — {tourInterest}

Name: {name}
Email: {email}
Phone: {phone}
Tour Interest: {tourInterest}

Message:
{message}
```

Plain text, no HTML.

### Confirmation to Sender

```
Subject: Thank you for contacting Vietnam Moto Tour

Hi {name},

We received your message and will get back to you within 24 hours.

Your inquiry:
- Tour Interest: {tourInterest}
- Message: {message}

Best regards,
Vietnam Moto Tour Team
Phone: +84-935-797-550
```

Plain text. From address: `"Vietnam Moto Tour" <easyridermotorbiketour@gmail.com>`.

## Frontend States

- **Idle** — form visible, ready to fill
- **Submitting** — button disabled, shows spinner/loading text, form fields disabled
- **Success** — form replaced with inline thank-you message: "Thank you! We'll get back to you within 24 hours."
- **Error** — error message shown above submit button, form stays filled so user can retry

## Error Handling

| Error                        | User sees                                      | Server                  |
| ---------------------------- | ---------------------------------------------- | ----------------------- |
| Missing/invalid fields       | Field-level validation messages                | 400 response            |
| Turnstile verification fails | "Verification failed, please try again"        | 400 response            |
| Gmail SMTP fails             | "Something went wrong, please try again later" | 500 response, log error |
| Network error                | "Could not connect, check your internet"       | fetch catch             |

### Partial Failure

If email-to-business sends but confirmation-to-sender fails: still return success (inquiry arrived). Log confirmation failure server-side.

## Files Touched/Created

- `src/pages/api/contact.ts` — new API route (validation, Turnstile verify, Nodemailer send)
- `src/pages/contact.tsx` — update form with new fields, Turnstile widget, fetch logic, form states
- `src/messages/en.json` / `vi.json` — new translation keys for form states, tour options, validation messages
- `.env.local` — secrets (gitignored)
