const keyInput = document.getElementById("key");
const labelInput = document.getElementById("label");
const baseInput = document.getElementById("base");
const modelInput = document.getElementById("model");
const maxTokensInput = document.getElementById("maxTokens");
const personaListEl = document.getElementById("personaList");
const addBtn = document.getElementById("addPersona");
const resetBtn = document.getElementById("resetDefault");
const saveBtn = document.getElementById("save");
const langSelect = document.getElementById("langSelect");
const statusEl = document.getElementById("footerMsg");

let autoSaveTimer = null;
let personaState = [];

const translations = {
  zh: {
    header_sub: "智能回帖系统界面",
    nav_api: "01. 接口配置",
    nav_persona: "02. 人格管理",
    nav_ui: "03. 界面设置",
    nav_adv: "04. 高级选项",
    nav_about: "05. 关于",
    api_title: "> API 连接设置",
    api_key: "API 密钥 [必填]",
    api_base: "基础 URL [可选]",
    api_model: "目标模型",
    api_tokens: "最大生成长度",
    persona_title: "> 人格数据库",
    persona_add: "初始化新单元",
    ui_title: "> 视觉输出配置",
    ui_label: "触发按钮文案 (最多4字)",
    ui_lang: "系统语言",
    ui_lang_hint: "系统语言探测: 自动",
    adv_title: "> 系统诊断",
    adv_danger: "危险区域",
    adv_reset: "出厂重置",
    btn_save: "执行保存",
    profile_role: "量化交易产品负责人 | 系统架构师",
    bio_1: "量化交易产品负责人，系统架构师，自动化工具开发者。",
    bio_2: "目前常驻上海，偏好可复现的环境与低摩擦的操作系统。",
    bio_3: "喜欢把复杂问题拆成模块，喜欢把冷幽默写进 prompt。",
    bio_4: "偶尔写点双语内容，偶尔也发点站长体。",
    bio_5: "不求热度，只求干净。",
    ad_title: "大模型源头网关",
    ad_feat: "高稳定 // 低成本 // 真源头",
    ad_desc: "面向企业与创作者的轻量级 AI 接入方案。",
    ad_btn: "立即接入",
    lang_auto: "自动识别",
    msg_awaiting: "等待输入...",
    msg_saving: "正在保存...",
    msg_saved: "配置已更新",
    msg_error: "错误: ",
    persona_unit: "单元",
    persona_name: "代号",
    persona_prompt: "模式数据",
    persona_purge: "清除"
  },
  en: {
    header_sub: "AI REPLY SYSTEM INTERFACE",
    nav_api: "01. API CONFIG",
    nav_persona: "02. PERSONA MGMT",
    nav_ui: "03. UI SYSTEMS",
    nav_adv: "04. ADVANCED",
    nav_about: "05. ABOUT",
    api_title: "> API CONNECTION SETUP",
    api_key: "API KEY [REQUIRED]",
    api_base: "BASE URL [OPTIONAL]",
    api_model: "TARGET MODEL",
    api_tokens: "MAX TOKENS",
    persona_title: "> PERSONA DATABASE",
    persona_add: "INITIALIZE NEW UNIT",
    ui_title: "> VISUAL OUTPUT CONFIG",
    ui_label: "TRIGGER BUTTON LABEL (MAX 4 CHARS)",
    ui_lang: "SYSTEM LANGUAGE",
    ui_lang_hint: "SYSTEM LANGUAGE: AUTO",
    adv_title: "> SYSTEM DIAGNOSTICS",
    adv_danger: "DANGER ZONE",
    adv_reset: "FACTORY RESET",
    btn_save: "EXECUTE SAVE",
    profile_role: "QUANT TRADING LEAD | SYSTEM ARCHITECT",
    bio_1: "Quant trading product lead, system architect, automation tool developer.",
    bio_2: "Based in Shanghai, prefers reproducible environments & low-friction OS.",
    bio_3: "Likes modularizing complex problems, writing dry humor into prompts.",
    bio_4: "Occasionally writes bilingual content, sometimes in webmaster style.",
    bio_5: "Not for hype, just for cleanliness.",
    ad_title: "AI API GATEWAY",
    ad_feat: "Stable // Low Cost // Pure Source",
    ad_desc: "Lightweight AI access for enterprises and creators.",
    ad_btn: "GET ACCESS",
    lang_auto: "AUTO DETECT",
    msg_awaiting: "AWAITING INPUT...",
    msg_saving: "SAVING...",
    msg_saved: "CONFIGURATION UPDATED",
    msg_error: "ERROR: ",
    persona_unit: "UNIT",
    persona_name: "DESIGNATION",
    persona_prompt: "PATTERN DATA",
    persona_purge: "PURGE"
  },
  ja: {
    header_sub: "AIリプライシステムインターフェース",
    nav_api: "01. API設定",
    nav_persona: "02. 人格管理",
    nav_ui: "03. UI設定",
    nav_adv: "04. 高等設定",
    nav_about: "05. 情報",
    api_title: "> API接続設定",
    api_key: "APIキー [必須]",
    api_base: "ベースURL [任意]",
    api_model: "ターゲットモデル",
    api_tokens: "最大トークン数",
    persona_title: "> 人格データベース",
    persona_add: "新規ユニット初期化",
    ui_title: "> 視覚出力設定",
    ui_label: "トリガーボタンラベル (最大4文字)",
    ui_lang: "システム言語",
    ui_lang_hint: "システム言語: 自動",
    adv_title: "> システム診断",
    adv_danger: "危険地帯",
    adv_reset: "工場出荷时リセット",
    btn_save: "保存実行",
    profile_role: "クオンツ製品責任者 | システムアーキテクト",
    bio_1: "クオンツ製品責任者、システムアーキテクト、自動化ツール開発者。",
    bio_2: "上海在住。再現可能な環境と低摩擦なOSを好む。",
    bio_3: "複雑な問題をモジュール化し、プロンプトにドライなユーモアを込めるのが好き。",
    bio_4: "時々バイリンガルコンテンツを書き、時にはウェブマスター体で投稿する。",
    bio_5: "人気は求めない、ただ清潔さを求める。",
    ad_title: "AI API ゲートウェイ",
    ad_feat: "高安定 // 低コスト // 真のソース",
    ad_desc: "企業やクリエイター向けの軽量AIアクセスソリューション。",
    ad_btn: "今すぐアクセス",
    lang_auto: "自動認識",
    msg_awaiting: "入力を待っています...",
    msg_saving: "保存中...",
    msg_saved: "設定が更新されました",
    msg_error: "エラー: ",
    persona_unit: "ユニット",
    persona_name: "呼称",
    persona_prompt: "パターンデータ",
    persona_purge: "消去"
  },
  ko: {
    header_sub: "AI 답장 시스템 인터페이스",
    nav_api: "01. API 설정",
    nav_persona: "02. 페르소나 관리",
    nav_ui: "03. UI 설정",
    nav_adv: "04. 고급 설정",
    nav_about: "05. 정보",
    api_title: "> API 연결 설정",
    api_key: "API 키 [필수]",
    api_base: "기본 URL [선택]",
    api_model: "대상 모델",
    api_tokens: "최대 토큰",
    persona_title: "> 페르소나 데이터베이스",
    persona_add: "새 유닛 초기화",
    ui_title: "> 시각 출력 설정",
    ui_label: "트리거 버튼 라벨 (최대 4자)",
    ui_lang: "시스템 언어",
    ui_lang_hint: "시스템 언어 감지: 자동",
    adv_title: "> 시스템 진단",
    adv_danger: "위험 구역",
    adv_reset: "공장 초기화",
    btn_save: "저장 실행",
    profile_role: "퀀트 트레이딩 제품 책임자 | 시스템 아키텍트",
    bio_1: "퀀트 트레이딩 제품 책임자, 시스템 아키텍트, 자동화 툴 개발자.",
    bio_2: "상하이 거주. 재현 가능한 환경과 저마찰 OS 선호.",
    bio_3: "복잡한 문제를 모듈화하고, 프롬프트에 드라이한 유머를 담는 것을 좋아함.",
    bio_4: "가끔 이국어 콘텐츠를 작성하고, 때로는 웹마스터 스타일로 게시함.",
    bio_5: "인기를 원하지 않음, 오직 깨끗함을 원함.",
    ad_title: "AI API 게이트웨이",
    ad_feat: "고안정 // 저비용 // 진짜 소스",
    ad_desc: "기업 및 크리에이터를 위한 경량 AI 액세스 솔루션.",
    ad_btn: "지금 접속",
    lang_auto: "자동 인식",
    msg_awaiting: "입력 대기 중...",
    msg_saving: "저장 중...",
    msg_saved: "설정이 업데이트되었습니다",
    msg_error: "오류: ",
    persona_unit: "유닛",
    persona_name: "명칭",
    persona_prompt: "패턴 데이터",
    persona_purge: "삭제"
  }
};

