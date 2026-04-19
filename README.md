Better Me
A personal AI coaching app built as a Progressive Web App using React and TypeScript.

About
Better Me is my final year project for BSc Computer Science at Kingston University (K2207177).

The app acts as a personal AI coach that helps users set goals through conversation, track daily completions, maintain streaks, write journal reflections and have voice or text conversations with an AI coach called Max.

All data is stored locally on the device using localStorage. Nothing leaves the device except text sent to the OpenAI API.

Tech Stack

- React + TypeScript
- Vite
- React Router v6
- Tailwind CSS v4
- OpenAI API (gpt-4o-mini)
- Web Speech API
- vite-plugin-pwa
- Phosphor Icons
- react-markdown

Setup

1. Clone the repo
2. Run `npm install --legacy-peer-deps`
3. Create a `.env` file in the root: VITE_OPENAI_API_KEY= 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

4. Run `npm run dev` to start on localhost:3000

Testing on a Real Device

1. `npm run build`
2. `npm run preview -- --host --port 3000`
3. `npx ngrok http 3000` in a second terminal
4. Open the ngrok URL on your phone in Chrome
5. Tap Add to Home Screen to install as a PWA

Author

Sebastian Olah - K2207177 - Kingston University
