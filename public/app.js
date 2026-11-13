const form = document.querySelector("#chat-form");
const promptInput = document.querySelector("#prompt");
const messagesElement = document.querySelector("#messages");
const sendButton = document.querySelector("#send-button");
const errorMessage = document.querySelector("#error-message");
const actionStatus = document.querySelector("#action-status");
const modelSelect = document.querySelector("#model-select");
const refreshModelsButton = document.querySelector("#refresh-models");
const connectionStatus = document.querySelector("#connection-status");
const connectionText = document.querySelector("#connection-text");
const imageInput = document.querySelector("#image-input");
const uploadButton = document.querySelector("#upload-button");
const attachmentPreview = document.querySelector("#attachment-preview");
const attachmentImage = document.querySelector("#attachment-image");
const attachmentName = document.querySelector("#attachment-name");
const removeAttachmentButton = document.querySelector("#remove-attachment");
const imageModelHint = document.querySelector("#image-model-hint");
const voiceButton = document.querySelector("#voice-button");
const newChatButton = document.querySelector("#new-chat-button");
const chatHistoryButton = document.querySelector("#chat-history-button");
const copyInputButton = document.querySelector("#copy-input-button");
const copyOutputButton = document.querySelector("#copy-output-button");
const editMessageControls = document.querySelector("#edit-message-controls");
const cancelEditButton = document.querySelector("#cancel-edit-button");
const historyList = document.querySelector("#history-list");

const conversation = [];
const maxImageBytes = 2 * 1024 * 1024;
const maxServerMessages = 500;
let availableModels = [];
let chatHistory = [];
let currentChatId = createChatId();
let pendingImage = null;
let editingMessageIndex = null;
let draftBeforeEdit = null;
let isLoading = false;
let modelsAvailable = false;
let recognition = null;
let isListening = false;

function createChatId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function addMessage(message, index) {
  const article = document.createElement("article");
  article.className = `message ${message.role === "user" ? "user-message" : "assistant-message"}`;

  const messageContent = document.createElement("div");
  messageContent.className = "message-content";

  if (message.role === "assistant") {
    const author = document.createElement("span");
    author.className = "message-author";
    author.textContent = message.isGreeting ? "Assistant" : "---";
    messageContent.append(author);

    if (message.model) {
      const model = document.createElement("span");
      model.className = "response-model";
      model.textContent = message.model;
      messageContent.append(model);
    }

    if (message.isGreeting) {
      const paragraph = document.createElement("p");
      paragraph.textContent = message.content;
      messageContent.append(paragraph);
    } else {
      messageContent.append(renderStructuredOutput(message.content));
    }
  } else {
    if (message.image) {
      const preview = document.createElement("img");
      preview.className = "message-image";
      preview.src = `data:${message.image.mimeType};base64,${message.image.data}`;
      preview.alt = "Photo attached to this message";
      messageContent.append(preview);
    } else if (message.hadImage) {
      const note = document.createElement("span");
      note.className = "image-history-note";
      note.textContent = "Photo attachment was not retained in saved history.";
      messageContent.append(note);
    }

    const paragraph = document.createElement("p");
    paragraph.textContent = message.content;
    messageContent.append(paragraph);
  }

  const messageColumn = document.createElement("div");
  messageColumn.className = "message-column";
  messageColumn.append(messageContent);

  if (!message.isGreeting) {
    const actions = document.createElement("div");
    actions.className = "message-actions";
    if (message.role === "user") {
      const editButton = document.createElement("button");
      editButton.type = "button";
      editButton.textContent = "Edit";
      editButton.setAttribute("aria-label", "Edit this message");
      editButton.addEventListener("click", () => editUserMessage(index));
      actions.append(editButton);
    }

    const copyButton = document.createElement("button");
    copyButton.type = "button";
    copyButton.textContent = "Copy";
    copyButton.setAttribute("aria-label", message.role === "user" ? "Copy this input" : "Copy this output");
    copyButton.addEventListener("click", () => copyText(message.content, message.role));
    actions.append(copyButton);
    messageColumn.append(actions);
  }

  article.append(messageColumn);
  messagesElement.append(article);
  messagesElement.scrollTop = messagesElement.scrollHeight;
  return article;
}

