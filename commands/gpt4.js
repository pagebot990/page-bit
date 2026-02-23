const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');
const OpenAI = require('openai');

const openai = new OpenAI({
    apiKey: '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'
});

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
            const completion = await openai.chat.completions.create({
                model: 'gpt-3.5-turbo', // pwede mo ring gamitin ang gpt-4 kung gusto mo
                messages: [
                    { role: 'user', content: prompt }
                ],
                max_tokens: 1000
            });

            const response = completion.choices[0]?.message?.content;

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
            console.error('OpenAI API Error:', err);
            await sendMessage(
                senderId,
                { text: 'Error: ' + err.message },
                pageAccessToken
            );
        }
    }
};
