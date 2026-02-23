const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
    name: 'gpt4',
    description: 'Interact with AI',
    usage: 'gpt4 [your message]',
    author: 'Raniel',

    async execute(senderId, args, pageAccessToken) {
        const prompt = args.join(' ');
        if (!prompt) {
            return sendMessage(senderId, { text: 'Usage: gpt4 <question>' }, pageAccessToken);
        }

        try {
            const res = await axios.get(
                'https://hiroshi-api.onrender.com/ai/gpt3',
                {
                    params: {
                        ask: prompt
                    }
                }
            );

            const response = res.data?.response;

            if (!response) {
                return sendMessage(senderId, { text: 'No response from AI.' }, pageAccessToken);
            }

            // Messenger text limit
            for (let i = 0; i < response.length; i += 1999) {
                await sendMessage(
                    senderId,
                    { text: response.substring(i, i + 1999) },
                    pageAccessToken
                );
            }

        } catch (err) {
            console.error('AI API Error:', err.message);
            await sendMessage(
                senderId,
                { text: 'Error: ' + err.message },
                pageAccessToken
            );
        }
    }
};
