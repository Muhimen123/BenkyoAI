import type { en } from "./en";

/**
 * Bangla (বাংলা) message dictionary.
 *
 * Typed `typeof en` so it MUST match the English dictionary key-for-key — the
 * compiler enforces parity, which is what makes a partial translation safe to
 * ship: a missing key here is a build error, not a silent English leak.
 */
export const bn: typeof en = {
  common: {
    back: "পেছনে",
    continue: "এগিয়ে যান",
    cancel: "বাতিল",
    close: "বন্ধ",
    save: "সংরক্ষণ",
    optional: "ঐচ্ছিক",
    loading: "লোড হচ্ছে…",
    retry: "আবার চেষ্টা করুন",
    connectKey: "কী কানেক্ট করুন",
    footerCopyright:
      "© {year} BenkyoAI — কপিরাইট Al Muhimen, Nishat Tasnim Meem, Fariha Tasnim Amir",
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
      ariaConnected: "{provider}-এ AI কী কানেক্ট করা আছে। সেটিংসে পরিচালনা করুন।",
      ariaNone: "কোনো AI কী কানেক্ট করা নেই। সেটিংসে একটি কানেক্ট করুন।",
      noKey: "কী নেই",
    },
    keyGate: {
      heading: "একটি AI কী কানেক্ট করুন",
      body: "কোনো কী কানেক্ট করা নেই, তাই কিছুই চলবে না। আপনার রোডম্যাপ, উপকরণ ও অগ্রগতি অক্ষত আছে — একটি কী কানেক্ট করুন আর ঠিক যেখানে ছিলেন সেখান থেকেই শুরু করুন।",
    },
    gitHub: {
      aria: "GitHub-এ BenkyoAI দেখুন",
    },
  },
  onboarding: {
    header: {
      noAccounts: "কোনো অ্যাকাউন্ট নেই · আপনার কী-তে চলে",
    },
    hero: {
      line1: "পড়াশোনা, যা মনে রাখে",
      line2: "তুমি যা",
      line3: "ভুল করেছ।",
      lede: "তোমার এখনকার অবস্থান ঘিরে তৈরি রোডম্যাপ। প্রতি ধাপে অনুশীলন। পুরোনো ভুলগুলো চুপচাপ আবার ফিরে আসে, যতক্ষণ না সেগুলো আর ভুল থাকে।",
    },
    steps: {
      key: "কী কানেক্ট করুন",
      topic: "তোমার বিষয়",
      level: "তোমার স্তর",
      purpose: "তোমার উদ্দেশ্য",
    },
    stepOf: "ধাপ {n}, মোট {m}",
    error: {
      roadmapFailed: "রোডম্যাপ ফিরে আসেনি। প্রথম ধাপে তোমার কী দেখে আবার চেষ্টা করো।",
    },
    reconnect: {
      heading: "AI কী আবার কানেক্ট করুন",
      firstHeading: "প্রথমে একটি AI কী কানেক্ট করুন",
    },
    topic: {
      heading: "তুমি কী শিখতে চাও?",
      lede: "যেভাবে মুখে বলবে সেভাবেই লেখো। একটি বিষয়, একটি অধ্যায়, একটি দক্ষতা, বা এমন কিছু যার প্রশ্নে তুমি বারবার আটকে যাও।",
      fieldLabel: "তোমার বিষয়",
      hint: 'নির্দিষ্ট থাকলে ভালো: "SN1 বনাম SN2 ব্যবস্থা" দিলে "রসায়ন" একটি বড় বিষয়ের চেয়ে অনেক বেশি তীক্ষ্ণ রোডম্যাপ পাবে।',
      placeholder:
        "যেমন জৈব রসায়ন — প্রতিস্থাপন ও অপসারণ ব্যবস্থা, আমার সাময়িক পরীক্ষার জন্য",
      addMaterial: "নিজের উপকরণ যোগ করো",
      materialLede:
        "তোমার কাছে স্লাইড বা নোট থাকলে, সাধারণ রূপরেখার বদলে সেগুলো ঘিরেই রোডম্যাপ তৈরি হয়।",
    },
    calibration: {
      heading: "তুমি কোথা থেকে শুরু করছো?",
      lede: "তিনটি প্রশ্ন। সততার সাথে উত্তর দাও — বেশি বানালে প্রথম কয়েকটি সেশন কেবল একটি প্রাচীর বলে মনে হবে।",
    },
    purpose: {
      heading: "কেন এটি, আর কেন এখন?",
      lede: "এটি রোডম্যাপ বদলায়, কেবল ভাষা নয় — কত দ্রুত এগোবে, কত গভীরে যাবে, আর কী ছাড়তে রাজি হবে।",
      exam: { label: "একটি পরীক্ষা", effect: "ছোট চক্র, ভারী রিকল, পরীক্ষার উপযোগী যা যা দরকার সেটাই।" },
      project: { label: "একটি প্রজেক্ট", effect: "যেখানে বানাবে সেখানে গভীরতা, বাকি জায়গায় চোখ বুলিয়ে নেওয়া।" },
      job: { label: "কাজ বা ইন্টারভিউ", effect: "সহকর্মী ও ইন্টারভিউয়ার যা জানে বলে ধরে নেয় সেটাই প্রথমে আসে।" },
      curiosity: { label: "কৌতূহল", effect: "তাড়াহুড়ো নেই, যা আগ্রহজনক মনে হয় তার পিছনে ছুটে।" },
      deadlineLabel: "শেষ তারিখ",
      deadlineHintNone: "কোনো তারিখ থাকলে রোডম্যাপ নিজেই সে অনুযায়ী গতি ঠিক করে।",
      deadlineHintDays: "{days} দিন বাকি। গতি সেই অনুযায়ীই ঠিক হবে।",
      deadlineHintPast: "সেই তারিখ পেরিয়ে গেছে — আরেকটি বেছে নাও।",
      submit: "আমার রোডম্যাপ বানাও",
    },
    building: {
      label: "বানাচ্ছি",
      reading: "তোমার দেওয়া উপকরণ পড়ছি",
      placing: "তোমাকে ম্যাপে বসাচ্ছি",
      ordering: "ধাপগুলো সাজাচ্ছি",
      pacing: "গতি ঠিক করছি",
    },
    preview: {
      headerLabel: "তোমার রোডম্যাপ",
      topicsCount: "{n}টি বিষয়",
      daysLeft: "{days} দিন বাকি",
      pacing: "গতি",
      caption0: "BenkyoAI-কে তুমি কী শিখছো বললেই বিষয়গুলো এখানে সাজবে।",
      caption1: "আগে কাঠামো — তোমার উপকরণ পরের ধাপে সেটি পুনরায় রূপ দেয়।",
      caption2: "টিক দেখায় দক্ষতা। তোমার উত্তর ঠিক করে প্রথম টিকগুলো কোথায় বসে।",
      caption3: "উদ্দেশ্য গতি ঠিক করে। একটি শেষ তারিখ সেটি আরও শক্ত করে।",
      skeleton: {
        groundRules: "মূল নিয়ম",
        coreMechanics: "মূল ব্যবস্থা",
        applyingPressure: "চাপের মধ্যে প্রয়োগ",
        depthConnections: "গভীরতা ও সংযোগ",
        bringingTogether: "একত্র করা",
      },
      pacingCopy: {
        exam: { label: "ঘন চক্র, ভারী রিকল", sessions: "সপ্তাহে ৫ সেশন · ৩৫ মিনিট" },
        project: { label: "যেখানে বানাবে সেখানে গভীরতা", sessions: "সপ্তাহে ৩ সেশন · ৪৫ মিনিট" },
        job: { label: "ধরে নেওয়া ভিত্তিগুলো আগে", sessions: "সপ্তাহে ৪ সেশন · ৩০ মিনিট" },
        curiosity: { label: "তাড়াহুড়ো নেই, তোমার আগ্রহ অনুসরণ করে", sessions: "সপ্তাহে ২ সেশন · ২৫ মিনিট" },
      },
    },
    memory: {
      label: "একটি ভুল, তিনটি সেশন ধরে",
      missed: "মিস হলো",
      blended: "আবার মিশিয়ে দেওয়া হলো",
      held: "নিজে থেকেই ধরে রাখা",
      day1: "দিন ১",
      day3: "দিন ৩",
      day9: "দিন ৯",
    },
    brand: {
      subtitle: "আরও বুদ্ধিদীপ্ত পড়াশোনা",
      caption: "BenkyoAI-কে তুমি কী শিখছো বললেই বিষয়গুলো এখানে সাজবে।",
    },
    byok: {
      facts: {
        stays: {
          title: "এই ডিভাইসেই থাকে",
          body: "কীটি কেবল এই ব্রাউজারেই সংরক্ষিত হয়। BenkyoAI-এর এটি রাখার কোনো সার্ভার নেই।",
        },
        wallet: {
          title: "তোমার ব্যবহার, তোমার খরচ",
          body: "অনুরোধগুলোর বিল যায় তোমার প্রোভাইডার অ্যাকাউন্টে, তাদের নির্ধারিত হারে। এখানে কোনো সাবস্ক্রিপশন নেই।",
        },
        shield: {
          title: "যখন খুশি বাতিল করো",
          body: "প্রোভাইডারে কীটি মুছে দিলেই সেটি সব জায়গায় সাথে সাথে কাজ করা বন্ধ করে।",
        },
      },
      heading: "তোমার AI কী কানেক্ট করো",
      explainer:
        "BenkyoAI-এর কোনো অ্যাকাউন্ট নেই, সাইন আপ করার কিছুও নেই। এটি চলে একটি API কী-তে — একটি লম্বা স্ট্রিং, যা তুমি একটি AI প্রোভাইডার থেকে পাও আর তা এই অ্যাপকে তোমার হয়ে প্রশ্ন করতে দেয়। একটি পেতে মিনিটখানে সময় লাগে, আর বেশিরভাগ প্রোভাইডারই শুরুতে কিছু ফ্রি দেয়।",
      pickProvider: "একটি প্রোভাইডার বেছে নাও",
      openProvider: "{name} খোলো",
      connected: "{name} কানেক্ট হয়েছে",
      savedNote:
        "এই ব্রাউজারে সংরক্ষিত হলো। কীটি আর দেখতে পাবে না — সেটিংসে যেকোনো সময় বদলাতে পারবে।",
      keyLabel: "তোমার কী পেস্ট করো",
      keyHint: "শুরু হয় {prefix} দিয়ে। কানেক্ট করার সাথে সাথেই যাচাই হয়।",
      showKey: "কী দেখাও",
      hideKey: "কী লুকাও",
      modelLabel: "মডেল",
      modelHint: "{model} এর জন্য খালি রাখো",
      notSaved: "কিছুই সংরক্ষণ হয়নি। উপরের কী ঠিক করে আবার চেষ্টা করো।",
      errorUnreachable: "প্রোভাইডারে পৌঁছানো গেল না। কানেকশন ঠিক করে আবার চেষ্টা করো।",
      checkingWith: "{name} দিয়ে যাচাই করছি…",
    },
  },
  dashboard: {
    purpose: {
      exam: "পরীক্ষার জন্য পড়ছ",
      project: "একটি প্রজেক্টের জন্য শিখছ",
      job: "কাজের জন্য শিখছ",
      curiosity: "কৌতূহল থেকে শিখছ",
    },
    switchRoadmap: "রোডম্যাপ বদলাও",
    newRoadmap: "নতুন রোডম্যাপ",
    openVault: "ভল্ট খোলো",
    congrats: {
      heading: "অভিনন্দন — তুমি {title} আয়ত্তে এনেছ!",
      body: "প্রতিটি ধাপ মাস্টারি লেভেলে। লক করতে একবার চূড়ান্ত পরীক্ষার রাতের রিভিশন করো, বা নতুন রোডম্যাপ শুরু করো।",
      finalPass: "চূড়ান্ত রিভিশন পাস",
      startNew: "নতুন রোডম্যাপ শুরু করো",
    },
    next: {
      unfinished: "অসম্পূর্ণ সেশন",
      nextStep: "পরবর্তী ধাপ",
      fallbackTitle: "তোমার পরবর্তী শেখার মাইলস্টোন",
      hoverHint: "বই খুলতে হোভার করো ✦",
      allMastered: "সবকিছু আয়ত্তে এসেছে",
      resumeDetail: "{topic} · প্রশ্ন {n}-এ থেমেছিল",
      nextDetail: "{topic} · আনুমানিক {min} মিনিট",
      emptyDetail:
        "ভল্টে একটি টপিক যোগ করো, বা সবকিছু নিয়ে একবার পরীক্ষার রাতের পাস চালাও।",
      resume: "সেশন আবার শুরু করো",
      startStep: "এই ধাপটি শুরু করো",
      weakPoints_one: "{count}টি দুর্বল পয়েন্ট মিশিয়ে দেওয়া হয়েছে",
      weakPoints_other: "{count}টি দুর্বল পয়েন্ট মিশিয়ে দেওয়া হয়েছে",
    },
    roadmapHeading: "তোমার রোডম্যাপ",
    seeEverything: "সব দেখো",
    sinceStarted: "শুরুর পর থেকে",
    progress: "অগ্রগতি",
    stepsMastered: "{total}-এর মধ্যে {done}টি ধাপ আয়ত্তে",
    activeRecall: "অ্যাক্টিভ রিকল",
    dueForReview: "{count}টি রিভিউ বাকি",
    recall: {
      fromLastSession: "শেষ সেশন থেকে",
      fromLastSessionBody: "তুমি যা কভার করেছিলে, আর যা অমীমাংসিত রয়ে গেছে।",
      upToMilestone: "একটি মাইলস্টোন পর্যন্ত",
      upToMilestoneBody: "{title} পর্যন্ত সবকিছু।",
      upToMilestoneBodyEmpty: "তোমার প্রথম মাইলস্টোন পর্যন্ত সবকিছু।",
      examNight: "পরীক্ষার রাত",
      examNightTitle: "পুরো ভল্ট রিভাইস করো",
      examNightBody:
        "তুমি যা শিখেছ তার সব নিয়ে এক পাস, দুর্বলতাগুলো আগে। ম্লান ইন্টারফেস, কোনো ব্যাখ্যা নেই — শুধু রিকল।",
    },
  },
  roadmap: {
    adjusted: "তোমার সাম্প্রতিক উত্তরের ভিত্তিতে আপডেট করা হয়েছে।",
    milestone: "মাইলস্টোন",
    yours: "তোমার",
    minCount: "{n} মিনিট",
    sessionCount_one: "{count}টি সেশন",
    sessionCount_other: "{count}টি সেশন",
    blendedReview: "মিশ্র রিভিউ",
    openTopic: "{title} খোলো",
    controls: {
      addByMyself: "নিজে যোগ করো",
      modifyPrompt: "প্রম্পট পরিবর্তন",
      addTitle: "নিজে একটি টপিক যোগ করো",
      addDescription:
        "রোডম্যাপে যা বাদ পড়েছে — শিক্ষক যা যোগ করেছেন, তুমি যে ফাঁক লক্ষ্য করেছ।",
      addTopic: "টপিক যোগ করো",
      topicLabel: "টপিক",
      topicPlaceholder: "যেমন রিং সিস্টেমের স্টেরিওকেমিস্ট্রি",
      subtopicsLabel: "সাবটপিক",
      subtopicsHint:
        "প্রতি লাইনে একটি। খালি রাখো আর টপিক খুললেই BenkyoAI পূরণ করে দেবে।",
      modifyTitle: "ইনস্ট্রাকশন পরিবর্তন",
      modifyDescription:
        "BenkyoAI তোমার রোডম্যাপ বানাও বা মানিয়ে নেওয়ার সময় এটি থেকে কাজ করে। সরাসরি এডিট করো।",
      rebuild: "রোডম্যাপ রিবিল্ড",
      rebuildNote:
        "রিবিল্ড করলে টিকে থাকা টপিকগুলোর মাস্টারি থেকে যায়। যা মুছে যায় তার প্র্যাকটিস ইতিহাসও মুছে যায়।",
    },
  },
  pacing: {
    noDeadline: "কোনো ডেডলাইন নেই। {note}",
    daysTo: "{date} পর্যন্ত {days} দিন বাকি",
    deadlinePassed: "ডেডলাইন পার হয়ে গেছে",
    behind: "পেছনে আছো",
    onPace: "গতিতে আছো",
    sessionsNote: "সপ্তাহে {perWeek}টি সেশন · প্রতিটি {perSession} মিনিট। {note}",
  },
  callback: {
    pickingUp: "{when} থেকে কাজ ধরছ",
    checkStuck: "মনে আছে কিনা যাচাই করো",
    rereadFirst: "আগে আবার পড়ো",
  },
  usage: {
    eyebrow: "তোমার কীতে AI ব্যবহার",
    estOnRoadmap: "এই রোডম্যাপে আনুমানিক",
    calls: "কল",
    tokensIn: "টোকেন ইন",
    tokensOut: "টোকেন আউট",
    todayNote:
      "আজ সব রোডম্যাপ জুড়ে: {calls}টি কল, {cost}। Gemini-এর খরচ পেইড-টিয়ার লিস্ট দামে অনুমান করা হয়েছে (ফ্রি-টিয়ার কী চার্জ হয় না), স্থানীয় Ollama মডেল ফ্রি, আর অন্যান্য প্রোভাইডার শুধু টোকেনে গণনা করা হয়।",
  },
  topic: {
    empty: {
      title: "সেই টপিকটি তোমার ভল্টে নেই",
      body: "রোডম্যাপ রিবিল্ড হওয়ার সময় মুছে গে থাকতে পারে।",
      back: "ভল্টে ফিরো",
    },
    eyebrow: "টপিক {n} / {m}",
    milestoneNote: "একটি মাইলস্টোন — এখান পর্যন্ত সবকিছু নিয়ে রিকল চলে।",
    reviewBlended: "রিভিউ মিশিয়ে দেওয়া হয়েছে",
    nextTopic: "পরবর্তী টপিক",
    topicMastery: "টপিক মাস্টারি",
    stepsMastered: "{total}-এর মধ্যে {done}টি ধাপ আয়ত্তে।",
    depthNote:
      "পুরো টপিক জুড়ে ব্যাখ্যায় প্রযোজ্য। জায়গা না হারিয়ে মাঝপথে বদলাতে পারো।",
  },
};
