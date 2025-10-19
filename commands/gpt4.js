const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
    name: 'gpt4',
    description: 'Interact with DeepAI text generator',
    usage: 'gpt4 [your message]',
    author: 'Raniel',

    async execute(senderId, args, pageAccessToken) {
        const prompt = args.join(' ');
        if (!prompt)
            return sendMessage(senderId, { text: "Usage: gpt4 <question>" }, pageAccessToken);

        try {
            const response = await axios.post(
                'https://api.deepai.org/api/text-generator',
                { text: prompt },
                {
                    headers: {
                        'Api-Key': 'a2f66585-7cde-482a-b537-2180457d83cc',
                    },
                }
            );

            const answer = response.data.output || "No response from AI.";
            const parts = [];

            for (let i = 0; i < answer.length; i += 1999) {
                parts.push(answer.substring(i, i + 1999));
            }

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