function getDetectedLang() {
  const browserLang = navigator.language.split('-')[0];
  return translations[browserLang] ? browserLang : 'en';
}

function applyTranslations(lang) {
  const activeLang = lang === 'auto' ? getDetectedLang() : lang;
  const dict = translations[activeLang] || translations.en;
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (dict[key]) el.textContent = dict[key];
  });
  renderPersonas();
}

function defaultPersonas() {
  return [
    { name: "SHINJI", prompt: "As Shinji Ikari: somewhat reserved, introspective, cautious but responds with honesty." },
    { name: "ASUKA", prompt: "Asuka Langley Soryu: confident, competitive, direct, occasionally tsundere, German-Japanese cultural background." },
    { name: "REI", prompt: "Rei Ayanami: detached, analytical, speaks concisely, shows minimal emotion, philosophical." },
    { name: "MISATO", prompt: "Misato Katsuragi: casual, caring, military commander style, uses informal language with authority." }
  ];
}

function personasToArray(personas) {
  if (Array.isArray(personas)) return personas;
  return Object.entries(personas || {}).map(([name, prompt]) => ({ name, prompt }));
}

function personasToMap(arr) {
  const out = {};
  arr.forEach((p) => { if (p.name && p.prompt) out[p.name] = p.prompt; });
  return out;
}

