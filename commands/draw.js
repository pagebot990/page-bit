const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: 'draw',
  description: 'Generates an image based on a prompt using the Kohi API',
  usage: 'draw [prompt]',
  author: 'Raniel',

  async execute(senderId, args, pageAccessToken) {
    if (!args || args.length === 0) {
      return sendMessage(senderId, {
        text: '❌ 𝗣𝗹𝗲𝗮𝘀𝗲 𝗽𝗿𝗼𝘃𝗶𝗱𝗲 𝘆𝗼𝘂𝗿 𝗽𝗿𝗼𝗺𝗽𝘁\n\n𝗘𝘅𝗮𝗺𝗽𝗹𝗲: draw dog.'
      }, pageAccessToken);
    }

    const prompt = args.join(' ');
    const apiUrl = `https://api-library-kohi.onrender.com/api/imagegen?model=nanobanana&prompt=${encodeURIComponent(prompt)}`;

    // Notify user
    await sendMessage(senderId, {
      text: '🎨 𝗚𝗲𝗻𝗲𝗿𝗮𝘁𝗶𝗻𝗴 𝘆𝗼𝘂𝗿 𝗶𝗺𝗮𝗴𝗲... 𝗽𝗹𝗲𝗮𝘀𝗲 𝘄𝗮𝗶𝘁 ⏳'
    }, pageAccessToken);

    try {
      // Fetch from the new API
      const { data } = await axios.get(apiUrl);

      // The API is expected to return an image URL in data
      let imageUrl = null;

      // Flexible extraction for different response formats
      if (data && typeof data === 'object') {
        imageUrl = data.url || data.image || data.data || null;
      } else if (typeof data === 'string') {
        imageUrl = data;
      }

      if (!imageUrl) {
        return sendMessage(senderId, {
          text: '⚠️ No image returned by the API. Please try again with a different prompt.'
        }, pageAccessToken);
      }

      // Send image
      await sendMessage(senderId, {
        attachment: {
          type: 'image',
          payload: {
            url: imageUrl
          }
        }
      }, pageAccessToken);

    } catch (error) {
      console.error('❌ Error generating image:', error.message);
      if (error.response) console.error('API response:', error.response.data);

      await sendMessage(senderId, {
        text: '🚫 An error occurred while generating the image. Please try again later.'
      }, pageAccessToken);
    }
  }
};
