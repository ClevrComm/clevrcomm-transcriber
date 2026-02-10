# How to Deploy Your App (Vercel)

To share this app with your team, the easiest way is to deploy it on **Vercel** (free).

## Prerequisites

1. **GitHub Account**: You'll need to push your code to a GitHub repository.
2. **Vercel Account**: Sign up at [vercel.com](https://vercel.com).

## Steps

### 1. Push to GitHub

1. Initialize git if you haven't:

    ```bash
    git init
    git add .
    git commit -m "Initial commit"
    ```

2. Create a new repository on GitHub.
3. Push your code:

    ```bash
    git remote add origin <your-repo-url>
    git push -u origin main
    ```

### 2. Import into Vercel

1. Go to your Vercel Dashboard and click **"Add New..." -> "Project"**.
2. Select your GitHub repository.
3. **Configure Project**:
    - **Framework Preset**: Vite (should detect auto)
    - **Root Directory**: `./`
    - **Environment Variables** (CRITICAL):
        - Name: `VITE_GEMINI_API_KEY`
        - Value: `your_actual_gemini_api_key_here`
4. Click **Deploy**.

### 3. Verification

- Once deployed, Vercel will give you a public URL (e.g., `https://your-app.vercel.app`).
- Your team can access this URL.
- **Security**: Anyone with the link can use your API key quota. Vercel allows you to add password protection (Pro plan) or you can rely on the fact that the URL is obscure.

## Notes

- **Proxy**: I added a special file `api/proxy.js` which Vercel defaults to using. This ensures the "Analyze URL" feature works online by handling the cross-origin requests securely.
