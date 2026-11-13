# Schedule Studio

A React + TypeScript viewer for examination schedules written in Markdown. It renders GitHub Flavored Markdown (including tables), copies the Markdown source, keeps up to 10 previous inputs in local browser storage, and supports browser speech recognition where available.

## Run locally

```powershell
cd schedule-viewer
npm install
npm run dev
```

Open the local URL printed by Vite.

## Use

- Select **Edit input** to change the sample or paste another schedule. The preview updates as you type.
- Choose **Copy output** to copy the Markdown source for the formatted preview, or **Copy input** to copy the source directly.
- Open **History** to restore one of the last 10 saved input versions. History stays in this browser.
- Select **Voice input** and allow microphone access to dictate into the input. Recognition support depends on the browser and may use its speech service.

The sample schedule is preloaded. Voice input requires a browser that implements the Web Speech API; the rest of the app works without it.
