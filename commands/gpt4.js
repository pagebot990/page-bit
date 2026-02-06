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
            return sendMessage(
                senderId,
                { text: 'Usage: gpt4 <question>' },
                pageAccessToken
            );
        }

        try {
            const res = await axios.get(
                'https://api-library-kohi.onrender.com/api/chatgpt',
                {
                    params: {
                        prompt: prompt, // FIXED (from promt ➜ prompt)
                        uid: senderId
                    }
                }
            );

            const response = res.data?.response;

            if (!response) {
                return sendMessage(
                    senderId,
                    { text: 'No response received from API.' },
                    pageAccessToken
                );
            }

            // split message (Messenger limit)
            for (let i = 0; i < response.length; i += 1999) {
                const part = response.substring(i, i + 1999);
                await sendMessage(senderId, { text: part }, pageAccessToken);
            }

        } catch (err) {
            console.error('GPT API Error:', err.message);
            await sendMessage(
                senderId,
                { text: 'There was an error generating the content. Please try again later.' },
                pageAccessToken
            );
        }
    }
};
