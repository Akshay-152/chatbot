const form = document.querySelector("#chat-form");
const promptInput = document.querySelector("#prompt");
const messagesElement = document.querySelector("#messages");
const scrollToBottomButton = document.querySelector("#scroll-to-bottom");
const sendButton = document.querySelector("#send-button");
const stopButton = document.querySelector("#stop-button");
const errorMessage = document.querySelector("#error-message");
const actionStatus = document.querySelector("#action-status");
const modelSelect = document.querySelector("#model-select");
const refreshModelsButton = document.querySelector("#refresh-models");
const connectionStatus = document.querySelector("#connection-status");
const connectionText = document.querySelector("#connection-text");
const sidebar = document.querySelector("#sidebar");
const mobileMenuButton = document.querySelector("#mobile-menu-button");
const mobileNavBackdrop = document.querySelector("#mobile-nav-backdrop");
const mobileViewport = window.matchMedia("(max-width: 560px)");
const imageInput = document.querySelector("#image-input");
const uploadButton = document.querySelector("#upload-button");
const composerDropHint = document.querySelector("#composer-drop-hint");
const attachmentPreview = document.querySelector("#attachment-preview");
const attachmentList = document.querySelector("#attachment-list");
const imageModelHint = document.querySelector("#image-model-hint");
const voiceButton = document.querySelector("#voice-button");
const voiceModeElement = document.querySelector("#voice-mode");
const voiceOrb = document.querySelector("#voice-orb");
const voiceCaption = document.querySelector("#voice-caption");
const voiceTypeForm = document.querySelector("#voice-type-form");
const voiceTypeInput = document.querySelector("#voice-type-input");
const voiceTypeButton = document.querySelector("#voice-type-button");
const voiceMuteButton = document.querySelector("#voice-mute-button");
const voiceCloseButton = document.querySelector("#voice-close-button");
const voiceSelect = document.querySelector("#voice-select");
const voiceSettingsStatus = document.querySelector("#voice-settings-status");
const webSearchToggle = document.querySelector("#web-search-toggle");
const newChatButton = document.querySelector("#new-chat-button");
const chatHistoryButton = document.querySelector("#chat-history-button");
const copyInputButton = document.querySelector("#copy-input-button");
const copyOutputButton = document.querySelector("#copy-output-button");
const exportChatButton = document.querySelector("#export-chat-button");
const historySearchInput = document.querySelector("#history-search");
const instructionsInput = document.querySelector("#instructions-input");
const saveInstructionsButton = document.querySelector("#save-instructions-button");
const editMessageControls = document.querySelector("#edit-message-controls");
const cancelEditButton = document.querySelector("#cancel-edit-button");
const historyList = document.querySelector("#history-list");
const outlineToggle = document.querySelector("#outline-toggle");
const chatOutline = document.querySelector(".chat-outline");
const outlineList = document.querySelector("#outline-list");
const outlineCount = document.querySelector("#outline-count");
const hoverOutlineQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
const settingsButton = document.querySelector("#settings-button");
const settingsDialog = document.querySelector("#settings-dialog");
const closeSettingsButton = document.querySelector("#close-settings-button");
const personalitySelect = document.querySelector("#personality-select");
const savePersonalityButton = document.querySelector("#save-personality-button");
const memoryInput = document.querySelector("#memory-input");
const saveMemoryButton = document.querySelector("#save-memory-button");
const savedSkillsElement = document.querySelector("#saved-skills");
const skillForm = document.querySelector("#skill-form");
const skillNameInput = document.querySelector("#skill-name");
const skillRequestInput = document.querySelector("#skill-request");
const skillFolderPathInput = document.querySelector("#skill-folder-path");
const previewSkillFolderButton = document.querySelector("#preview-skill-folder");
const skillFolderPreview = document.querySelector("#skill-folder-preview");
const settingsStatus = document.querySelector("#settings-status");
const settingsSearchInput = document.querySelector("#settings-search");
const settingsNav = document.querySelector("#settings-nav");
const settingsContent = document.querySelector(".settings-content");
const settingsGroupTitle = document.querySelector("#settings-group-title");
const settingsEmpty = document.querySelector("#settings-empty");
const settingsSections = Array.from(document.querySelectorAll(".settings-section"));
let activeSettingsGroup = "all";
const useSkillButton = document.querySelector("#use-skill-button");
const skillSelectionCount = document.querySelector("#skill-selection-count");
const skillPopover = document.querySelector("#skill-popover");
const skillPickerList = document.querySelector("#skill-picker-list");
const manageSkillsButton = document.querySelector("#manage-skills-button");


const conversation = [];
const maxImageBytes = 2 * 1024 * 1024;
const maxPdfBytes = 5 * 1024 * 1024;
const maxAttachments = 12;
const maxChatAttachments = 5;
const maxTotalAttachmentBytes = 24 * 1024 * 1024;
const maxBatchInstructionLength = 2000;
const maxUserMessageLength = 40000;
const maxServerMessages = 500;
const maxActiveSkills = 3;
const welcomeMessages = [
  "Welcome to Chatbot! How can I help you today?",
  "Hi there! Welcome to Chatbot. What would you like to chat about?",
  "Hey! Welcome to Chatbot. What can I help you with?",
  "Welcome! What would you like to explore or work on today?"
];
let availableModels = [];
let chatHistory = [];
let savedSkills = [];
let activeSkillIds = [];
let currentChatId = createChatId();
let currentGreeting = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
let pendingImages = [];
let pendingDocuments = [];
let editingMessageIndex = null;
let draftBeforeEdit = null;
let isLoading = false;
let isProcessingAttachments = false;
let modelsAvailable = false;
let activeSpeechButton = null;
let webSearchEnabled = true;
let settingsReturnFocus = null;
let recentImageContext = [];
let isBatchProcessing = false;
let activeChatController = null;

const suggestedPrompts = [
  { label: "Explain a concept", prompt: "Explain a topic in simple terms" },
  { label: "Help me write", prompt: "Help me write or improve a message" },
  { label: "Research a topic", prompt: "Research a current topic and cite sources" }
];

function syncAppHeight() {
  const visualViewport = window.visualViewport;
  const height = visualViewport ? visualViewport.height : window.innerHeight;
  document.documentElement.style.setProperty("--app-height", `${Math.round(height)}px`);
}

syncAppHeight();
window.addEventListener("resize", syncAppHeight);
if (window.visualViewport) window.visualViewport.addEventListener("resize", syncAppHeight);

function openMobileNav() {
  if (!mobileViewport.matches) return;
  sidebar.classList.add("is-open");
  sidebar.setAttribute("role", "dialog");
  sidebar.setAttribute("aria-modal", "true");
  sidebar.setAttribute("aria-label", "Conversation menu");
  mobileNavBackdrop.hidden = false;
  document.body.classList.add("mobile-nav-open");
  mobileMenuButton.setAttribute("aria-expanded", "true");
  mobileMenuButton.setAttribute("aria-label", "Close conversation menu");
  newChatButton.focus();
}

function closeMobileNav(restoreFocus = true) {
  sidebar.classList.remove("is-open");
  sidebar.removeAttribute("role");
  sidebar.removeAttribute("aria-modal");
  sidebar.setAttribute("aria-label", "Conversation sidebar");
  mobileNavBackdrop.hidden = true;
  document.body.classList.remove("mobile-nav-open");
  mobileMenuButton.setAttribute("aria-expanded", "false");
  mobileMenuButton.setAttribute("aria-label", "Open conversation menu");
  if (restoreFocus && mobileViewport.matches) mobileMenuButton.focus();
}

function createChatId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function updateOutlineExpanded() {
  const isExpanded = chatOutline.classList.contains("is-open") ||
    (!chatOutline.classList.contains("is-dismissed") &&
      ((hoverOutlineQuery.matches && chatOutline.matches(":hover")) ||
        chatOutline.contains(document.activeElement)));
  outlineToggle.setAttribute("aria-expanded", String(isExpanded));
}

function openOutline() {
  chatOutline.classList.remove("is-dismissed");
  chatOutline.classList.add("is-open");
  updateOutlineExpanded();
}

function closeOutline() {
  chatOutline.classList.remove("is-open");
  chatOutline.classList.add("is-dismissed");
  if (chatOutline.contains(document.activeElement)) document.activeElement.blur();
  updateOutlineExpanded();
}

function stopSpeechPlayback() {
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  resetSpeechButton();
}

function resetSpeechButton(button = activeSpeechButton) {
  if (!button || activeSpeechButton !== button) return;
  if (activeSpeechButton) {
    activeSpeechButton.classList.remove("is-speaking");
    activeSpeechButton.setAttribute("aria-label", "Read response aloud");
    activeSpeechButton.title = "Read response aloud";
  }
  activeSpeechButton = null;
}

function splitSpeechText(text, maxLength = 180) {
  const chunks = [];
  let chunk = "";

  for (const word of text.replace(/\s+/g, " ").trim().split(" ")) {
    if (word.length > maxLength) {
      if (chunk) chunks.push(chunk);
      chunk = "";
      const characters = Array.from(word);
      for (let index = 0; index < characters.length; index += maxLength) {
        const part = characters.slice(index, index + maxLength).join("");
        if (part.length === maxLength || index + maxLength < characters.length) {
          chunks.push(part);
        } else {
          chunk = part;
        }
      }
      continue;
    }

    const nextChunk = chunk ? `${chunk} ${word}` : word;
    if (nextChunk.length > maxLength) {
      chunks.push(chunk);
      chunk = word;
    } else {
      chunk = nextChunk;
    }
  }

  if (chunk) chunks.push(chunk);
  return chunks;
}

const voicePreferenceKey = "chatbot-voice-name";

function readVoicePreference() {
  try {
    return window.localStorage.getItem(voicePreferenceKey) || "";
  } catch {
    return "";
  }
}

function writeVoicePreference(name) {
  try {
    if (name) window.localStorage.setItem(voicePreferenceKey, name);
    else window.localStorage.removeItem(voicePreferenceKey);
  } catch {
    /* Ignore storage failures; the system voice stays in use. */
  }
}

