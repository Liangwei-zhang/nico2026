// ========== 全局单例保护 ==========
if (window.__DASHEN_LOADED__) {
  throw new Error('DaShen already loaded');
}
window.__DASHEN_LOADED__ = true;

(function() {
'use strict';

// ========== 配置 ==========
const CONFIG = {
  BUTTON_ID: "dashen-ai-btn",
  OVERLAY_ID: "dashen-ai-overlay",
  CHECK_INTERVAL: 1000,
  BRAND_COLOR: "#f0903a"
};

// ========== 国际化 ==========
const i18n = {
  zh: { 
    title: "智能回复", 
    generating: "正在生成...", 
    done: "✓ 已完成",
    error: "生成失败"
  },
  en: { 
    title: "AI Reply", 
    generating: "Generating...", 
    done: "✓ Done",
    error: "Failed"
  },
  ja: { 
    title: "AI返信", 
    generating: "生成中...", 
    done: "✓ 完了",
    error: "失敗"
  },
  ko: { 
    title: "AI 답장", 
    generating: "생성 중...", 
    done: "✓ 완료",
    error: "실패"
  }
};

// ========== 全局状态 ==========
let currentLang = "zh";
let currentReplyText = "";
let settings = {};

// ========== 工具函数 ==========
function getLang() {
  const l = navigator.language.split('-')[0];
  return i18n[l] ? l : 'en';
}

function getTweetText(buttonElement) {
  const allArticles = document.querySelectorAll('article[data-testid="tweet"]');
  
  if (allArticles.length > 0) {
    const mainArticle = allArticles[0];
    const tweetText = mainArticle.querySelector('[data-testid="tweetText"]');
    if (tweetText) return tweetText.innerText;
  }
  
  const allTweets = document.querySelectorAll('[data-testid="tweetText"]');
  return allTweets.length ? allTweets[0].innerText : "";
}

function fillTwitterBox(text) {
  const box = document.querySelector('[role="textbox"][contenteditable="true"]');
  if (!box) return false;
  
  box.focus();
  document.execCommand("selectAll", false, null);
  document.execCommand("insertText", false, text);
  box.dispatchEvent(new Event('input', { bubbles: true }));
  return true;
}

// ========== 按钮管理器（使用 Shadow DOM 隔离） ==========
class ButtonManager {
  constructor() {
    this.injectedToolbars = new Set();
    this.containerClass = `dashen-btn-container`;
    this.isInjecting = false;
    this.lastUrl = window.location.href;
    this.observers = new Map();
  }
  
  getToolbarId(toolbar) {
    let current = toolbar;
    let path = [];
    for (let i = 0; i < 5 && current; i++) {
      const classes = Array.from(current.classList || []).sort().join(',');
      path.push(classes);
      current = current.parentElement;
    }
    return path.join('|');
  }
  
  cleanup() {
    const allButtons = document.querySelectorAll(`.${this.containerClass}`);
    allButtons.forEach(btn => {
      if (!btn.offsetParent && !btn.closest('body')) {
        btn.remove();
      }
    });
  }

  createButton(currentPersona, personas) {
    const container = document.createElement("div");
    container.className = this.containerClass;
    container.style.cssText = "display:inline-block;margin-right:10px;position:relative;";
    
    const shadow = container.attachShadow({ mode: "open" });
    
    const hasMultiplePersonas = personas && Object.keys(personas).length > 1;
    
    shadow.innerHTML = `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@600;800&family=Share+Tech+Mono&display=swap');
        
        * { box-sizing: border-box; margin: 0; padding: 0; }
        
        :host {
          --nerv-orange: #f0903a;
          --nerv-red: #e81900;
          --nerv-green: #58f2a5;
          --nerv-dark: #000020;
          --nerv-glass: rgba(240, 144, 58, 0.15);
        }

        .btn {
          background: rgba(0, 0, 0, 0.7);
          border: 1px solid var(--nerv-orange);
          color: var(--nerv-orange);
          padding: 6px 14px;
          font-family: 'Orbitron', sans-serif;
          font-weight: 800;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 1px;
          cursor: pointer;
          transition: all 0.2s;
          clip-path: polygon(
            10px 0, 100% 0, 
            100% calc(100% - 10px), calc(100% - 10px) 100%, 
            0 100%, 0 10px
          );
          position: relative;
          overflow: hidden;
          text-shadow: 0 0 5px rgba(240, 144, 58, 0.5);
          box-shadow: 0 0 10px rgba(0,0,0,0.5);
        }

        .btn::before {
          content: "";
          position: absolute;
          top: 0; left: -100%; width: 50%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(240, 144, 58, 0.4), transparent);
          transform: skewX(-25deg);
          transition: 0.5s;
        }

        .btn:hover {
          background: var(--nerv-orange);
          color: #000;
          box-shadow: 0 0 20px var(--nerv-orange);
          text-shadow: none;
        }

        .btn:hover::before {
          left: 150%;
        }

        .menu {
          position: absolute;
          bottom: calc(100% + 12px);
          left: 0;
          background: rgba(0, 18, 32, 0.95);
          border: 1px solid var(--nerv-orange);
          min-width: 160px;
          display: none;
          flex-direction: column;
          box-shadow: 0 0 20px rgba(240, 144, 58, 0.2);
          z-index: 10000;
          clip-path: polygon(
            0 0, 100% 0, 
            100% calc(100% - 15px), calc(100% - 15px) 100%, 
            0 100%
          );
          backdrop-filter: blur(5px);
          padding-bottom: 5px;
        }

        .menu::after {
          content: "PERSONA SELECT";
          position: absolute;
          bottom: 2px; right: 5px;
          font-size: 8px;
          color: var(--nerv-orange);
          opacity: 0.5;
          font-family: 'Share Tech Mono', monospace;
        }

        .menu.visible { display: flex; animation: menuGlitch 0.2s cubic-bezier(0.1, 0.9, 0.2, 1); }

        @keyframes menuGlitch {
          0% { opacity: 0; transform: translateY(10px); clip-path: inset(50% 0 50% 0); }
          50% { opacity: 1; clip-path: inset(0 0 0 0); }
          100% { transform: translateY(0); }
        }

        .menu-item {
          padding: 10px 16px;
          color: var(--nerv-orange);
          font-family: 'Share Tech Mono', monospace;
          font-size: 12px;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.2s;
          border-left: 2px solid transparent;
          position: relative;
        }

        .menu-item:hover {
          background: var(--nerv-glass);
          color: #fff;
          border-left: 2px solid var(--nerv-orange);
          padding-left: 20px;
          text-shadow: 0 0 8px var(--nerv-orange);
        }

        .menu-item.active {
          background: var(--nerv-orange);
          color: #000;
          font-weight: bold;
        }
      </style>
      <button class="btn" id="main-btn">${currentPersona || "智答"}</button>
      ${hasMultiplePersonas ? '<div class="menu" id="menu"></div>' : ''}
    `;
    
    const mainBtn = shadow.getElementById("main-btn");
    const menu = shadow.getElementById("menu");
    
    let selectedPersona = currentPersona;
    
    if (hasMultiplePersonas && menu) {
      Object.keys(personas).forEach(personaName => {
        const item = document.createElement("div");
        item.className = "menu-item";
        item.textContent = personaName;
        
        if (personaName === currentPersona) {
          item.style.background = CONFIG.BRAND_COLOR;
          item.style.color = '#000';
        }
        
        item.addEventListener("click", (e) => {
          e.stopPropagation();
          e.preventDefault();
          
          selectedPersona = personaName;
          mainBtn.textContent = personaName;
          
          settings.currentPersona = personaName;
          chrome.storage.sync.set({ lastSelectedPersona: personaName });
          
          menu.querySelectorAll('.menu-item').forEach(mi => {
            mi.style.background = '';
            mi.style.color = CONFIG.BRAND_COLOR;
          });
          item.style.background = CONFIG.BRAND_COLOR;
          item.style.color = '#000';
          
          menu.classList.remove("visible");
        });
        menu.appendChild(item);
      });
      
      let hideTimer = null;
      
      mainBtn.addEventListener("mouseenter", () => {
        clearTimeout(hideTimer);
        menu.classList.add("visible");
      });
      
      menu.addEventListener("mouseenter", () => {
        clearTimeout(hideTimer);
      });
      
      const hideMenu = () => {
        hideTimer = setTimeout(() => {
          menu.classList.remove("visible");
        }, 200);
      };
      
      mainBtn.addEventListener("mouseleave", hideMenu);
      menu.addEventListener("mouseleave", hideMenu);
    }
    
    mainBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const personaPrompt = personas?.[selectedPersona] || "请生成一条友好的回复";
      this.handleClick(container, personaPrompt);
    });
    
    return container;
  }

  handleClick(buttonContainer, personaPrompt) {
    const tweetText = getTweetText(buttonContainer);
    if (!tweetText) {
      console.warn("[DaShen] 无法获取推文内容");
      return;
    }

    currentReplyText = "";
    overlayManager.show(tweetText);

    chrome.runtime.sendMessage({
      type: "GENERATE_REPLY_STREAM",
      prompt: personaPrompt,
      tweetText: tweetText
    });
  }

  inject() {
    if (this.isInjecting) return;
    this.isInjecting = true;
    
    try {
      if (window.location.pathname === '/home' || window.location.pathname === '/') {
        return;
      }
      
      if (this.lastUrl !== window.location.href) {
        this.lastUrl = window.location.href;
        this.injectedToolbars.clear();
        this.observers.forEach(obs => obs.disconnect());
        this.observers.clear();
        document.querySelectorAll(`.${this.containerClass}`).forEach(btn => btn.remove());
      }
      
      this.cleanup();
      
      const replyButtons = document.querySelectorAll('[data-testid="tweetButtonInline"]');
      
      const validToolbars = [];
      
      replyButtons.forEach((replyBtn, index) => {
        if (!replyBtn.offsetParent) return;
        
        const replyBtnContainer = replyBtn.parentElement;
        if (!replyBtnContainer?.className.includes('r-knv0ih')) return;
        
        const toolbar = replyBtnContainer?.parentElement;
        
        if (!toolbar) return;
        if (toolbar.querySelector(`.${this.containerClass}`)) return;
        
        validToolbars.push({ 
          toolbar, 
          replyBtn,
          replyBtnContainer,
          index,
          childCount: toolbar.children.length
        });
      });
      
      if (validToolbars.length === 0) return;
      
      const existingButtons = document.querySelectorAll(`.${this.containerClass}`);
      if (existingButtons.length > 0) return;
      
      const target = validToolbars[0];
      
      const currentPersona = settings.currentPersona || settings.btnLabel || "智答";
      const button = this.createButton(currentPersona, settings.personas);
      
      try {
        target.replyBtnContainer.insertBefore(button, target.replyBtn);
        
        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            mutation.removedNodes.forEach((node) => {
              if (node === button || (node.contains && node.contains(button))) {
                observer.disconnect();
                this.observers.delete(target.replyBtnContainer);
                
                setTimeout(() => {
                  const stillExists = document.contains(button);
                  if (!stillExists) {
                    const newReplyBtn = document.querySelector('[data-testid="tweetButtonInline"]');
                    if (newReplyBtn && newReplyBtn.offsetParent) {
                      const newContainer = newReplyBtn.parentElement;
                      if (newContainer && !newContainer.querySelector(`.${this.containerClass}`)) {
                        const currentPersona = settings.currentPersona || settings.btnLabel || "智答";
                        const newButton = this.createButton(currentPersona, settings.personas);
                        newContainer.insertBefore(newButton, newReplyBtn);
                      }
                    }
                  }
                }, 100);
              }
            });
          });
        });
        
        observer.observe(target.replyBtnContainer, { childList: true, subtree: true });
        this.observers.set(target.replyBtnContainer, observer);
        
      } catch (e) {
        console.error('[DaShen] 插入失败:', e);
      }
    } finally {
      this.isInjecting = false;
    }
  }
}

