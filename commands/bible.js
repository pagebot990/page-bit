const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: 'bible',
  description: 'Get a random Bible verse or search by reference',
  usage: 'bible [book chapter:verse]',
  author: 'Raniel',

  async execute(senderId, args, pageAccessToken) {
    const query = args.join(' ');

    
    const randomVerses = [
      "John 3:16",
      "Psalm 23:1",
      "Romans 8:28",
      "Philippians 4:13",
      "Proverbs 3:5",
      "Isaiah 41:10",
      "Jeremiah 29:11",
      "Matthew 6:33",
      "Galatians 2:20",
      "1 Corinthians 13:4-5",
    ];

    const searchQuery = query || randomVerses[Math.floor(Math.random() * randomVerses.length)];

    try {
      const response = await axios.get(`https://bible-api.com/${encodeURIComponent(searchQuery)}`);
      const data = response.data;

      if (data && data.text) {
        await sendMessage(senderId, {
          text: `📖 ${data.reference}\n\n${data.text.trim()}`,
        }, pageAccessToken);
      } else {
        await sendMessage(senderId, {
          text: `❌ No verse found. You searched: "${searchQuery}". Please check the input or try again.`,
        }, pageAccessToken);
      }
    } catch (error) {
      console.error('Bible API error:', error.message);
      await sendMessage(senderId, {
        text: "⚠️ An error occurred while fetching the verse. Please try again later.",
      }, pageAccessToken);
    }
  }
};