function tableCells(line) {
  return line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((cell) => cell.trim());
}

function isTableDivider(line) {
  const cells = tableCells(line);
  return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell));
}

function isListItem(line) {
  return /^\s*(?:[-*+]|\d+[.)])\s+/.test(line);
}

function isBlockStart(lines, index) {
  const line = lines[index];
  return /^ {0,3}#{1,6}\s+/.test(line) ||
    /^ {0,3}```/.test(line) ||
    /^ {0,3}(?:-{3,}|_{3,}|\*{3,})\s*$/.test(line) ||
    /^ {0,3}>\s?/.test(line) ||
    isListItem(line) ||
    (line.includes("|") && index + 1 < lines.length && isTableDivider(lines[index + 1]));
}

function appendInline(parent, text) {
  const tokenPattern = /(\*\*[^*]+\*\*|__[^_]+__|~~[^~]+~~|`[^`]+`|\*[^*]+\*|_[^_]+_)/g;
  let start = 0;

  for (const match of text.matchAll(tokenPattern)) {
    if (match.index > start) {
      parent.append(document.createTextNode(text.slice(start, match.index)));
    }

    const token = match[0];
    let element;
    let content;
    if (token.startsWith("**") || token.startsWith("__")) {
      element = document.createElement("strong");
      content = token.slice(2, -2);
    } else if (token.startsWith("~~")) {
      element = document.createElement("del");
      content = token.slice(2, -2);
    } else if (token.startsWith("`")) {
      element = document.createElement("code");
      content = token.slice(1, -1);
    } else if (token.startsWith("*")) {
      element = document.createElement("em");
      content = token.slice(1, -1);
    } else {
      element = document.createElement("em");
      content = token.slice(1, -1);
    }
    element.textContent = content;
    parent.append(element);
    start = match.index + token.length;
  }

  if (start < text.length) {
    parent.append(document.createTextNode(text.slice(start)));
  }
}

function appendTable(parent, lines, headerLine, dividerLine) {
  const headers = tableCells(headerLine);
  const alignments = tableCells(dividerLine).map((cell) =>
    cell.startsWith(":") && cell.endsWith(":") ? "center" : cell.endsWith(":") ? "right" : "left"
  );
  const wrapper = document.createElement("div");
  wrapper.className = "structured-table-wrap";
  const table = document.createElement("table");
  const head = document.createElement("thead");
  const headerRow = document.createElement("tr");

  headers.forEach((value, index) => {
    const cell = document.createElement("th");
    cell.scope = "col";
    cell.style.textAlign = alignments[index] || "left";
    appendInline(cell, value);
    headerRow.append(cell);
  });
  head.append(headerRow);
  table.append(head);

  const body = document.createElement("tbody");
  for (const line of lines) {
    const values = tableCells(line);
    const row = document.createElement("tr");
    headers.forEach((_, cellIndex) => {
      const cell = document.createElement("td");
      cell.style.textAlign = alignments[cellIndex] || "left";
      appendInline(cell, values[cellIndex] || "");
      row.append(cell);
    });
    body.append(row);
  }
  table.append(body);
  wrapper.append(table);
  parent.append(wrapper);
}

