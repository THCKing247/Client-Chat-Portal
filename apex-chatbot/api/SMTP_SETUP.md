# SMTP Configuration Guide

This guide explains how to configure SMTP for sending welcome emails to new users.

## Quick Setup

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Choose an SMTP provider and add the credentials to your `.env` file

3. Restart your API server

## SMTP Provider Options

### Option 1: Gmail (Easiest for Testing)

**Steps:**
1. Go to your Google Account settings
2. Enable 2-Factor Authentication (required)
3. Go to "App Passwords" (https://myaccount.google.com/apppasswords)
4. Create a new app password for "Mail"
5. Copy the 16-character password

**Add to `.env`:**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-16-char-app-password
SMTP_FROM=your-email@gmail.com
```

**Note:** Gmail has sending limits (500 emails/day for free accounts)

---

### Option 2: SendGrid (Recommended for Production)

**Steps:**
1. Sign up at https://sendgrid.com (free tier: 100 emails/day)
2. Go to Settings → API Keys
3. Create a new API Key with "Mail Send" permissions
4. Copy the API key

**Add to `.env`:**
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key-here
SMTP_FROM=noreply@yourdomain.com
```

---

### Option 3: Mailgun (Good for Production)

**Steps:**
1. Sign up at https://www.mailgun.com (free tier: 5,000 emails/month)
2. Verify your domain or use their sandbox domain for testing
3. Go to Sending → Domain Settings
4. Copy your SMTP credentials

**Add to `.env`:**
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=your-mailgun-username
SMTP_PASSWORD=your-mailgun-password
SMTP_FROM=noreply@yourdomain.com
```

---

### Option 4: AWS SES (Best for High Volume)

**Steps:**
1. Set up AWS SES in your AWS account
2. Verify your email address or domain
3. Create SMTP credentials in SES console
4. Copy the SMTP server endpoint and credentials

**Add to `.env`:**
```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com  # Use your region's endpoint
SMTP_PORT=587
SMTP_USER=your-aws-ses-smtp-username
SMTP_PASSWORD=your-aws-ses-smtp-password
SMTP_FROM=noreply@yourdomain.com
```

---

### Option 5: Custom SMTP Server

If you have your own mail server:

**Add to `.env`:**
```env
SMTP_HOST=mail.yourdomain.com
SMTP_PORT=587  # or 465 for SSL
SMTP_USER=your-email@yourdomain.com
SMTP_PASSWORD=your-password
SMTP_FROM=noreply@yourdomain.com
```

**Port Notes:**
- Port 587: TLS/STARTTLS (recommended)
- Port 465: SSL (secure)
- Port 25: Usually blocked by ISPs

---

## Testing Your Configuration

After setting up SMTP, test it by creating a new user. The system will:
1. Create the user account
2. Send a welcome email automatically
3. Log success/error messages in the console

**Check the API logs** for:
- ✅ `Welcome email sent to user@example.com` (success)
- ⚠️ `SMTP not configured, skipping welcome email` (not configured)
- ❌ `Failed to send welcome email` (configuration error)

---

## Troubleshooting

### Email not sending?

1. **Check environment variables:**
   - Make sure all SMTP variables are set in `.env`
   - Restart the server after changing `.env`

2. **Check logs:**
   - Look for error messages in the API console
   - Common errors: "Invalid login", "Connection timeout"

3. **Test SMTP connection:**
   - Use an SMTP testing tool like https://www.smtper.net/
   - Verify credentials are correct

4. **Gmail-specific issues:**
   - Must use App Password (not regular password)
   - 2FA must be enabled
   - Check "Less secure app access" is disabled (use App Password instead)

5. **Firewall/Network:**
   - Ensure port 587 or 465 is not blocked
   - Some networks block SMTP ports

---

## Security Notes

- **Never commit `.env` to git** (it's in `.gitignore`)
- Use App Passwords for Gmail, not your main password
- For production, use a dedicated email service (SendGrid, Mailgun, AWS SES)
- Verify your "From" email address matches your domain for better deliverability

---

## Optional: Disable Email Sending

If you don't want to send emails, simply don't set the SMTP variables. The system will skip email sending gracefully without errors.

