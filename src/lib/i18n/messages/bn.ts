import type { en } from "./en";

/**
 * Bangla (বাংলা) messages.
 *
 * Typed `typeof en`, so this object must match the English dictionary
 * key-for-key. A missing key is a compile error rather than a silent English
 * leak in the middle of a Bangla screen.
 *
 * Voice: informal "তুমি" throughout — the app talks to one learner, the way a
 * study companion would, and consistency matters more than formality. Brand
 * names (BenkyoAI, providers, model ids, URLs) and numerals stay as-is.
 */
export const bn: typeof en = {
  common: {
    back: "পেছনে",
    continue: "এগিয়ে যাও",
    cancel: "বাতিল",
    close: "বন্ধ",
    optional: "ঐচ্ছিক",
    footerCopyright:
      "© {year} BenkyoAI — কপিরাইট আল মুহাইমিন, নিশাত তাসনিম মীম, ফারিহা তাসনিম আমির",
  },
  locale: {
    toggleLabel: "ভাষা",
  },
  shell: {
    nav: {
      today: "আজ",
      vault: "ভল্ট",
      settings: "সেটিংস",
    },
    keyStatus: {
      ariaConnected: "{provider}-এ AI কী কানেক্ট করা আছে। সেটিংসে সেটা সামলাও।",
      ariaNone: "কোনো AI কী কানেক্ট করা নেই। সেটিংসে একটা কানেক্ট করো।",
      noKey: "কী নেই",
    },
    keyGate: {
      heading: "একটা AI কী কানেক্ট করো",
      body: "কোনো কী কানেক্ট করা নেই, তাই কিছুই চলবে না। তোমার রোডম্যাপ, উপকরণ আর অগ্রগতি অক্ষত আছে — একটা কী কানেক্ট করো, ঠিক যেখানে ছিলে সেখান থেকেই শুরু করবে।",
    },
    gitHub: {
      aria: "GitHub-এ BenkyoAI দেখো",
    },
  },
  onboarding: {
    header: {
      noAccounts: "কোনো অ্যাকাউন্ট নেই · তোমার কী দিয়েই চলে",
    },
    hero: {
      headline: "পড়াশোনা, যা মনে রাখে তুমি যা ভুল করেছ।",
      fullStop: "।",
      // , যে মনে রাখে তুমি কি ভুল করেছিলে
      line1: "তোমার পার্সোনাল AI টিউটর",
      line2: "যে মনে রাখে",
      line3: "তুমি কি ভুল করেছিলে",
      lede: "তোমার এখনকার অবস্থান ঘিরে তৈরি রোডম্যাপ। প্রতিটি ধাপে অনুশীলন। পুরোনো ভুলগুলো চুপচুপে আবার ফিরে আসে, যতক্ষণ না সেগুলো আর ভুল থাকে।",
    },
    steps: {
      key: "কী কানেক্ট করো",
      topic: "তোমার বিষয়",
      level: "তোমার স্তর",
      purpose: "তোমার উদ্দেশ্য",
    },
    stepCounter: "ধাপ {index} / {total}",
    reconnect: {
      heading: "আবার একটা AI কী কানেক্ট করো",
      firstHeading: "প্রথমে একটা AI কী কানেক্ট করো",
      note: "তোমার কী সরিয়ে ফেলা হয়েছে। তোমার রোডম্যাপ, উপকরণ আর অগ্রগতি অক্ষত আছে — একটা কী কানেক্ট করো, সোজা সেগুলোতেই ফিরে যাবে।",
    },
    error: "রোডম্যাপটা ফিরে আসেনি। প্রথম ধাপে তোমার কী-টা দেখে আবার চেষ্টা করো।",
    building: {
      eyebrow: "তৈরি হচ্ছে",
      reading: "তুমি যা দিয়েছ, তা পড়ছে",
      placing: "তোমাকে মানচিত্রে বসাচ্ছে",
      ordering: "ধাপগুলো সাজাচ্ছে",
      pacing: "গতি ঠিক করছে",
    },
  },
  byok: {
    defaultHeading: "তোমার AI কী কানেক্ট করো",
    intro:
      "BenkyoAI-তে কোনো অ্যাকাউন্ট নেই, সাইন-আপও নেই। এটা চলে একটা API কী দিয়ে — লম্বা একটা স্ট্রিং, যা কোনো AI প্রোভাইডারের কাছ থেকে নেওয়া হয় আর এই অ্যাপকে তোমার হয়ে প্রশ্ন করার সুযোগ দেয়। একটা নিতে এক মিনিটের মতো লাগে, আর বেশিরভাগ প্রোভাইডার শুরুতে ফ্রি ব্যবহার দেয়।",
    facts: {
      device: {
        title: "এই ডিভাইসেই থাকে",
        body: "কীটা শুধু এই ব্রাউজারে সেভ হয়। BenkyoAI-এর এমন কোনো সার্ভার নেই যেখানে এটা রাখা হয়।",
      },
      usage: {
        title: "তোমার ব্যবহার, তোমার খরচ",
        body: "রিকোয়েস্টের বিল যায় তোমার প্রোভাইডার অ্যাকাউন্টে, তাদের রেটে। এখানে কোনো সাবস্ক্রিপশন নেই।",
      },
      revoke: {
        title: "যখন খুশি বাতিল করো",
        body: "প্রোভাইডারে কী-টা ডিলিট করলে সঙ্গে সঙ্গেই সব জায়গায় কাজ করা বন্ধ হয়ে যায়।",
      },
    },
    pickProvider: "একটা প্রোভাইডার বেছে নাও",
    providerAria: "AI প্রোভাইডার",
    openProvider: "{name} খোলো",
    connected: {
      title: "{name} কানেক্ট হয়েছে",
      body: "এই ব্রাউজারে সেভ হয়েছে। কী-টা আর দেখতে পাবে না — সেটিংসে যখন খুশি বদলে নাও।",
    },
    keyField: {
      paste: "তোমার কী পেস্ট করো",
      hint: "{prefix} দিয়ে শুরু হয়। কানেক্ট করার সঙ্গে সঙ্গেই যাচাই হবে।",
      show: "কী দেখাও",
      hide: "কী লুকাও",
    },
    model: {
      label: "মডেল",
      hint: "খালি রাখলে {model} ব্যবহার হবে।",
    },
    failure: "প্রোভাইডারে পৌঁছানো গেল না। তোমার কানেকশন দেখে আবার চেষ্টা করো।",
    notSaved: "কিছুই সেভ হয়নি। উপরের কী-টা ঠিক করে আবার চেষ্টা করো।",
    checking: "{name}-এর সঙ্গে যাচাই হচ্ছে…",
    submit: "কী কানেক্ট করো",
    continue: "এগিয়ে যাও",
  },
  providers: {
    google: {
      freeTierNote: "একটা ফ্রি টিয়ার আছে, যা সাধারণ পড়াশোনার জন্য যথেষ্ট।",
      steps: {
        signIn: "aistudio.google.com/apikey খুলে Google অ্যাকাউন্ট দিয়ে সাইন ইন করো।",
        create: "Create API key বেছে নাও, তারপর একটা প্রজেক্ট বাছো বা নতুন বানাও।",
        copy: "যে কী দেখাচ্ছে সেটা কপি করো — শুরু হয় AIza বা AQ দিয়ে।",
        paste: "নিচে পেস্ট করো। BenkyoAI সঙ্গে সঙ্গেই যাচাই করে নেবে।",
      },
    },
    openai: {
      freeTierNote: "পে-অ্যাজ-ইউ-গো। শুরু করার আগে অল্প ক্রেডিট যোগ করো।",
      steps: {
        signIn: "platform.openai.com/api-keys খুলে সাইন ইন করো।",
        create: "Create new secret key বেছে নিয়ে BenkyoAI-এর মতো একটা নাম দাও।",
        copy: "কীটা সঙ্গে সঙ্গে কপি করো — OpenAI এটা একবারই দেখায়।",
        paste: "নিচে পেস্ট করো। BenkyoAI সঙ্গে সঙ্গেই যাচাই করে নেবে।",
      },
    },
    anthropic: {
      freeTierNote: "পে-অ্যাজ-ইউ-গো। শুরু করার আগে অল্প ক্রেডিট যোগ করো।",
      steps: {
        signIn: "console.anthropic.com/settings/keys খুলে সাইন ইন করো।",
        create: "Create key বেছে নিয়ে BenkyoAI-এর মতো একটা নাম দাও।",
        copy: "যে কী দেখাচ্ছে সেটা কপি করো — শুরু হয় sk-ant- দিয়ে।",
        paste: "নিচে পেস্ট করো। BenkyoAI সঙ্গে সঙ্গেই যাচাই করে নেবে।",
      },
    },
    ollama: {
      credentialLabel: "Ollama-র ঠিকানা",
      freeTierNote:
        "ফ্রি, প্রাইভেট আর অফলাইন: মডেলটা তোমার নিজের কম্পিউটারেই চলে। কাজ করে যখন BenkyoAI-ও এই মেশিনেই চলে (npm run dev)।",
      steps: {
        signIn: "ollama.com/download থেকে Ollama ইনস্টল করে চালু করো।",
        create: "টার্মিনালে একটা মডেল নামাও, যেমন: ollama pull gemma3:4b",
        copy: "BenkyoAI লোকালি চালাও npm run dev দিয়ে — হোস্ট করা সাইট তোমার কম্পিউটারে পৌঁছাতে পারে না।",
        paste: "নিচে http://localhost:11434 পেস্ট করো। BenkyoAI দেখে নেয় মডেলটা ইনস্টল আছে কি না।",
      },
    },
  },
  material: {
    dropHint:
      "স্লাইড, PDF, নোটের ছবি, লেকচার রেকর্ডিং — এখানে আপলোড করো বা এক এক করে যোগ করো।",
    add: "উপকরণ যোগ করো",
    pasteNotes: "নোট পেস্ট করো",
    youtube: "YouTube লিংক",
    videoPlaceholder: "https://www.youtube.com/watch?v=…",
    videoHint: "BenkyoAI ভিডিওর ক্যাপশন পড়ে আর টাইমস্ট্যাম্প ধরে উদ্ধৃতি দেয়।",
    videoInvalid: "এটা YouTube লিংকের মতো লাগছে না।",
    videoCaptions: "ভিডিওটার ক্যাপশন পড়া গেল না।",
    addVideo: "ভিডিও যোগ করো",
    addNotes: "নোট যোগ করো",
    notesPlaceholder: "সিলেবাস, লেকচার নোট, প্রবলেম সেট — যা আছে পেস্ট করো…",
    removeAria: "{name} সরাও",
    pastedNotes: "পেস্ট করা নোট",
    words: "{count}টি শব্দ",
    youtubeParts: "YouTube · {count}টি টাইমস্ট্যাম্প অংশ",
    status: {
      indexing: "ইনডেক্স হচ্ছে…",
      notIndexed: "ইনডেক্স হয়নি",
      storedOnly: "সেভ আছে, খোঁজা যাবে না",
      semantic: "সেমান্টিক + কীওয়ার্ড",
      keyword: "কীওয়ার্ড",
      indexed_one: "{count}টি প্যাসেজ · {kind} সার্চ",
      indexed_other: "{count}টি প্যাসেজ · {kind} সার্চ",
    },
  },
  topic: {
    heading: "তুমি কী শিখতে চাও?",
    lede: "যেভাবে মুখে বলবে সেভাবেই লেখো। একটা বিষয়, একটা অধ্যায়, একটা দক্ষতা, বা যেটার প্রশ্নে তুমি বারবার আটকে যাও।",
    fieldLabel: "তোমার বিষয়",
    fieldHint:
      "নির্দিষ্ট থাকলে ভালো: “SN1 বনাম SN2 মেকানিজম” লিখলে “রসায়ন”-এর চেয়ে ধারালো রোডম্যাপ পাবে।",
    placeholder:
      "যেমন: জৈব রসায়ন — প্রতিস্থাপন ও অপসারণ মেকানিজম, আমার টার্ম-শেষ পরীক্ষার জন্য",
    materialHeading: "নিজের উপকরণ যোগ করো",
    materialHint:
      "স্লাইড বা নোট থাকলে রোডম্যাপ সেগুলোকে ঘিরেই তৈরি হয়, সাধারণ আউটলাইনের বদলে।",
  },
  calibration: {
    heading: "তুমি কোথা থেকে শুরু করছ?",
    lede: "তিনটা প্রশ্ন। সৎভাবে উত্তর দাও — বাড়িয়ে বললে প্রথম কয়েকটা সেশন দেয়ালের মতো লাগবে।",
    questions: {
      q_seen: {
        prompt: "{topic} নিয়ে আগে কতটা পড়াশোনা করেছ?",
        options: {
          option1: "প্রথমবার — শূন্য থেকে শুরু করো",
          option2: "একটু আধটু পড়েছি",
          option3: "আগে পড়েছিলাম, ভুলে গেছি",
          option4: "এখনই পড়ছি",
        },
      },
      q_solo: {
        prompt: "এই বিষয়ে একটা সাধারণ সমস্যা ধরলে কী হয়?",
        options: {
          option1: "কোথা থেকে শুরু করব বুঝতে পারব না",
          option2: "নোট খোলা লাগবে",
          option3: "অনেকটা এগোতে পারব",
          option4: "শেষ করে নিজের কাজ যাচাই করে নেব",
        },
      },
      q_explain: {
        prompt: "মূল ধারণাটা এখনই ক্লাসমেটকে বুঝিয়ে বলতে পারবে?",
        options: {
          option1: "এখনও না",
          option2: "মোটামুটি, ফাঁকফোকর নিয়ে",
          option3: "হ্যাঁ, যদি তারা আপত্তি না করে",
          option4: "হ্যাঁ, অস্বস্তিকর প্রশ্নগুলো সহ",
        },
      },
    },
  },
  purpose: {
    heading: "কেন এটা, এখনই কেন?",
    lede: "এটা রোডম্যাপটা বদলে দেয়, শুধু সুর নয় — কত দ্রুত এগোবে, কত গভীরে যাবে, আর কী বাদ দিতে রাজি।",
    options: {
      exam: {
        label: "একটা পরীক্ষা",
        effect: "ছোট চক্র, ভারী পুনরালোচনা, পরীক্ষায় যা আসতে পারে তা নিয়ে আপসহীন।",
      },
      project: {
        label: "একটা প্রজেক্ট",
        effect: "যেখানে বানাবে সেখানে গভীরতা, যেখানে বানাবে না সেখানে চোখ বুলিয়ে।",
      },
      job: {
        label: "কাজ বা ইন্টারভিউ",
        effect: "সহকর্মী আর ইন্টারভিউয়ার যা জানা ধরে নেয়, সেটাই আগে আনে।",
      },
      curiosity: {
        label: "কৌতূহল",
        effect: "তাড়াহুড়ো নেই, যা আকর্ষণীয় লাগে তা-ই অনুসরণ করে।",
      },
    },
    deadline: {
      label: "সময়সীমা",
      hintNone: "তারিখ দিলে রোডম্যাপ সেই তারিখ ধরেই নিজের গতি ঠিক করে।",
      daysOut_one: "{count} দিন বাকি। গতি সেভাবেই ঠিক হবে।",
      daysOut_other: "{count} দিন বাকি। গতি সেভাবেই ঠিক হবে।",
      hintPast: "তারিখটা পেরিয়ে গেছে — আর একটা বেছে নাও।",
    },
    submit: "আমার রোডম্যাপ বানাও",
  },
  preview: {
    eyebrow: "তোমার রোডম্যাপ",
    topicsCount_one: "{count}টি বিষয়",
    topicsCount_other: "{count}টি বিষয়",
    rows: {
      groundRules: "মূল নিয়ম",
      coreMechanics: "মূল কাঠামো",
      applyingUnderPressure: "চাপের মধ্যে প্রয়োগ",
      depthAndConnections: "গভীরতা ও সংযোগ",
      bringingItTogether: "সব একসাথে",
    },
    pacing: {
      exam: { label: "ছোট চক্র, ভারী পুনরালোচনা", sessions: "সপ্তাহে ৫ সেশন · ৩৫ মিনিট" },
      project: { label: "যেখানে বানাবে সেখানে গভীর", sessions: "সপ্তাহে ৩ সেশন · ৪৫ মিনিট" },
      job: { label: "ধরে নেওয়া বেসিকগুলো আগে", sessions: "সপ্তাহে ৪ সেশন · ৩০ মিনিট" },
      curiosity: { label: "তাড়াহুড়ো নেই, আগ্রহই পথ", sessions: "সপ্তাহে ২ সেশন · ২৫ মিনিট" },
    },
    daysLeft_one: "{count} দিন বাকি",
    daysLeft_other: "{count} দিন বাকি",
    pacingLabel: "গতি",
    captions: {
      brand: "BenkyoAI-কে বলো তুমি কী শিখছ, তখন বিষয়গুলো এখানে এসে জমবে।",
      topic: "আগে কাঠামো — পরের ধাপে তোমার উপকরণ এটাকে বদলে দেবে।",
      calibration:
        "টিকগুলো দক্ষতা দেখায়। তোমার উত্তর ঠিক করে দেয় প্রথমগুলো কোথা থেকে শুরু হবে।",
      purpose: "উদ্দেশ্যই গতি ঠিক করে। সময়সীমা সেটাকে টাইট করে।",
    },
    brand: {
      tagline: "স্মার্ট পড়াশোনা",
    },
  },
};
