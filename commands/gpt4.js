const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

module.exports = {
    name: 'gpt4',
    description: 'Interact with GPT-4o',
    usage: 'gpt4 [your message]',
    author: 'Raniel',

    async execute(senderId, args, pageAccessToken) {
        const prompt = args.join(' ');
        if (!prompt) {
            return sendMessage(senderId, { text: 'Usage: gpt4 <question>' }, pageAccessToken);
        }

        try {
            const res = await axios.post(
                'https://api.openai.com/v1/chat/completions',
                {
                    model: 'gpt-3.5-turbo',
                    messages: [
                        { role: 'user', content: prompt }
                    ],
                    max_tokens: 1000
                },
                {
                    headers: {
                        'Authorization': `Bearer ${OPENAI_API_KEY}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            const response = res.data?.choices[0]?.message?.content;

            if (!response) {
                return sendMessage(senderId, { text: 'No response from AI.' }, pageAccessToken);
            }

            for (let i = 0; i < response.length; i += 1999) {
                await sendMessage(
                    senderId,
                    { text: response.substring(i, i + 1999) },
                    pageAccessToken
                );
            }

        } catch (err) {
            console.error('OpenAI API Error:', err.response?.data || err.message);
            await sendMessage(
                senderId,
                { text: 'Error: ' + (err.response?.data?.error?.message || err.message) },
                pageAccessToken
            );
        }
    }
};
