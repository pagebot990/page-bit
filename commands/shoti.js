const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');
const fs = require('fs');

const token = fs.readFileSync('token.txt', 'utf8');

const API_BASE = 'https://norch-project.gleeze.com/api/spotify';
module.exports = {
  name: 'spotify',
  description: 'Fetch Spotify track.',
  usage: 'spotify <song name>',
  author: 'Ry',

  execute: async (senderId, query = "Hiling Mark Carpio") => {
    const pageAccessToken = token;

    try {
      const { data } = await axios.get(API_BASE, {
        params: { q: query }
      });

      if (data.status === 'success' && data.data) {
        const { preview_url, title, artist } = data.data;

        const audioMessage = {
          attachment: {
            type: 'audio',
            payload: {
              url: preview_url
            }
          },
          text: `🎵 *${title}* - ${artist}`
        };

        await sendMessage(senderId, audioMessage, pageAccessToken);
      } else {
        sendError(senderId, '❌ Error: Unable to fetch Spotify track.', pageAccessToken);
      }
    } catch (error) {
      console.error('Error fetching Spotify track:', error.message);
      sendError(senderId, '❌ Error: Unexpected error occurred.', pageAccessToken);
    }
  },
};

const sendError = async (senderId, errorMessage, pageAccessToken) => {
  await sendMessage(senderId, { text: errorMessage }, pageAccessToken);
};