function getPreferredSpeechVoice() {
  if (!("speechSynthesis" in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  const saved = readVoicePreference();
  return voices.find((candidate) => candidate.name === saved)
    || voices.find((candidate) => candidate.default && /^en/i.test(candidate.lang))
    || voices.find((candidate) => candidate.default)
    || voices.find((candidate) => /^en[-_]/i.test(candidate.lang))
    || voices[0]
    || null;
}

function getSpeechVoice(text) {
  const requestedLanguage = /[\u0D00-\u0D7F]/.test(text)
    ? "ml-IN"
    : navigator.language || "en-US";
  const voices = window.speechSynthesis.getVoices();
  const languagePrefix = requestedLanguage.split("-")[0].toLowerCase();
  const preferred = getPreferredSpeechVoice();
  const preferredMatches = preferred &&
    preferred.lang.toLowerCase().split("-")[0] === languagePrefix ? preferred : null;
  const voice = preferredMatches || voices.find((candidate) =>
    candidate.lang.toLowerCase() === requestedLanguage.toLowerCase()
  ) || voices.find((candidate) =>
    candidate.lang.toLowerCase() === languagePrefix ||
    candidate.lang.toLowerCase().startsWith(`${languagePrefix}-`)
  ) || voices.find((candidate) => candidate.default) || voices[0] || null;

  return {
    voice,
    language: voice
      ? voice.lang
      : requestedLanguage === "ml-IN"
        ? navigator.language || "en-US"
        : requestedLanguage
  };
}

function speakSpeechChunk(chunks, index, button, speechVoice) {
  if (activeSpeechButton !== button) return;
  if (index >= chunks.length) {
    resetSpeechButton(button);
    return;
  }

  try {
    const utterance = new window.SpeechSynthesisUtterance(chunks[index]);
    utterance.lang = speechVoice.language;
    if (speechVoice.voice) utterance.voice = speechVoice.voice;
    utterance.onend = () => speakSpeechChunk(chunks, index + 1, button, speechVoice);
    utterance.onerror = (event) => {
      if (activeSpeechButton !== button) return;
      stopSpeechPlayback();
      if (event.error !== "canceled" && event.error !== "interrupted") {
        setActionStatus("Text-to-speech failed. Check your browser's speech settings.");
      }
    };
    window.speechSynthesis.speak(utterance);
  } catch {
    stopSpeechPlayback();
    setActionStatus("Text-to-speech could not start.");
  }
}

function readMessageAloud(message, article, button) {
  if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
    setActionStatus("Text-to-speech is not supported in this browser.");
    return;
  }
  if (activeSpeechButton === button) {
    stopSpeechPlayback();
    return;
  }

  const output = article.querySelector(".structured-output-content");
  const text = (output ? output.innerText : message.content).trim();
  if (!text) return;

  stopSpeechPlayback();
  let speechVoice;
  try {
    speechVoice = getSpeechVoice(text);
  } catch {
    stopSpeechPlayback();
    setActionStatus("Text-to-speech could not load an available voice.");
    return;
  }

  activeSpeechButton = button;
  button.classList.add("is-speaking");
  button.setAttribute("aria-label", "Stop reading aloud");
  button.title = "Stop reading aloud";
  speakSpeechChunk(splitSpeechText(text), 0, button, speechVoice);
}

function appendMessageActions(message, index, messageColumn) {
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

  if (message.role === "assistant") {
    const downloadButton = document.createElement("button");
    downloadButton.type = "button";
    downloadButton.textContent = "Download .md";
    downloadButton.setAttribute("aria-label", "Download this response as Markdown");
    downloadButton.addEventListener("click", () => downloadResponse(message.content));
    actions.append(downloadButton);

    if (index >= 0 && index === conversation.length - 1) {
      const regenerateButton = document.createElement("button");
      regenerateButton.type = "button";
      regenerateButton.textContent = "Regenerate";
      regenerateButton.setAttribute("aria-label", "Regenerate this reply");
      regenerateButton.addEventListener("click", regenerateResponse);
      actions.append(regenerateButton);

      if (message.truncated) {
        const continueButton = document.createElement("button");
        continueButton.type = "button";
        continueButton.textContent = "Continue";
        continueButton.setAttribute("aria-label", "Continue this reply");
        continueButton.addEventListener("click", continueReply);
        actions.append(continueButton);
      }
    }

    const readButton = document.createElement("button");
    readButton.className = "read-aloud-button";
    readButton.type = "button";
    readButton.title = "Read response aloud";
    readButton.setAttribute("aria-label", "Read response aloud");
    readButton.innerHTML = '<svg aria-hidden="true" viewBox="0 0 20 20" fill="none"><path d="M3 8v4h3l4 3V5L6 8H3Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M13 7a4 4 0 0 1 0 6m2-8a7 7 0 0 1 0 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';
    readButton.addEventListener("click", () => readMessageAloud(message, messageColumn, readButton));
    actions.append(readButton);
  }

  messageColumn.append(actions);
}

function regenerateResponse() {
  if (isLoading || conversation.length === 0) return;
  let lastUserIndex = -1;
  conversation.forEach((message, index) => {
    if (message.role === "user") lastUserIndex = index;
  });
  if (lastUserIndex === -1) return;

  const lastUserMessage = conversation[lastUserIndex];
  editUserMessage(lastUserIndex);
  if (lastUserMessage.hadImage && pendingImages.length === 0 && recentImageContext.length) {
    pendingImages = recentImageContext.slice();
    renderPendingAttachments();
  }
  updateSendButton();
  setActionStatus("Regenerating the last reply…");
  form.requestSubmit();
}

function continueReply() {
  if (isLoading || !modelsAvailable) return;
  promptInput.value = "Continue from where you stopped, without repeating anything.";
  promptInput.dispatchEvent(new Event("input", { bubbles: true }));
  setActionStatus("Continuing the reply…");
  form.requestSubmit();
}

function downloadTextFile(content, filename, mimeType = "text/markdown") {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function exportConversation() {
  if (conversation.length === 0) return;
  const chat = chatHistory.find((item) => item.id === currentChatId);
  const title = (chat && chat.title) || "Conversation";
  const lines = [
    `# ${title}`,
    "",
    `Exported from the local Chatbot on ${new Date().toLocaleString()}.`,
    ""
  ];
  for (const message of conversation) {
    lines.push(`## ${message.role === "user" ? "You" : "Assistant"}${message.model ? ` · ${message.model}` : ""}`, "");
    if (message.hadImage) lines.push("_Images were attached to this message and are not saved._", "");
    for (const document of message.documents || []) {
      lines.push(`_Attached PDF: ${document.name}_`, "");
    }
    lines.push(message.content, "");
  }
  downloadTextFile(lines.join("\n"), `chat-${new Date().toISOString().slice(0, 10)}.md`);
  setActionStatus("Conversation exported as Markdown.");
}

function downloadResponse(content) {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "assistant-response.md";
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
  setActionStatus("Response downloaded as Markdown.");
}

function addMessage(message, index) {
  const article = document.createElement("article");
  article.className = `message ${message.role === "user" ? "user-message" : "assistant-message"}`;
  if (index >= 0) article.id = `chat-message-${index}`;
  if (message.isStreaming) article.classList.add("is-streaming");
  if (message.isArriving) article.classList.add("is-arriving");

  const messageContent = document.createElement("div");
  messageContent.className = "message-content";

  if (message.role === "assistant") {
    const author = document.createElement("span");
    author.className = "message-author";
    author.textContent = "Assistant";
    messageContent.append(author);

    if (message.model) {
      const model = document.createElement("span");
      model.className = "response-model";
      model.textContent = message.model;
      messageContent.append(model);
    }

    if (message.isGreeting) {
      messageContent.classList.add("welcome-content");
      article.classList.add("welcome-message");
      const heading = document.createElement("h1");
      heading.className = "welcome-title";
      heading.textContent = message.content;
      const prompts = document.createElement("div");
      prompts.className = "suggested-prompts";
      prompts.setAttribute("role", "group");
      prompts.setAttribute("aria-label", "Suggested prompts");
      suggestedPrompts.forEach(({ label, prompt }) => {
        const button = document.createElement("button");
        button.className = "suggested-prompt";
        button.type = "button";
        button.dataset.prompt = prompt;
        button.textContent = label;
        prompts.append(button);
      });
      messageContent.append(heading, prompts);
    } else {
      messageContent.append(renderStructuredOutput(message.content));
    }
  } else {
    const images = message.images || (message.image ? [message.image] : []);
    for (const image of images) {
      const preview = document.createElement("img");
      preview.className = "message-image";
      preview.src = `data:${image.mimeType};base64,${image.data}`;
      preview.alt = "Image attached to this message";
      messageContent.append(preview);
    }
    if (!images.length && message.hadImage) {
      const note = document.createElement("span");
      note.className = "image-history-note";
      note.textContent = "Image attachments were not retained in saved history.";
      messageContent.append(note);
    }
    const documents = message.documents || [];
    for (const attachment of documents) {
      const label = document.createElement("span");
      label.className = "document-history-note";
      label.textContent = `PDF processed: ${attachment.name}`;
      messageContent.append(label);
    }
    if (!documents.length && message.hadDocuments) {
      const note = document.createElement("span");
      note.className = "document-history-note";
      note.textContent = "PDF text was processed; the source file is not retained.";
      messageContent.append(note);
    }

    const paragraph = document.createElement("p");
    paragraph.textContent = message.content;
    messageContent.append(paragraph);
  }

  const messageColumn = document.createElement("div");
  messageColumn.className = "message-column";
  messageColumn.append(messageContent);

  if (!message.isStreaming) {
    appendMessageActions(message, index, messageColumn);
  }

  article.append(messageColumn);
  messagesElement.append(article);
  messagesElement.scrollTop = messagesElement.scrollHeight;
  updateScrollToBottomButton();
  if (message.role === "user") renderOutline();
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
  const tokenPattern = /(\[((?:\\.|[^\]])+)\]\(https?:\/\/[^)\s]+\)|\*\*[^*]+\*\*|__[^_]+__|~~[^~]+~~|`[^`]+`|\*[^*]+\*|_[^_]+_)/g;
  let start = 0;

  for (const match of text.matchAll(tokenPattern)) {
    if (match.index > start) {
      parent.append(document.createTextNode(text.slice(start, match.index)));
    }

    const token = match[0];
    if (token.startsWith("[")) {
      const linkMatch = /^\[((?:\\.|[^\]])+)\]\((https?:\/\/[^)\s]+)\)$/.exec(token);
      if (linkMatch) {
        const link = document.createElement("a");
        link.href = linkMatch[2];
        link.textContent = linkMatch[1].replace(/\\([\\[\]])/g, "$1");
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        parent.append(link);
        start = match.index + token.length;
        continue;
      }
    }

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

function createCodeBlock(codeText, language) {
  const block = document.createElement("section");
  block.className = "code-block";
  const header = document.createElement("header");
  header.className = "code-block-header";
  const languageLabel = document.createElement("span");
  languageLabel.className = "code-language";
  languageLabel.textContent = language || "code";

  const actions = document.createElement("div");
  actions.className = "code-actions";
  const copyButton = document.createElement("button");
  copyButton.type = "button";
  copyButton.textContent = "Copy";
  copyButton.addEventListener("click", () => copyText(codeText, "code"));
  const downloadButton = document.createElement("button");
  downloadButton.type = "button";
  downloadButton.textContent = "Download";
  downloadButton.addEventListener("click", () => downloadCode(codeText, language));
  actions.append(copyButton, downloadButton);
  header.append(languageLabel, actions);

  const pre = document.createElement("pre");
  const code = document.createElement("code");
  code.textContent = codeText;
  pre.append(code);
  block.append(header, pre);
  return block;
}

function downloadCode(codeText, language) {
  const extension = (language || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const safeExtension = /^[a-z0-9]{1,10}$/.test(extension) ? extension : "txt";
  const objectUrl = URL.createObjectURL(new Blob([codeText], { type: "text/plain;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = `snippet.${safeExtension}`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
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

    const codeFence = /^ {0,3}```([\w.+#-]*)\s*$/.exec(line);
    if (codeFence) {
      const codeLines = [];
      index += 1;
      while (index < lines.length && !/^ {0,3}```/.test(lines[index])) {
        codeLines.push(lines[index]);
        index += 1;
      }
      if (index < lines.length) index += 1;
      fragment.append(createCodeBlock(codeLines.join("\n"), codeFence[1]));
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
  exportChatButton.disabled = conversation.length === 0;
}

function renderMessages() {
  stopSpeechPlayback();
  messagesElement.replaceChildren();
  if (conversation.length === 0) {
    addMessage({
      role: "assistant",
      content: currentGreeting,
      isGreeting: true
    }, -1);
  } else {
    conversation.forEach((message, index) => addMessage(message, index));
  }
  updateToolbarState();
  renderOutline();
}

function renderOutline() {
  const prompts = conversation
    .map((message, index) => ({ message, index }))
    .filter((entry) => entry.message.role === "user");
  outlineCount.textContent = String(prompts.length);
  outlineList.replaceChildren();
  outlineToggle.replaceChildren();

  if (prompts.length === 0) {
    const empty = document.createElement("p");
    empty.className = "outline-empty";
    empty.textContent = "Your prompts will appear here.";
    outlineList.append(empty);
    return;
  }

  const tickCount = Math.min(prompts.length, 7);
  for (let index = 0; index < tickCount; index += 1) {
    const tick = document.createElement("span");
    tick.className = `outline-rail-tick${index === tickCount - 1 ? " is-active" : ""}`;
    outlineToggle.append(tick);
  }

  prompts.forEach(({ message, index }, promptIndex) => {
    const button = document.createElement("button");
    button.className = "outline-item";
    button.type = "button";
    button.dataset.messageIndex = String(index);
    const number = document.createElement("span");
    number.className = "outline-number";
    number.textContent = String(promptIndex + 1).padStart(2, "0");
    const title = document.createElement("span");
    title.className = "outline-title";
    title.textContent = message.content.trim().replace(/\s+/g, " ") || "Photo question";
    button.title = title.textContent;
    button.append(number, title);
    button.addEventListener("click", () => {
      const target = document.getElementById(`chat-message-${index}`);
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
      closeOutline();
    });
    outlineList.append(button);
  });
  updateActiveOutline();
}

function updateActiveOutline() {
  const buttons = Array.from(outlineList.querySelectorAll(".outline-item"));
  if (!buttons.length) return;
  const threshold = messagesElement.getBoundingClientRect().top + 80;
  let activeButton = buttons[0];
  for (const button of buttons) {
    const index = Number(button.dataset.messageIndex);
    const target = document.getElementById(`chat-message-${index}`);
    if (target && target.getBoundingClientRect().top <= threshold) activeButton = button;
  }
  buttons.forEach((button) => button.classList.toggle("is-active", button === activeButton));
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
    } else if (conversation.length === 0) {
      renderMessages();
    }
  } catch (error) {
    showError(error.message || "Saved chat history could not be loaded.");
    renderMessages();
  }
}

function sortChatHistory() {
  chatHistory.sort((left, right) =>
    Number(right.pinned === true) - Number(left.pinned === true) ||
    right.updatedAt.localeCompare(left.updatedAt)
  );
}

function renderHistoryList() {
  historyList.replaceChildren();
  const query = historySearchInput.value.trim().toLowerCase();
  const matches = query
    ? chatHistory.filter((chat) => (chat.title || "Conversation").toLowerCase().includes(query))
    : chatHistory;

  if (matches.length === 0) {
    const empty = document.createElement("p");
    empty.className = "history-empty";
    empty.textContent = query
      ? `No conversations match “${historySearchInput.value.trim()}”.`
      : "Your conversations will appear here after a reply.";
    historyList.append(empty);
    return;
  }

  for (const chat of matches) {
    const entry = document.createElement("div");
    entry.className = `history-entry${chat.id === currentChatId ? " is-active" : ""}${chat.pinned ? " is-pinned" : ""}`;
    const button = document.createElement("button");
    button.className = "history-item";
    button.type = "button";
    button.disabled = isLoading;
    button.textContent = chat.title || "Conversation";
    button.title = chat.title || "Conversation";
    button.addEventListener("click", () => {
      closeMobileNav(false);
      restoreChat(chat.id);
    });

    const actions = document.createElement("div");
    actions.className = "history-actions";

    const pinButton = document.createElement("button");
    pinButton.className = "icon-button history-action-button";
    pinButton.type = "button";
    pinButton.disabled = isLoading;
    pinButton.textContent = chat.pinned ? "★" : "☆";
    pinButton.setAttribute("aria-label", chat.pinned
      ? `Unpin ${chat.title || "conversation"}`
      : `Pin ${chat.title || "conversation"}`);
    pinButton.title = chat.pinned ? "Unpin conversation" : "Pin conversation";
    pinButton.setAttribute("aria-pressed", String(chat.pinned === true));
    pinButton.addEventListener("click", () => togglePinChat(chat));

    const renameButton = document.createElement("button");
    renameButton.className = "icon-button history-action-button";
    renameButton.type = "button";
    renameButton.disabled = isLoading;
    renameButton.textContent = "✎";
    renameButton.setAttribute("aria-label", `Rename ${chat.title || "conversation"}`);
    renameButton.title = "Rename conversation";
    renameButton.addEventListener("click", () => startRenameChat(chat, entry));

    const deleteButton = document.createElement("button");
    deleteButton.className = "icon-button delete-history-button history-action-button";
    deleteButton.type = "button";
    deleteButton.disabled = isLoading;
    deleteButton.textContent = "×";
    deleteButton.setAttribute("aria-label", `Delete ${chat.title || "conversation"}`);
    deleteButton.title = "Delete conversation";
    deleteButton.addEventListener("click", () => deleteChat(chat.id));

    actions.append(pinButton, renameButton, deleteButton);
    entry.append(button, actions);
    historyList.append(entry);
  }
}

async function updateChatMeta(chat, patch) {
  const response = await fetch(`/api/history/${encodeURIComponent(chat.id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch)
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Could not update that conversation.");
  if (result.chat) {
    chat.title = result.chat.title;
    chat.pinned = result.chat.pinned === true;
  }
  sortChatHistory();
  renderHistoryList();
}

function startRenameChat(chat, entry) {
  if (isLoading) return;
  entry.replaceChildren();

  const input = document.createElement("input");
  input.className = "history-rename-input";
  input.value = chat.title || "";
  input.maxLength = 120;
  input.setAttribute("aria-label", "New conversation name");

  const saveButton = document.createElement("button");
  saveButton.className = "icon-button history-action-button";
  saveButton.type = "button";
  saveButton.textContent = "✓";
  saveButton.title = "Save name";
  saveButton.setAttribute("aria-label", "Save conversation name");

  const cancelButton = document.createElement("button");
  cancelButton.className = "icon-button history-action-button";
  cancelButton.type = "button";
  cancelButton.textContent = "×";
  cancelButton.title = "Cancel rename";
  cancelButton.setAttribute("aria-label", "Cancel rename");

  const finish = async (commit) => {
    if (!commit) {
      renderHistoryList();
      return;
    }
    const title = input.value.trim();
    if (!title) {
      input.focus();
      return;
    }
    try {
      await updateChatMeta(chat, { title: title.slice(0, 120) });
      setActionStatus("Conversation renamed.");
    } catch (error) {
      setActionStatus(error.message || "Could not rename that conversation.");
      renderHistoryList();
    }
  };

  saveButton.addEventListener("click", () => finish(true));
  cancelButton.addEventListener("click", () => finish(false));
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      finish(true);
    } else if (event.key === "Escape") {
      event.preventDefault();
      finish(false);
    }
  });

  entry.append(input, saveButton, cancelButton);
  input.focus();
  input.select();
}

async function togglePinChat(chat) {
  try {
    await updateChatMeta(chat, { pinned: chat.pinned !== true });
    setActionStatus(chat.pinned ? "Conversation pinned." : "Conversation unpinned.");
  } catch (error) {
    setActionStatus(error.message || "Could not pin that conversation.");
  }
}

function openHistory() {
  loadChatHistory();
}

async function restoreChat(chatId, showStatus = true) {
  if (isBatchProcessing) return;
  try {
    const response = await fetch(`/api/history/${encodeURIComponent(chatId)}`);
    const result = await response.json();
    if (!response.ok || !result.chat) {
      throw new Error(result.error || "Could not restore that conversation.");
    }

    const chat = result.chat;
    conversation.splice(0, conversation.length, ...chat.messages);
    currentChatId = chat.id;
    activeSkillIds = Array.isArray(chat.skillIds) ? chat.skillIds : [];
    editingMessageIndex = null;
    draftBeforeEdit = null;
    pendingImages = [];
    pendingDocuments = [];
    recentImageContext = [];
    promptInput.value = "";
    renderPendingAttachments();
    editMessageControls.hidden = true;
    renderMessages();
    renderHistoryList();
    renderSkillPicker();
    updateSendButton();
    promptInput.focus();
    if (showStatus) {
      setActionStatus(chat.messages.some((message) => message.hadImage)
        ? "Conversation restored. Image files are not retained in saved history."
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
      currentGreeting = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
      activeSkillIds = [];
      editingMessageIndex = null;
      draftBeforeEdit = null;
      promptInput.value = "";
      pendingImages = [];
      pendingDocuments = [];
      recentImageContext = [];
      renderPendingAttachments();
      editMessageControls.hidden = true;
      renderMessages();
      renderSkillPicker();
      updateSendButton();
    }
    renderHistoryList();
    setActionStatus("Conversation deleted.");
  } catch (error) {
    showError(error.message || "Could not delete that conversation.");
  }
}

function setSettingsStatus(message, isError = false) {
  settingsStatus.textContent = message;
  settingsStatus.classList.toggle("is-error", isError);
}

function updateSkillSelectionUI() {
  skillSelectionCount.textContent = activeSkillIds.length ? String(activeSkillIds.length) : "";
  skillSelectionCount.hidden = activeSkillIds.length === 0;
  useSkillButton.classList.toggle("is-selected", activeSkillIds.length > 0);
  useSkillButton.setAttribute("aria-expanded", String(!skillPopover.hidden));
  skillPickerList.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
    checkbox.checked = activeSkillIds.includes(checkbox.value);
    checkbox.disabled = isLoading ||
      (!checkbox.checked && activeSkillIds.length >= maxActiveSkills);
  });
}

function renderSkillPicker() {
  skillPickerList.replaceChildren();
  if (savedSkills.length === 0) {
    const empty = document.createElement("p");
    empty.className = "skill-picker-empty";
    empty.textContent = "No skills yet. Create one in Settings.";
    skillPickerList.append(empty);
    updateSkillSelectionUI();
    return;
  }

  for (const skill of savedSkills) {
    const label = document.createElement("label");
    label.className = "skill-picker-option";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = skill.id;
    checkbox.checked = activeSkillIds.includes(skill.id);
    checkbox.addEventListener("change", () => {
      if (checkbox.checked && !activeSkillIds.includes(skill.id)) {
        if (activeSkillIds.length >= maxActiveSkills) {
          checkbox.checked = false;
          setActionStatus(`Use up to ${maxActiveSkills} skills in one chat.`);
          return;
        }
        activeSkillIds.push(skill.id);
      } else {
        activeSkillIds = activeSkillIds.filter((id) => id !== skill.id);
      }
      updateSkillSelectionUI();
    });
    const copy = document.createElement("span");
    copy.className = "skill-picker-copy";
    const name = document.createElement("span");
    name.className = "skill-picker-name";
    name.textContent = skill.name;
    const summary = document.createElement("span");
    summary.className = "skill-picker-summary";
    summary.textContent = skill.summary;
    copy.append(name, summary);
    label.append(checkbox, copy);
    skillPickerList.append(label);
  }
  updateSkillSelectionUI();
}

function renderSavedSkills() {
  savedSkillsElement.replaceChildren();
  if (savedSkills.length === 0) {
    const empty = document.createElement("p");
    empty.className = "saved-skills-empty";
    empty.textContent = "No saved skills yet.";
    savedSkillsElement.append(empty);
    return;
  }

  for (const skill of savedSkills) {
    const row = document.createElement("article");
    row.className = "saved-skill";
    const copy = document.createElement("div");
    copy.className = "saved-skill-copy";
    const name = document.createElement("div");
    name.className = "saved-skill-name";
    name.textContent = skill.name;
    const summary = document.createElement("div");
    summary.className = "saved-skill-summary";
    summary.textContent = skill.summary;
    copy.append(name, summary);
    const instructions = document.createElement("details");
    instructions.className = "saved-skill-details";
    const summaryLabel = document.createElement("summary");
    summaryLabel.textContent = "View generated instructions";
    const instructionsText = document.createElement("pre");
    instructionsText.textContent = skill.instructions;
    instructions.append(summaryLabel, instructionsText);
    copy.append(instructions);
    if (skill.sourcePath) {
      const source = document.createElement("div");
      source.className = "saved-skill-source";
      source.textContent = `${skill.sourcePath} · ${skill.fileCount} files`;
      copy.append(source);
    }

    const remove = document.createElement("button");
    remove.className = "saved-skill-delete";
    remove.type = "button";
    remove.textContent = "Delete";
    remove.setAttribute("aria-label", `Delete skill ${skill.name}`);
    remove.addEventListener("click", () => deleteSkill(skill.id));
    row.append(copy, remove);
    savedSkillsElement.append(row);
  }
}

async function loadSkills() {
  const response = await fetch("/api/skills");
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Could not load skills.");
  savedSkills = Array.isArray(result.skills) ? result.skills : [];
  activeSkillIds = activeSkillIds.filter((id) => savedSkills.some((skill) => skill.id === id));
  renderSkillPicker();
  renderSavedSkills();
}

async function loadSettings() {
  try {
    const [personalityResponse, memoryResponse, skillsResponse, instructionsResponse] = await Promise.all([
      fetch("/api/personality"),
      fetch("/api/memory"),
      fetch("/api/skills"),
      fetch("/api/instructions")
    ]);
    const [personality, memory, skills, instructions] = await Promise.all([
      personalityResponse.json(),
      memoryResponse.json(),
      skillsResponse.json(),
      instructionsResponse.json()
    ]);
    if (!personalityResponse.ok) throw new Error(personality.error || "Could not load chat personality.");
    if (!memoryResponse.ok) throw new Error(memory.error || "Could not load memory.");
    if (!skillsResponse.ok) throw new Error(skills.error || "Could not load skills.");
    if (!instructionsResponse.ok) throw new Error(instructions.error || "Could not load custom instructions.");
    personalitySelect.value = personality.personality;
    memoryInput.value = typeof memory.text === "string" ? memory.text : "";
    instructionsInput.value = typeof instructions.text === "string" ? instructions.text : "";
    savedSkills = Array.isArray(skills.skills) ? skills.skills : [];
    activeSkillIds = activeSkillIds.filter((id) => savedSkills.some((skill) => skill.id === id));
    renderSavedSkills();
    renderSkillPicker();
  } catch (error) {
    setSettingsStatus(error.message || "Could not load settings.", true);
  }
}

async function savePersonality() {
  savePersonalityButton.disabled = true;
  setSettingsStatus("Saving chat personality…");
  try {
    const response = await fetch("/api/personality", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ personality: personalitySelect.value })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Could not save chat personality.");
    personalitySelect.value = result.personality;
    setSettingsStatus(`${personalitySelect.options[personalitySelect.selectedIndex].text} personality saved for future replies.`);
  } catch (error) {
    setSettingsStatus(error.message || "Could not save chat personality.", true);
  } finally {
    savePersonalityButton.disabled = false;
  }
}

