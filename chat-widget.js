// Chat Widget Script
(function () {
  // Load external CSS
  const styleLink = document.createElement("link");
  styleLink.rel = "stylesheet";
  styleLink.href =
    "https://cdn.jsdelivr.net/gh/urosmarolt/agent-js@main/chat-widget-final.css"; // Replace with actual URL
  document.head.appendChild(styleLink);

  // Default configuration
  const defaultConfig = {
    webhook: {
      url: "",
      route: "",
    },
    branding: {
      logo: "",
      name: "",
      welcomeText: "",
      responseTimeText: "",
      poweredBy: {
        text: "Powered by UPlytix",
        link: "https://startuplytix.com",
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

  if (window.N8NChatWidgetInitialized) return;
  window.N8NChatWidgetInitialized = true;

  let currentSessionId =
    localStorage.getItem("n8nChatSessionId") || crypto.randomUUID();
  localStorage.setItem("n8nChatSessionId", currentSessionId);

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

  // Load font from config
  const fontLink = document.createElement("link");
  fontLink.rel = "stylesheet";
  fontLink.href =
    config.style.fontUrl ||
    "https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700&display=swap";
  document.head.appendChild(fontLink);

  // Apply font-family via CSS variable
  if (config.style.fontFamily) {
    widgetContainer.style.setProperty(
      "--n8n-chat-font-family",
      config.style.fontFamily
    );
  }

  const chatContainer = document.createElement("div");
  chatContainer.className = `chat-container${
    config.style.position === "left" ? " position-left" : ""
  }`;

  const newConversationHTML = `
    <div class="brand-header">
      <img src="${config.branding.logo}" alt="${config.branding.name}">
      <span>${config.branding.name}</span>
      <button class="close-button">×</button>
    </div>
    <div class="new-conversation">
      <h2 class="welcome-text">${config.branding.welcomeText}</h2>
      <button class="new-chat-btn">
        <svg class="message-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <path fill="currentColor" d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.2L4 17.2V4h16v12z"/>
        </svg>
        Send us a message
      </button>
      <p class="response-text">${config.branding.responseTimeText}</p>
    </div>
  `;

  const chatInterfaceHTML = `
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
    </div>
  `;

  chatContainer.innerHTML = newConversationHTML + chatInterfaceHTML;

  const toggleButton = document.createElement("button");
  toggleButton.className = `chat-toggle${
    config.style.position === "left" ? " position-left" : ""
  }`;
  toggleButton.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
      <path d="M12 2C6.477 2 2 6.477 2 12c0 1.821.487 3.53 1.338 5L2.5 21.5l4.5-.838A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18c-1.476 0-2.886-.313-4.156-.878l-3.156.586.586-3.156A7.962 7.962 0 014 12c0-4.411 3.589-8 8-8s8 3.589 8 8-3.589 8-8 8z"/>
    </svg>`;

  widgetContainer.appendChild(chatContainer);
  widgetContainer.appendChild(toggleButton);
  document.body.appendChild(widgetContainer);

  const newChatBtn = chatContainer.querySelector(".new-chat-btn");
  const chatInterface = chatContainer.querySelector(".chat-interface");
  const messagesContainer = chatContainer.querySelector(".chat-messages");
  const textarea = chatContainer.querySelector("textarea");
  textarea.addEventListener("input", () => {
    textarea.style.height = "auto";
    textarea.style.height = textarea.scrollHeight + "px";
  });
  const sendButton = chatContainer.querySelector('button[type="submit"]');

  function generateUUID() {
    return crypto.randomUUID();
  }

  async function startNewConversation() {
    // Load previous chat history if available
    function loadChatHistory() {
      let chatHistory =
        JSON.parse(localStorage.getItem(`chat_history_${currentSessionId}`)) ||
        [];
      chatHistory.forEach((msg) => {
        const messageDiv = document.createElement("div");
        messageDiv.className =
          msg.type === "user" ? "chat-message user" : "chat-message bot";
        messageDiv.textContent = msg.content;
        messagesContainer.appendChild(messageDiv);
        messageDiv.scrollIntoView({ behavior: "auto", block: "start" });
      });
    }

    // Initialize the conversation and load previous messages
    loadChatHistory();

    const data = [
      {
        action: "loadPreviousSession",
        sessionId: currentSessionId,
        route: config.webhook.route,
        metadata: { userId: "" },
      },
    ];

    try {
      const response = await fetch(config.webhook.url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();
      chatContainer.querySelector(".brand-header").style.display = "none";
      chatContainer.querySelector(".new-conversation").style.display = "none";
      chatInterface.classList.add("active");

      const botMessageDiv = document.createElement("div");
      botMessageDiv.className = "chat-message bot";

      const avatar = document.createElement("img");
      avatar.className = "avatar";
      avatar.src = config.branding.avatar || config.branding.logo || "";

      const rawOutput = Array.isArray(responseData)
        ? responseData[0]?.output
        : responseData?.output || "";
      const messageContent = document.createElement("div");
      messageContent.innerHTML = formatMessageContent(
        rawOutput || "*[No response]*"
      );

      botMessageDiv.appendChild(avatar);
      botMessageDiv.appendChild(messageContent);
      messagesContainer.appendChild(botMessageDiv);
      botMessageDiv.scrollIntoView({ behavior: "auto", block: "start" });

      // Save the bot's initial response to the chat history
      updateChatHistory({
        type: "bot",
        content: rawOutput || "*[No response]*",
      });
    } catch (error) {
      console.error("Error:", error);
    }
  }

  async function sendMessage(message) {
    // Retrieve the full chat history from local storage
    const chatHistory =
      JSON.parse(localStorage.getItem(`chat_history_${currentSessionId}`)) ||
      [];

    // Prepare the message data with the full chat history
    const messageData = {
      action: "sendMessage",
      sessionId: currentSessionId,
      route: config.webhook.route,
      chatInput: message,
      metadata: { userId: "" },
      chat_history: chatHistory, // Include the entire history here
    };

    // Disable input
    textarea.disabled = true;
    sendButton.disabled = true;

    const userMessageDiv = document.createElement("div");
    userMessageDiv.className = "chat-message user";
    userMessageDiv.textContent = message;
    messagesContainer.appendChild(userMessageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // Add typing indicator
    const thinkingDiv = document.createElement("div");
    thinkingDiv.className = "chat-message bot thinking";
    thinkingDiv.innerHTML = `
        <img class="avatar" src="${
          config.branding.avatar || config.branding.logo || ""
        }" />
        <div class="thinking-content">
            <p class="typing-label">Typing...</p>
            <div class="loader-dots"><span>.</span><span>.</span><span>.</span></div>
        </div>
    `;
    messagesContainer.appendChild(thinkingDiv);
    thinkingDiv.scrollIntoView({ behavior: "auto", block: "start" });

    try {
      const response = await fetch(config.webhook.url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(messageData),
      });

      const data = await response.json();

      // Remove typing indicator
      if (thinkingDiv && thinkingDiv.parentNode) {
        thinkingDiv.parentNode.removeChild(thinkingDiv);
      }

      // Show actual response
      const botMessageDiv = document.createElement("div");
      botMessageDiv.className = "chat-message bot";

      const avatar = document.createElement("img");
      avatar.className = "avatar";
      avatar.src = config.branding.avatar || config.branding.logo || "";

      const rawOutput = Array.isArray(data)
        ? data[0]?.output
        : data?.output || "";
      const messageContent = document.createElement("div");
      messageContent.innerHTML = formatMessageContent(
        rawOutput || "*[No response]*"
      );

      botMessageDiv.appendChild(avatar);
      botMessageDiv.appendChild(messageContent);
      messagesContainer.appendChild(botMessageDiv);
      botMessageDiv.scrollIntoView({ behavior: "auto", block: "start" });

      // Re-enable input
      textarea.disabled = false;
      sendButton.disabled = false;
      textarea.focus();
    } catch (error) {
      console.error("Error:", error);
      textarea.disabled = false;
      sendButton.disabled = false;
    }
  }

  newChatBtn.addEventListener("click", startNewConversation);

  function saveChatHistory(message, sender) {
    const chatHistory =
      JSON.parse(localStorage.getItem(`chat_history_${currentSessionId}`)) ||
      [];
    chatHistory.push({ sender: sender, message: message });
    localStorage.setItem(
      `chat_history_${currentSessionId}`,
      JSON.stringify(chatHistory)
    );
  }

  sendButton.addEventListener("click", () => {
    const message = textarea.value.trim();
    if (message) {
      sendMessage(message);
      saveChatHistory(message, "user"); // Save user message
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

  messagesContainer.addEventListener("click", function (e) {
    const target = e.target;

    // Check if the clicked element is an <li> containing an <a> tag within it
    if (
      target.tagName === "LI" &&
      target.querySelector("a") &&
      target.closest(".chat-message.bot")
    ) {
      const link = target.querySelector("a");
      if (link) {
        const text = link.textContent.trim();
        sendMessage(text); // reuse your existing function
      }
    }
  });

  function formatMessageContent(rawOutput) {
    return marked
      .parse(rawOutput)
      .replace(
        /<li><a href="([^"]+)">(.*?)<\/a><\/li>/g,
        (match, href, text) =>
          `<li class="clickable-bullet"><a href="${href}">${text}</a></li>`
      );
  }

  const closeButtons = chatContainer.querySelectorAll(".close-button");
  closeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      chatContainer.classList.remove("open");
    });
  });

  function updateChatHistory(message) {
    let chatHistory =
      JSON.parse(localStorage.getItem(`chat_history_${currentSessionId}`)) ||
      [];
    chatHistory.push(message);
    localStorage.setItem(
      `chat_history_${currentSessionId}`,
      JSON.stringify(chatHistory)
    );
  }
})();
