const Groq = require("groq-sdk");

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

async function main() {
    try {
        const models = await groq.models.list();
        console.log("Available Models:");
        models.data.forEach((model) => {
            console.log(`- ${model.id} (owned by ${model.owned_by})`);
        });
    } catch (error) {
        console.error("Error listing models:", error);
    }
}

main();
