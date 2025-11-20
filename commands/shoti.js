const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');
const fs = require('fs');

const token = fs.readFileSync('token.txt', 'utf8');

const API_BASE = 'https://norch-project.gleeze.com/api/spotify';

module.exports = {
  name: 'spotify',
  description: 'Fetch a Spotify track.',
  usage: 'spotify <song name>',
  author: 'Ry',

  execute: async (senderId, query = "Hiling Mark Carpio") => {
    const pageAccessToken = token;

    try {
      const { data } = await axios.get(API_BASE, {
        params: { q: query }
      });

      if (data.status === true && data.result) {
        const { title, artist, url, thumbnail } = data.result;

        const audioMessage = {
          attachment: {
            type: 'audio',
            payload: {
              url: url
            }
          }
        };

        await sendMessage(senderId, { text: `🎵 ${title} - ${artist}` }, pageAccessToken);
        await sendMessage(senderId, audioMessage, pageAccessToken);

      } else {
        sendError(senderId, '❌ Error: Unable to fetch Spotify track.', pageAccessToken);
      }

    } catch (error) {
      console.error('Error fetching Spotify:', error.message);
      sendError(senderId, '❌ Error: Unexpected error occurred.', pageAccessToken);
    }
  },
};

const sendError = async (senderId, errorMessage, pageAccessToken) => {
  await sendMessage(senderId, { text: errorMessage }, pageAccessToken);
};