function renderStructuredOutput(markdown) {
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
  const fragment = document.createDocumentFragment();
  const output = document.createElement("div");
  output.className = "structured-output-content";
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) {
      index += 1;
      continue;
    }

    if (/^ {0,3}```/.test(line)) {
      const codeLines = [];
      index += 1;
      while (index < lines.length && !/^ {0,3}```/.test(lines[index])) {
        codeLines.push(lines[index]);
        index += 1;
      }
      if (index < lines.length) index += 1;
      const pre = document.createElement("pre");
      const code = document.createElement("code");
      code.textContent = codeLines.join("\n");
      pre.append(code);
      fragment.append(pre);
      continue;
    }

    const heading = /^ {0,3}(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line);
    if (heading) {
      const element = document.createElement(`h${heading[1].length}`);
      appendInline(element, heading[2]);
      fragment.append(element);
      index += 1;
      continue;
    }

    if (/^ {0,3}(?:-{3,}|_{3,}|\*{3,})\s*$/.test(line)) {
      fragment.append(document.createElement("hr"));
      index += 1;
      continue;
    }

    if (/^ {0,3}>\s?/.test(line)) {
      const quote = document.createElement("blockquote");
      const quoteLines = [];
      while (index < lines.length && /^ {0,3}>\s?/.test(lines[index])) {
        quoteLines.push(lines[index].replace(/^ {0,3}>\s?/, ""));
        index += 1;
      }
      const paragraph = document.createElement("p");
      appendInline(paragraph, quoteLines.join(" "));
      quote.append(paragraph);
      fragment.append(quote);
      continue;
    }

    if (isListItem(line)) {
      const firstItem = /^\s*(?:([-*+])|(\d+)[.)])\s+/.exec(line);
      const ordered = Boolean(firstItem[2]);
      const list = document.createElement(ordered ? "ol" : "ul");
      while (index < lines.length && isListItem(lines[index])) {
        const item = /^\s*(?:([-*+])|(\d+)[.)])\s+(.+)$/.exec(lines[index]);
        if (Boolean(item[2]) !== ordered) break;
        const listItem = document.createElement("li");
        appendInline(listItem, item[3]);
        list.append(listItem);
        index += 1;
      }
      fragment.append(list);
      continue;
    }

    if (line.includes("|") && index + 1 < lines.length && isTableDivider(lines[index + 1])) {
      const headerLine = line;
      const dividerLine = lines[index + 1];
      const rows = [];
      index += 2;
      while (index < lines.length && lines[index].includes("|") && lines[index].trim()) {
        rows.push(lines[index]);
        index += 1;
      }
      appendTable(fragment, rows, headerLine, dividerLine);
      continue;
    }

    const paragraphLines = [line];
    index += 1;
    while (index < lines.length && lines[index].trim() && !isBlockStart(lines, index)) {
      paragraphLines.push(lines[index]);
      index += 1;
    }
    const paragraph = document.createElement("p");
    appendInline(paragraph, paragraphLines.join(" "));
    fragment.append(paragraph);
  }

  output.append(fragment);
  return output;
}

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.hidden = false;
}

function setActionStatus(message) {
  actionStatus.textContent = message;
}

function updateToolbarState() {
  const hasInput = conversation.some((message) => message.role === "user");
  const hasOutput = conversation.some((message) => message.role === "assistant");
  copyInputButton.disabled = !hasInput;
  copyOutputButton.disabled = !hasOutput;
}

function renderMessages() {
  messagesElement.replaceChildren();
  if (conversation.length === 0) {
    addMessage({
      role: "assistant",
      content: "Hi! What can I help you with today?",
      isGreeting: true
    }, -1);
  } else {
    conversation.forEach((message, index) => addMessage(message, index));
  }
  updateToolbarState();
}

async function loadChatHistory(restoreLatest = false) {
  try {
    const response = await fetch("/api/history");
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Could not load saved chats.");
    chatHistory = Array.isArray(result.chats) ? result.chats : [];
    renderHistoryList();

    if (restoreLatest) {
      if (chatHistory.length > 0) {
        await restoreChat(chatHistory[0].id, false);
      } else {
        renderMessages();
      }
    }
  } catch (error) {
    showError(error.message || "Saved chat history could not be loaded.");
    renderMessages();
  }
}

