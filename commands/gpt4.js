const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
    name: 'gpt4',
    description: 'Interact with GPT-4o',
    usage: 'gpt4 [your message]',
    author: 'Raniel',

    async execute(senderId, args, pageAccessToken) {
        const prompt = args.join(' ');
        if (!prompt) return sendMessage(senderId, { text: "Usage: gpt4 <question>" }, pageAccessToken);

        try {
            const { data: { response } } = await axios.get(`https://rapido.zetsu.xyz/api/aria?prompt=${encodeURIComponent(prompt)}&apikey=rapi_7cdde90c01404858a0e396f5471213e5`);

            const parts = [];

            for (let i = 0; i < response.length; i += 1999) {
                parts.push(response.substring(i, i + 1999));
            }

            // send all msg parts
            for (const part of parts) {
                await sendMessage(senderId, { text: part }, pageAccessToken);
            }

        } catch {
            sendMessage(senderId, { text: 'There was an error generating the content. Please try again later.' }, pageAccessToken);
        }
    }
};
