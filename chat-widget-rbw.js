(function () {
  const styleLink = document.createElement("link");
  styleLink.rel = "stylesheet";
  styleLink.href =
    "https://cdn.jsdelivr.net/gh/urosmarolt/agent-js@main/chat-widget-final.css";
  document.head.appendChild(styleLink);

  const defaultConfig = {
    webhook: { url: "" },
    branding: {
      logo: "",
      name: "",
      welcomeText: "",
      responseTimeText: "",
      poweredBy: {
        text: "Powered by RBW EV Cars",
        link: "https://rbwevcars.com/",
      },
    },
    style: {
      primaryColor: "",
      secondaryColor: "",
      position: "right",
      backgroundColor: "#ffffff",
      fontColor: "#333333",
    },
  };

  const config = window.ChatWidgetConfig
    ? {
        webhook: {
          ...defaultConfig.webhook,
          ...window.ChatWidgetConfig.webhook,
        },
        branding: {
          ...defaultConfig.branding,
          ...window.ChatWidgetConfig.branding,
        },
        style: { ...defaultConfig.style, ...window.ChatWidgetConfig.style },
      }
    : defaultConfig;

  if (window.ChatWidgetInitialized) return;
  window.ChatWidgetInitialized = true;

  let currentSessionId =
    localStorage.getItem("chatSessionId") || crypto.randomUUID();
  localStorage.setItem("chatSessionId", currentSessionId);

  const widgetContainer = document.createElement("div");
  widgetContainer.className = "n8n-chat-widget";
  widgetContainer.style.setProperty(
    "--n8n-chat-primary-color",
    config.style.primaryColor
  );
  widgetContainer.style.setProperty(
    "--n8n-chat-secondary-color",
    config.style.secondaryColor
  );
  widgetContainer.style.setProperty(
    "--n8n-chat-background-color",
    config.style.backgroundColor
  );
  widgetContainer.style.setProperty(
    "--n8n-chat-font-color",
    config.style.fontColor
  );

  const fontLink = document.createElement("link");
  fontLink.rel = "stylesheet";
  fontLink.href =
    "https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700&display=swap";
  document.head.appendChild(fontLink);

  const chatContainer = document.createElement("div");
  chatContainer.className = `chat-container${
    config.style.position === "left" ? " position-left" : ""
  }`;
  chatContainer.innerHTML = `
    <div class="new-conversation">
      <h2 class="welcome-text">${config.branding.welcomeText}</h2>
      <button class="new-chat-btn">Send us a message</button>
      <p class="response-text">${config.branding.responseTimeText}</p>
    </div>
    <div class="chat-interface">
      <div class="brand-header">
        <img src="${config.branding.logo}" alt="${config.branding.name}">
        <span>${config.branding.name}</span>
        <button class="close-button">×</button>
      </div>
      <div class="chat-messages"></div>
      <div class="chat-input">
        <textarea placeholder="Type your message here..." rows="1"></textarea>
        <button type="submit">Send</button>
      </div>
      <div class="chat-footer">
        <a href="${config.branding.poweredBy.link}" target="_blank">${config.branding.poweredBy.text}</a>
      </div>
    </div>`;

  const toggleButton = document.createElement("button");
  toggleButton.className = `chat-toggle${
    config.style.position === "left" ? " position-left" : ""
  }`;
  toggleButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.477 2 12c0 1.821.487 3.53 1.338 5L2.5 21.5l4.5-.838A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"/></svg>`;

  widgetContainer.appendChild(chatContainer);
  widgetContainer.appendChild(toggleButton);
  document.body.appendChild(widgetContainer);

  const newChatBtn = chatContainer.querySelector(".new-chat-btn");
  const chatInterface = chatContainer.querySelector(".chat-interface");
  const messagesContainer = chatContainer.querySelector(".chat-messages");
  const textarea = chatContainer.querySelector("textarea");
  const sendButton = chatContainer.querySelector('button[type="submit"]');

  textarea.addEventListener("input", () => {
    textarea.style.height = "auto";
    textarea.style.height = textarea.scrollHeight + "px";
  });

  newChatBtn.addEventListener("click", () => {
    chatContainer.querySelector(".new-conversation").style.display = "none";
    chatInterface.classList.add("active");
  });

  async function sendMessage(message) {
    const chatHistory =
      JSON.parse(localStorage.getItem(`chat_history_${currentSessionId}`)) || [];
    textarea.disabled = true;
    sendButton.disabled = true;

    const userDiv = document.createElement("div");
    userDiv.className = "chat-message user";
    userDiv.textContent = message;
    messagesContainer.appendChild(userDiv);
    userDiv.scrollIntoView({ behavior: "smooth", block: "start" });

    const thinkingDiv = document.createElement("div");
    thinkingDiv.className = "chat-message bot thinking";
    thinkingDiv.textContent = "Thinking...";
    messagesContainer.appendChild(thinkingDiv);

    try {
      const res = await fetch(config.webhook.url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: currentSessionId,
          chatInput: message,
          chat_history: chatHistory,
        }),
      });

      const data = await res.json();
      thinkingDiv.remove();

      const botDiv = document.createElement("div");
      botDiv.className = "chat-message bot";

      const avatarImg = document.createElement("img");
      avatarImg.className = "avatar";
      avatarImg.src = config.branding.avatar || config.branding.logo || "";
      avatarImg.alt = "Bot Avatar";

      const botDiv = document.createElement("div");
      botDiv.className = "chat-message bot";
      
      const avatarImg = document.createElement("img");
      avatarImg.className = "avatar";
      avatarImg.src = config.branding.avatar || config.branding.logo || "";
      avatarImg.alt = "Bot Avatar";
      
      const textContent = document.createElement("div");
      textContent.innerHTML = data.response; // expects raw HTML, which your BE sends
      
      botDiv.appendChild(avatarImg);
      botDiv.appendChild(textContent);
      messagesContainer.appendChild(botDiv);
      botDiv.scrollIntoView({ behavior: "smooth", block: "start" });

      saveChatHistory({ sender: "user", message });
      saveChatHistory({ sender: "bot", message: safeResponse });

      textarea.disabled = false;
      sendButton.disabled = false;
      textarea.focus();
    } catch (e) {
      console.error(e);
      thinkingDiv.remove();
      textarea.disabled = false;
      sendButton.disabled = false;
    }
  }

  // Left intact for potential legacy fallback, not used now
  function formatPlainText(text) {
    if (!text) return "";

    text = text.replace(
      /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
    );

    return text.replace(/\n/g, "<br>").replace(/\s{2,}/g, "&nbsp;&nbsp;");
  }

  sendButton.addEventListener("click", () => {
    const message = textarea.value.trim();
    if (message) {
      sendMessage(message);
      textarea.value = "";
    }
  });

  textarea.addEventListener("keypress", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const message = textarea.value.trim();
      if (message) {
        sendMessage(message);
        textarea.value = "";
      }
    }
  });

  toggleButton.addEventListener("click", () => {
    chatContainer.classList.toggle("open");
  });

  chatContainer
    .querySelectorAll(".close-button")
    .forEach((btn) =>
      btn.addEventListener("click", () =>
        chatContainer.classList.remove("open")
      )
    );

  function saveChatHistory(entry) {
    const history =
      JSON.parse(localStorage.getItem(`chat_history_${currentSessionId}`)) || [];
    history.push(entry);
    localStorage.setItem(
      `chat_history_${currentSessionId}`,
      JSON.stringify(history)
    );
  }
})();
