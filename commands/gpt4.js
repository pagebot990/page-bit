const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
    name: 'gpt4',
    description: 'Interact with GPT API',
    usage: 'gpt4 [your message]',
    author: 'Raniel',

    async execute(senderId, args, pageAccessToken) {
        const prompt = args.join(' ');
        if (!prompt) {
            return sendMessage(senderId, { text: "Usage: gpt4 <question>" }, pageAccessToken);
        }

        try {
            const res = await axios.get(
                `https://chatgpt-api.shuttle.dev/?q=${encodeURIComponent(prompt)}`
            );

            const output = res.data?.message;
            if (!output) {
                return sendMessage(senderId, { text: "API returned no response." }, pageAccessToken);
            }

            const parts = [];
            for (let i = 0; i < output.length; i += 1999) {
                parts.push(output.substring(i, i + 1999));
            }

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
