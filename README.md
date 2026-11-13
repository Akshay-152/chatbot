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

The model picker defaults to **Auto · best for request** and still allows manual selection. Auto chooses a vision-capable model for photos, a reasoning-oriented/larger model for math requests and active skills, and a smaller model for other requests. Skill creation also uses the reasoning-oriented selection. These choices use Ollama model capabilities, names, and parameter metadata; they are heuristics, not benchmark rankings. Use the refresh button after downloading another model. The server defaults to `http://127.0.0.1:11434`; set `OLLAMA_HOST` if Ollama is running elsewhere. You can copy `.env.example` as a reference for variable names, but the app does not load `.env` files automatically.

Attach JPEG, PNG, or WebP photos up to 2 MB. Image questions require a vision-language model; regular text models may not understand photos.

Automatic web research is enabled by default with the **Web Auto** composer toggle. For prompts that ask for research, Wikipedia, or current information (such as latest news, versions, prices, or weather), the server sends up to 500 characters of the latest user prompt to DuckDuckGo and the English Wikipedia API in parallel. Results are combined, duplicate links are merged, and clickable, labeled sources are appended to the answer. If one provider is unavailable, the other can still supply results and the answer includes a research note; if both fail, the request reports an error. Wikipedia is provided for general background, not as the authority for time-sensitive facts. Search results are treated as untrusted context. Turn **Web Auto** off to keep a request local. Other prompts do not trigger a search.

**Voice mode** opens from the microphone button in the composer. The app records your speech, sends the clip to the server at `POST /api/voice/transcribe`, and asks Ollama for a hands-free reply that uses saved memory and the selected skills and is capped at 1000 characters. The reply is spoken aloud with the voice picked in **Settings → Voice → Spoken voice**, and the orb resizes, glows, and throws rings while it listens, thinks, and speaks. Tap the orb again to stop listening or to interrupt playback; the speaker button mutes spoken replies, and the type field accepts a prompt without speaking. Server transcription uses any OpenAI-compatible speech-to-text endpoint: set `VOICE_STT_URL` (for example a local whisper.cpp or faster-whisper server), optionally `VOICE_STT_MODEL` and `VOICE_STT_API_KEY`. Without `VOICE_STT_URL` the recorded clip is not sent to a speech service and voice mode falls back to the browser's speech recognition, so it needs a browser that provides it.

Voice typing and response read-aloud use the browser's Web Speech APIs. Voice typing requires microphone permission; read-aloud adds a speaker button under assistant messages, including the welcome, and can be stopped by pressing it again. Long replies are read in shorter segments, using a matching installed voice when available. Browser and voice/language support vary, and speech recognition may use the browser vendor's speech service.

Opening the app starts a fresh chat with a randomized welcome message and suggested prompt shortcuts; existing conversations remain available in the sidebar. Ollama replies stream into the chat as they are generated and are then rendered as structured Markdown. Use **Edit** on a user message to replace it and regenerate later turns, **Copy** on a message or the toolbar to copy text, and the sidebar to restore or delete conversations. On phones, use the menu button to open the sidebar for chat history, new chats, and settings. The composer follows mobile viewport resizing, and keyboard focus is managed in the drawer and Settings dialog. Code blocks include copy and download controls. The right edge expands on hover to show numbered prompts from the current conversation; select one to scroll to that turn.

Conversations are stored as JSON in `data/chats.json` on this computer. The server creates this file automatically if it does not exist. Photo bytes are never saved; restored chats show a note where an image was attached. For privacy, this runtime data file is ignored by Git. Set `CHAT_DATA_FILE` to change its location.

Open **Settings** at the bottom of the left sidebar to choose a **Lover**, **Professional**, or **Casual** chat personality, save personal memory in `data/memory.json`, and create reusable skills. Casual mode mirrors the user's language and keeps replies conversational; the selected tone is stored in `data/personality.json` and applied to future replies. Skills are generated by the selected local Ollama model—or the auto-selected reasoning model in Auto mode—and stored as `skills/<id>.json`; `skills/master.json` is the structured aggregate of saved skills. Select up to three skills from **Use skill** in the composer to apply them to a conversation.

To create a folder-based skill, enter an absolute folder path in Settings or add a quoted path / `Path: ...` line to the skill request, then preview the folder before generating. The app scans only supported text and code files, skips hidden/secret and dependency/build folders, caps the scan at 120 files / 512 KB, and never executes shell commands. Skill generation prioritizes project documentation and source files, then sends at most 16 files / 128 KB of excerpts to Ollama. Generation uses Ollama's structured JSON output, streams progress, and has a 50-minute timeout; closing the request cancels the Ollama call. When a skill is selected, its source folder is re-read and bounded excerpts are supplied to Ollama. The local server binds to loopback only.

When replying, the server also provides Ollama with up to the 20 most recent text messages from other saved chats and any saved personal memory as context. This gives chats local memory; it does not train or modify the model. Deleting a conversation removes it from future memory context.

## Exam schedule viewer

A separate React + TypeScript schedule formatter is available in [`schedule-viewer/`](./schedule-viewer/README.md). Run it independently with `cd schedule-viewer`, `npm install`, and `npm run dev`.