async function saveCustomInstructions() {
  saveInstructionsButton.disabled = true;
  setSettingsStatus("Saving custom instructions…");
  try {
    const response = await fetch("/api/instructions", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: instructionsInput.value })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Could not save custom instructions.");
    instructionsInput.value = result.text;
    setSettingsStatus("Custom instructions saved and will be added to future replies.");
  } catch (error) {
    setSettingsStatus(error.message || "Could not save custom instructions.", true);
  } finally {
    saveInstructionsButton.disabled = false;
  }
}

async function saveMemory() {
  saveMemoryButton.disabled = true;
  setSettingsStatus("Saving memory…");
  try {
    const response = await fetch("/api/memory", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: memoryInput.value })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Could not save memory.");
    memoryInput.value = result.text;
    setSettingsStatus("Memory saved locally and will be included in future replies.");
  } catch (error) {
    setSettingsStatus(error.message || "Could not save memory.", true);
  } finally {
    saveMemoryButton.disabled = false;
  }
}

function extractFolderPathFromRequest(text) {
  const labeled = /(?:^|\n)\s*(?:folder|source|project)?\s*path\s*[:=]\s*["'`]?([A-Za-z]:\\[^\r\n"'`]+|\/[^\r\n"'`]+)/i.exec(text);
  const quoted = /(["'`])([A-Za-z]:\\[^"'`]+|\/[^"'`]+)\1/.exec(text);
  const candidate = labeled ? labeled[1] : quoted ? quoted[2] : "";
  return candidate ? candidate.trim().replace(/[.,;]+$/, "") : "";
}

function renderFolderPreview(result) {
  skillFolderPreview.replaceChildren();
  const heading = document.createElement("p");
  heading.className = "skill-preview-title";
  heading.textContent = `${result.folderPath} · ${result.files.length} files`;
  skillFolderPreview.append(heading);
  for (const warning of result.warnings || []) {
    const note = document.createElement("p");
    note.className = "saved-skill-summary";
    note.textContent = warning;
    skillFolderPreview.append(note);
  }
  for (const file of result.files) {
    const item = document.createElement("article");
    item.className = "skill-preview-file";
    const title = document.createElement("div");
    title.className = "skill-preview-title";
    title.textContent = file.path;
    const content = document.createElement("pre");
    content.textContent = file.content;
    item.append(title, content);
    skillFolderPreview.append(item);
  }
  skillFolderPreview.hidden = false;
}

async function previewSkillFolder() {
  const folderPath = skillFolderPathInput.value.trim() ||
    extractFolderPathFromRequest(skillRequestInput.value);
  if (!folderPath) {
    setSettingsStatus("Enter a folder path or add a quoted path / “Path: …” line to the skill request.", true);
    return;
  }
  skillFolderPathInput.value = folderPath;
  previewSkillFolderButton.disabled = true;
  setSettingsStatus("Reading supported text and code files from the selected folder…");
  try {
    const response = await fetch("/api/skills/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ folderPath })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Could not preview the folder.");
    renderFolderPreview(result);
    setSettingsStatus(`Preview ready. ${result.files.length} supported files were read; no commands were run.`);
  } catch (error) {
    setSettingsStatus(error.message || "Could not preview the folder.", true);
  } finally {
    previewSkillFolderButton.disabled = false;
  }
}

async function createSkill(event) {
  event.preventDefault();
  const request = skillRequestInput.value.trim();
  if (!request) return;
  const createButton = document.querySelector("#create-skill-button");
  createButton.disabled = true;
  previewSkillFolderButton.disabled = true;
  setSettingsStatus("Analyzing the selected files and generating a reusable skill…");
  try {
    const selectedModel = chooseModelForRequest({ requiresReasoning: true });
    const folderPath = skillFolderPathInput.value.trim() || extractFolderPathFromRequest(request);
    if (folderPath) skillFolderPathInput.value = folderPath;
    const response = await fetch("/api/skills", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: selectedModel,
        name: skillNameInput.value.trim(),
        request,
        folderPath
      })
    });
    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.error || "Could not create the skill.");
    }
    const skill = await readSkillEventStream(response);
    await loadSkills();
    skillNameInput.value = "";
    skillRequestInput.value = "";
    skillFolderPathInput.value = "";
    skillFolderPreview.replaceChildren();
    skillFolderPreview.hidden = true;
    setSettingsStatus(`“${skill.name}” was saved in the local skills folder.`);
  } catch (error) {
    setSettingsStatus(error.message || "Could not create the skill.", true);
  } finally {
    createButton.disabled = false;
    previewSkillFolderButton.disabled = false;
  }
}

