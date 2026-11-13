# Chatbot

A lightweight local chatbot powered by Ollama. The app lists models installed on your Ollama server and sends chat requests directly to it.

## Run locally

1. Install [Ollama](https://ollama.com/) and start it.
2. Download at least one model in a terminal, for example:

   ```powershell
   ollama pull llama3.2
   ```

   For photo questions, download a vision-language model such as:

   ```powershell
   ollama pull llama3.2-vision
   ```

3. Use Node.js 20 or newer and start the chatbot:

   ```powershell
   npm start
   ```

4. Open [http://localhost:3000](http://localhost:3000).

The model picker shows the models currently installed on your Ollama server. Use the refresh button after downloading another model. The server defaults to `http://127.0.0.1:11434`; set `OLLAMA_HOST` if Ollama is running elsewhere. You can copy `.env.example` as a reference for variable names, but the app does not load `.env` files automatically.

Attach JPEG, PNG, or WebP photos up to 2 MB. Image questions require a vision-language model; regular text models may not understand photos.

Voice typing uses the browser's built-in Web Speech API and requires microphone permission. Browser support varies, and speech recognition may use the browser vendor's speech service.

Ollama replies are formatted as structured Markdown directly in the chat, so each reply appears only once. Use **Edit** on a user message to replace it and regenerate later turns, **Copy** on a message or the toolbar to copy text, and the sidebar to restore or delete conversations.

Conversations are stored as JSON in `data/chats.json` on this computer. The server creates this file automatically if it does not exist. Photo bytes are never saved; restored chats show a note where an image was attached. For privacy, this runtime data file is ignored by Git. Set `CHAT_DATA_FILE` to change its location.

When replying, the server provides Ollama with up to the 20 most recent text messages from other saved chats as historical context. This gives chats local, cross-conversation memory; it does not train or modify the model. Deleting a conversation also removes it from future memory context.

## Exam schedule viewer

A separate React + TypeScript schedule formatter is available in [`schedule-viewer/`](./schedule-viewer/README.md). Run it independently with `cd schedule-viewer`, `npm install`, and `npm run dev`.
