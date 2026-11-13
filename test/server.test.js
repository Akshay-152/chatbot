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
          {
            name: "llama2:latest",
            capabilities: ["completion"],
            size: 4 * 1024 ** 3,
            details: { family: "llama", parameter_size: "4B" }
          },
          {
            name: "gemma4:e2b",
            capabilities: ["completion", "vision"],
            size: 2 * 1024 ** 3,
            details: { family: "gemma", parameter_size: "2B" }
          },
          {
            name: "deepseek-r1:8b",
            capabilities: ["completion", "thinking"],
            size: 5 * 1024 ** 3,
            details: { family: "deepseek", parameter_size: "8B" }
          }
        ]
      }));
      return;
    }

    if (request.url === "/api/chat") {
      let body = "";
      for await (const chunk of request) body += chunk;
      const chat = JSON.parse(body);
      receivedChats.push(chat);
      response.writeHead(200, { "Content-Type": chat.stream ? "application/x-ndjson" : "application/json" });
      if (chat.stream) {
        const isSkillGeneration = chat.messages[0].content.includes("Create a concise, reusable assistant skill");
        const shouldTruncateSkill = isSkillGeneration &&
          chat.messages[1].content.includes("simulate truncation");
        const content = isSkillGeneration
          ? shouldTruncateSkill
            ? "{\"name\":\"cut off\""
            : `Generated skill:\n\`\`\`json\n${JSON.stringify({
            name: "Generated project skill",
            summary: "Follows the conventions and structure of this project.",
            instructions: "Review the project documentation and existing source patterns before suggesting changes."
          })}\n\`\`\``
          : "I can see the photo.";
        const chunks = isSkillGeneration
          ? [content.slice(0, Math.ceil(content.length / 2)), content.slice(Math.ceil(content.length / 2))]
          : ["I can ", "see the photo."];
        response.write(`${JSON.stringify({ message: { content: chunks[0] }, done: false })}\n`);
        response.end(`${JSON.stringify({
          message: { content: chunks[1] },
          done: true,
          ...(shouldTruncateSkill ? { done_reason: "length" } : {})
        })}\n`);
      } else {
        response.end(JSON.stringify({
          message: {
            content: JSON.stringify({
              name: "Generated project skill",
              summary: "Follows the conventions and structure of this project.",
              instructions: "Review the project documentation and existing source patterns before suggesting changes."
            })
          }
        }));
      }
      return;
    }

    response.writeHead(404);
    response.end();
  });

  const previousHost = process.env.OLLAMA_HOST;
  const previousDataFile = process.env.CHAT_DATA_FILE;
  const previousMemoryFile = process.env.MEMORY_DATA_FILE;
  const previousPersonalityFile = process.env.PERSONALITY_DATA_FILE;
  const previousSkillDirectory = process.env.SKILL_DATA_DIR;
  const testDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "ollama-chat-test-"));
  const dataFile = path.join(testDirectory, "data", "chats.json");
  const memoryFile = path.join(testDirectory, "data", "memory.json");
  const personalityFile = path.join(testDirectory, "data", "personality.json");
  const skillDirectory = path.join(testDirectory, "skills");
  const projectDirectory = path.join(testDirectory, "source-project");
  fs.mkdirSync(path.join(projectDirectory, "src"), { recursive: true });
  fs.mkdirSync(path.join(projectDirectory, "node_modules", "ignored"), { recursive: true });
  fs.writeFileSync(path.join(projectDirectory, "README.md"), "# Project docs\nUse the local helper pattern.");
  fs.writeFileSync(path.join(projectDirectory, "src", "app.js"), "function localHelper() { return 'safe'; }");
  fs.writeFileSync(path.join(projectDirectory, ".env"), "SECRET=do-not-read");
  fs.writeFileSync(path.join(projectDirectory, "node_modules", "ignored", "index.js"), "do not scan");
  await new Promise((resolve) => ollama.listen(0, "127.0.0.1", resolve));
  const ollamaPort = ollama.address().port;
  process.env.OLLAMA_HOST = `http://127.0.0.1:${ollamaPort}`;
  process.env.CHAT_DATA_FILE = dataFile;
  process.env.MEMORY_DATA_FILE = memoryFile;
  process.env.PERSONALITY_DATA_FILE = personalityFile;
  process.env.SKILL_DATA_DIR = skillDirectory;
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
    if (previousMemoryFile === undefined) {
      delete process.env.MEMORY_DATA_FILE;
    } else {
      process.env.MEMORY_DATA_FILE = previousMemoryFile;
    }
    if (previousPersonalityFile === undefined) {
      delete process.env.PERSONALITY_DATA_FILE;
    } else {
      process.env.PERSONALITY_DATA_FILE = previousPersonalityFile;
    }
    if (previousSkillDirectory === undefined) {
      delete process.env.SKILL_DATA_DIR;
    } else {
      process.env.SKILL_DATA_DIR = previousSkillDirectory;
    }
    fs.rmSync(testDirectory, { recursive: true, force: true });
  });

  const page = await fetch(appUrl);
  assert.equal(page.status, 200);
  const pageHtml = await page.text();
  assert.match(pageHtml, /image-input/);
  assert.match(pageHtml, /voice-button/);
  assert.match(pageHtml, /personality-select/);
  assert.match(pageHtml, /mobile-menu-button/);
  assert.match(pageHtml, /mobile-nav-backdrop/);
  assert.match(pageHtml, /search the web and Wikipedia/i);

  const modelResponse = await fetch(`${appUrl}/api/models`);
  assert.equal(modelResponse.status, 200);
  assert.deepEqual(await modelResponse.json(), {
    models: [
      {
        name: "llama2:latest",
        capabilities: ["completion"],
        family: "llama",
        parameterSize: "4B",
        sizeBytes: 4 * 1024 ** 3
      },
      {
        name: "gemma4:e2b",
        capabilities: ["completion", "vision"],
        family: "gemma",
        parameterSize: "2B",
        sizeBytes: 2 * 1024 ** 3
      },
      {
        name: "deepseek-r1:8b",
        capabilities: ["completion", "thinking"],
        family: "deepseek",
        parameterSize: "8B",
        sizeBytes: 5 * 1024 ** 3
      }
    ]
  });

  const defaultPersonalityResponse = await fetch(`${appUrl}/api/personality`);
  assert.equal(defaultPersonalityResponse.status, 200);
  assert.deepEqual(await defaultPersonalityResponse.json(), { personality: "casual", updatedAt: null });
  const invalidPersonalityResponse = await fetch(`${appUrl}/api/personality`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ personality: "pirate" })
  });
  assert.equal(invalidPersonalityResponse.status, 400);
  const loverPersonalityResponse = await fetch(`${appUrl}/api/personality`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ personality: "lover" })
  });
  assert.equal(loverPersonalityResponse.status, 200);
  assert.equal((await loverPersonalityResponse.json()).personality, "lover");
  assert.equal(JSON.parse(fs.readFileSync(personalityFile, "utf8")).personality, "lover");

  const chatResponse = await fetch(`${appUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chatId: "test-chat-1",
      model: "auto",
      messages: [{
        role: "user",
        content: "Remember my favorite color is violet. What is in this picture?",
        image: { mimeType: "image/png", data: "aGVsbG8=" }
      }]
    })
  });
  assert.equal(chatResponse.status, 200);
  assert.match(chatResponse.headers.get("content-type"), /text\/event-stream/);
  const streamText = await chatResponse.text();
  const streamEvents = streamText.split(/\n\n/).filter(Boolean).map((event) =>
    JSON.parse(event.replace(/^data:\s*/, ""))
  );
  assert.deepEqual(streamEvents.filter((event) => event.token).map((event) => event.token), ["I can ", "see the photo."]);
  assert.equal(streamEvents.at(-1).reply, "I can see the photo.");
  assert.equal(streamEvents.find((event) => event.model).model, "gemma4:e2b");
  assert.equal(receivedChats[0].model, "gemma4:e2b");
  assert.equal(receivedChats[0].stream, true);
  assert.match(receivedChats[0].messages[0].content, /warm, affectionate, playful/);
  assert.deepEqual(receivedChats[0].messages.find((message) => message.images).images, ["aGVsbG8="]);

  const casualPersonalityResponse = await fetch(`${appUrl}/api/personality`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ personality: "casual" })
  });
  assert.equal(casualPersonalityResponse.status, 200);

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
  assert.equal(receivedChats[1].model, "gemma4:e2b");
  assert.equal(receivedChats[1].messages[0].role, "system");
  assert.match(receivedChats[1].messages[0].content, /favorite color is violet/);
  assert.equal(receivedChats[1].messages[1].content, "What color do I like?");

  const saveMemoryResponse = await fetch(`${appUrl}/api/memory`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: "The user prefers concise steps." })
  });
  assert.equal(saveMemoryResponse.status, 200);
  assert.equal((await saveMemoryResponse.json()).text, "The user prefers concise steps.");
  assert.equal(JSON.parse(fs.readFileSync(memoryFile, "utf8")).text, "The user prefers concise steps.");

  const previewResponse = await fetch(`${appUrl}/api/skills/preview`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ folderPath: projectDirectory })
  });
  assert.equal(previewResponse.status, 200);
  const preview = await previewResponse.json();
  assert.deepEqual(preview.files.map((file) => file.path), ["README.md", "src/app.js"]);
  assert.equal(preview.files.some((file) => file.content.includes("SECRET=")), false);
  assert.equal(preview.files.some((file) => file.content.includes("do not scan")), false);
  const filesystemRootResponse = await fetch(`${appUrl}/api/skills/preview`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ folderPath: path.parse(projectDirectory).root })
  });
  assert.equal(filesystemRootResponse.status, 400);

  for (let index = 0; index < 18; index += 1) {
    const fileName = `generated-${String(index).padStart(2, "0")}.js`;
    fs.writeFileSync(path.join(projectDirectory, "src", fileName), `// representative source\n${"const value = 'example';\n".repeat(160)}`);
  }

  const createSkillResponse = await fetch(`${appUrl}/api/skills`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "auto",
      name: "Project conventions",
      request: "Create a skill for making changes in this project's style.",
      folderPath: projectDirectory
    })
  });
  assert.equal(createSkillResponse.status, 200);
  assert.match(createSkillResponse.headers.get("content-type"), /text\/event-stream/);
  const skillEvents = (await createSkillResponse.text()).split(/\n\n/).filter(Boolean).map((event) =>
    JSON.parse(event.slice(5).trim())
  );
  const skill = skillEvents.at(-1).skill;
  assert.ok(skillEvents.some((event) => event.progress));
  assert.ok(skillEvents.some((event) => event.token));
  assert.equal(skill.name, "Project conventions");
  assert.equal(skill.fileCount, 20);
  assert.equal(skill.sourcePath, fs.realpathSync(projectDirectory));
  assert.equal(receivedChats[2].stream, true);
  assert.equal(receivedChats[2].model, "deepseek-r1:8b");
  assert.equal(receivedChats[2].options.num_predict, 2048);
  assert.deepEqual(receivedChats[2].format.required, ["name", "summary", "instructions"]);
  const skillPrompt = JSON.parse(receivedChats[2].messages[1].content);
  assert.ok(skillPrompt.source_files.length <= 16);
  assert.ok(skillPrompt.source_files.reduce((total, file) => total + file.content.length, 0) <= 128000);
  assert.ok(skillPrompt.omitted_file_count > 0);
  assert.match(receivedChats[2].messages[1].content, /Use the local helper pattern/);
  assert.equal(fs.existsSync(path.join(skillDirectory, `${skill.id}.json`)), true);
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(skillDirectory, "master.json"), "utf8")).skills.map((item) => item.id), [skill.id]);

  fs.appendFileSync(path.join(projectDirectory, "README.md"), "\nUpdated source text.");
  const skilledChatResponse = await fetch(`${appUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chatId: "test-chat-3",
      model: "auto",
      skillIds: [skill.id],
      messages: [{ role: "user", content: "Use the project conventions." }]
    })
  });
  assert.equal(skilledChatResponse.status, 200);
  await skilledChatResponse.text();
  assert.equal(receivedChats[3].model, "deepseek-r1:8b");
  assert.match(receivedChats[3].messages[0].content, /The user prefers concise steps/);
  assert.match(receivedChats[3].messages[0].content, /Project conventions/);
  assert.match(receivedChats[3].messages[0].content, /function localHelper/);
  assert.match(receivedChats[3].messages[0].content, /Updated source text/);

  const truncatedSkillResponse = await fetch(`${appUrl}/api/skills`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "auto",
      name: "Truncated skill",
      request: "simulate truncation"
    })
  });
  const truncatedSkillEvents = (await truncatedSkillResponse.text()).split(/\n\n/).filter(Boolean).map((event) =>
    JSON.parse(event.slice(5).trim())
  );
  assert.match(truncatedSkillEvents.at(-1).error, /output limit/);
  const savedSkillsResponse = await fetch(`${appUrl}/api/skills`);
  assert.equal((await savedSkillsResponse.json()).skills.length, 1);

  const deleteSkillResponse = await fetch(`${appUrl}/api/skills/${skill.id}`, { method: "DELETE" });
  assert.equal(deleteSkillResponse.status, 200);
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(skillDirectory, "master.json"), "utf8")).skills, []);
  const skillChat = (await (await fetch(`${appUrl}/api/history/test-chat-3`)).json()).chat;
  assert.deepEqual(skillChat.skillIds, []);

  const deleteResponse = await fetch(`${appUrl}/api/history/test-chat-2`, { method: "DELETE" });
  assert.equal(deleteResponse.status, 200);
  assert.deepEqual(await deleteResponse.json(), { deleted: true });
  const remainingHistoryResponse = await fetch(`${appUrl}/api/history`);
  assert.deepEqual((await remainingHistoryResponse.json()).chats.map((chat) => chat.id), ["test-chat-3", "test-chat-1"]);

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

  const fastAutoResponse = await fetch(`${appUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chatId: "test-chat-auto-fast",
      model: "auto",
      messages: [{ role: "user", content: "Say hello." }]
    })
  });
  assert.equal(fastAutoResponse.status, 200);
  await fastAutoResponse.text();
  assert.equal(receivedChats[5].model, "gemma4:e2b");

  const reasoningAutoResponse = await fetch(`${appUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chatId: "test-chat-auto-reasoning",
      model: "auto",
      messages: [{ role: "user", content: "Calculate 144 / 12 and show the reasoning." }]
    })
  });
  assert.equal(reasoningAutoResponse.status, 200);
  await reasoningAutoResponse.text();
  assert.equal(receivedChats[6].model, "deepseek-r1:8b");

  const searchQueries = [];
  const wikipediaQueries = [];
  let failWebSearch = false;
  const originalFetch = globalThis.fetch;
  t.mock.method(globalThis, "fetch", async (input, options) => {
    const url = new URL(input instanceof Request ? input.url : input.toString());
    if (url.hostname === "html.duckduckgo.com") {
      searchQueries.push(url.searchParams.get("q"));
      if (failWebSearch) throw new Error("DuckDuckGo unavailable");
      return new Response(
        '<div class="result"><h2><a class="result__a" href="https://example.com/research">Research Source</a></h2><a class="result__snippet">Current findings &amp; methodology</a></div>',
        { status: 200, headers: { "Content-Type": "text/html" } }
      );
    }
    if (url.hostname === "en.wikipedia.org") {
      wikipediaQueries.push(url.searchParams.get("gsrsearch"));
      return new Response(JSON.stringify({
        query: {
          pages: [{
            title: "Local model performance",
            fullurl: "https://en.wikipedia.org/wiki/Local_model_performance",
            extract: "Wikipedia background and overview."
          }]
        }
      }), { status: 200, headers: { "Content-Type": "application/json" } });
    }
    return originalFetch(input, options);
  });

  const webDisabledResponse = await fetch(`${appUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chatId: "test-chat-web-disabled",
      model: "gemma4:e2b",
      webSearch: false,
      messages: [{ role: "user", content: "Research the latest findings about local model performance." }]
    })
  });
  assert.equal(webDisabledResponse.status, 200);
  await webDisabledResponse.text();
  assert.deepEqual(searchQueries, []);
  assert.deepEqual(wikipediaQueries, []);

  const researchPrompt = "Research the latest findings about local model performance.";
  const webResearchResponse = await fetch(`${appUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chatId: "test-chat-web-research",
      model: "gemma4:e2b",
      webSearch: true,
      messages: [{ role: "user", content: researchPrompt }]
    })
  });
  assert.equal(webResearchResponse.status, 200);
  const webResearchEvents = (await webResearchResponse.text()).split(/\n\n/).filter(Boolean).map((event) =>
    JSON.parse(event.replace(/^data:\s*/, ""))
  );
  assert.match(webResearchEvents.at(-1).reply, /### Sources[\s\S]*\[Research Source\]\(https:\/\/example\.com\/research\)/);
  assert.match(webResearchEvents.at(-1).reply, /\[Local model performance\]\(https:\/\/en\.wikipedia\.org\/wiki\/Local_model_performance\) \(Wikipedia\)/);
  assert.match(receivedChats[8].messages[0].content, /Current findings & methodology/);
  assert.match(receivedChats[8].messages[0].content, /Wikipedia background and overview/);
  assert.deepEqual(searchQueries, [researchPrompt]);
  assert.deepEqual(wikipediaQueries, [researchPrompt]);

  failWebSearch = true;
  const wikipediaOnlyResponse = await fetch(`${appUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chatId: "test-chat-wikipedia-only",
      model: "gemma4:e2b",
      webSearch: true,
      messages: [{ role: "user", content: "Wikipedia: local model performance" }]
    })
  });
  assert.equal(wikipediaOnlyResponse.status, 200);
  const wikipediaOnlyEvents = (await wikipediaOnlyResponse.text()).split(/\n\n/).filter(Boolean).map((event) =>
    JSON.parse(event.replace(/^data:\s*/, ""))
  );
  assert.match(wikipediaOnlyEvents.at(-1).reply, /Could not search: Web search\./);
  assert.match(wikipediaOnlyEvents.at(-1).reply, /\(Wikipedia\)/);
  assert.deepEqual(searchQueries, [researchPrompt, "Wikipedia: local model performance"]);
  assert.deepEqual(wikipediaQueries, [researchPrompt, "Wikipedia: local model performance"]);
});
