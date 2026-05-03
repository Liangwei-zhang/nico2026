import type { SupportedLang, I18nStrings } from './types';

const translations: Record<SupportedLang, I18nStrings> = {
  zh: {
    title: '智能回复',
    generating: '正在生成...',
    done: '✓ 已完成',
    error: '生成失败',
    copied: '已复制到剪贴板',
    copyHint: '请在回复框按 Ctrl+V 粘贴',
    retry: '重试',
    openingReply: '正在打开回复框...',
    filling: '正在填充...',
  },
  en: {
    title: 'AI Reply',
    generating: 'Generating...',
    done: '✓ Done',
    error: 'Failed',
    copied: 'Copied to clipboard',
    copyHint: 'Press Ctrl+V to paste in reply box',
    retry: 'Retry',
    openingReply: 'Opening reply...',
    filling: 'Filling...',
  },
  ja: {
    title: 'AI返信',
    generating: '生成中...',
    done: '✓ 完了',
    error: '失敗',
    copied: 'クリップボードにコピーしました',
    copyHint: '返信欄でCtrl+Vを押して貼り付けてください',
    retry: 'リトライ',
    openingReply: '返信を開いています...',
    filling: '入力中...',
  },
  ko: {
    title: 'AI 답장',
    generating: '생성 중...',
    done: '✓ 완료',
    error: '실패',
    copied: '클립보드에 복사됨',
    copyHint: '답장란에서 Ctrl+V를 눌러 붙여넣기하세요',
    retry: '다시 시도',
    openingReply: '답장 열는 중...',
    filling: '입력 중...',
  },
};

export function detectLanguage(): SupportedLang {
  const browserLang = navigator.language.split('-')[0];
  return browserLang in translations ? (browserLang as SupportedLang) : 'en';
}

export function getStrings(lang: SupportedLang | 'auto'): I18nStrings {
  const effectiveLang = lang === 'auto' ? detectLanguage() : lang;
  return translations[effectiveLang] || translations.en;
}

export type OptionsI18nKey =
  | 'header_sub'
  | 'nav_api'
  | 'nav_persona'
  | 'nav_ui'
  | 'nav_adv'
  | 'nav_about'
  | 'api_title'
  | 'api_key'
  | 'api_base'
  | 'api_model'
  | 'api_tokens'
  | 'persona_title'
  | 'persona_add'
  | 'ui_title'
  | 'ui_label'
  | 'ui_lang'
  | 'ui_lang_hint'
  | 'adv_title'
  | 'adv_danger'
  | 'adv_reset'
  | 'btn_save'
  | 'profile_role'
  | 'bio_1'
  | 'bio_2'
  | 'bio_3'
  | 'bio_4'
  | 'bio_5'
  | 'ad_title'
  | 'ad_feat'
  | 'ad_desc'
  | 'ad_btn'
  | 'lang_auto'
  | 'msg_awaiting'
  | 'msg_saving'
  | 'msg_saved'
  | 'msg_error'
  | 'persona_unit'
  | 'persona_name'
  | 'persona_prompt'
  | 'persona_purge';

