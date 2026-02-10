import fetch from 'node-fetch';

export default async function handler(req, res) {
    const { url } = req.query;

    if (!url) {
        return res.status(400).json({ error: 'Missing URL parameter' });
    }

    try {
        // Basic validation to prevent abuse (optional, but good practice)
        // if (!url.startsWith('https://cdn.discordapp.com')) {
        //   return res.status(403).json({ error: 'Only Discord URLs are allowed' });
        // }

        const response = await fetch(url);

        if (!response.ok) {
            return res.status(response.status).send(response.statusText);
        }

        const contentType = response.headers.get('content-type');
        const buffer = await response.arrayBuffer();

        // Set CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.setHeader('Content-Type', contentType || 'application/octet-stream');

        // Send the file
        res.send(Buffer.from(buffer));

    } catch (error) {
        console.error('Proxy Error:', error);
        res.status(500).json({ error: 'Failed to fetch resource' });
    }
}
