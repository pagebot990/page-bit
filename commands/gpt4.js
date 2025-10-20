const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
    name: 'gpt4',
    description: 'Interact with GPT-4o (BetaDash API, streaming-safe)',
    usage: 'gpt4 [your message]',
    author: 'Raniel',

    async execute(senderId, args, pageAccessToken) {
        const prompt = args.join(' ');
        if (!prompt)
            return sendMessage(senderId, { text: "Usage: gpt4 <question>" }, pageAccessToken);

        try {
            // ✅ Make request (stream-safe)
            const { data } = await axios.get(
                `https://betadash-api-swordslush-production.up.railway.app/Llama70b?ask=${encodeURIComponent(prompt)}`,
                { responseType: 'text' } // important: get raw text
            );

            // ✅ Extract all "content" parts
            const contentMatches = data.match(/"content":"(.*?)"/g);
            let finalResponse = "";

            if (contentMatches) {
                finalResponse = contentMatches
                    .map(m => m.replace(/"content":"|"/g, '').replace(/\\n/g, '\n'))
                    .join(' ');
            } else {
                // fallback if API changes format
                finalResponse = data;
            }

            // ✅ If still empty
            if (!finalResponse.trim()) finalResponse = "No response from GPT-4 API.";

            // ✅ Split long messages
            const parts = [];
            for (let i = 0; i < finalResponse.length; i += 1999) {
                parts.push(finalResponse.substring(i, i + 1999));
            }

            // ✅ Send each part
            for (const part of parts) {
                await sendMessage(senderId, { text: part }, pageAccessToken);
            }

        } catch (error) {
            console.error("❌ GPT-4 command error:", error.message);
            if (error.response) console.error("API response:", error.response.data);
            sendMessage(
                senderId,
                { text: 'There was an error processing your request.' },
                pageAccessToken
            );
        }
    }
};
