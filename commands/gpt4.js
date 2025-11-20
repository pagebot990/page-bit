const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
    name: 'gpt4',
    description: 'Interact with GPT-4o (via api-library-kohi)',
    usage: 'gpt4 [your message]',
    author: 'Raniel',

    async execute(senderId, args, pageAccessToken) {
        const prompt = args.join(' ');
        if (!prompt)
            return sendMessage(senderId, { text: "Usage: gpt4 <question>" }, pageAccessToken);

        try {
            // ✅ Call your API
            const { data } = await axios.get(
                `https://api-library-kohi.onrender.com/api/amd-gpt?prompt=${encodeURIComponent(prompt)}`,
                { responseType: 'json' }
            );

            // ✅ Extract message properly
            let finalResponse = "";
            if (data && data.data) {
                finalResponse = data.data;
            } else {
                finalResponse = "No response from GPT-4 API.";
            }

            // ✅ Split long messages if needed
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