async function deleteSkill(skillId) {
  const skill = savedSkills.find((item) => item.id === skillId);
  if (!skill || !window.confirm(`Delete the skill "${skill.name}"?`)) return;
  try {
    const response = await fetch(`/api/skills/${encodeURIComponent(skillId)}`, { method: "DELETE" });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Could not delete the skill.");
    await loadSkills();
    setSettingsStatus(`“${skill.name}” was deleted.`);
  } catch (error) {
    setSettingsStatus(error.message || "Could not delete the skill.", true);
  }
}

function settingsGroupLabel(group) {
  const button = settingsNav.querySelector(`.settings-nav-group[data-group="${group}"]`);
  return button ? button.textContent.trim().replace(/\s+/g, " ") : "Settings";
}

function applySettingsFilter() {
  const query = settingsSearchInput.value.trim().toLowerCase();
  settingsSections.forEach((section) => {
    const inGroup = activeSettingsGroup === "all" || section.dataset.group === activeSettingsGroup;
    const matchesQuery = !query || section.textContent.toLowerCase().includes(query);
    section.hidden = !(inGroup && matchesQuery);
  });

  if (query) {
    const matches = settingsSections.filter((section) => !section.hidden).length;
    settingsGroupTitle.textContent = "Search results";
    settingsEmpty.textContent = `No settings match “${settingsSearchInput.value.trim()}”.`;
    settingsEmpty.hidden = matches > 0;
  } else {
    settingsGroupTitle.textContent = settingsGroupLabel(activeSettingsGroup);
    settingsEmpty.hidden = true;
  }
}

function selectSettingsGroup(group) {
  activeSettingsGroup = group;
  settingsSearchInput.value = "";
  settingsNav.querySelectorAll(".settings-nav-group").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.group === group);
  });
  applySettingsFilter();
  settingsContent.scrollTop = 0;
}

function populateVoiceOptions() {
  if (!voiceSelect) return;
  if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
    voiceSelect.disabled = true;
    if (voiceSettingsStatus) {
      voiceSettingsStatus.textContent = "This browser cannot speak replies aloud. Voice input still works.";
    }
    return;
  }

  const voices = window.speechSynthesis.getVoices()
    .slice()
    .sort((left, right) =>
      Number(right.localService) - Number(left.localService) || left.name.localeCompare(right.name));
  const saved = readVoicePreference();
  voiceSelect.replaceChildren();
  const automatic = document.createElement("option");
  automatic.value = "";
  automatic.textContent = "System default";
  voiceSelect.append(automatic);
  voices.forEach((voice) => {
    const option = document.createElement("option");
    option.value = voice.name;
    option.textContent = `${voice.name} — ${voice.lang}${voice.localService ? "" : " (network)"}`;
    voiceSelect.append(option);
  });
  voiceSelect.value = voices.some((voice) => voice.name === saved) ? saved : "";
  voiceSelect.disabled = voices.length === 0;
  if (voiceSettingsStatus) {
    voiceSettingsStatus.textContent = voices.length
      ? `${voices.length} voice${voices.length === 1 ? "" : "s"} available on this device.`
      : "No system voices are available yet. Install one in your system's speech settings.";
  }
}

function previewSelectedVoice() {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const voice = getPreferredSpeechVoice();
  const utterance = new window.SpeechSynthesisUtterance("This is how my spoken replies will sound.");
  if (voice) {
    utterance.voice = voice;
    utterance.lang = voice.lang;
  }
  window.speechSynthesis.speak(utterance);
}

function resetSettingsView() {
  settingsSearchInput.value = "";
  settingsNav.querySelectorAll(".settings-nav-group-wrap").forEach((wrap) => {
    const groupButton = wrap.querySelector(".settings-nav-group");
    const children = wrap.querySelector(".settings-nav-children");
    if (groupButton) groupButton.setAttribute("aria-expanded", "false");
    if (children) children.hidden = true;
  });
  selectSettingsGroup("all");
}

function openSettings() {
  const returnFocus = mobileViewport.matches && sidebar.classList.contains("is-open")
    ? mobileMenuButton
    : document.activeElement;
  closeMobileNav(false);
  settingsReturnFocus = returnFocus instanceof HTMLElement ? returnFocus : null;
  settingsDialog.hidden = false;
  skillPopover.hidden = true;
  setSettingsStatus("");
  resetSettingsView();
  populateVoiceOptions();
  loadSettings();
  closeSettingsButton.focus();
}

function closeSettings() {
  if (settingsDialog.hidden) return;
  settingsDialog.hidden = true;
  if (settingsReturnFocus && settingsReturnFocus.isConnected) settingsReturnFocus.focus();
  settingsReturnFocus = null;
}

function startNewChat() {
  if (isBatchProcessing) return;
  closeMobileNav(false);
  conversation.length = 0;
  currentChatId = createChatId();
  currentGreeting = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
  activeSkillIds = [];
  editingMessageIndex = null;
  draftBeforeEdit = null;
  pendingImages = [];
  pendingDocuments = [];
  recentImageContext = [];
  promptInput.value = "";
  renderPendingAttachments();
  editMessageControls.hidden = true;
  errorMessage.hidden = true;
  renderMessages();
  renderHistoryList();
  renderSkillPicker();
  updateSendButton();
  setActionStatus("Started a new chat.");
  promptInput.focus();
}

function editUserMessage(index) {
  const message = conversation[index];
  if (!message || message.role !== "user" || isLoading) return;

  draftBeforeEdit = {
    content: promptInput.value,
    images: pendingImages,
    documents: pendingDocuments
  };
  editingMessageIndex = index;
  promptInput.value = message.content;
  pendingImages = message.images || (message.image ? [message.image] : []);
  pendingDocuments = message.documents || [];
  renderPendingAttachments();
  editMessageControls.hidden = false;
  errorMessage.hidden = true;
  updateSendButton();
  promptInput.focus();
  setActionStatus(message.hadImage && !message.image && (!message.images || !message.images.length)
    ? "Saved image files are unavailable to edit. PDF text remains available."
    : "Editing a sent message. Later turns will be replaced when you send.");
}

function cancelEdit() {
  if (editingMessageIndex === null) return;
  editingMessageIndex = null;
  promptInput.value = draftBeforeEdit ? draftBeforeEdit.content : "";
  pendingImages = draftBeforeEdit ? draftBeforeEdit.images : [];
  pendingDocuments = draftBeforeEdit ? draftBeforeEdit.documents : [];
  draftBeforeEdit = null;
  editMessageControls.hidden = true;
  renderPendingAttachments();
  updateSendButton();
  setActionStatus("Message edit cancelled.");
}

async function copyText(value, kind) {
  try {
    await navigator.clipboard.writeText(value);
    const label = kind === "user" ? "Input" : kind === "code" ? "Code" : "Output";
    setActionStatus(`${label} copied.`);
  } catch {
    setActionStatus("Clipboard access failed. Allow clipboard permission and try again.");
  }
}

function copyLatestMessage(role) {
  const message = [...conversation].reverse().find((item) => item.role === role);
  if (message) copyText(message.content, role);
}

function updateSendButton() {
  const hasImages = pendingImages.length > 0;
  const hasAttachments = hasImages || pendingDocuments.length > 0;
  const hasContent = promptInput.value.trim().length > 0 || hasAttachments;
  const imageModelSelected = !hasImages || modelSupportsVision();
  imageModelHint.hidden = !hasImages || imageModelSelected;
  sendButton.disabled = isLoading || isProcessingAttachments || !modelsAvailable || !hasContent || !imageModelSelected;
  sendButton.querySelector("span").textContent = isLoading
    ? "Thinking..."
    : editingMessageIndex === null ? "Send" : "Update";
}