function renderHistoryList() {
  historyList.replaceChildren();
  if (chatHistory.length === 0) {
    const empty = document.createElement("p");
    empty.className = "history-empty";
    empty.textContent = "Your conversations will appear here after a reply.";
    historyList.append(empty);
    return;
  }

  for (const chat of chatHistory) {
    const entry = document.createElement("div");
    entry.className = `history-entry${chat.id === currentChatId ? " is-active" : ""}`;
    const button = document.createElement("button");
    button.className = "history-item";
    button.type = "button";
    button.disabled = isLoading;
    button.textContent = chat.title || "Conversation";
    button.title = chat.title || "Conversation";
    button.addEventListener("click", () => restoreChat(chat.id));

    const deleteButton = document.createElement("button");
    deleteButton.className = "icon-button delete-history-button";
    deleteButton.type = "button";
    deleteButton.disabled = isLoading;
    deleteButton.textContent = "×";
    deleteButton.setAttribute("aria-label", `Delete ${chat.title || "conversation"}`);
    deleteButton.title = "Delete conversation";
    deleteButton.addEventListener("click", () => deleteChat(chat.id));

    entry.append(button, deleteButton);
    historyList.append(entry);
  }
}

function openHistory() {
  loadChatHistory();
}

async function restoreChat(chatId, showStatus = true) {
  try {
    const response = await fetch(`/api/history/${encodeURIComponent(chatId)}`);
    const result = await response.json();
    if (!response.ok || !result.chat) {
      throw new Error(result.error || "Could not restore that conversation.");
    }

    const chat = result.chat;
    conversation.splice(0, conversation.length, ...chat.messages);
    currentChatId = chat.id;
    editingMessageIndex = null;
    draftBeforeEdit = null;
    pendingImage = null;
    promptInput.value = "";
    attachmentImage.removeAttribute("src");
    attachmentPreview.hidden = true;
    editMessageControls.hidden = true;
    renderMessages();
    renderHistoryList();
    updateSendButton();
    if (showStatus) {
      setActionStatus(chat.messages.some((message) => message.hadImage)
        ? "Conversation restored. Photo attachments are not retained in saved history."
        : "Conversation restored.");
    }
  } catch (error) {
    showError(error.message || "Could not restore that conversation.");
  }
}

async function deleteChat(chatId) {
  const chat = chatHistory.find((item) => item.id === chatId);
  if (!chat || !window.confirm(`Delete "${chat.title || "this conversation"}"?`)) return;

  try {
    const response = await fetch(`/api/history/${encodeURIComponent(chatId)}`, { method: "DELETE" });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Could not delete that conversation.");

    chatHistory = chatHistory.filter((item) => item.id !== chatId);
    if (currentChatId === chatId) {
      conversation.length = 0;
      currentChatId = createChatId();
      editingMessageIndex = null;
      draftBeforeEdit = null;
      promptInput.value = "";
      pendingImage = null;
      attachmentImage.removeAttribute("src");
      attachmentPreview.hidden = true;
      editMessageControls.hidden = true;
      renderMessages();
      updateSendButton();
    }
    renderHistoryList();
    setActionStatus("Conversation deleted.");
  } catch (error) {
    showError(error.message || "Could not delete that conversation.");
  }
}

function startNewChat() {
  conversation.length = 0;
  currentChatId = createChatId();
  editingMessageIndex = null;
  draftBeforeEdit = null;
  pendingImage = null;
  promptInput.value = "";
  attachmentImage.removeAttribute("src");
  attachmentPreview.hidden = true;
  editMessageControls.hidden = true;
  errorMessage.hidden = true;
  renderMessages();
  renderHistoryList();
  updateSendButton();
  setActionStatus("Started a new chat.");
}