function updateStatus(messageKey, type = "info") {
  const lang = langSelect.value;
  const activeLang = lang === 'auto' ? getDetectedLang() : lang;
  const message = (translations[activeLang] && translations[activeLang][messageKey]) || messageKey;
  statusEl.textContent = message;
  statusEl.style.color = type === "error" ? "var(--nerv-red)" : (type === "success" ? "var(--nerv-green)" : "var(--nerv-orange)");
  if (type === "success" || type === "error") {
    setTimeout(() => {
      const currentDict = translations[langSelect.value === 'auto' ? getDetectedLang() : langSelect.value];
      statusEl.textContent = currentDict.msg_awaiting;
      statusEl.style.color = "var(--nerv-red)";
    }, 2000);
  }
}

function renderPersonas() {
  const lang = langSelect.value;
  const dict = translations[lang === 'auto' ? getDetectedLang() : lang] || translations.en;
  personaListEl.innerHTML = "";
  personaState.forEach((p, idx) => {
    const card = document.createElement("div");
    card.className = "persona-card";
    card.style.display = "flex";
    card.style.flexDirection = "column";
    card.innerHTML = `
      <div style="display:flex; justify-content:space-between; margin-bottom:10px; border-bottom:1px dashed var(--nerv-gray); padding-bottom:5px;">
        <div style="color:var(--nerv-cyan); font-weight:bold;">${dict.persona_unit}-${(idx + 1).toString().padStart(2, "0")}</div>
        <div style="color:var(--nerv-gray); font-size:0.7rem; font-family:'Orbitron'">${p.name}</div>
      </div>
      <div class="form-group" style="margin-bottom:10px;">
        <label style="font-size:0.7rem;">${dict.persona_name}</label>
        <input data-idx="${idx}" data-field="name" value="${p.name}" style="padding:6px; font-size:0.9rem;" />
      </div>
      <div class="form-group" style="margin-bottom:15px; flex-grow:1;">
        <label style="font-size:0.7rem;">${dict.persona_prompt}</label>
        <textarea data-idx="${idx}" data-field="prompt" style="padding:6px; font-size:0.85rem; min-height:80px; resize:none;">${p.prompt}</textarea>
      </div>
      <div style="display:flex; gap:8px; justify-content:space-between; margin-top:auto;">
        <div style="display:flex; gap:4px;">
            <button class="btn" data-action="up" data-idx="${idx}" style="padding:4px 8px; font-size:0.8rem;">▲</button>
            <button class="btn" data-action="down" data-idx="${idx}" style="padding:4px 8px; font-size:0.8rem;">▼</button>
        </div>
        <button class="btn danger" data-action="delete" data-idx="${idx}" style="padding:4px 12px; font-size:0.8rem;">${dict.persona_purge}</button>
      </div>
    `;
    personaListEl.appendChild(card);
  });
}

