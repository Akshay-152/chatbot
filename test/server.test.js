const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const server = require("../server");

test("Ollama chat, persistent history, and cross-chat memory", async (t) => {
  const receivedChats = [];
  const ollama = http.createServer(async (request, response) => {
    if (request.url === "/api/tags") {
      response.writeHead(200, { "Content-Type": "application/json" });
      response.end(JSON.stringify({
        models: [
          { name: "llama2:latest", capabilities: ["completion"] },
          { name: "gemma4:e2b", capabilities: ["completion", "vision"] }
        ]
      }));
      return;
    }

    if (request.url === "/api/chat") {
      let body = "";
      for await (const chunk of request) body += chunk;
      receivedChats.push(JSON.parse(body));
      response.writeHead(200, { "Content-Type": "application/json" });
      response.end(JSON.stringify({ message: { content: "I can see the photo." } }));
      return;
    }

    response.writeHead(404);
    response.end();
  });

  const previousHost = process.env.OLLAMA_HOST;
  const previousDataFile = process.env.CHAT_DATA_FILE;
  const dataDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "ollama-chat-test-"));
  const dataFile = path.join(dataDirectory, "chats.json");
  await new Promise((resolve) => ollama.listen(0, "127.0.0.1", resolve));
  const ollamaPort = ollama.address().port;
  process.env.OLLAMA_HOST = `http://127.0.0.1:${ollamaPort}`;
  process.env.CHAT_DATA_FILE = dataFile;
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const appUrl = `http://127.0.0.1:${server.address().port}`;

  t.after(async () => {
    await new Promise((resolve) => server.close(resolve));
    await new Promise((resolve) => ollama.close(resolve));
    if (previousHost === undefined) {
      delete process.env.OLLAMA_HOST;
    } else {
      process.env.OLLAMA_HOST = previousHost;
    }
    if (previousDataFile === undefined) {
      delete process.env.CHAT_DATA_FILE;
    } else {
      process.env.CHAT_DATA_FILE = previousDataFile;
    }
    fs.rmSync(dataDirectory, { recursive: true, force: true });
  });

  const page = await fetch(appUrl);
  assert.equal(page.status, 200);
  const pageHtml = await page.text();
  assert.match(pageHtml, /image-input/);
  assert.match(pageHtml, /voice-button/);

  const modelResponse = await fetch(`${appUrl}/api/models`);
  assert.equal(modelResponse.status, 200);
  assert.deepEqual(await modelResponse.json(), {
    models: [
      { name: "llama2:latest", capabilities: ["completion"] },
      { name: "gemma4:e2b", capabilities: ["completion", "vision"] }
    ]
  });

  const chatResponse = await fetch(`${appUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chatId: "test-chat-1",
      model: "gemma4:e2b",
      messages: [{
        role: "user",
        content: "Remember my favorite color is violet. What is in this picture?",
        image: { mimeType: "image/png", data: "aGVsbG8=" }
      }]
    })
  });
  assert.equal(chatResponse.status, 200);
  assert.deepEqual(await chatResponse.json(), { reply: "I can see the photo." });
  assert.equal(receivedChats[0].model, "gemma4:e2b");
  assert.equal(receivedChats[0].stream, false);
  assert.deepEqual(receivedChats[0].messages[0].images, ["aGVsbG8="]);

  const historyResponse = await fetch(`${appUrl}/api/history`);
  assert.equal(historyResponse.status, 200);
  const history = await historyResponse.json();
  assert.equal(history.chats.length, 1);
  assert.equal(history.chats[0].id, "test-chat-1");

  const storedChatResponse = await fetch(`${appUrl}/api/history/test-chat-1`);
  assert.equal(storedChatResponse.status, 200);
  const storedChat = (await storedChatResponse.json()).chat;
  assert.equal(storedChat.messages.length, 2);
  assert.equal(storedChat.messages[0].hadImage, true);
  assert.equal("image" in storedChat.messages[0], false);
  assert.deepEqual(JSON.parse(fs.readFileSync(dataFile, "utf8")).chats.map((chat) => chat.id), ["test-chat-1"]);

  const memoryChatResponse = await fetch(`${appUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chatId: "test-chat-2",
      model: "gemma4:e2b",
      messages: [{ role: "user", content: "What color do I like?" }]
    })
  });
  assert.equal(memoryChatResponse.status, 200);
  assert.equal(receivedChats[1].messages[0].role, "system");
  assert.match(receivedChats[1].messages[0].content, /favorite color is violet/);
  assert.equal(receivedChats[1].messages[1].content, "What color do I like?");

  const deleteResponse = await fetch(`${appUrl}/api/history/test-chat-2`, { method: "DELETE" });
  assert.equal(deleteResponse.status, 200);
  assert.deepEqual(await deleteResponse.json(), { deleted: true });
  const remainingHistoryResponse = await fetch(`${appUrl}/api/history`);
  assert.deepEqual((await remainingHistoryResponse.json()).chats.map((chat) => chat.id), ["test-chat-1"]);

  const invalidImageResponse = await fetch(`${appUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chatId: "test-chat-3",
      model: "gemma4:e2b",
      messages: [{
        role: "user",
        content: "What is in this picture?",
        image: { mimeType: "image/png", data: "not-base64!" }
      }]
    })
  });
  assert.equal(invalidImageResponse.status, 400);
});