function editUserMessage(index) {
  const message = conversation[index];
  if (!message || message.role !== "user" || isLoading) return;

  draftBeforeEdit = {
    content: promptInput.value,
    image: pendingImage
  };
  editingMessageIndex = index;
  promptInput.value = message.content;
  pendingImage = message.image || null;
  attachmentPreview.hidden = !pendingImage;
  if (pendingImage) {
    attachmentImage.src = `data:${pendingImage.mimeType};base64,${pendingImage.data}`;
    attachmentName.textContent = "Attached image";
  } else {
    attachmentImage.removeAttribute("src");
  }
  editMessageControls.hidden = false;
  errorMessage.hidden = true;
  updateSendButton();
  promptInput.focus();
  setActionStatus(message.hadImage && !message.image
    ? "This saved message had a photo, but that attachment is not available to edit."
    : "Editing a sent message. Later turns will be replaced when you send.");
}

function cancelEdit() {
  if (editingMessageIndex === null) return;
  editingMessageIndex = null;
  promptInput.value = draftBeforeEdit ? draftBeforeEdit.content : "";
  pendingImage = draftBeforeEdit ? draftBeforeEdit.image : null;
  draftBeforeEdit = null;
  editMessageControls.hidden = true;
  attachmentPreview.hidden = !pendingImage;
  if (pendingImage) {
    attachmentImage.src = `data:${pendingImage.mimeType};base64,${pendingImage.data}`;
  } else {
    attachmentImage.removeAttribute("src");
  }
  updateSendButton();
  setActionStatus("Message edit cancelled.");
}

async function copyText(value, kind) {
  try {
    await navigator.clipboard.writeText(value);
    setActionStatus(`${kind === "user" ? "Input" : "Output"} copied.`);
  } catch {
    setActionStatus("Clipboard access failed. Allow clipboard permission and try again.");
  }
}

function copyLatestMessage(role) {
  const message = [...conversation].reverse().find((item) => item.role === role);
  if (message) copyText(message.content, role);
}

function updateSendButton() {
  const hasContent = promptInput.value.trim().length > 0 || pendingImage !== null;
  const imageModelSelected = !pendingImage || modelSupportsVision();
  imageModelHint.hidden = !pendingImage || imageModelSelected;
  sendButton.disabled = isLoading || !modelsAvailable || !hasContent || !imageModelSelected;
  sendButton.querySelector("span").textContent = isLoading
    ? "Thinking..."
    : editingMessageIndex === null ? "Send" : "Update";
}

function modelSupportsVision() {
  const selectedOption = modelSelect.selectedOptions[0];
  return selectedOption && selectedOption.dataset.vision === "true";
}

function setLoading(loading) {
  isLoading = loading;
  promptInput.disabled = loading;
  uploadButton.disabled = loading;
  removeAttachmentButton.disabled = loading;
  voiceButton.disabled = loading || !SpeechRecognition;
  modelSelect.disabled = loading || !modelsAvailable;
  newChatButton.disabled = loading;
  chatHistoryButton.disabled = loading;
  historyList.querySelectorAll("button").forEach((button) => {
    button.disabled = loading;
  });
  updateSendButton();
}

function setConnectionStatus(state, text) {
  connectionStatus.classList.toggle("is-offline", state === "offline");
  connectionStatus.classList.toggle("is-online", state === "online");
  connectionText.textContent = text;
}

