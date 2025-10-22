const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
    name: 'gpt4',
    description: 'Interact with GPT-4o (Kohi API - super clean)',
    usage: 'gpt4 [your message]',
    author: 'Raniel',

    async execute(senderId, args, pageAccessToken) {
        const prompt = args.join(' ');
        if (!prompt)
            return sendMessage(senderId, { text: "Usage: gpt4 <question>" }, pageAccessToken);

        try {
            // ✅ Request to your Kohi API
            const { data } = await axios.get(
                `https://api-library-kohi.onrender.com/api/gpt4o?prompt=${encodeURIComponent(prompt)}`,
                { responseType: 'text' }
            );

            let finalResponse = "";

            // ✅ Handle both JSON and plain text safely
            try {
                const parsed = typeof data === "string" ? JSON.parse(data) : data;
                finalResponse = parsed.response || parsed.output || parsed.text || "";
            } catch {
                finalResponse = data;
            }

            // ✅ Clean leftover JSON-like structure
            finalResponse = String(finalResponse)
                .replace(/^{\s*"response"\s*:\s*"|"}$/g, '') // remove {"response": "..."}
                .replace(/[#*_`>~\-]/g, '') // remove markdown symbols
                .replace(/\n{2,}/g, '\n')   // fix double newlines
                .trim();

            // ✅ Remove greetings or filler text
            const removePatterns = [
                /^(hallo|hello|hi)[!,. ]*/i,
                /wie kann ich (ihnen|dir) heute helfen[?!. ]*/i,
                /how can i (help|assist) (you|u)( today)?[?!. ]*/i,
                /i'?m here to (help|assist)[. ]*/i
            ];
            for (const pattern of removePatterns) {
                finalResponse = finalResponse.replace(pattern, '');
            }

            if (!finalResponse.trim()) finalResponse = "No response from GPT-4 API.";

            // ✅ Split for Messenger message limits
            const parts = [];
            for (let i = 0; i < finalResponse.length; i += 1999) {
                parts.push(finalResponse.substring(i, i + 1999));
            }

            // ✅ Send clean messages
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