function renderPendingAttachments() {
  const attachments = [
    ...pendingImages.map((image, index) => ({ kind: "image", name: image.name, image, index })),
    ...pendingDocuments.map((document, index) => ({ kind: "document", name: document.name, document, index }))
  ];
  attachmentList.replaceChildren();
  attachmentPreview.hidden = attachments.length === 0;

  for (const attachment of attachments) {
    const item = document.createElement("div");
    item.className = "attachment-item";
    if (attachment.image) {
      const thumbnail = document.createElement("img");
      thumbnail.src = `data:${attachment.image.mimeType};base64,${attachment.image.data}`;
      thumbnail.alt = "";
      item.append(thumbnail);
    } else {
      const icon = document.createElement("span");
      icon.className = "attachment-file-icon";
      icon.textContent = "PDF";
      item.append(icon);
    }

    const copy = document.createElement("span");
    copy.className = "attachment-file-copy";
    const name = document.createElement("span");
    name.className = "attachment-file-name";
    name.textContent = attachment.name;
    name.title = attachment.name;
    const meta = document.createElement("span");
    meta.className = "attachment-file-meta";
    const size = attachment.image ? attachment.image.size : attachment.document.size;
    meta.textContent = `${attachment.image ? "Image" : "PDF"}${size ? ` · ${formatBatchSize(size)}` : ""}`;
    copy.append(name, meta);
    item.append(copy);

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.textContent = "×";
    removeButton.setAttribute("aria-label", `Remove ${attachment.name}`);
    removeButton.disabled = isLoading || isProcessingAttachments;
    removeButton.addEventListener("click", () => {
      if (attachment.kind === "image") pendingImages.splice(attachment.index, 1);
      else pendingDocuments.splice(attachment.index, 1);
      renderPendingAttachments();
      updateSendButton();
    });
    item.append(removeButton);
    attachmentList.append(item);
  }
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error(`Could not read ${file.name}.`));
    });
    reader.addEventListener("error", () => reject(new Error(`Could not read ${file.name}.`)));
    reader.readAsDataURL(file);
  });
}

async function extractPdfText(file, dataUrl) {
  const base64 = dataUrl.split(",")[1];
  if (!base64) throw new Error(`Could not read ${file.name}.`);
  const response = await fetch("/api/documents/extract", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mimeType: "application/pdf", data: base64 })
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || `Could not process ${file.name}.`);
  return {
    kind: "document",
    name: file.name,
    mimeType: "application/pdf",
    data: base64,
    text: result.text,
    pages: result.pages,
    size: file.size
  };
}

async function processAttachmentFiles(fileList) {
  const files = Array.from(fileList);
  if (!files.length) return;

  const existingCount = pendingImages.length + pendingDocuments.length;
  if (existingCount + files.length > maxAttachments) {
    showError(`Attach up to ${maxAttachments} images or PDFs at a time.`);
    return;
  }

  let totalBytes = files.reduce((total, file) => total + file.size, 0);
  totalBytes += pendingImages.reduce((total, image) => total + (image.size || 0), 0);
  totalBytes += pendingDocuments.reduce((total, document) => total + (document.size || 0), 0);
  if (totalBytes > maxTotalAttachmentBytes) {
    showError("Attachments must total 24 MB or less.");
    return;
  }

  for (const file of files) {
    const isImage = ["image/jpeg", "image/png", "image/webp"].includes(file.type);
    const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
    if (!isImage && !isPdf) {
      showError("Choose JPEG, PNG, WebP images, or PDF files.");
      return;
    }
    if (isImage && file.size > maxImageBytes) {
      showError("Images must be 2 MB or smaller each.");
      return;
    }
    if (isPdf && file.size > maxPdfBytes) {
      showError("PDF files must be 5 MB or smaller each.");
      return;
    }
  }

  isProcessingAttachments = true;
  uploadButton.disabled = true;
  updateSendButton();
  setActionStatus("Reading attachments...");
  try {
    const loaded = [];
    for (const file of files) {
      const isImage = ["image/jpeg", "image/png", "image/webp"].includes(file.type);
      const dataUrl = await readFileAsDataUrl(file);
      if (isImage) {
        const base64 = dataUrl.split(",")[1];
        if (!base64) throw new Error(`Could not read ${file.name}.`);
        loaded.push({
          kind: "image",
          name: file.name,
          mimeType: file.type,
          data: base64,
          size: file.size
        });
      } else {
        loaded.push(await extractPdfText(file, dataUrl));
      }
    }

    pendingImages.push(...loaded.filter((attachment) => attachment.kind === "image"));
    pendingDocuments.push(...loaded.filter((attachment) => attachment.kind === "document"));
    renderPendingAttachments();
    errorMessage.hidden = true;
    const totalFiles = pendingImages.length + pendingDocuments.length;
    setActionStatus(totalFiles > maxChatAttachments
      ? `${totalFiles} files attached. Sending processes them as one batch report in this chat.`
      : `${loaded.length} attachment${loaded.length === 1 ? "" : "s"} ready.`);
  } catch (error) {
    showError(error.message || "Could not read the selected attachments.");
  } finally {
    isProcessingAttachments = false;
    uploadButton.disabled = isLoading;
    updateSendButton();
  }
}

function formatBatchSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

async function readBatchEventStream(response, onEvent) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let finalEvent = null;

  function consumeLine(line) {
    if (!line.startsWith("data:")) return;
    let event;
    try {
      event = JSON.parse(line.slice(5).trim());
    } catch {
      throw new Error("The batch server returned an invalid response.");
    }
    if (event.error) throw new Error(event.error);
    onEvent(event);
    if (event.done === true) finalEvent = event;
  }

  while (true) {
    const { value, done } = await reader.read();
    buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop();
    lines.forEach(consumeLine);
    if (done) {
      if (buffer) consumeLine(buffer);
      break;
    }
  }

  if (!finalEvent || typeof finalEvent.report !== "string") {
    throw new Error("Batch processing ended before the report was ready.");
  }
  return finalEvent;
}