async function loadModels() {
  const previousModel = modelSelect.value;
  modelsAvailable = false;
  refreshModelsButton.disabled = true;
  modelSelect.disabled = true;
  modelSelect.replaceChildren(new Option("Loading models…", ""));
  updateSendButton();
  setConnectionStatus("loading", "Connecting to Ollama…");

  try {
    const response = await fetch("/api/models");
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || "Could not load Ollama models.");
    }

    const models = Array.isArray(result.models) ? result.models : [];
    availableModels = models.filter((model) => model && typeof model.name === "string");
    modelSelect.replaceChildren();

    if (availableModels.length === 0) {
      modelSelect.add(new Option("No models installed", ""));
      modelsAvailable = false;
      setConnectionStatus("offline", "Ollama is ready");
      showError("No models found. Install one with Ollama, then refresh the model list.");
    } else {
      for (const model of availableModels) {
        const supportsVision = Array.isArray(model.capabilities) && model.capabilities.includes("vision");
        const option = new Option(`${model.name}${supportsVision ? " · Vision" : ""}`, model.name);
        option.dataset.vision = String(supportsVision);
        modelSelect.add(option);
      }
      modelSelect.value = availableModels.some((model) => model.name === previousModel)
        ? previousModel
        : availableModels[0].name;
      modelsAvailable = true;
      errorMessage.hidden = true;
      setConnectionStatus("online", `${availableModels.length} model${availableModels.length === 1 ? "" : "s"} available`);
    }
  } catch (error) {
    modelSelect.replaceChildren(new Option("Ollama unavailable", ""));
    modelsAvailable = false;
    setConnectionStatus("offline", "Ollama is offline");
    showError(error.message || "Could not connect to Ollama. Start Ollama and refresh.");
  } finally {
    refreshModelsButton.disabled = false;
    modelSelect.disabled = isLoading || !modelsAvailable;
    updateSendButton();
  }
}

promptInput.addEventListener("input", () => {
  promptInput.style.height = "auto";
  promptInput.style.height = `${Math.min(promptInput.scrollHeight, 150)}px`;
  updateSendButton();
});

promptInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    form.requestSubmit();
  }
});

imageInput.addEventListener("change", () => {
  const file = imageInput.files && imageInput.files[0];
  imageInput.value = "";
  if (!file) return;

  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    showError("Choose a JPEG, PNG, or WebP image.");
    return;
  }
  if (file.size > maxImageBytes) {
    showError("Images must be 2 MB or smaller.");
    return;
  }

  const reader = new FileReader();
  reader.addEventListener("load", () => {
    if (typeof reader.result !== "string") {
      showError("Could not read that image. Please try another file.");
      return;
    }

    const base64 = reader.result.split(",")[1];
    if (!base64) {
      showError("Could not read that image. Please try another file.");
      return;
    }

    pendingImage = { mimeType: file.type, data: base64 };
    attachmentImage.src = reader.result;
    attachmentName.textContent = file.name;
    attachmentPreview.hidden = false;
    errorMessage.hidden = true;
    updateSendButton();
  });
  reader.addEventListener("error", () => showError("Could not read that image. Please try another file."));
  reader.readAsDataURL(file);
});

uploadButton.addEventListener("click", () => imageInput.click());

removeAttachmentButton.addEventListener("click", () => {
  pendingImage = null;
  attachmentImage.removeAttribute("src");
  attachmentPreview.hidden = true;
  updateSendButton();
});

refreshModelsButton.addEventListener("click", loadModels);
newChatButton.addEventListener("click", startNewChat);
chatHistoryButton.addEventListener("click", openHistory);
copyInputButton.addEventListener("click", () => copyLatestMessage("user"));
copyOutputButton.addEventListener("click", () => copyLatestMessage("assistant"));
cancelEditButton.addEventListener("click", cancelEdit);

