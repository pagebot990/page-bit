const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
    name: 'gpt4',
    description: 'Interact with GPT-4o',
    usage: 'gpt4 [your message]',
    author: 'Raniel',

    async execute(senderId, args, pageAccessToken) {
        const prompt = args.join(' ');
        if (!prompt) {
            return sendMessage(senderId, { text: "Usage: gpt4 <question>" }, pageAccessToken);
        }

        try {
            // CALL YOUR API
            const res = await axios.get(
                `https://api-library-kohi.onrender.com/api/gemini?prompt=${encodeURIComponent(prompt)}`
            );

            // The actual response is inside res.data.data
            const output = res.data?.data;

            if (!output) {
                return sendMessage(senderId, { text: "API returned no response." }, pageAccessToken);
            }

            // SPLIT MESSAGE INTO 1999 CHUNKS
            const parts = [];
            for (let i = 0; i < output.length; i += 1999) {
                parts.push(output.substring(i, i + 1999));
            }

            // SEND EACH PART
            for (const part of parts) {
                await sendMessage(senderId, { text: part }, pageAccessToken);
            }

        } catch (err) {
            console.error("GPT ERROR:", err?.response?.data || err.message);
            sendMessage(
                senderId,
                { text: 'There was an error generating the content. Please try again later.' },
                pageAccessToken
            );
        }
    }
};