async function persistHistoryMessages(messages) {
  const response = await fetch(`/api/history/${encodeURIComponent(currentChatId)}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages })
  });
  const result = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error((result && result.error) || "Could not save these messages to the chat.");
  }
  return result.chat;
}

async function runBatchInChat() {
  if (isBatchProcessing) return;
  const instruction = promptInput.value.trim().slice(0, maxBatchInstructionLength);
  const files = [
    ...pendingImages.map((image) => ({
      name: image.name,
      mimeType: image.mimeType,
      data: image.data,
      sizeBytes: image.size || 0
    })),
    ...pendingDocuments.map((document) => ({
      name: document.name,
      mimeType: "application/pdf",
      data: document.data,
      sizeBytes: document.size || 0
    }))
  ];
  if (!files.length) return;
  if (files.some((file) => !file.data)) {
    showError("Re-attach these files before processing them as a batch.");
    return;
  }

  isBatchProcessing = true;
  errorMessage.hidden = true;
  const progressMessage = {
    role: "assistant",
    content: `Preparing ${files.length} files…`,
    model: "batch",
    isStreaming: true
  };
  conversation.push(progressMessage);
  renderMessages();
  updateToolbarState();
  promptInput.disabled = true;
  uploadButton.disabled = true;
  sendButton.disabled = true;
  setActionStatus(`Processing ${files.length} files…`);

  try {
    const response = await fetch("/api/batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: modelSelect.value || "auto",
        instruction,
        files: files.map(({ name, mimeType, data }) => ({ name, mimeType, data }))
      })
    });
    if (!response.ok) {
      const result = await response.json().catch(() => null);
      throw new Error((result && result.error) || "Could not process these files.");
    }
    if (!(response.headers.get("content-type") || "").includes("text/event-stream")) {
      throw new Error("The batch server did not start a progress stream.");
    }

    const result = await readBatchEventStream(response, (event) => {
      if (typeof event.progress !== "string") return;
      progressMessage.content = event.progress;
      setActionStatus(event.progress);
      renderMessages();
    });

    const results = result.results || [];
    const processed = results.filter((item) => item.status === "done").length;
    const failed = results.length - processed;
    const fileNames = results.map((item) => item.name);
    const instructionLine = instruction ? `\nInstruction: ${instruction}` : "";
    const summary = `Batch report for ${fileNames.length} file${fileNames.length === 1 ? "" : "s"}: ${fileNames.join(", ")}${instructionLine}`;

    conversation.pop();
    conversation.push(
      { role: "user", content: summary },
      {
        role: "assistant",
        content: result.report,
        model: `${result.model} · batch report`,
        isArriving: true
      }
    );
    promptInput.value = "";
    promptInput.style.height = "auto";
    pendingImages = [];
    pendingDocuments = [];
    recentImageContext = [];
    renderPendingAttachments();
    renderMessages();
    updateToolbarState();
    setActionStatus(`Report added to this chat: ${processed} processed${failed ? `, ${failed} failed` : ""}.`);

    try {
      await persistHistoryMessages([
        { role: "user", content: summary },
        { role: "assistant", content: result.report }
      ]);
      await loadChatHistory();
    } catch {
      setActionStatus("Report added to the chat, but it could not be saved to history.");
    }
  } catch (error) {
    if (conversation[conversation.length - 1] === progressMessage) conversation.pop();
    renderMessages();
    updateToolbarState();
    showError(error.message || "Could not process these files.");
  } finally {
    isBatchProcessing = false;
    promptInput.disabled = false;
    uploadButton.disabled = isLoading;
    updateSendButton();
    promptInput.focus();
  }
}

function modelSupportsVision() {
  const selectedOption = modelSelect.selectedOptions[0];
  return selectedOption && selectedOption.dataset.vision === "true";
}

function modelHasVision(model) {
  const capabilities = Array.isArray(model.capabilities) ? model.capabilities : [];
  const name = `${model.name || ""} ${model.family || ""}`;
  return capabilities.includes("vision") ||
    /(llava|bakllava|moondream|minicpm-v|gemma3|vision|qwen[\w.-]*vl)/i.test(name);
}

function getModelParameterSize(model) {
  const parameterSize = model.parameterSize ||
    (model.details && model.details.parameter_size) ||
    "";
  const match = /(\d+(?:\.\d+)?)\s*([bm])\b/i.exec(String(parameterSize)) ||
    /(\d+(?:\.\d+)?)([bm])\b/i.exec(String(model.name || ""));
  if (match) {
    const count = Number(match[1]);
    return match[2].toLowerCase() === "m" ? count / 1000 : count;
  }
  return Number.isFinite(model.sizeBytes) && model.sizeBytes > 0
    ? model.sizeBytes / (1024 ** 3)
    : 0;
}

function getModelReasoningScore(model) {
  const name = `${model.name || ""} ${model.family || ""}`.toLowerCase();
  const capabilities = Array.isArray(model.capabilities) ? model.capabilities : [];
  let score = getModelParameterSize(model) * 10;

  if (capabilities.some((capability) => /reason|think/i.test(capability))) score += 120;
  if (/(deepseek-r1|qwq|reasoner)/i.test(name)) score += 100;
  else if (/qwen3/i.test(name)) score += 80;
  else if (/(deepseek|qwen2\.5|phi-4)/i.test(name)) score += 45;
  else if (/gemma3|llama3\.3|mistral/i.test(name)) score += 25;

  return score;
}

function chooseModelForRequest({ requiresVision = false, requiresReasoning = false } = {}) {
  if (modelSelect.value !== "auto") return modelSelect.value;

  const candidates = availableModels.filter((model) => !requiresVision || modelHasVision(model));
  if (!candidates.length) {
    throw new Error(requiresVision
      ? "Auto selection needs an installed vision-capable model. Install one or select it manually."
      : "No installed Ollama model is available for automatic selection.");
  }
  candidates.sort((left, right) => {
    const difference = requiresReasoning
      ? getModelReasoningScore(right) - getModelReasoningScore(left)
      : getModelParameterSize(left) - getModelParameterSize(right);
    return difference || left.name.localeCompare(right.name);
  });
  return candidates[0].name;
}

function promptNeedsReasoning(prompt) {
  return /\b(calculate|calculation|compute|solve|equation|math|mathematics|logic|reasoning|prove|proof|analy[sz]e|compare|derive|deduce)\b|step[- ]by[- ]step|(?:\d+\s*[+\-*\/=]\s*\d+)/i.test(prompt);
}

function promptMentionsImages(prompt) {
  return /\b(image|images|photo|photos|picture|pictures|screenshot|screenshots|attachment|attachments|attached)\b|\b(these|those|above)\b/i.test(prompt);
}

function isAtBottom() {
  return messagesElement.scrollHeight - messagesElement.scrollTop - messagesElement.clientHeight < 80;
}

function updateScrollToBottomButton() {
  const hasOverflow = messagesElement.scrollHeight > messagesElement.clientHeight + 1;
  const awayFromBottom =
    messagesElement.scrollHeight - messagesElement.scrollTop - messagesElement.clientHeight > 48;
  scrollToBottomButton.hidden = !hasOverflow;
  scrollToBottomButton.classList.toggle("is-visible", hasOverflow && awayFromBottom);
}

function scrollToBottom() {
  messagesElement.scrollTo({ top: messagesElement.scrollHeight, behavior: "smooth" });
}

function setLoading(loading) {
  isLoading = loading;
  messagesElement.setAttribute("aria-busy", String(loading));
  sendButton.hidden = loading;
  stopButton.hidden = !loading;
  stopButton.disabled = !loading;
  promptInput.disabled = loading;
  uploadButton.disabled = loading || isProcessingAttachments;
  attachmentList.querySelectorAll("button").forEach((button) => {
    button.disabled = loading || isProcessingAttachments;
  });
  voiceButton.disabled = loading;
  webSearchToggle.disabled = loading;
  modelSelect.disabled = loading || !modelsAvailable;
  newChatButton.disabled = loading;
  chatHistoryButton.disabled = loading;
  settingsButton.disabled = loading;
  useSkillButton.disabled = loading;
  historyList.querySelectorAll("button").forEach((button) => {
    button.disabled = loading;
  });
  updateSkillSelectionUI();
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
      const autoOption = new Option("Auto", "auto");
      autoOption.dataset.vision = String(availableModels.some(modelHasVision));
      modelSelect.add(autoOption);
      for (const model of availableModels) {
        const supportsVision = modelHasVision(model);
        const option = new Option(`${model.name}${supportsVision ? " · Vision" : ""}`, model.name);
        option.dataset.vision = String(supportsVision);
        modelSelect.add(option);
      }
      modelSelect.value = previousModel === "auto" || availableModels.some((model) => model.name === previousModel)
        ? previousModel
        : "auto";
      modelsAvailable = true;
      errorMessage.hidden = true;
      setConnectionStatus("online", `${availableModels.length} model${availableModels.length === 1 ? "" : "s"} available`);
      modelSelect.title = "Auto uses a vision model for images, a reasoning model for skills and math, and a fast model for other requests.";
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
  promptInput.style.height = `${Math.min(promptInput.scrollHeight, 180)}px`;
  updateSendButton();
});

promptInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    form.requestSubmit();
  }
});

imageInput.addEventListener("change", () => {
  const files = Array.from(imageInput.files || []);
  imageInput.value = "";
  processAttachmentFiles(files);
});

uploadButton.addEventListener("click", () => imageInput.click());

let composerDragDepth = 0;

function dragHasFiles(event) {
  const types = event.dataTransfer && event.dataTransfer.types;
  return !!types && Array.from(types).includes("Files");
}

function setComposerDragging(active) {
  form.classList.toggle("is-dragging", active);
  composerDropHint.hidden = !active;
  if (!active) composerDragDepth = 0;
}

form.addEventListener("dragenter", (event) => {
  if (!dragHasFiles(event) || isLoading || isProcessingAttachments || isBatchProcessing) return;
  event.preventDefault();
  composerDragDepth += 1;
  setComposerDragging(true);
});

form.addEventListener("dragover", (event) => {
  if (!dragHasFiles(event)) return;
  event.preventDefault();
  if (event.dataTransfer) event.dataTransfer.dropEffect = "copy";
});

form.addEventListener("dragleave", (event) => {
  if (!dragHasFiles(event)) return;
  composerDragDepth = Math.max(0, composerDragDepth - 1);
  if (composerDragDepth === 0) setComposerDragging(false);
});

form.addEventListener("drop", (event) => {
  if (!dragHasFiles(event)) return;
  event.preventDefault();
  const files = event.dataTransfer ? Array.from(event.dataTransfer.files) : [];
  setComposerDragging(false);
  if (isLoading || isProcessingAttachments || isBatchProcessing) {
    setActionStatus("Wait for the current request to finish before adding files.");
    return;
  }
  if (files.length) processAttachmentFiles(files);
});

window.addEventListener("blur", () => setComposerDragging(false));

refreshModelsButton.addEventListener("click", loadModels);
newChatButton.addEventListener("click", startNewChat);
mobileMenuButton.addEventListener("click", () => {
  if (sidebar.classList.contains("is-open")) closeMobileNav();
  else openMobileNav();
});
mobileNavBackdrop.addEventListener("click", () => closeMobileNav());
sidebar.addEventListener("keydown", (event) => {
  if (event.key !== "Tab" || !mobileViewport.matches || !sidebar.classList.contains("is-open")) return;
  const focusableElements = Array.from(sidebar.querySelectorAll(
    'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex]:not([tabindex="-1"])'
  )).filter((element) => element.getClientRects().length > 0);
  if (!focusableElements.length) {
    event.preventDefault();
    return;
  }

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];
  if (event.shiftKey &&
      (document.activeElement === firstElement || !sidebar.contains(document.activeElement))) {
    event.preventDefault();
    lastElement.focus();
  } else if (!event.shiftKey &&
      (document.activeElement === lastElement || !sidebar.contains(document.activeElement))) {
    event.preventDefault();
    firstElement.focus();
  }
});
mobileViewport.addEventListener("change", (event) => {
  if (!event.matches) closeMobileNav(false);
});

const drawerSwipe = { tracking: false, startX: 0, startY: 0, open: false, handled: false };
const drawerSwipeThreshold = 64;
const drawerEdgeWidth = 26;

function suppressSwipeClick() {
  const blockClick = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };
  document.addEventListener("click", blockClick, { capture: true, once: true });
  window.setTimeout(() => document.removeEventListener("click", blockClick, true), 400);
}

function startDrawerSwipe(event) {
  drawerSwipe.tracking = false;
  if (!mobileViewport.matches || event.touches.length !== 1) return;
  if (!settingsDialog.hidden || !voiceModeElement.hidden) return;
  const target = event.target;
  if (target.closest && target.closest("#chat-form, input, textarea, select")) return;

  const touch = event.touches[0];
  const isOpen = sidebar.classList.contains("is-open");
  if (isOpen) {
    if (!sidebar.contains(target) && target !== mobileNavBackdrop) return;
  } else if (touch.clientX > drawerEdgeWidth) {
    return;
  }

  drawerSwipe.tracking = true;
  drawerSwipe.startX = touch.clientX;
  drawerSwipe.startY = touch.clientY;
  drawerSwipe.open = isOpen;
  drawerSwipe.handled = false;
}

function moveDrawerSwipe(event) {
  if (!drawerSwipe.tracking || drawerSwipe.handled) return;
  if (event.touches.length !== 1) {
    drawerSwipe.tracking = false;
    return;
  }

  const touch = event.touches[0];
  const deltaX = touch.clientX - drawerSwipe.startX;
  const deltaY = touch.clientY - drawerSwipe.startY;
  if (Math.abs(deltaX) < drawerSwipeThreshold || Math.abs(deltaX) < Math.abs(deltaY) * 1.4) return;

  drawerSwipe.handled = true;
  if (!drawerSwipe.open && deltaX > 0) {
    openMobileNav();
    suppressSwipeClick();
  } else if (drawerSwipe.open && deltaX < 0) {
    closeMobileNav();
    suppressSwipeClick();
  }
}

function endDrawerSwipe() {
  drawerSwipe.tracking = false;
}

document.addEventListener("touchstart", startDrawerSwipe, { passive: true });
document.addEventListener("touchmove", moveDrawerSwipe, { passive: true });
document.addEventListener("touchend", endDrawerSwipe, { passive: true });
document.addEventListener("touchcancel", endDrawerSwipe, { passive: true });
chatHistoryButton.addEventListener("click", openHistory);
copyInputButton.addEventListener("click", () => copyLatestMessage("user"));
copyOutputButton.addEventListener("click", () => copyLatestMessage("assistant"));
cancelEditButton.addEventListener("click", cancelEdit);
settingsButton.addEventListener("click", openSettings);
closeSettingsButton.addEventListener("click", closeSettings);
settingsDialog.addEventListener("keydown", (event) => {
  if (event.key !== "Tab") return;
  const focusableElements = Array.from(settingsDialog.querySelectorAll(
    'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex]:not([tabindex="-1"])'
  )).filter((element) => element.getClientRects().length > 0);
  if (!focusableElements.length) {
    event.preventDefault();
    return;
  }

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];
  if (event.shiftKey &&
      (document.activeElement === firstElement || !settingsDialog.contains(document.activeElement))) {
    event.preventDefault();
    lastElement.focus();
  } else if (!event.shiftKey &&
      (document.activeElement === lastElement || !settingsDialog.contains(document.activeElement))) {
    event.preventDefault();
    firstElement.focus();
  }
});
settingsDialog.addEventListener("click", (event) => {
  if (event.target === settingsDialog) closeSettings();
});
settingsSearchInput.addEventListener("input", () => {
  const hasQuery = Boolean(settingsSearchInput.value.trim());
  if (hasQuery) activeSettingsGroup = "all";
  settingsNav.querySelectorAll(".settings-nav-group").forEach((button) => {
    button.classList.toggle("is-active", !hasQuery && button.dataset.group === activeSettingsGroup);
  });
  applySettingsFilter();
  settingsContent.scrollTop = 0;
});
settingsNav.addEventListener("click", (event) => {
  const groupButton = event.target.closest(".settings-nav-group");
  if (groupButton) {
    if (groupButton.hasAttribute("aria-expanded")) {
      const isExpanded = groupButton.getAttribute("aria-expanded") === "true";
      groupButton.setAttribute("aria-expanded", String(!isExpanded));
      const children = groupButton.parentElement.querySelector(".settings-nav-children");
      if (children) children.hidden = isExpanded;
    }
    selectSettingsGroup(groupButton.dataset.group);
    return;
  }

  const childButton = event.target.closest(".settings-nav-child");
  if (!childButton) return;
  const target = document.getElementById(childButton.dataset.target);
  if (!target) return;
  const section = target.closest(".settings-section");
  if (section && section.dataset.group) selectSettingsGroup(section.dataset.group);
  const offset = target.getBoundingClientRect().top - settingsContent.getBoundingClientRect().top + settingsContent.scrollTop;
  settingsContent.scrollTop = Math.max(0, offset - 48);
});
saveMemoryButton.addEventListener("click", saveMemory);
saveInstructionsButton.addEventListener("click", saveCustomInstructions);
historySearchInput.addEventListener("input", renderHistoryList);
exportChatButton.addEventListener("click", exportConversation);
if (voiceSelect) {
  voiceSelect.addEventListener("change", () => {
    writeVoicePreference(voiceSelect.value);
    previewSelectedVoice();
  });
}
if ("speechSynthesis" in window) {
  window.speechSynthesis.addEventListener("voiceschanged", populateVoiceOptions);
}
populateVoiceOptions();
savePersonalityButton.addEventListener("click", savePersonality);
skillForm.addEventListener("submit", createSkill);
previewSkillFolderButton.addEventListener("click", previewSkillFolder);
skillRequestInput.addEventListener("input", () => {
  if (!skillFolderPathInput.value.trim()) {
    const extractedPath = extractFolderPathFromRequest(skillRequestInput.value);
    if (extractedPath) skillFolderPathInput.value = extractedPath;
  }
});

useSkillButton.addEventListener("click", () => {
  skillPopover.hidden = !skillPopover.hidden;
  updateSkillSelectionUI();
});
manageSkillsButton.addEventListener("click", openSettings);
document.addEventListener("click", (event) => {
  if (!skillPopover.hidden &&
      !skillPopover.contains(event.target) &&
      !useSkillButton.contains(event.target)) {
    skillPopover.hidden = true;
    updateSkillSelectionUI();
  }
});

outlineToggle.addEventListener("click", () => {
  const isOpen = chatOutline.classList.contains("is-open");
  const isHovered = hoverOutlineQuery.matches && chatOutline.matches(":hover");
  if (chatOutline.classList.contains("is-dismissed") || (!isOpen && !isHovered)) {
    openOutline();
  } else {
    closeOutline();
  }
});
chatOutline.addEventListener("pointerenter", () => {
  if (!chatOutline.classList.contains("is-open")) {
    chatOutline.classList.remove("is-dismissed");
  }
  updateOutlineExpanded();
});
chatOutline.addEventListener("pointerleave", () => {
  if (!chatOutline.classList.contains("is-open")) {
    chatOutline.classList.remove("is-dismissed");
  }
  updateOutlineExpanded();
});
chatOutline.addEventListener("focusin", updateOutlineExpanded);
chatOutline.addEventListener("focusout", () => requestAnimationFrame(updateOutlineExpanded));
document.addEventListener("click", (event) => {
  if (!chatOutline.contains(event.target) &&
      (chatOutline.classList.contains("is-open") || chatOutline.matches(":focus-within"))) {
    closeOutline();
  }
});
messagesElement.addEventListener("scroll", () => {
  updateActiveOutline();
  updateScrollToBottomButton();
});
messagesElement.addEventListener("click", (event) => {
  const suggestion = event.target.closest(".suggested-prompt");
  if (!suggestion) return;
  promptInput.value = suggestion.dataset.prompt || "";
  promptInput.dispatchEvent(new Event("input", { bubbles: true }));
  promptInput.focus();
});
window.addEventListener("resize", updateScrollToBottomButton);
scrollToBottomButton.addEventListener("click", scrollToBottom);
window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeSettings();
    closeBatchStudio();
    skillPopover.hidden = true;
    closeMobileNav();
    closeOutline();
  }
});

modelSelect.addEventListener("change", () => {
  updateSendButton();
});

webSearchToggle.addEventListener("click", () => {
  webSearchEnabled = !webSearchEnabled;
  webSearchToggle.classList.toggle("is-enabled", webSearchEnabled);
  webSearchToggle.setAttribute("aria-pressed", String(webSearchEnabled));
  webSearchToggle.textContent = webSearchEnabled ? "Web Auto" : "Web Off";
  webSearchToggle.title = webSearchEnabled
    ? "Automatically search the web and Wikipedia for current and research questions. Click to turn it off."
    : "Web and Wikipedia research are off. Click to allow automatic searches for current and research questions.";
  setActionStatus(webSearchEnabled
    ? "Automatic web and Wikipedia research enabled."
    : "Web and Wikipedia research disabled.");
});


const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

const voiceSession = {
  active: false,
  state: "idle",
  muted: false,
  listening: false,
  stream: null,
  recorder: null,
  recorderMime: "",
  chunks: [],
  recognition: null,
  browserTranscript: "",
  speechToken: 0,
  autoStopTimer: 0,
  finalizeTimer: 0
};

function setVoiceState(state, caption) {
  voiceSession.state = state;
  voiceModeElement.dataset.state = state;
  voiceCaption.textContent = caption;
  voiceOrb.setAttribute(
    "aria-label",
    state === "listening" ? "Stop listening" : state === "speaking" ? "Interrupt the spoken reply" : "Start listening"
  );
}

function updateVoiceMuteButton() {
  voiceMuteButton.setAttribute("aria-pressed", String(voiceSession.muted));
  voiceMuteButton.setAttribute("aria-label", voiceSession.muted ? "Unmute spoken replies" : "Mute spoken replies");
  voiceMuteButton.title = voiceSession.muted ? "Unmute spoken replies" : "Mute spoken replies";
  voiceModeElement.classList.toggle("is-muted", voiceSession.muted);
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || "").replace(/^data:[^,]*,/, ""));
    reader.onerror = () => reject(new Error("Could not read the recording."));
    reader.readAsDataURL(blob);
  });
}

function cancelVoiceSpeech() {
  voiceSession.speechToken += 1;
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
}

function stopVoiceStream() {
  if (voiceSession.stream) {
    voiceSession.stream.getTracks().forEach((track) => track.stop());
    voiceSession.stream = null;
  }
}

function stopVoiceRecorder() {
  return new Promise((resolve) => {
    const recorder = voiceSession.recorder;
    voiceSession.recorder = null;
    if (!recorder || recorder.state === "inactive") {
      resolve(null);
      return;
    }
    recorder.addEventListener("stop", () => {
      resolve(voiceSession.chunks.length
        ? new Blob(voiceSession.chunks, { type: voiceSession.recorderMime || "audio/webm" })
        : null);
    }, { once: true });
    try {
      recorder.stop();
    } catch {
      resolve(null);
    }
  });
}

function startVoiceRecognition() {
  if (!SpeechRecognition) return;
  try {
    const recognition = new SpeechRecognition();
    voiceSession.recognition = recognition;
    recognition.lang = navigator.language || "en-US";
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.addEventListener("result", (event) => {
      if (!voiceSession.active || !voiceSession.listening) return;
      const text = Array.from(event.results)
        .map((result) => result[0].transcript)
        .join(" ")
        .trim();
      voiceSession.browserTranscript = text;
      if (document.activeElement !== voiceTypeInput) voiceTypeInput.value = text;
      const lastResult = event.results[event.results.length - 1];
      if (lastResult && lastResult.isFinal) {
        clearTimeout(voiceSession.finalizeTimer);
        voiceSession.finalizeTimer = window.setTimeout(() => finishVoiceListening(), 900);
      }
    });
    recognition.addEventListener("error", () => {
      /* Server transcription is the fallback, so recognition errors are ignored. */
    });
    recognition.addEventListener("end", () => {
      if (voiceSession.recognition === recognition) voiceSession.recognition = null;
    });
    recognition.start();
  } catch {
    voiceSession.recognition = null;
  }
}

async function startVoiceListening() {
  if (!voiceSession.active || voiceSession.listening) return;
  if (voiceSession.state === "thinking" || voiceSession.state === "speaking") return;

  cancelVoiceSpeech();
  voiceSession.browserTranscript = "";
  voiceSession.chunks = [];
  if (document.activeElement === voiceTypeInput) voiceTypeInput.blur();
  voiceTypeInput.value = "";
  voiceTypeInput.placeholder = "Listening…";
  setVoiceState("listening", "Listening… tap the orb when you're done");

  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error("Microphone capture is not supported in this browser.");
    }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    if (!voiceSession.active) {
      stream.getTracks().forEach((track) => track.stop());
      return;
    }
    voiceSession.stream = stream;

    if ("MediaRecorder" in window) {
      const mimeTypes = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus"];
      const mimeType = mimeTypes.find((type) => MediaRecorder.isTypeSupported(type)) || "";
      try {
        voiceSession.recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      } catch {
        voiceSession.recorder = new MediaRecorder(stream);
      }
      voiceSession.recorderMime = voiceSession.recorder.mimeType || mimeType || "audio/webm";
      voiceSession.recorder.addEventListener("dataavailable", (event) => {
        if (event.data && event.data.size) voiceSession.chunks.push(event.data);
      });
      voiceSession.recorder.start(250);
    }

    startVoiceRecognition();
    voiceSession.listening = true;
    voiceButton.classList.add("is-listening");
    voiceSession.autoStopTimer = window.setTimeout(() => finishVoiceListening(), 30000);
  } catch {
    voiceSession.listening = false;
    stopVoiceStream();
    setVoiceState("error", "Microphone access is blocked. Allow it in your browser, or type below.");
  }
}

function cancelVoiceCapture() {
  if (!voiceSession.listening) return;
  voiceSession.listening = false;
  voiceTypeInput.placeholder = "Type";
  clearTimeout(voiceSession.autoStopTimer);
  clearTimeout(voiceSession.finalizeTimer);
  voiceButton.classList.remove("is-listening");
  if (voiceSession.recognition) {
    try {
      voiceSession.recognition.abort();
    } catch {
      /* The recognition instance may already be stopped. */
    }
    voiceSession.recognition = null;
  }
  const recorder = voiceSession.recorder;
  voiceSession.recorder = null;
  if (recorder && recorder.state !== "inactive") {
    try {
      recorder.stop();
    } catch {
      /* Ignore a recorder that already stopped. */
    }
  }
  voiceSession.chunks = [];
  stopVoiceStream();
}

async function finishVoiceListening() {
  if (!voiceSession.listening) return;
  voiceSession.listening = false;
  clearTimeout(voiceSession.autoStopTimer);
  clearTimeout(voiceSession.finalizeTimer);
  voiceButton.classList.remove("is-listening");

  if (voiceSession.recognition) {
    try {
      voiceSession.recognition.stop();
    } catch {
      /* Ignore a recognition instance that already ended. */
    }
    voiceSession.recognition = null;
  }

  const blob = await stopVoiceRecorder();
  stopVoiceStream();
  if (!voiceSession.active) return;

  const typed = voiceTypeInput.value.trim();
  const browserTranscript = (voiceSession.browserTranscript || typed).trim();
  voiceTypeInput.placeholder = "Type";
  setVoiceState("thinking", "Thinking…");

  let serverTranscript = "";
  if (blob && blob.size > 800) {
    try {
      serverTranscript = await transcribeRecordedAudio(blob);
    } catch (error) {
      setActionStatus(error.message || "Server transcription failed.");
    }
  }
  if (!voiceSession.active) return;

  const text = (serverTranscript || browserTranscript).trim();
  if (!text) {
    setVoiceState("error", "I didn't catch that. Tap the orb to try again, or type below.");
    return;
  }

  voiceTypeInput.value = text;
  await sendVoiceTurn(text);
}

async function transcribeRecordedAudio(blob) {
  const audio = await blobToBase64(blob);
  const response = await fetch("/api/voice/transcribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      audio,
      mimeType: blob.type || "audio/webm",
      language: (navigator.language || "").slice(0, 5)
    })
  });
  if (response.status === 503) return "";
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || "Server transcription failed.");
  return typeof result.text === "string" ? result.text.trim() : "";
}

async function sendVoiceTurn(text) {
  if (!voiceSession.active) return;
  let selectedModel;
  try {
    selectedModel = chooseModelForRequest({
      requiresVision: false,
      requiresReasoning: activeSkillIds.length > 0 || promptNeedsReasoning(text)
    });
  } catch (error) {
    setVoiceState("error", error.message);
    return;
  }

  cancelVoiceSpeech();
  errorMessage.hidden = true;
  setVoiceState("thinking", "Thinking…");
  const userMessage = { role: "user", content: text };
  conversation.push(userMessage);
  addMessage(userMessage, conversation.length - 1);
  const streamingMessage = { role: "assistant", content: "", model: selectedModel, isStreaming: true };
  const assistantBubble = addMessage(streamingMessage, conversation.length);
  const liveOutput = assistantBubble.querySelector(".structured-output-content");
  liveOutput.textContent = "…";
  messagesElement.scrollTop = messagesElement.scrollHeight;
  updateToolbarState();
  renderOutline();
  setLoading(true);

  try {
    const recentMessages = conversation.slice(-maxServerMessages);
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chatId: currentChatId,
        model: selectedModel,
        voice: true,
        webSearch: false,
        skillIds: activeSkillIds,
        messages: recentMessages.map((message) => ({ role: message.role, content: message.content }))
      })
    });
    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      throw new Error(result.error || "Voice reply failed. Please try again.");
    }
    const streamResult = await readChatEventStream(response, () => {}, () => {});
    const reply = streamResult.reply;
    const assistantMessage = {
      role: "assistant",
      content: reply,
      model: streamResult.model || selectedModel,
      isArriving: true
    };
    conversation.push(assistantMessage);
    assistantBubble.classList.remove("is-streaming");
    assistantBubble.classList.add("is-arriving");
    liveOutput.replaceWith(renderStructuredOutput(reply));
    appendMessageActions(assistantMessage, conversation.length - 1, assistantBubble.querySelector(".message-column"));
    messagesElement.scrollTop = messagesElement.scrollHeight;
    updateToolbarState();
    renderOutline();
    loadChatHistory();
    setLoading(false);
    setActionStatus("Voice reply received.");
    speakVoiceReply(reply);
  } catch (error) {
    assistantBubble.remove();
    setLoading(false);
    const message = error.message || "Could not reach the server.";
    showError(message);
    setVoiceState("error", `${message} Tap the orb to try again.`);
  }
}

function speakVoiceReply(text) {
  if (!voiceSession.active) return;
  if (voiceSession.muted || !("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
    setVoiceState("idle", "Tap the orb to talk again");
    return;
  }

  const spoken = text
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/\[(.*?)\]\((.*?)\)/g, "$1")
    .replace(/[*_`#>|]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!spoken) {
    setVoiceState("idle", "Tap the orb to talk again");
    return;
  }

  const chunks = splitSpeechText(spoken, 180);
  const voice = getPreferredSpeechVoice();
  const token = ++voiceSession.speechToken;
  let index = 0;
  setVoiceState("speaking", "Speaking… tap the orb to interrupt");

  const speakNext = () => {
    if (!voiceSession.active || token !== voiceSession.speechToken) return;
    if (index >= chunks.length) {
      setVoiceState("idle", "Tap the orb to talk again");
      return;
    }
    const utterance = new SpeechSynthesisUtterance(chunks[index]);
    index += 1;
    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    }
    utterance.rate = 1.02;
    utterance.onend = () => window.setTimeout(speakNext, 60);
    utterance.onerror = (event) => {
      if (event.error === "canceled" || event.error === "interrupted") return;
      setVoiceState("idle", "The reply is in the chat. Tap the orb to talk again");
    };
    window.speechSynthesis.speak(utterance);
  };
  speakNext();
}

