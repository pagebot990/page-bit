const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
    name: 'gpt4',
    description: 'Interact with GPT-4o (BetaDash API)',
    usage: 'gpt4 [your message]',
    author: 'coffee',

    async execute(senderId, args, pageAccessToken) {
        const prompt = args.join(' ');
        if (!prompt)
            return sendMessage(senderId, { text: "Usage: gpt4 <question>" }, pageAccessToken);

        try {
            // ✅ API call
            const { data } = await axios.get(
                `https://betadash-api-swordslush-production.up.railway.app/gpt4?ask=${encodeURIComponent(prompt)}`
            );

            // ✅ Handle both text or JSON responses
            let responseText = "";
            if (typeof data === "string") {
                responseText = data;
            } else if (data.response) {
                responseText = data.response;
            } else if (data.output) {
                responseText = data.output;
            } else if (data.answer) {
                responseText = data.answer;
            } else {
                responseText = JSON.stringify(data);
            }

            // ✅ Split long messages
            const parts = [];
            for (let i = 0; i < responseText.length; i += 1999) {
                parts.push(responseText.substring(i, i + 1999));
            }

            // ✅ Send each part to the user
            for (const part of parts) {
                await sendMessage(senderId, { text: part }, pageAccessToken);
            }

        } catch (error) {
            console.error("❌ GPT-4 command error:", error.message);
            if (error.response) {
                console.error("API response:", error.response.data);
            }
            sendMessage(
                senderId,
                { text: 'There was an error generating the content. Please try again later.' },
                pageAccessToken
            );
        }
    }
};