function loadState() {
  chrome.storage.sync.get(
    ["apiKey", "personas", "btnLabel", "baseUrl", "model", "maxTokens", "lang"],
    (res) => {
      langSelect.value = res.lang || "auto";
      keyInput.value = res.apiKey || "";
      labelInput.value = res.btnLabel || "智答";
      baseInput.value = res.baseUrl || "";
      modelInput.value = res.model || "";
      maxTokensInput.value = res.maxTokens || 400;
      personaState = personasToArray(res.personas) || defaultPersonas();
      applyTranslations(langSelect.value);
    }
  );
}

function saveState() {
  const filtered = personaState.filter(p => p.name.trim() && p.prompt.trim());
  chrome.storage.sync.set({
    lang: langSelect.value,
    apiKey: keyInput.value.trim(),
    btnLabel: labelInput.value.trim().slice(0, 4),
    baseUrl: baseInput.value.trim(),
    model: modelInput.value.trim(),
    maxTokens: Number(maxTokensInput.value) || 400,
    personas: personasToMap(filtered.length ? filtered : defaultPersonas())
  }, () => updateStatus("msg_saved", "success"));
}

langSelect.onchange = () => {
  applyTranslations(langSelect.value);
  saveState();
};

addBtn.onclick = () => {
  personaState.push({ name: "NEW UNIT", prompt: "..." });
  renderPersonas();
};

resetBtn.onclick = () => {
  if (confirm("FACTORY RESET?")) {
    personaState = defaultPersonas();
    renderPersonas();
    saveState();
  }
};

saveBtn.onclick = saveState;

personaListEl.addEventListener("input", (e) => {
  const idx = Number(e.target.dataset.idx);
  const field = e.target.dataset.field;
  if (personaState[idx]) personaState[idx][field] = e.target.value;
});

personaListEl.addEventListener("click", (e) => {
  const action = e.target.dataset.action;
  if (!action) return;
  
  const idx = Number(e.target.dataset.idx);
  if (action === "delete") personaState.splice(idx, 1);
  if (action === "up" && idx > 0) [personaState[idx-1], personaState[idx]] = [personaState[idx], personaState[idx-1]];
  if (action === "down" && idx < personaState.length - 1) [personaState[idx+1], personaState[idx]] = [personaState[idx], personaState[idx+1]];
  renderPersonas();
});

loadState();
