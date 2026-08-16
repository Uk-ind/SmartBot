# SmartBot — Direct Chat

The app opens directly into the assistant interface. There is no separate landing page or onboarding flow.

## Deploy to Vercel

Import this repository into Vercel. Vercel supports Express applications and zero-configuration/standard Express deployment patterns. urlVercel Express deployment guidehttps://vercel.com/kb/express

Set this environment variable in the Vercel project:

`OPENAI_API_KEY`

Optional:

`OPENAI_MODEL=gpt-5.6`

The OpenAI API key stays server-side. The frontend never contains the key. The app uses the OpenAI Responses API for the live assistant. urlOpenAI API Platformhttps://platform.openai.com/overview

## Local run

`npm install`

Copy `.env.example` to `.env`, set `OPENAI_API_KEY`, then:

`npm start`

Open `http://localhost:3000`.
