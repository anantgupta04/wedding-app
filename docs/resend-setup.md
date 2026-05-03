# Set Up Resend (Email)

## Step 1 — Make Account

Go to **resend.com**. Click Sign Up. Use email. Confirm email. Done.

---

## Step 2 — Get Key

1. You inside Resend dashboard now.
2. Click **API Keys** on left.
3. Click **Create API Key**.
4. Name it `wedding-app`. Full access. Click Create.
5. Copy the key. It look like `re_abc123...`. **Copy now. You not see it again.**

---

## Step 3 — Put Key in Vercel

1. Go to **vercel.com** → your project → **Settings** → **Environment Variables**.
2. Add new variable:
   - Name: `RESEND_API_KEY`
   - Value: paste your key from Step 2
   - Environments: check **Production**, **Preview**, **Development**
3. Click Save.
4. Go to **Deployments** tab → click **...** on latest deploy → **Redeploy**. (New env var need redeploy to take effect.)

---

## Step 4 — Put Key in Local Dev

Open `.env.local` file in project root. Add this line:

```
RESEND_API_KEY=re_your_key_here
```

If file not exist, create it. Make sure `.env.local` is in `.gitignore` (it already is).

---

## Step 5 — Change Sender Address (Optional But Good)

Right now emails come from `noreply@resend.dev`. That fine for testing.

For real wedding, you want `noreply@yourdomain.com`. To do that:

1. In Resend dashboard → **Domains** → **Add Domain** → enter your domain.
2. Add the DNS records Resend shows you (takes 5–10 min).
3. Once verified, open `lib/email/resend.ts` line 9 and change:
   ```ts
   from: 'Wedding App <noreply@resend.dev>',
   ```
   to:
   ```ts
   from: 'Wedding App <noreply@yourdomain.com>',
   ```
4. Commit and push.

---

## Test It

Submit a real RSVP on your invite page. Two emails should fire:

- **Couple gets**: "New RSVP from [Guest Name]"
- **Guest gets** (if they gave email): "Your RSVP for [Wedding Name] is confirmed"

Check spam if you not see it.

---

## Free Tier Limits

Resend free plan = **3,000 emails/month**, 100/day. For a 300-guest wedding this is plenty.
