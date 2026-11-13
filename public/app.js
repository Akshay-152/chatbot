const form = document.querySelector("#chat-form");
const promptInput = document.querySelector("#prompt");
const messagesElement = document.querySelector("#messages");
const scrollToBottomButton = document.querySelector("#scroll-to-bottom");
const sendButton = document.querySelector("#send-button");
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
const attachmentPreview = document.querySelector("#attachment-preview");
const attachmentImage = document.querySelector("#attachment-image");
const attachmentName = document.querySelector("#attachment-name");
const removeAttachmentButton = document.querySelector("#remove-attachment");
const imageModelHint = document.querySelector("#image-model-hint");
const voiceButton = document.querySelector("#voice-button");
const webSearchToggle = document.querySelector("#web-search-toggle");
const newChatButton = document.querySelector("#new-chat-button");
const chatHistoryButton = document.querySelector("#chat-history-button");
const copyInputButton = document.querySelector("#copy-input-button");
const copyOutputButton = document.querySelector("#copy-output-button");
const editMessageControls = document.querySelector("#edit-message-controls");
const cancelEditButton = document.querySelector("#cancel-edit-button");
const historyList = document.querySelector("#history-list");
const outlineToggle = document.querySelector("#outline-toggle");
const outlineList = document.querySelector("#outline-list");
const outlineCount = document.querySelector("#outline-count");
const settingsButton = document.querySelector("#settings-button");
const settingsDialog = document.querySelector("#settings-dialog");
const closeSettingsButton = document.querySelector("#close-settings-button");
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
const useSkillButton = document.querySelector("#use-skill-button");
const skillSelectionCount = document.querySelector("#skill-selection-count");
const skillPopover = document.querySelector("#skill-popover");
const skillPickerList = document.querySelector("#skill-picker-list");
const manageSkillsButton = document.querySelector("#manage-skills-button");

const conversation = [];
const maxImageBytes = 2 * 1024 * 1024;
const maxServerMessages = 500;
const maxActiveSkills = 3;
let availableModels = [];
let chatHistory = [];
let savedSkills = [];
let activeSkillIds = [];
let currentChatId = createChatId();
let pendingImage = null;
let editingMessageIndex = null;
let draftBeforeEdit = null;
let isLoading = false;
let modelsAvailable = false;
let recognition = null;
let isListening = false;
let webSearchEnabled = true;

function openMobileNav() {
  if (!mobileViewport.matches) return;
  sidebar.classList.add("is-open");
  mobileNavBackdrop.hidden = false;
  document.body.classList.add("mobile-nav-open");
  mobileMenuButton.setAttribute("aria-expanded", "true");
  mobileMenuButton.setAttribute("aria-label", "Close conversation menu");
  newChatButton.focus();
}

function closeMobileNav(restoreFocus = true) {
  sidebar.classList.remove("is-open");
  mobileNavBackdrop.hidden = true;
  document.body.classList.remove("mobile-nav-open");
  mobileMenuButton.setAttribute("aria-expanded", "false");
  mobileMenuButton.setAttribute("aria-label", "Open conversation menu");
  if (restoreFocus && mobileViewport.matches) mobileMenuButton.focus();
}

