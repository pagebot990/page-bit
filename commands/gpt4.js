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
            // Updated Endpoint URL
            const endpointUrl = 'https://www.smfahim.xyz/ai/cloud-ai'; 

            // The new API expects a POST request with a JSON body
            const res = await axios.post(
                endpointUrl,
                {
                    prompt: prompt
                    // Based on the image, uid is not required for this API,
                    // but if it becomes necessary, you might add it here.
                    // uid: senderId 
                }
            );

            // The image shows the response has a "result" key, not "response" or "status"
            const apiResult = res.data?.result;

            if (!apiResult) {
                return sendMessage(
                    senderId,
                    { text: 'No result received from API.' },
                    pageAccessToken
                );
            }

            // Messenger text limit (1999 characters)
            for (let i = 0; i < apiResult.length; i += 1999) {
                await sendMessage(
                    senderId,
                    { text: apiResult.substring(i, i + 1999) },
                    pageAccessToken
                );
            }

        } catch (err) {
            console.error('API Error:', err.message);

            await sendMessage(
                senderId,
                { text: 'Error: ' + err.message + '. Please try again later.' },
                pageAccessToken
            );
        }
    }
};