const optionsTranslations: Record<SupportedLang, Record<OptionsI18nKey, string>> = {
  zh: {
    header_sub: '智能回帖系统界面',
    nav_api: '01. 接口配置',
    nav_persona: '02. 人格管理',
    nav_ui: '03. 界面设置',
    nav_adv: '04. 高级选项',
    nav_about: '05. 关于',
    api_title: '> API 连接设置',
    api_key: 'API 密钥 [必填]',
    api_base: '基础 URL [可选]',
    api_model: '目标模型',
    api_tokens: '最大生成长度',
    persona_title: '> 人格数据库',
    persona_add: '初始化新单元',
    ui_title: '> 视觉输出配置',
    ui_label: '触发按钮文案 (最多6字)',
    ui_lang: '系统语言',
    ui_lang_hint: '系统语言探测: 自动',
    adv_title: '> 系统诊断',
    adv_danger: '危险区域',
    adv_reset: '出厂重置',
    btn_save: '执行保存',
    profile_role: '量化交易产品负责人 | 系统架构师',
    bio_1: '量化交易产品负责人，系统架构师，自动化工具开发者。',
    bio_2: '目前常驻上海，偏好可复现的环境与低摩擦的操作系统。',
    bio_3: '喜欢把复杂问题拆成模块，喜欢把冷幽默写进 prompt。',
    bio_4: '偶尔写点双语内容，偶尔也发点站长体。',
    bio_5: '不求热度，只求干净。',
    ad_title: '大模型源头网关',
    ad_feat: '高稳定 // 低成本 // 真源头',
    ad_desc: '面向企业与创作者的轻量级 AI 接入方案。',
    ad_btn: '立即接入',
    lang_auto: '自动识别',
    msg_awaiting: '等待输入...',
    msg_saving: '正在保存...',
    msg_saved: '配置已更新',
    msg_error: '错误: ',
    persona_unit: '单元',
    persona_name: '代号',
    persona_prompt: '模式数据',
    persona_purge: '清除',
  },
  en: {
    header_sub: 'AI REPLY SYSTEM INTERFACE',
    nav_api: '01. API CONFIG',
    nav_persona: '02. PERSONA MGMT',
    nav_ui: '03. UI SYSTEMS',
    nav_adv: '04. ADVANCED',
    nav_about: '05. ABOUT',
    api_title: '> API CONNECTION SETUP',
    api_key: 'API KEY [REQUIRED]',
    api_base: 'BASE URL [OPTIONAL]',
    api_model: 'TARGET MODEL',
    api_tokens: 'MAX TOKENS',
    persona_title: '> PERSONA DATABASE',
    persona_add: 'INITIALIZE NEW UNIT',
    ui_title: '> VISUAL OUTPUT CONFIG',
    ui_label: 'TRIGGER BUTTON LABEL (MAX 6 CHARS)',
    ui_lang: 'SYSTEM LANGUAGE',
    ui_lang_hint: 'SYSTEM LANGUAGE: AUTO',
    adv_title: '> SYSTEM DIAGNOSTICS',
    adv_danger: 'DANGER ZONE',
    adv_reset: 'FACTORY RESET',
    btn_save: 'EXECUTE SAVE',
    profile_role: 'QUANT TRADING LEAD | SYSTEM ARCHITECT',
    bio_1: 'Quant trading product lead, system architect, automation tool developer.',
    bio_2: 'Based in Shanghai, prefers reproducible environments & low-friction OS.',
    bio_3: 'Likes modularizing complex problems, writing dry humor into prompts.',
    bio_4: 'Occasionally writes bilingual content, sometimes in webmaster style.',
    bio_5: 'Not for hype, just for cleanliness.',
    ad_title: 'AI API GATEWAY',
    ad_feat: 'Stable // Low Cost // Pure Source',
    ad_desc: 'Lightweight AI access for enterprises and creators.',
    ad_btn: 'GET ACCESS',
    lang_auto: 'AUTO DETECT',
    msg_awaiting: 'AWAITING INPUT...',
    msg_saving: 'SAVING...',
    msg_saved: 'CONFIGURATION UPDATED',
    msg_error: 'ERROR: ',
    persona_unit: 'UNIT',
    persona_name: 'DESIGNATION',
    persona_prompt: 'PATTERN DATA',
    persona_purge: 'PURGE',
  },
  ja: {
    header_sub: 'AIリプライシステムインターフェース',
    nav_api: '01. API設定',
    nav_persona: '02. 人格管理',
    nav_ui: '03. UI設定',
    nav_adv: '04. 高等設定',
    nav_about: '05. 情報',
    api_title: '> API接続設定',
    api_key: 'APIキー [必須]',
    api_base: 'ベースURL [任意]',
    api_model: 'ターゲットモデル',
    api_tokens: '最大トークン数',
    persona_title: '> 人格データベース',
    persona_add: '新規ユニット初期化',
    ui_title: '> 視覚出力設定',
    ui_label: 'トリガーボタンラベル (最大6文字)',
    ui_lang: 'システム言語',
    ui_lang_hint: 'システム言語: 自動',
    adv_title: '> システム診断',
    adv_danger: '危険地帯',
    adv_reset: '工場出荷時リセット',
    btn_save: '保存実行',
    profile_role: 'クオンツ製品責任者 | システムアーキテクト',
    bio_1: 'クオンツ製品責任者、システムアーキテクト、自動化ツール開発者。',
    bio_2: '上海在住。再現可能な環境と低摩擦なOSを好む。',
    bio_3: '複雑な問題をモジュール化し、プロンプトにドライなユーモアを込めるのが好き。',
    bio_4: '時々バイリンガルコンテンツを書き、時にはウェブマスター体で投稿する。',
    bio_5: '人気は求めない、ただ清潔さを求める。',
    ad_title: 'AI API ゲートウェイ',
    ad_feat: '高安定 // 低コスト // 真のソース',
    ad_desc: '企業やクリエイター向けの軽量AIアクセスソリューション。',
    ad_btn: '今すぐアクセス',
    lang_auto: '自動認識',
    msg_awaiting: '入力を待っています...',
    msg_saving: '保存中...',
    msg_saved: '設定が更新されました',
    msg_error: 'エラー: ',
    persona_unit: 'ユニット',
    persona_name: '呼称',
    persona_prompt: 'パターンデータ',
    persona_purge: '消去',
  },
  ko: {
    header_sub: 'AI 답장 시스템 인터페이스',
    nav_api: '01. API 설정',
    nav_persona: '02. 페르소나 관리',
    nav_ui: '03. UI 설정',
    nav_adv: '04. 고급 설정',
    nav_about: '05. 정보',
    api_title: '> API 연결 설정',
    api_key: 'API 키 [필수]',
    api_base: '기본 URL [선택]',
    api_model: '대상 모델',
    api_tokens: '최대 토큰',
    persona_title: '> 페르소나 데이터베이스',
    persona_add: '새 유닛 초기화',
    ui_title: '> 시각 출력 설정',
    ui_label: '트리거 버튼 라벨 (최대 6자)',
    ui_lang: '시스템 언어',
    ui_lang_hint: '시스템 언어 감지: 자동',
    adv_title: '> 시스템 진단',
    adv_danger: '위험 구역',
    adv_reset: '공장 초기화',
    btn_save: '저장 실행',
    profile_role: '퀀트 트레이딩 제품 책임자 | 시스템 아키텍트',
    bio_1: '퀀트 트레이딩 제품 책임자, 시스템 아키텍트, 자동화 툴 개발자.',
    bio_2: '상하이 거주. 재현 가능한 환경과 저마찰 OS 선호.',
    bio_3: '복잡한 문제를 모듈화하고, 프롬프트에 드라이한 유머를 담는 것을 좋아함.',
    bio_4: '가끔 이국어 콘텐츠를 작성하고, 때로는 웹마스터 스타일로 게시함.',
    bio_5: '인기를 원하지 않음, 오직 깨끗함을 원함.',
    ad_title: 'AI API 게이트웨이',
    ad_feat: '고안정 // 저비용 // 진짜 소스',
    ad_desc: '기업 및 크리에이터를 위한 경량 AI 액세스 솔루션.',
    ad_btn: '지금 접속',
    lang_auto: '자동 인식',
    msg_awaiting: '입력 대기 중...',
    msg_saving: '저장 중...',
    msg_saved: '설정이 업데이트되었습니다',
    msg_error: '오류: ',
    persona_unit: '유닛',
    persona_name: '명칭',
    persona_prompt: '패턴 데이터',
    persona_purge: '삭제',
  },
};

export function getOptionsString(lang: SupportedLang | 'auto', key: OptionsI18nKey): string {
  const effectiveLang = lang === 'auto' ? detectLanguage() : lang;
  return optionsTranslations[effectiveLang]?.[key] || optionsTranslations.en[key] || key;
}

export function getOptionsStrings(lang: SupportedLang | 'auto'): Record<OptionsI18nKey, string> {
  const effectiveLang = lang === 'auto' ? detectLanguage() : lang;
  return optionsTranslations[effectiveLang] || optionsTranslations.en;
}
