const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
    name: 'gpt4',
    description: 'Interact with a free AI API (Gemini proxy)',
    usage: 'gpt4 [your message]',
    author: 'Raniel',

    async execute(senderId, args, pageAccessToken) {
        const prompt = args.join(' ');
        if (!prompt)
            return sendMessage(senderId, { text: "Usage: gpt4 <question>" }, pageAccessToken);

        try {
            // ✅ Free API — no key required
            const { data } = await axios.get(`https://api.azzam.wtf/api/gemini?text=${encodeURIComponent(prompt)}`);
            const response = data.response || "No response received.";

            const parts = [];
            for (let i = 0; i < response.length; i += 1999) {
                parts.push(response.substring(i, i + 1999));
            }

            // Send each chunk of the response
            for (const part of parts) {
                await sendMessage(senderId, { text: part }, pageAccessToken);
            }

        } catch (error) {
            console.error(error);
            sendMessage(
                senderId,
                { text: 'There was an error generating the content. Please try again later.' },
                pageAccessToken
            );
        }
    }
};
