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
            return sendMessage(
                senderId,
                { text: 'Usage: gpt4 <question>' },
                pageAccessToken
            );
        }

        try {
            const res = await axios.get(
                'https://gpt4-ubt7.onrender.com/gpt4-convo',
                {
                    params: {
                        prompt: prompt,
                        uid: senderId   // para unique per user
                    }
                }
            );

            const status = res.data?.status;
            const response = res.data?.response;

            if (!status || !response) {
                return sendMessage(
                    senderId,
                    { text: 'No response received from API.' },
                    pageAccessToken
                );
            }

            // Messenger text limit (1999 characters)
            for (let i = 0; i < response.length; i += 1999) {
                await sendMessage(
                    senderId,
                    { text: response.substring(i, i + 1999) },
                    pageAccessToken
                );
            }

        } catch (err) {
            console.error('API Error:', err.message);

            await sendMessage(
                senderId,
                { text: 'Error: ' + err.message },
                pageAccessToken
            );
        }
    }
};