function createChatId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
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
  messageColumn.append(actions);
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
    author.textContent = message.isGreeting ? "Assistant" : "sir,";
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

  if (!message.isGreeting && !message.isStreaming) {
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
      outlineToggle.setAttribute("aria-expanded", "false");
      document.querySelector(".chat-outline").classList.remove("is-open");
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
    button.addEventListener("click", () => {
      closeMobileNav(false);
      restoreChat(chat.id);
    });

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
    activeSkillIds = Array.isArray(chat.skillIds) ? chat.skillIds : [];
    editingMessageIndex = null;
    draftBeforeEdit = null;
    pendingImage = null;
    promptInput.value = "";
    attachmentImage.removeAttribute("src");
    attachmentPreview.hidden = true;
    editMessageControls.hidden = true;
    renderMessages();
    renderHistoryList();
    renderSkillPicker();
    updateSendButton();
    promptInput.focus();
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
      activeSkillIds = [];
      editingMessageIndex = null;
      draftBeforeEdit = null;
      promptInput.value = "";
      pendingImage = null;
      attachmentImage.removeAttribute("src");
      attachmentPreview.hidden = true;
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
    const [memoryResponse, skillsResponse] = await Promise.all([
      fetch("/api/memory"),
      fetch("/api/skills")
    ]);
    const [memory, skills] = await Promise.all([memoryResponse.json(), skillsResponse.json()]);
    if (!memoryResponse.ok) throw new Error(memory.error || "Could not load memory.");
    if (!skillsResponse.ok) throw new Error(skills.error || "Could not load skills.");
    memoryInput.value = typeof memory.text === "string" ? memory.text : "";
    savedSkills = Array.isArray(skills.skills) ? skills.skills : [];
    activeSkillIds = activeSkillIds.filter((id) => savedSkills.some((skill) => skill.id === id));
    renderSavedSkills();
    renderSkillPicker();
  } catch (error) {
    setSettingsStatus(error.message || "Could not load settings.", true);
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

function openSettings() {
  closeMobileNav(false);
  settingsDialog.hidden = false;
  skillPopover.hidden = true;
  setSettingsStatus("");
  loadSettings();
  closeSettingsButton.focus();
}

function closeSettings() {
  settingsDialog.hidden = true;
}

function startNewChat() {
  closeMobileNav(false);
  conversation.length = 0;
  currentChatId = createChatId();
  activeSkillIds = [];
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

function isAtBottom() {
  return messagesElement.scrollHeight - messagesElement.scrollTop - messagesElement.clientHeight < 80;
}

function updateScrollToBottomButton() {
  scrollToBottomButton.hidden = isAtBottom();
}

function scrollToBottom() {
  messagesElement.scrollTo({ top: messagesElement.scrollHeight, behavior: "smooth" });
}

function setLoading(loading) {
  isLoading = loading;
  messagesElement.setAttribute("aria-busy", String(loading));
  promptInput.disabled = loading;
  uploadButton.disabled = loading;
  removeAttachmentButton.disabled = loading;
  voiceButton.disabled = loading || !SpeechRecognition;
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
      const autoOption = new Option("Auto · best for request", "auto");
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
mobileMenuButton.addEventListener("click", () => {
  if (sidebar.classList.contains("is-open")) closeMobileNav();
  else openMobileNav();
});
mobileNavBackdrop.addEventListener("click", () => closeMobileNav());
mobileViewport.addEventListener("change", (event) => {
  if (!event.matches) closeMobileNav(false);
});
chatHistoryButton.addEventListener("click", openHistory);
copyInputButton.addEventListener("click", () => copyLatestMessage("user"));
copyOutputButton.addEventListener("click", () => copyLatestMessage("assistant"));
cancelEditButton.addEventListener("click", cancelEdit);
settingsButton.addEventListener("click", openSettings);
closeSettingsButton.addEventListener("click", closeSettings);
settingsDialog.addEventListener("click", (event) => {
  if (event.target === settingsDialog) closeSettings();
});
saveMemoryButton.addEventListener("click", saveMemory);
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
  const isOpen = document.querySelector(".chat-outline").classList.toggle("is-open");
  outlineToggle.setAttribute("aria-expanded", String(isOpen));
});
messagesElement.addEventListener("scroll", () => {
  updateActiveOutline();
  updateScrollToBottomButton();
});
scrollToBottomButton.addEventListener("click", scrollToBottom);
window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeSettings();
    skillPopover.hidden = true;
    closeMobileNav();
    document.querySelector(".chat-outline").classList.remove("is-open");
    outlineToggle.setAttribute("aria-expanded", "false");
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
    ? "Automatic web research is on for current and research questions. Click to turn it off."
    : "Web research is off. Click to allow automatic searches for current and research questions.";
  setActionStatus(webSearchEnabled ? "Automatic web research enabled." : "Web research disabled.");
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

async function readChatEventStream(response, onToken, onModel) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let reply = "";
  let model = null;
  let completed = false;

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
  return { reply, model };
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
  if ((!text && !pendingImage) || sendButton.disabled) return;

  errorMessage.hidden = true;
  const image = pendingImage;
  const content = text || "Describe this image.";
  let selectedModel;
  try {
    selectedModel = chooseModelForRequest({
      requiresVision: Boolean(image),
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
      if (message.image) latestImageIndex = index;
    });

    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chatId: currentChatId,
        model: selectedModel,
        webSearch: webSearchEnabled,
        skillIds: activeSkillIds,
        messages: recentMessages.map((message, index) => ({
          role: message.role,
          content: message.content,
          ...(message.hadImage ? { hadImage: true } : {}),
          ...(index === latestImageIndex ? { image: message.image } : {})
        }))
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
      content: reply,
      model: responseModel,
      isArriving: true
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
    if (streamRenderFrame) cancelAnimationFrame(streamRenderFrame);
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
loadSettings();