// ========== 浮窗管理器（使用 Shadow DOM 隔离） ==========
class OverlayManager {
  constructor() {
    this.container = null;
    this.shadow = null;
  }

  create() {
    if (this.container) return;

    // 创建容器并挂载到 documentElement（最顶层）
    this.container = document.createElement("div");
    this.container.id = CONFIG.OVERLAY_ID;
    this.container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 2147483647;
    `;

    // 创建 Shadow DOM 完全隔离样式
    this.shadow = this.container.attachShadow({ mode: "open" });

    const dict = i18n[currentLang];
    
    this.shadow.innerHTML = `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@600;800&family=Share+Tech+Mono&display=swap');

        :host {
          --nerv-orange: #f0903a;
          --nerv-red: #e81900;
          --nerv-green: #58f2a5;
          --nerv-dark: #000020;
          --nerv-hex: rgba(240, 144, 58, 0.1);
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }
        
        .overlay-backdrop {
          position: fixed;
          right: 20px;
          bottom: 20px;
          width: 450px;
          max-width: calc(100vw - 40px);
          background-color: #000;
          background-image: 
            linear-gradient(rgba(0, 18, 49, 0.9), rgba(0, 18, 49, 0.95)),
            repeating-linear-gradient(0deg, transparent, transparent 1px, #000 1px, #000 2px);
          border: 1px solid var(--nerv-orange);
          box-shadow: 0 0 30px rgba(240, 144, 58, 0.2), inset 0 0 50px rgba(0,0,0,0.8);
          display: none;
          flex-direction: column;
          pointer-events: auto;
          clip-path: polygon(
            0 0, 100% 0, 
            100% calc(100% - 20px), calc(100% - 20px) 100%, 
            20px 100%, 0 calc(100% - 20px)
          );
          font-family: 'Share Tech Mono', monospace;
        }
        
        .overlay-backdrop.visible { display: flex; animation: windowOpen 0.3s cubic-bezier(0.2, 0.8, 0.2, 1); }

        @keyframes windowOpen {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* 装饰性网格背景 */
        .overlay-backdrop::before {
          content: "";
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: 
            linear-gradient(90deg, rgba(240, 144, 58, 0.03) 1px, transparent 1px),
            linear-gradient(rgba(240, 144, 58, 0.03) 1px, transparent 1px);
          background-size: 20px 20px;
          pointer-events: none;
          z-index: 0;
        }
        
        .header {
          padding: 12px 18px;
          background: rgba(0, 0, 0, 0.6);
          border-bottom: 2px solid var(--nerv-red);
          display: flex;
          justify-content: space-between;
          align-items: center;
          position: relative;
          z-index: 2;
        }

        .header::after {
          content: "MAGI-01";
          position: absolute;
          right: 50px; top: 16px;
          font-size: 10px;
          color: var(--nerv-red);
          opacity: 0.7;
          letter-spacing: 2px;
          animation: blink 2s infinite;
        }
        
        .title {
          color: var(--nerv-red);
          font-family: 'Orbitron', sans-serif;
          font-weight: 800;
          font-size: 16px;
          text-transform: uppercase;
          letter-spacing: 3px;
          text-shadow: 0 0 10px var(--nerv-red);
          display: flex;
          align-items: center;
        }

        .title::before {
          content: "///";
          margin-right: 8px;
          color: var(--nerv-orange);
          font-size: 12px;
          letter-spacing: -2px;
        }
        
        .close-btn {
          background: transparent;
          border: 1px solid var(--nerv-orange);
          color: var(--nerv-orange);
          font-size: 16px;
          line-height: 1;
          cursor: pointer;
          width: 24px; height: 24px;
          display: flex; align-items: center; justify-content: center;
          font-family: 'Orbitron', sans-serif;
          transition: all 0.2s;
        }
        .close-btn:hover {
          background: var(--nerv-orange);
          color: #000;
          box-shadow: 0 0 10px var(--nerv-orange);
        }
        
        .tweet-content {
          padding: 15px 20px;
          font-size: 12px;
          color: #54a2d4;
          line-height: 1.5;
          border-bottom: 1px dashed rgba(240, 144, 58, 0.3);
          max-height: 100px;
          overflow-y: auto;
          position: relative;
          z-index: 2;
          background: rgba(0, 20, 40, 0.3);
        }

        .tweet-content::before {
          content: "TARGET_DATA_SOURCE";
          display: block;
          font-size: 9px;
          color: #54a2d4;
          opacity: 0.5;
          margin-bottom: 5px;
          letter-spacing: 1px;
        }
        
        .thinking-content {
          padding: 15px 20px;
          font-size: 12px;
          color: var(--nerv-green);
          line-height: 1.4;
          border-bottom: 1px solid rgba(88, 242, 165, 0.2);
          max-height: 150px;
          overflow-y: auto;
          white-space: pre-wrap;
          font-family: 'Share Tech Mono', monospace;
          position: relative;
          z-index: 2;
          display: none;
          background: rgba(0, 20, 0, 0.2);
        }
        
        .thinking-content.visible { display: block; }
        
        .thinking-label {
          color: var(--nerv-green);
          font-size: 10px;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 1px;
          display: flex;
          align-items: center;
        }

        .thinking-label::after {
          content: "";
          display: inline-block;
          width: 8px; height: 8px;
          background: var(--nerv-green);
          margin-left: 8px;
          animation: blink 0.5s infinite;
        }
        
        .stream-content {
          padding: 20px;
          font-size: 14px;
          color: var(--nerv-orange);
          line-height: 1.6;
          min-height: 120px;
          max-height: 300px;
          overflow-y: auto;
          white-space: pre-wrap;
          position: relative;
          z-index: 2;
          text-shadow: 0 0 2px rgba(240, 144, 58, 0.3);
        }

        .stream-content::before {
          content: "GENERATED_RESPONSE_OUTPUT";
          display: block;
          font-size: 9px;
          color: var(--nerv-orange);
          opacity: 0.5;
          margin-bottom: 10px;
          letter-spacing: 1px;
        }

        .error-content {
          padding: 20px;
          font-size: 13px;
          color: var(--nerv-red);
          background: rgba(232, 25, 0, 0.1);
          border-top: 1px solid var(--nerv-red);
        }

        /* 滚动条样式 */
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: rgba(0,0,0,0.3); }
        ::-webkit-scrollbar-thumb { background: var(--nerv-orange); }
        .thinking-content::-webkit-scrollbar-thumb { background: var(--nerv-green); }

        @keyframes blink { 50% { opacity: 0; } }
      </style>
      <div class="overlay-backdrop" id="backdrop">
        <div class="header">
          <span class="title">${dict.title}</span>
          <button class="close-btn" id="close-btn">×</button>
        </div>
        <div class="tweet-content" id="tweet-content"></div>
        <div class="thinking-content" id="thinking-content">
          <div class="thinking-label">NEURAL_PROCESS_SYNC...</div>
          <div id="thinking-text"></div>
        </div>
        <div class="stream-content" id="stream-content">${dict.generating}</div>
      </div>
    `;

    // 绑定关闭事件
    this.shadow.getElementById("close-btn").addEventListener("click", () => {
      this.hide();
    });

    document.documentElement.appendChild(this.container);
  }

  show(tweetText) {
    this.create();
    const backdrop = this.shadow.getElementById("backdrop");
    const dict = i18n[currentLang];
    
    this.shadow.getElementById("tweet-content").textContent = tweetText;
    this.shadow.getElementById("stream-content").textContent = dict.generating;
    this.shadow.getElementById("thinking-content").classList.remove("visible");
    this.shadow.getElementById("thinking-text").textContent = "";
    backdrop.classList.add("visible");
  }

  hide() {
    if (!this.shadow) return;
    const backdrop = this.shadow.getElementById("backdrop");
    backdrop.classList.remove("visible");
  }

  updateThinking(text) {
    if (!this.shadow) return;
    const thinkingEl = this.shadow.getElementById("thinking-content");
    const thinkingTextEl = this.shadow.getElementById("thinking-text");
    thinkingEl.classList.add("visible");
    thinkingTextEl.textContent = text;
  }

  updateStream(text, thinkingText) {
    if (!this.shadow) return;
    const streamEl = this.shadow.getElementById("stream-content");
    streamEl.textContent = text;
  }

  showComplete() {
    if (!this.shadow) return;
    const dict = i18n[currentLang];
    const streamEl = this.shadow.getElementById("stream-content");
    streamEl.textContent = currentReplyText + `\n\n${dict.done}`;
  }

  showError(errorMsg) {
    if (!this.shadow) return;
    const dict = i18n[currentLang];
    const streamEl = this.shadow.getElementById("stream-content");
    streamEl.innerHTML = `<span style="color: #e81900;">❌ ${dict.error}</span>\n\n${errorMsg || '未知错误'}`;
  }
}

// ========== 初始化 ==========
const buttonManager = new ButtonManager();
const overlayManager = new OverlayManager();

// 加载设置并启动注入循环
chrome.storage.sync.get(["personas", "currentPersona", "btnLabel", "lang", "lastSelectedPersona"], (result) => {
  settings = result;
  currentLang = (result.lang === "auto" || !result.lang) ? getLang() : result.lang;
  
  if (result.lastSelectedPersona && result.personas && result.personas[result.lastSelectedPersona]) {
    settings.currentPersona = result.lastSelectedPersona;
  }
  
  setInterval(() => {
    buttonManager.inject();
  }, CONFIG.CHECK_INTERVAL);
  
  buttonManager.inject();
});

// ========== 监听后台消息 ==========
let currentThinkingText = "";

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type !== "AI_REPLY_PROGRESS") return;

  if (msg.status === "thinking") {
    currentThinkingText += msg.delta;
    overlayManager.updateThinking(currentThinkingText);
  }

  if (msg.status === "stream") {
    if (currentReplyText === "") currentReplyText = "";
    currentReplyText += msg.delta;
    overlayManager.updateStream(currentReplyText, currentThinkingText);
  }

  if (msg.status === "done") {
    fillTwitterBox(currentReplyText);
    overlayManager.showComplete();
    currentThinkingText = "";
  }

  if (msg.status === "error") {
    overlayManager.showError(msg.error);
    currentThinkingText = "";
  }
});

})();
