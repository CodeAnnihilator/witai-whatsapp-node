const express = require('express');
const bodyParser = require('body-parser');
const reds = require('follow-redirects');
const speech = require('@google-cloud/speech');
const Wit = require('node-wit').Wit;

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));

app.listen(port, () => console.log(`Example app listening on port ${port}!`));

const WitClient = new Wit({accessToken: process.env.WIT_CLIENT_TOKEN});
const accountSid = process.env.ACCOUNT_SID;
const authToken = process.env.AUTH_TOKEN;
const twilioClient = require('twilio')(accountSid, authToken);

twilioClient.messaging.webhooks

app.post('/inbound', async (req, res) => {

	const fs = require('fs');

	const audioSource = req.body.MediaUrl0;

	const GCPSpeechClient = new speech.SpeechClient();
 
	const stream = await fs.createWriteStream('./voice.ogg');

	await reds.https.get(audioSource, response => response.pipe(stream));

	stream.on('finish', async () => {

		const audioBytes = fs.readFileSync('./voice.ogg');

		const audio = {
			content: audioBytes,
		};

		const config = {
			encoding: 'OGG_OPUS',
			sampleRateHertz: 16000,
			languageCode: 'ru-RU',
		};

		const request = {
			audio: audio,
			config: config,
		};

		const [response] = await GCPSpeechClient.recognize(request);

		const transcription = response.results
			.map(result => result.alternatives[0].transcript)
			.join('\n');

		console.log(`Transcription: ${transcription}`);

		const witResponseObject = await WitClient
			.message(transcription, {})
			.then(data => JSON.stringify(data))

		twilioClient.messages.create({
			from: process.env.WA_NUMBER,
			to: req.body.From,
			body: witResponseObject,
		}).then(message => console.log(message.sid));

	})

});
