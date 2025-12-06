const https = require('https');

const fs = require('fs');
const path = require('path');

// Manually read .env.local
let apiKey = "";
try {
    const envPath = path.join(__dirname, '.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/GOOGLE_API_KEY=(.*)/);
    if (match && match[1]) {
        apiKey = match[1].trim().replace(/^["']|["']$/g, ''); // Remove quotes if present
    }
} catch (e) {
    console.error("❌ COULD NOT READ .ENV.LOCAL");
}


if (!apiKey) {
    console.error("❌ KEY NOT FOUND");
    process.exit(1);
}

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

https.get(url, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            if (json.error) {
                console.error("❌ API ERROR:", json.error);
            } else {
                console.log("✅ AVAILABLE MODELS:");
                (json.models || []).forEach(m => {
                    if (m.supportedGenerationMethods.includes('generateContent')) {
                        console.log(`- ${m.name}`);
                    }
                });
            }
        } catch (e) {
            console.error("❌ PARSE ERROR:", e.message);
            console.log(data);
        }
    });

}).on('error', (err) => {
    console.error("❌ NETWORK ERROR:", err.message);
});