modelSelect.addEventListener("change", () => {
  updateSendButton();
});

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.lang = navigator.language || "en-US";
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.addEventListener("result", (event) => {
    const transcript = Array.from(event.results)
      .slice(event.resultIndex)
      .filter((result) => result.isFinal)
      .map((result) => result[0].transcript.trim())
      .filter(Boolean)
      .join(" ");

    if (transcript) {
      const start = promptInput.selectionStart;
      const end = promptInput.selectionEnd;
      const before = promptInput.value.slice(0, start);
      const after = promptInput.value.slice(end);
      const separator = before && !/\s$/.test(before) ? " " : "";
      const inserted = `${separator}${transcript} `;
      promptInput.value = `${before}${inserted}${after}`.slice(0, 4000);
      const cursor = Math.min(before.length + inserted.length, promptInput.value.length);
      promptInput.setSelectionRange(cursor, cursor);
      promptInput.dispatchEvent(new Event("input"));
    }
  });

  recognition.addEventListener("error", (event) => {
    const messages = {
      "not-allowed": "Allow microphone access in your browser to use voice typing.",
      "no-speech": "No speech was detected. Try again.",
      "audio-capture": "No microphone was found."
    };
    showError(messages[event.error] || "Voice typing failed. Please try again.");
  });

  recognition.addEventListener("end", () => {
    isListening = false;
    voiceButton.classList.remove("is-listening");
    voiceButton.setAttribute("aria-label", "Start voice typing");
    voiceButton.title = "Start voice typing";
    voiceButton.disabled = isLoading;
  });

  voiceButton.addEventListener("click", () => {
    errorMessage.hidden = true;
    if (isListening) {
      recognition.stop();
      return;
    }

    try {
      recognition.start();
      isListening = true;
      voiceButton.classList.add("is-listening");
      voiceButton.setAttribute("aria-label", "Stop voice typing");
      voiceButton.title = "Listening…";
    } catch (error) {
      isListening = false;
      showError("Voice typing could not start. Check microphone permission and try again.");
    }
  });
} else {
  voiceButton.disabled = true;
  voiceButton.title = "Voice typing is not supported in this browser";
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const text = promptInput.value.trim();
  if ((!text && !pendingImage) || sendButton.disabled) return;

  errorMessage.hidden = true;
  const image = pendingImage;
  const content = text || "Describe this image.";
  const editIndex = editingMessageIndex;
  const previousConversation = editIndex === null ? null : conversation.slice();
  const previousDraft = draftBeforeEdit;

  if (editIndex !== null) {
    conversation.splice(editIndex);
    editingMessageIndex = null;
    draftBeforeEdit = null;
    editMessageControls.hidden = true;
    renderMessages();
  }

  const userMessage = { role: "user", content, image };
  conversation.push(userMessage);
  const userBubble = addMessage(userMessage, conversation.length - 1);
  promptInput.value = "";
  promptInput.style.height = "auto";
  pendingImage = null;
  attachmentImage.removeAttribute("src");
  attachmentPreview.hidden = true;
  editMessageControls.hidden = true;
  setLoading(true);

  try {
    const recentMessages = conversation.slice(-maxServerMessages);
    let latestImageIndex = -1;
    recentMessages.forEach((message, index) => {
      if (message.image) latestImageIndex = index;
    });

    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chatId: currentChatId,
        model: modelSelect.value,
        messages: recentMessages.map((message, index) => ({
          role: message.role,
          content: message.content,
          ...(message.hadImage ? { hadImage: true } : {}),
          ...(index === latestImageIndex ? { image: message.image } : {})
        }))
      })
    });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Something went wrong. Please try again.");
    }

    if (image) {
      for (const message of conversation) {
        if (message.image) {
          message.hadImage = true;
          message.image = null;
        }
      }
    }
    const assistantMessage = {
      role: "assistant",
      content: result.reply,
      model: modelSelect.value
    };
    conversation.push(assistantMessage);
    addMessage(assistantMessage, conversation.length - 1);
    await loadChatHistory();
    setActionStatus("Structured response received.");
  } catch (error) {
    conversation.pop();
    if (previousConversation) {
      conversation.splice(0, conversation.length, ...previousConversation);
      editingMessageIndex = editIndex;
      draftBeforeEdit = previousDraft;
      editMessageControls.hidden = false;
      renderMessages();
    } else {
      userBubble.remove();
      updateToolbarState();
    }
    promptInput.value = text;
    if (image) {
      pendingImage = image;
      attachmentImage.src = `data:${image.mimeType};base64,${image.data}`;
      attachmentName.textContent = "Attached image";
      attachmentPreview.hidden = false;
    }
    updateSendButton();
    showError(error.message || "Could not reach the server. Please try again.");
  } finally {
    setLoading(false);
    promptInput.focus();
  }
});

loadChatHistory(true);
loadModels();
