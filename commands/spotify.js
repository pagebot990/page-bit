const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');
const FormData = require('form-data');

module.exports = {
    name: 'spotify',
    description: 'Search Spotify Song (voice output)',
    usage: 'spotify <song name>',
    author: 'Raniel',

    async execute(senderId, args, pageAccessToken) {
        const query = args.join(' ');
        if (!query) {
            return sendMessage(senderId, { text: "Usage: spotify <song name>" }, pageAccessToken);
        }

        try {
            // GET SONG DATA
            const res = await axios.get(
                `https://api-library-kohi.onrender.com/api/spotify?song=${encodeURIComponent(query)}`
            );

            const result = res.data?.data;
            if (!result) {
                return sendMessage(senderId, { text: "No results found." }, pageAccessToken);
            }

            // DOWNLOAD THE AUDIO FILE
            const audioBuffer = await axios.get(result.audioUrl, {
                responseType: "arraybuffer"
            });

            // UPLOAD THE AUDIO AS ATTACHMENT
            const form = new FormData();
            form.append("message", JSON.stringify({
                recipient: { id: senderId },
                message: { attachment: { type: "audio", payload: {} } }
            }));
            form.append("filedata", Buffer.from(audioBuffer.data), {
                filename: "audio.mp3",
                contentType: "audio/mpeg"
            });

            // SEND AUDIO
            await axios.post(
                `https://graph.facebook.com/v17.0/me/messages?access_token=${pageAccessToken}`,
                form,
                { headers: form.getHeaders() }
            );

            // SEND SONG INFO TEXT
            const info = 
`🎵 *Spotify Result*

*Title:* ${result.title}
*Artist:* ${result.artist}
*Duration:* ${result.duration}s`;

            await sendMessage(senderId, { text: info }, pageAccessToken);

        } catch (err) {
            console.error("SPOTIFY AUDIO ERROR:", err?.response?.data || err.message);
            sendMessage(
                senderId,
                { text: "There was an error fetching the audio. Try again later." },
                pageAccessToken
            );
        }
    }
};
