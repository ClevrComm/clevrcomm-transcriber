import fetch from 'node-fetch';

const PROXY_URL = "https://api.allorigins.win/raw?url=";
const TARGET_URL = "https://cdn.discordapp.com/attachments/1241121334290022440/1468717552917287115/3450686765052.mp3?ex=698ba0d0&is=698a4f50&hm=9ab429d312916fb4780e5fbbfe3269e0b7709a79b1bf70c9606375a96cd05671&";

async function checkHeaders() {
    const fullUrl = PROXY_URL + encodeURIComponent(TARGET_URL);
    console.log(`Testing: ${fullUrl}`);

    try {
        const response = await fetch(fullUrl, { method: 'HEAD' }); // Check headers

        console.log("Status:", response.status);
        console.log("CORS Headers:");
        console.log("Access-Control-Allow-Origin:", response.headers.get('access-control-allow-origin'));

        // Also try a small GET to be sure
        const getResponse = await fetch(fullUrl, { method: 'GET' });
        console.log("GET Status:", getResponse.status);
        console.log("Content-Type:", getResponse.headers.get('content-type'));

        if (response.headers.get('access-control-allow-origin')) {
            console.log("SUCCESS: Proxy adds CORS headers.");
        } else {
            console.log("FAILURE: No CORS header found.");
        }

    } catch (error) {
        console.error("Error:", error);
    }
}

checkHeaders();