async function openVoiceMode() {
  if (voiceSession.active || !voiceModeElement) return;
  errorMessage.hidden = true;
  voiceSession.active = true;
  voiceSession.muted = false;
  updateVoiceMuteButton();
  voiceModeElement.hidden = false;
  document.body.classList.add("voice-mode-open");
  voiceTypeInput.value = "";
  voiceTypeInput.placeholder = "Type";
  setVoiceState("idle", "Tap the orb and start talking");
  voiceCloseButton.focus();
  await startVoiceListening();
}

function closeVoiceMode() {
  if (!voiceSession.active) return;
  voiceSession.active = false;
  voiceSession.listening = false;
  clearTimeout(voiceSession.autoStopTimer);
  clearTimeout(voiceSession.finalizeTimer);
  cancelVoiceSpeech();
  if (voiceSession.recognition) {
    try {
      voiceSession.recognition.abort();
    } catch {
      /* Ignore a recognition instance that already ended. */
    }
    voiceSession.recognition = null;
  }
  const recorder = voiceSession.recorder;
  voiceSession.recorder = null;
  if (recorder && recorder.state !== "inactive") {
    try {
      recorder.stop();
    } catch {
      /* Ignore a recorder that already stopped. */
    }
  }
  voiceSession.chunks = [];
  stopVoiceStream();
  voiceButton.classList.remove("is-listening");
  voiceModeElement.hidden = true;
  document.body.classList.remove("voice-mode-open");
  voiceButton.focus();
}

