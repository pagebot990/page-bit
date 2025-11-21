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

            // DOWNLOAD AUDIO FILE
            const audioBuffer = await axios.get(result.audioUrl, {
                responseType: "arraybuffer"
            });

            // STEP 1 — UPLOAD AUDIO TO FACEBOOK
            const form = new FormData();
            form.append("filedata", Buffer.from(audioBuffer.data), {
                filename: "song.mp3",
                contentType: "audio/mpeg"
            });

            const uploadRes = await axios.post(
                `https://graph.facebook.com/v17.0/me/message_attachments?access_token=${pageAccessToken}`,
                form,
                { headers: form.getHeaders() }
            );

            const attachmentId = uploadRes.data.attachment_id;

            // STEP 2 — SEND MESSAGE USING attachment_id
            await sendMessage(
                senderId,
                {
                    attachment: {
                        type: "audio",
                        payload: {
                            attachment_id: attachmentId
                        }
                    }
                },
                pageAccessToken
            );

            // OPTIONAL: SEND SONG DETAILS
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
