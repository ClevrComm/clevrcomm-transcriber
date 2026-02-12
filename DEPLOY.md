# How to Deploy Your App (Vercel)

To share this app with your team, the easiest way is to deploy it on **Vercel** (free).

## Prerequisites

1. **GitHub Account**: You'll need to push your code to a GitHub repository.
2. **Vercel Account**: Sign up at [vercel.com](https://vercel.com).

## Steps

### 1. Push to GitHub

I have already **initialized Git** and **committed your code** for you. You just need to create the home for it:

1. Go to [github.com/new](https://github.com/new) and create a repository named `clevrcomm-transcriber`.
2. Copy the two lines they show under "**...or push an existing repository from the command line**". They look like this:

    ```bash
    git remote add origin https://github.com/yourname/clevrcomm-transcriber.git
    git push -u origin main
    ```

3. Paste those into your terminal.

### 2. Connect to Vercel

1. Go to [vercel.com/new](https://vercel.com/new).
2. Click **Import** next to your new GitHub repository.
3. **Environment Variables** (IMPORTANT):
    - `VITE_GEMINI_API_KEY`: [Your Key]
    - `VITE_APP_PASSWORD`: `clevr2026` (or your choice)
4. Click **Deploy**.

### 3. Verification

- Once deployed, Vercel will give you a public URL (e.g., `https://your-app.vercel.app`).
- Your team can access this URL.
- **Security**: Anyone with the link can use your API key quota. Vercel allows you to add password protection (Pro plan) or you can rely on the fact that the URL is obscure.

## Notes

- **Proxy**: I added a special file `api/proxy.js` which Vercel defaults to using. This ensures the "Analyze URL" feature works online by handling the cross-origin requests securely.

## Troubleshooting

### Incorrect Project Name / URL

If Vercel deployed your app to a URL like `clevrcomm-transcriber-c8qt.vercel.app` instead of `clevrcomm-transcriber.vercel.app`:

1. Go to your project in the **Vercel Dashboard**.
2. Click **Settings** -> **Domains**.
3. Click **Edit** next to the current domain.
4. Change it to `clevrcomm-transcriber.vercel.app`.
5. If it says "Taken", you may need to use a slightly different name or connect a custom domain.
