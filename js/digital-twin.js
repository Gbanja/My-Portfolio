(() => {
  "use strict";
  const configured = window.DIGITAL_TWIN_ENDPOINT;
  if (!configured || document.querySelector("gbanjah-digital-twin")) return;
  let endpoint;
  try {
    endpoint = new URL(configured);
    if (endpoint.protocol !== "https:" && !(endpoint.protocol === "http:" && endpoint.hostname === "127.0.0.1")) return;
  } catch { return; }
  const stylesheet = new URL("../css/digital-twin.css", document.currentScript.src);
  const host = document.createElement("gbanjah-digital-twin");
  const root = host.attachShadow({ mode: "open" });
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = stylesheet.href;
  root.append(link);
  const content = document.createElement("div");
  // Authored markup only; questions, answers and errors always use textContent.
  content.innerHTML = `
    <button class="launcher" type="button" aria-haspopup="dialog" aria-expanded="false" aria-controls="twin-panel"><span aria-hidden="true">✦</span> Ask my Digital Twin</button>
    <dialog id="twin-panel" aria-labelledby="twin-title" aria-describedby="disclosure">
      <div class="heading"><span class="avatar" aria-hidden="true">gc.</span><div><p class="eyebrow">A CONVERSATION ABOUT MY CAREER</p><h2 id="twin-title">Digital Twin <span class="badge">AI</span></h2></div><button class="close" type="button" aria-label="Close chat">×</button></div>
      <div class="transcript" role="log" aria-live="polite" aria-relevant="additions text" aria-label="Career conversation">
        <div class="welcome"><p class="eyebrow">MEET THE PERSON BEHIND THE WORK</p><h3>Curious?<br>Let's talk.</h3><p>I'm Gbanjah's AI career guide. Ask about his experience, education, skills, or projects.</p><div class="suggestions"><button type="button">What does Gbanjah do at Orange?</button><button type="button">Tell me about his projects.</button><button type="button">What skills does he bring?</button></div></div>
      </div>
      <div class="feedback"><p class="error" role="alert"></p><button type="button" class="retry" hidden>Retry question</button><p class="notice" role="status"></p></div>
      <form><label for="question">Ask about Gbanjah’s career</label><div class="composer"><textarea id="question" rows="2" maxlength="1500" placeholder="What would you like to know?"></textarea><button class="send" type="submit">Send</button><button class="stop" type="button" hidden>Stop</button></div><div class="tools"><button class="clear" type="button">Clear chat</button><a href="mailto:gbanjahcampbell.com@gmail.com">Contact Gbanjah ↗</a></div><p id="disclosure">AI can make mistakes. Messages go to OpenRouter and its model provider. Avoid private information. Chat clears when you leave or reload this page.</p></form>
    </dialog>`;
  root.append(content);
  document.body.append(host);
  // Leave room for the floating control at the bottom of the existing site.
  document.body.style.paddingBottom = "90px";
  const find = selector => root.querySelector(selector);
  const panel = find("dialog"), launcher = find(".launcher"), input = find("textarea");
  const transcript = find(".transcript"), welcome = find(".welcome");
  const error = find(".error"), notice = find(".notice"), retry = find(".retry");
  const sendButton = find(".send"), stopButton = find(".stop");
  let history = [], active = null, failed = "", pending = "";
  let pendingNodes = [];

  function row(role, text) {
    const item = document.createElement("div");
    item.className = `message ${role}`;
    const label = document.createElement("strong");
    label.textContent = role === "user" ? "You" : "Digital Twin · AI";
    const body = document.createElement("p");
    body.textContent = text;
    item.append(label, body);
    transcript.append(item);
    transcript.scrollTop = transcript.scrollHeight;
    return item;
  }
  function busy(value) {
    input.disabled = value;
    sendButton.hidden = value;
    stopButton.hidden = !value;
    root.querySelectorAll(".suggestions button").forEach(button => { button.disabled = value; });
    if (value) stopButton.focus();
    else if (panel.open) input.focus();
  }
  function removePending() { pendingNodes.forEach(node => node.remove()); pendingNodes = []; }
  function stop() {
    if (!active) return;
    active.abort(); active = null;
    input.value = pending; pending = "";
    removePending(); busy(false);
    welcome.hidden = history.length > 0;
    notice.textContent = "Response stopped. You can edit your question or send it again.";
  }
  function messagesFor(question) {
    const messages = [...history.slice(-12), { role: "user", content: question }];
    while (messages.length > 1 && (messages.reduce((total, message) => total + message.content.length, 0) > 24000 || new TextEncoder().encode(JSON.stringify({ messages })).length > 32000)) messages.splice(0, 2);
    return messages;
  }
  async function send(question) {
    const text = question.trim();
    if (!text || text.length > 1500 || active) return;
    const controller = new AbortController(); active = controller;
    pending = text; failed = ""; input.value = "";
    error.textContent = ""; notice.textContent = ""; retry.hidden = true;
    welcome.hidden = true;
    pendingNodes = [row("user", text), row("assistant", "Thinking…")];
    busy(true);
    const deadline = setTimeout(() => controller.abort(), 50000);
    try {
      const response = await fetch(endpoint.href, {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "omit",
        body: JSON.stringify({ messages: messagesFor(text) }), signal: controller.signal,
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(typeof result?.error === "string" ? result.error : "The Digital Twin is unavailable. Please try again.");
      if (typeof result?.reply !== "string" || !result.reply.trim() || result.reply.length > 8000) throw new Error("The reply could not be completed. Please try again.");
      if (active !== controller) return;
      pendingNodes[1].querySelector("p").textContent = result.reply;
      pendingNodes = [];
      history.push({ role: "user", content: text }, { role: "assistant", content: result.reply });
      transcript.scrollTop = transcript.scrollHeight;
    } catch (failure) {
      if (active !== controller) return;
      removePending(); failed = text; input.value = text;
      welcome.hidden = history.length > 0;
      error.textContent = failure.name === "AbortError" || failure.name === "TypeError" ? "The connection was interrupted or took too long. Please try again." : failure.message;
      retry.hidden = false;
    } finally {
      clearTimeout(deadline);
      if (active === controller) { active = null; pending = ""; busy(false); }
    }
  }
  launcher.addEventListener("click", () => { panel.showModal(); launcher.setAttribute("aria-expanded", "true"); input.focus(); });
  find(".close").addEventListener("click", () => panel.close());
  panel.addEventListener("close", () => { stop(); launcher.setAttribute("aria-expanded", "false"); launcher.focus(); });
  panel.addEventListener("keydown", event => {
    if (event.key !== "Tab") return;
    const controls = [...panel.querySelectorAll("button:not(:disabled), textarea:not(:disabled), a[href]")].filter(node => node.getClientRects().length);
    const first = controls[0], last = controls.at(-1);
    if (event.shiftKey && root.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && root.activeElement === last) { event.preventDefault(); first.focus(); }
  });
  find("form").addEventListener("submit", event => { event.preventDefault(); void send(input.value); });
  input.addEventListener("keydown", event => { if (event.key === "Enter" && !event.shiftKey && !event.isComposing) { event.preventDefault(); void send(input.value); } });
  root.querySelectorAll(".suggestions button").forEach(button => button.addEventListener("click", () => void send(button.textContent)));
  retry.addEventListener("click", () => void send(failed));
  stopButton.addEventListener("click", stop);
  find(".clear").addEventListener("click", () => {
    stop(); history = []; failed = ""; input.value = "";
    transcript.querySelectorAll(".message").forEach(node => node.remove());
    welcome.hidden = false; error.textContent = ""; retry.hidden = true;
    notice.textContent = "Chat cleared. Start a new conversation."; input.focus();
  });
  window.addEventListener("pagehide", () => active?.abort());
})();
