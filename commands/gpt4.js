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
            // ✅ Using your new API endpoint
            const { data } = await axios.get(
                `https://betadash-api-swordslush-production.up.railway.app/gpt4?ask=${encodeURIComponent(prompt)}`
            );

            // Some APIs return { response: "..."} or just plain text
            const response =
                data.response || data.output || data.answer || data || "No response received.";

            const parts = [];
            for (let i = 0; i < response.length; i += 1999) {
                parts.push(response.substring(i, i + 1999));
            }

            for (const part of parts) {
                await sendMessage(senderId, { text: part }, pageAccessToken);
            }

        } catch (error) {
            console.error("GPT-4 command error:", error.message);
            sendMessage(
                senderId,
                { text: 'There was an error generating the content. Please try again later.' },
                pageAccessToken
            );
        }
    }
};
        }
    }
};
