(function () {
  "use strict";

  var BASE_URL = "";
  var scriptTag = document.currentScript;
  if (scriptTag && scriptTag.src) {
    var url = new URL(scriptTag.src);
    BASE_URL = url.origin;
  }

  var CONFIG_URL = BASE_URL + "/api/support-chat/widget-config";
  var SESSION_URL = BASE_URL + "/api/support-chat/session";
  var MESSAGE_URL = BASE_URL + "/api/support-chat/message";
  var AGENTS_ONLINE_URL = BASE_URL + "/api/support-chat/agents-online";
  var REQUEST_AGENT_URL = BASE_URL + "/api/support-chat/request-agent";
  var SESSION_KEY = "mob-support-chat-session";

  var state = {
    isOpen: false,
    config: null,
    messages: [],
    sessionId: null,
    isLoading: false,
    sessionStatus: "ai_only",
    agentsOnline: false,
    pollingTimer: null,
    agentCheckTimer: null,
  };

  function fetchConfig() {
    return fetch(CONFIG_URL)
      .then(function (r) { return r.json(); })
      .then(function (data) {
        state.config = data;
        return data;
      });
  }

  function createSession() {
    return fetch(SESSION_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pageUrl: window.location.href,
        userAgent: navigator.userAgent,
        referrer: document.referrer,
      }),
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        state.sessionId = data.sessionId;
        try { sessionStorage.setItem(SESSION_KEY, data.sessionId); } catch (e) {}
        return data.sessionId;
      });
  }

  function sendMessage(message) {
    state.isLoading = true;
    renderMessages();

    var p = state.sessionId
      ? Promise.resolve(state.sessionId)
      : createSession();

    return p.then(function (sid) {
      return fetch(MESSAGE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: sid, message: message }),
      });
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        // When agent is active, response is empty (agent replies via polling)
        if (data.response) {
          state.messages.push({ role: "assistant", content: data.response });
        }
        state.isLoading = false;
        renderMessages();
      })
      .catch(function () {
        state.messages.push({
          role: "assistant",
          content: "Sorry, something went wrong. Please try again.",
        });
        state.isLoading = false;
        renderMessages();
      });
  }

  function checkAgentsOnline() {
    fetch(AGENTS_ONLINE_URL)
      .then(function (r) { return r.json(); })
      .then(function (data) {
        state.agentsOnline = data.online;
        renderMessages();
      })
      .catch(function () {});
  }

  function requestHumanAgent() {
    if (!state.sessionId) return;
    fetch(REQUEST_AGENT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: state.sessionId }),
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        state.sessionStatus = data.status;
        startPolling();
        renderMessages();
      })
      .catch(function () {
        state.messages.push({
          role: "system",
          content: "Sorry, we couldn't connect you to an agent right now.",
        });
        renderMessages();
      });
  }

  function startPolling() {
    stopPolling();
    state.pollingTimer = setInterval(pollMessages, 3000);
  }

  function stopPolling() {
    if (state.pollingTimer) {
      clearInterval(state.pollingTimer);
      state.pollingTimer = null;
    }
  }

  function pollMessages() {
    if (!state.sessionId) return;
    var lastMsg = state.messages[state.messages.length - 1];
    var since = lastMsg && lastMsg.createdAt ? lastMsg.createdAt : "";
    var url = BASE_URL + "/api/support-chat/session/" + state.sessionId + "/messages" + (since ? "?since=" + encodeURIComponent(since) : "");
    fetch(url)
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data.sessionStatus) {
          state.sessionStatus = data.sessionStatus;
          if (data.sessionStatus === "agent_closed" || data.sessionStatus === "ticket_created") {
            stopPolling();
          }
        }
        if (data.messages && data.messages.length > 0) {
          var existingIds = {};
          state.messages.forEach(function (m) { if (m.id) existingIds[m.id] = true; });
          data.messages.forEach(function (m) {
            if (!existingIds[m.id]) {
              state.messages.push(m);
            }
          });
        }
        renderMessages();
      })
      .catch(function () {});
  }

  function resetSession() {
    stopPolling();
    state.sessionId = null;
    state.messages = [];
    state.sessionStatus = "ai_only";
    try { sessionStorage.removeItem(SESSION_KEY); } catch (e) {}
    renderMessages();
  }

  function esc(str) {
    var d = document.createElement("div");
    d.textContent = str;
    return d.innerHTML;
  }

  function getBubbleSize(cfg) {
    if (cfg.bubbleSize === "small") return 48;
    if (cfg.bubbleSize === "large") return 64;
    return 56;
  }

  var root, bubble, panel;

  function createWidget(cfg) {
    var size = getBubbleSize(cfg);
    var pos = cfg.position === "bottom-left" ? "left" : "right";

    // Shadow host for style isolation
    root = document.createElement("div");
    root.id = "mob-support-widget";
    root.setAttribute("style", "all:initial;position:fixed;z-index:" + (cfg.zIndex || 9999) + ";" + pos + ":24px;bottom:24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:14px;line-height:1.5;color:#1f2937;");

    // Bubble
    bubble = document.createElement("button");
    bubble.setAttribute("aria-label", "Open support chat");
    bubble.setAttribute(
      "style",
      "width:" + size + "px;height:" + size + "px;border-radius:50%;background:" + cfg.primaryColor + ";color:#fff;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(0,0,0,.15);transition:transform .2s,box-shadow .2s;"
    );
    bubble.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/></svg>';
    bubble.onmouseenter = function () { bubble.style.transform = "scale(1.1)"; };
    bubble.onmouseleave = function () { bubble.style.transform = "scale(1)"; };
    bubble.onclick = togglePanel;

    // Panel
    panel = document.createElement("div");
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", "Support chat");
    panel.setAttribute("aria-modal", "true");
    panel.setAttribute(
      "style",
      "display:none;position:absolute;" + pos + ":0;bottom:" + (size + 12) + "px;width:380px;max-height:520px;background:#fff;border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,.15);overflow:hidden;flex-direction:column;"
    );

    renderPanel(cfg);

    root.appendChild(panel);
    root.appendChild(bubble);
    document.body.appendChild(root);
  }

  function renderPanel(cfg) {
    var headerBg = cfg.primaryColor;
    var footerHtml = "";

    if (state.sessionStatus === "agent_closed" || state.sessionStatus === "ticket_created") {
      footerHtml =
        '<div style="padding:12px 16px;border-top:1px solid #e5e7eb;text-align:center;">' +
        '<button id="mob-chat-reset" style="background:' + headerBg + ';color:#fff;border:none;border-radius:8px;padding:8px 16px;cursor:pointer;font-size:14px;">Start new conversation</button></div>';
    } else if (state.sessionStatus === "pending_agent") {
      footerHtml =
        '<div style="padding:12px 16px;border-top:1px solid #e5e7eb;text-align:center;color:#9ca3af;font-size:13px;display:flex;align-items:center;justify-content:center;gap:6px;">' +
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation:mob-spin 1s linear infinite;"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>' +
        'Waiting for an agent...</div>';
    } else {
      var talkBtn = "";
      if (state.agentsOnline && state.sessionStatus === "ai_only" && state.sessionId && state.messages.length > 0) {
        talkBtn =
          '<div style="text-align:center;padding:8px 16px 0;">' +
          '<button id="mob-talk-person" style="background:none;border:1px solid #e5e7eb;border-radius:20px;padding:4px 12px;font-size:12px;color:#9ca3af;cursor:pointer;">Talk to a person</button></div>';
      }
      footerHtml = talkBtn +
        '<div style="padding:12px 16px;border-top:' + (talkBtn ? "none" : "1px solid #e5e7eb") + ';display:flex;gap:8px;">' +
        '<input id="mob-chat-input" type="text" placeholder="Type your message..." aria-label="Type your message" ' +
        'style="flex:1;padding:8px 12px;border:1px solid #d1d5db;border-radius:8px;outline:none;font-size:14px;" />' +
        '<button id="mob-chat-send" aria-label="Send message" style="background:' + headerBg + ';color:#fff;border:none;border-radius:8px;padding:8px 12px;cursor:pointer;">' +
        '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m22 2-7 20-4-9-9-4z"/><path d="m22 2-10 10"/></svg></button></div>';
    }

    panel.innerHTML =
      '<div style="background:' + headerBg + ';color:#fff;padding:16px 20px;display:flex;align-items:center;justify-content:space-between;">' +
      '<div><div style="font-weight:600;font-size:15px;">' + esc(cfg.agentName || "Brain") + '</div>' +
      '<div style="font-size:12px;opacity:.85;">' + esc(cfg.agentRole || "Support") + '</div></div>' +
      '<button aria-label="Close support chat" style="background:none;border:none;color:#fff;cursor:pointer;padding:4px;" onclick="document.getElementById(\'mob-support-widget\')._toggle()">' +
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg></button></div>' +
      '<div id="mob-chat-body" style="flex:1;overflow-y:auto;padding:16px;max-height:360px;min-height:200px;"></div>' +
      footerHtml;

    root._toggle = togglePanel;

    var input = document.getElementById("mob-chat-input");
    var sendBtn = document.getElementById("mob-chat-send");
    var talkPersonBtn = document.getElementById("mob-talk-person");
    var resetBtn = document.getElementById("mob-chat-reset");

    if (input) {
      input.addEventListener("keydown", function (e) {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          submitMessage();
        }
      });
    }
    if (sendBtn) {
      sendBtn.addEventListener("click", submitMessage);
    }
    if (talkPersonBtn) {
      talkPersonBtn.addEventListener("click", requestHumanAgent);
    }
    if (resetBtn) {
      resetBtn.addEventListener("click", resetSession);
    }

    renderMessages();
  }

  function submitMessage() {
    var input = document.getElementById("mob-chat-input");
    if (!input) return;
    var msg = input.value.trim();
    if (!msg || state.isLoading) return;
    input.value = "";
    state.messages.push({ role: "user", content: msg });
    renderMessages();
    sendMessage(msg);
  }

  function renderMessages() {
    var body = document.getElementById("mob-chat-body");
    if (!body) {
      // Panel not rendered yet, do a full re-render
      if (state.config && panel) renderPanel(state.config);
      return;
    }
    var cfg = state.config;

    var html = "";

    if (state.messages.length === 0 && cfg) {
      html += '<div style="text-align:center;padding:20px 0;">';
      html += '<div style="width:48px;height:48px;border-radius:50%;background:' + cfg.primaryColor + ';color:#fff;display:inline-flex;align-items:center;justify-content:center;margin-bottom:12px;">';
      html += '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/></svg></div>';
      html += '<p style="font-size:14px;color:#6b7280;margin:0 0 16px;">' + esc(cfg.welcomeMessage || "How can I help?") + "</p>";
      if (cfg.starterButtons && cfg.starterButtons.length) {
        html += '<div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;">';
        cfg.starterButtons.forEach(function (btn, i) {
          html +=
            '<button data-starter="' + i + '" style="background:#f3f4f6;border:1px solid #e5e7eb;border-radius:20px;padding:6px 14px;font-size:13px;cursor:pointer;transition:background .15s;">' +
            esc(btn.label) + "</button>";
        });
        html += "</div>";
      }
      html += "</div>";
    }

    state.messages.forEach(function (m) {
      if (m.role === "system") {
        html +=
          '<div style="display:flex;justify-content:center;margin-bottom:8px;">' +
          '<p style="font-size:12px;font-style:italic;color:#9ca3af;text-align:center;padding:4px 16px;">' +
          esc(m.content) + "</p></div>";
      } else if (m.role === "user") {
        html +=
          '<div style="display:flex;justify-content:flex-end;margin-bottom:8px;">' +
          '<div style="background:' + (cfg ? cfg.primaryColor : "#6366f1") + ';color:#fff;border-radius:16px 16px 4px 16px;padding:8px 14px;max-width:85%;font-size:14px;word-wrap:break-word;">' +
          esc(m.content) + "</div></div>";
      } else {
        var label = m.role === "agent" ? '<p style="font-size:11px;font-weight:600;margin:0 0 2px;opacity:.7;">Agent</p>' : "";
        html +=
          '<div style="display:flex;justify-content:flex-start;margin-bottom:8px;">' +
          '<div style="background:#f3f4f6;color:#1f2937;border-radius:16px 16px 16px 4px;padding:8px 14px;max-width:85%;font-size:14px;word-wrap:break-word;">' +
          label + simpleMarkdown(m.content) + "</div></div>";
      }
    });

    if (state.isLoading) {
      html +=
        '<div style="display:flex;justify-content:flex-start;margin-bottom:8px;">' +
        '<div style="background:#f3f4f6;border-radius:16px;padding:12px 18px;display:flex;gap:4px;">' +
        '<span style="width:8px;height:8px;border-radius:50%;background:#9ca3af;animation:mob-bounce 1.4s infinite both;animation-delay:0s;"></span>' +
        '<span style="width:8px;height:8px;border-radius:50%;background:#9ca3af;animation:mob-bounce 1.4s infinite both;animation-delay:.2s;"></span>' +
        '<span style="width:8px;height:8px;border-radius:50%;background:#9ca3af;animation:mob-bounce 1.4s infinite both;animation-delay:.4s;"></span>' +
        "</div></div>";
    }

    body.innerHTML = html;
    body.scrollTop = body.scrollHeight;

    // Attach starter button handlers
    var starters = body.querySelectorAll("[data-starter]");
    starters.forEach(function (el) {
      el.addEventListener("click", function () {
        var idx = parseInt(el.getAttribute("data-starter"), 10);
        if (cfg && cfg.starterButtons && cfg.starterButtons[idx]) {
          var msg = cfg.starterButtons[idx].message;
          state.messages.push({ role: "user", content: msg });
          renderMessages();
          sendMessage(msg);
        }
      });
    });
  }

  function simpleMarkdown(text) {
    if (!text) return "";
    return text
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/`(.+?)`/g, '<code style="background:#e5e7eb;padding:1px 4px;border-radius:3px;font-size:13px;">$1</code>')
      .replace(/^[-*]\s+(.+)$/gm, '<li style="margin-left:16px;">$1</li>')
      .replace(/\n/g, "<br>");
  }

  function togglePanel() {
    state.isOpen = !state.isOpen;
    if (panel) {
      panel.style.display = state.isOpen ? "flex" : "none";
    }
    if (bubble) {
      bubble.setAttribute(
        "aria-label",
        state.isOpen ? "Close support chat" : "Open support chat"
      );
    }
    if (state.isOpen) {
      var input = document.getElementById("mob-chat-input");
      if (input) input.focus();
    }
  }

  // Inject animations
  var style = document.createElement("style");
  style.textContent = "@keyframes mob-bounce{0%,80%,100%{transform:scale(0)}40%{transform:scale(1)}}@keyframes mob-spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}";
  document.head.appendChild(style);

  // Keyboard handler
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && state.isOpen) {
      togglePanel();
      if (bubble) bubble.focus();
    }
  });

  // Init
  try {
    state.sessionId = sessionStorage.getItem(SESSION_KEY);
  } catch (e) {}

  fetchConfig().then(function (cfg) {
    if (cfg) {
      createWidget(cfg);
      // Check agent availability on mount and every 60s
      checkAgentsOnline();
      state.agentCheckTimer = setInterval(checkAgentsOnline, 60000);
    }
  }).catch(function (err) {
    console.warn("[MyOpenBrain Support Widget] Failed to load config:", err);
  });
})();
