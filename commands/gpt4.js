const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
    name: 'gpt4',
    description: 'Interact with GPT-4o (Hiroshi API - clean response)',
    usage: 'gpt4 [your message]',
    author: 'Raniel',

    async execute(senderId, args, pageAccessToken) {
        const prompt = args.join(' ');
        if (!prompt)
            return sendMessage(senderId, { text: "Usage: gpt4 <question>" }, pageAccessToken);

        try {
            // ✅ Call the API
            const { data } = await axios.get(
                `https://hiroshi-api.onrender.com/ai/gpt3?ask=${encodeURIComponent(prompt)}`
            );

            // ✅ Extract response text safely
            let finalResponse = data?.response || "No response received.";

            // ✅ Clean Markdown and formatting
            finalResponse = finalResponse
                .replace(/[#*_`>~-]/g, '') // remove markdown symbols
                .replace(/\n{2,}/g, '\n')  // fix double newlines
                .trim();

            // ✅ Split if too long for Messenger
            const parts = [];
            for (let i = 0; i < finalResponse.length; i += 1999) {
                parts.push(finalResponse.substring(i, i + 1999));
            }

            // ✅ Send all message parts
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
