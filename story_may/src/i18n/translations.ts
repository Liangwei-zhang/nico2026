export const translations = {
  'zh-CN': {
    // Meta
    siteTitle: 'Story.may.cool - AI语音动画',
    siteDescription: '上传你的配音，AI自动生成动画视频。讲好你的故事。',
    
    // Navigation
    nav: {
      home: '首页',
      howItWorks: '如何使用',
      showcase: '案例展示',
      features: '功能特点',
      contact: '联系我们',
    },
    
    // Hero
    hero: {
      title: '讲好你的故事',
      subtitle: 'AI赋能动画创作',
      description: '只需上传一段配音，AI将自动为你生成精美的动画视频。让每一个声音都成为一段精彩的视觉故事。',
      cta: '开始创作',
      watchDemo: '观看演示',
    },
    
    // How it works
    howItWorks: {
      title: '三步开启魔法',
      subtitle: '简单、快速、神奇',
      step1: {
        title: '录制配音',
        description: '用你的声音讲述故事，录制或上传音频文件',
      },
      step2: {
        title: 'AI 处理',
        description: '智能AI分析你的声音，理解情感与节奏',
      },
      step3: {
        title: '动画生成',
        description: '自动生成与配音完美同步的精美动画',
      },
    },
    
    // Showcase
    showcase: {
      title: '精彩案例',
      subtitle: '看看其他创作者的作品',
      playVideo: '播放视频',
    },
    
    // Features
    features: {
      title: '为什么选择我们',
      subtitle: '强大的AI技术，让创作更简单',
      items: [
        {
          title: 'AI驱动',
          description: '最先进的人工智能技术，理解你的每一个声音细节',
        },
        {
          title: '多语言支持',
          description: '支持中文、英文等多种语言的配音识别',
        },
        {
          title: '快速生成',
          description: '几分钟内完成动画创作，节省大量时间',
        },
        {
          title: '高质量输出',
          description: '专业级动画质量，可用于各类场景',
        },
      ],
    },
    
    // CTA
    cta: {
      title: '准备好开始了吗？',
      subtitle: '让我们一起将你的声音变成动人的故事',
      button: '联系我们',
      email: '发送邮件',
    },
    
    // Footer
    footer: {
      copyright: '© 2026 Story.may.cool. 保留所有权利。',
      tagline: '用声音讲述故事，用AI创造奇迹',
    },
  },
  
  'en': {
    // Meta
    siteTitle: 'Story.may.cool - AI Voice Animation',
    siteDescription: 'Upload your voice recording, AI automatically generates animated videos. Tell your story.',
    
    // Navigation
    nav: {
      home: 'Home',
      howItWorks: 'How It Works',
      showcase: 'Showcase',
      features: 'Features',
      contact: 'Contact',
    },
    
    // Hero
    hero: {
      title: 'Tell Your Story',
      subtitle: 'AI-Powered Animation',
      description: 'Simply upload a voice recording, and AI will automatically generate beautiful animated videos. Turn every voice into a captivating visual story.',
      cta: 'Start Creating',
      watchDemo: 'Watch Demo',
    },
    
    // How it works
    howItWorks: {
      title: 'Three Steps to Magic',
      subtitle: 'Simple, Fast, Magical',
      step1: {
        title: 'Record Voice',
        description: 'Tell your story with your voice, record or upload audio',
      },
      step2: {
        title: 'AI Processing',
        description: 'Smart AI analyzes your voice, understanding emotion and rhythm',
      },
      step3: {
        title: 'Animation Generated',
        description: 'Automatically create beautiful animations synced with your voice',
      },
    },
    
    // Showcase
    showcase: {
      title: 'Featured Work',
      subtitle: 'See what other creators have made',
      playVideo: 'Play Video',
    },
    
    // Features
    features: {
      title: 'Why Choose Us',
      subtitle: 'Powerful AI technology makes creation simple',
      items: [
        {
          title: 'AI-Powered',
          description: 'Cutting-edge artificial intelligence that understands every nuance of your voice',
        },
        {
          title: 'Multilingual',
          description: 'Support for Chinese, English, and many other languages',
        },
        {
          title: 'Fast Generation',
          description: 'Create animations in minutes, saving valuable time',
        },
        {
          title: 'High Quality',
          description: 'Professional-grade animation quality for any use case',
        },
      ],
    },
    
    // CTA
    cta: {
      title: 'Ready to Begin?',
      subtitle: "Let's transform your voice into a compelling story together",
      button: 'Contact Us',
      email: 'Send Email',
    },
    
    // Footer
    footer: {
      copyright: '© 2026 Story.may.cool. All rights reserved.',
      tagline: 'Tell stories with voice, create magic with AI',
    },
  },
} as const;

export type Locale = keyof typeof translations;
export type TranslationKeys = typeof translations['zh-CN'];