voiceButton.addEventListener("click", openVoiceMode);
voiceCloseButton.addEventListener("click", closeVoiceMode);
voiceOrb.addEventListener("click", () => {
  if (voiceSession.state === "listening") {
    finishVoiceListening();
  } else if (voiceSession.state === "speaking") {
    cancelVoiceSpeech();
    setVoiceState("idle", "Tap the orb to talk again");
  } else if (voiceSession.state === "idle" || voiceSession.state === "error") {
    startVoiceListening();
  }
});
voiceMuteButton.addEventListener("click", () => {
  voiceSession.muted = !voiceSession.muted;
  updateVoiceMuteButton();
  if (voiceSession.muted) {
    cancelVoiceSpeech();
    if (voiceSession.state === "speaking") setVoiceState("idle", "Spoken replies are muted. Tap the orb to talk again");
  }
});
voiceTypeButton.addEventListener("click", () => voiceTypeInput.focus());
voiceTypeInput.addEventListener("focus", cancelVoiceCapture);
voiceTypeForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = voiceTypeInput.value.trim();
  if (!text || voiceSession.state === "thinking" || voiceSession.state === "speaking") return;
  cancelVoiceCapture();
  voiceTypeInput.value = text;
  sendVoiceTurn(text);
});
voiceModeElement.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    event.preventDefault();
    closeVoiceMode();
  }
});

async function readChatEventStream(response, onToken, onModel) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
      let reply = "";
    let model = null;
    let completed = false;
    let truncated = false;

  function consumeLine(line) {
    if (!line.startsWith("data:")) return;
    let event;
    try {
      event = JSON.parse(line.slice(5).trim());
    } catch {
      throw new Error("The chat server returned an invalid response.");
    }
    if (event.error) throw new Error(event.error);
    if (typeof event.model === "string") {
      model = event.model;
      onModel(model);
    }
    if (typeof event.token === "string") {
      reply += event.token;
      onToken(reply);
    }
    if (event.truncated === true) truncated = true;
    if (event.done === true) {
      if (typeof event.reply === "string") reply = event.reply;
      completed = true;
    }
  }

  while (true) {
    const { value, done } = await reader.read();
    buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop();
    lines.forEach(consumeLine);
    if (done) {
      if (buffer) consumeLine(buffer);
      break;
    }
  }

  if (!completed || !reply.trim()) {
    throw new Error("The response stream ended before Ollama finished.");
  }
  return { reply, model, truncated };
}

async function readSkillEventStream(response) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let skill = null;
  let completed = false;
  let generatedCharacters = 0;
  let nextStatusUpdate = 120;

  function consumeLine(line) {
    if (!line.startsWith("data:")) return;
    let event;
    try {
      event = JSON.parse(line.slice(5).trim());
    } catch {
      throw new Error("The skill generator returned an invalid response.");
    }
    if (event.error) throw new Error(event.error);
    if (typeof event.progress === "string") setSettingsStatus(event.progress);
    if (typeof event.token === "string") {
      generatedCharacters += event.token.length;
      if (generatedCharacters >= nextStatusUpdate) {
        setSettingsStatus("Ollama is writing the skill…");
        nextStatusUpdate = generatedCharacters + 120;
      }
    }
    if (event.done === true) {
      skill = event.skill;
      completed = true;
    }
  }

  while (true) {
    const { value, done } = await reader.read();
    buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop();
    lines.forEach(consumeLine);
    if (done) {
      if (buffer) consumeLine(buffer);
      break;
    }
  }

  if (!completed || !skill || typeof skill.name !== "string") {
    throw new Error("Skill generation ended before Ollama finished.");
  }
  return skill;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const text = promptInput.value.trim();
  if ((!text && !pendingImages.length && !pendingDocuments.length) || sendButton.disabled) return;

  if (pendingImages.length + pendingDocuments.length > maxChatAttachments) {
    if (editingMessageIndex !== null) {
      showError("Finish editing the current message before sending more than five files.");
      return;
    }
    runBatchInChat();
    return;
  }

  errorMessage.hidden = true;
  const images = pendingImages;
  const documents = pendingDocuments;
  const content = text || (images.length
    ? `Describe these ${images.length} attached image${images.length === 1 ? "" : "s"}.`
    : `Summarize ${documents.length === 1 ? "this PDF" : "these PDFs"}.`);
  const reusableImages = images.length === 0 && documents.length === 0 &&
    recentImageContext.length > 0 && promptMentionsImages(content)
    ? recentImageContext
    : [];
  let selectedModel;
  try {
    selectedModel = chooseModelForRequest({
      requiresVision: images.length > 0,
      requiresReasoning: activeSkillIds.length > 0 || promptNeedsReasoning(content)
    });
  } catch (error) {
    showError(error.message);
    return;
  }
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

  const userMessage = {
    role: "user",
    content,
    images,
    documents: documents.map(({ name, text: documentText, pages }) => ({
      name,
      text: documentText,
      pages
    }))
  };
  conversation.push(userMessage);
  const userBubble = addMessage(userMessage, conversation.length - 1);
  promptInput.value = "";
  promptInput.style.height = "auto";
  pendingImages = [];
  pendingDocuments = [];
  renderPendingAttachments();
  editMessageControls.hidden = true;
  setLoading(true);
  const streamingMessage = {
    role: "assistant",
    content: "",
    model: selectedModel,
    isStreaming: true
  };
  const assistantBubble = addMessage(streamingMessage, conversation.length);
  const liveOutput = assistantBubble.querySelector(".structured-output-content");
  let pendingReply = "";
  let streamRenderFrame = 0;

  try {
    const recentMessages = conversation.slice(-maxServerMessages);
    let latestImageIndex = -1;
    recentMessages.forEach((message, index) => {
      if (message.image || (message.images && message.images.length)) latestImageIndex = index;
    });
    const imagePayloadIndex = latestImageIndex >= 0
      ? latestImageIndex
      : (reusableImages.length ? recentMessages.length - 1 : -1);

    activeChatController = new AbortController();
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: activeChatController.signal,
      body: JSON.stringify({
        chatId: currentChatId,
        model: selectedModel,
        webSearch: webSearchEnabled,
        skillIds: activeSkillIds,
        messages: recentMessages.map((message, index) => {
          const messageImages = message.images || (message.image ? [message.image] : []);
          return {
            role: message.role,
            content: message.content,
            ...(message.hadImage ? { hadImage: true } : {}),
            ...(message.hadDocuments ? { hadDocuments: true } : {}),
            ...(index === imagePayloadIndex && (messageImages.length || reusableImages.length)
              ? {
                  images: (messageImages.length ? messageImages : reusableImages)
                    .map(({ mimeType, data }) => ({ mimeType, data }))
                }
              : {}),
            ...(message.documents && message.documents.length
              ? { documents: message.documents.map(({ name, text: documentText }) => ({
                  name,
                  text: documentText
                })) }
              : {})
          };
        })
      })
    });
    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.error || "Something went wrong. Please try again.");
    }

    if (!(response.headers.get("content-type") || "").includes("text/event-stream")) {
      throw new Error("The chat server did not start a response stream.");
    }

    const streamResult = await readChatEventStream(
      response,
      (partialReply) => {
        pendingReply = partialReply;
        if (!streamRenderFrame) {
          streamRenderFrame = requestAnimationFrame(() => {
            const shouldFollow = isAtBottom();
            liveOutput.textContent = pendingReply;
            if (shouldFollow) messagesElement.scrollTop = messagesElement.scrollHeight;
            updateScrollToBottomButton();
            streamRenderFrame = 0;
          });
        }
      },
      (selectedModel) => {
        const modelLabel = assistantBubble.querySelector(".response-model");
        if (modelLabel) modelLabel.textContent = selectedModel;
      }
    );
    const reply = streamResult.reply;
    const responseModel = streamResult.model || selectedModel;
    const shouldFollow = isAtBottom();
    if (streamRenderFrame) cancelAnimationFrame(streamRenderFrame);
    liveOutput.textContent = reply;

    if (images.length) {
      const knownImages = new Set(recentImageContext.map((image) => image.data));
      recentImageContext = [
        ...recentImageContext,
        ...images.filter((image) => !knownImages.has(image.data))
      ].slice(-maxAttachments);
      for (const message of conversation) {
        if (message.image || (message.images && message.images.length)) {
          message.hadImage = true;
          message.image = null;
          message.images = null;
        }
      }
    }
    const assistantMessage = {
      role: "assistant",
      content: reply,
      model: responseModel,
      isArriving: true,
      ...(streamResult.truncated ? { truncated: true } : {})
    };
    conversation.push(assistantMessage);
    assistantBubble.classList.remove("is-streaming");
    assistantBubble.classList.add("is-arriving");
    liveOutput.replaceWith(renderStructuredOutput(reply));
    appendMessageActions(assistantMessage, conversation.length - 1, assistantBubble.querySelector(".message-column"));
    if (shouldFollow) messagesElement.scrollTop = messagesElement.scrollHeight;
    updateScrollToBottomButton();
    updateToolbarState();
    await loadChatHistory();
    setActionStatus("Structured response received.");
  } catch (error) {
    const wasStopped = error.name === "AbortError" ||
      (activeChatController !== null && activeChatController.signal.aborted);
    if (streamRenderFrame) cancelAnimationFrame(streamRenderFrame);
    const partialReply = pendingReply.trim();

    if (wasStopped && partialReply) {
      liveOutput.replaceWith(renderStructuredOutput(partialReply));
      assistantBubble.classList.remove("is-streaming");
      const stoppedMessage = {
        role: "assistant",
        content: partialReply,
        model: (assistantBubble.querySelector(".response-model") || {}).textContent || selectedModel,
        stopped: true
      };
      conversation.push(stoppedMessage);

      const stoppedNote = document.createElement("span");
      stoppedNote.className = "stopped-note";
      stoppedNote.textContent = "Stopped before the reply finished.";
      assistantBubble.querySelector(".message-content").append(stoppedNote);
      appendMessageActions(
        stoppedMessage,
        conversation.length - 1,
        assistantBubble.querySelector(".message-column")
      );
      updateToolbarState();
      updateScrollToBottomButton();
      setActionStatus("Generation stopped. The partial reply is kept in this chat.");
      return;
    }

    conversation.pop();
    if (assistantBubble) assistantBubble.remove();
    if (previousConversation) {
      conversation.splice(0, conversation.length, ...previousConversation);
      editingMessageIndex = editIndex;
      draftBeforeEdit = previousDraft;
      editMessageControls.hidden = false;
      renderMessages();
    } else {
      userBubble.remove();
      updateToolbarState();
      renderOutline();
    }
    promptInput.value = text;
    pendingImages = images;
    pendingDocuments = documents;
    renderPendingAttachments();
    updateSendButton();
    if (wasStopped) {
      setActionStatus("Generation stopped before any text arrived. Your message is back in the composer.");
    } else {
      showError(error.message || "Could not reach the server. Please try again.");
    }
  } finally {
    activeChatController = null;
    setLoading(false);
    promptInput.focus();
  }
});

stopButton.addEventListener("click", () => {
  if (!activeChatController || !isLoading) return;
  setActionStatus("Stopping generation…");
  activeChatController.abort();
});

loadChatHistory();
loadModels();
loadSettings();
