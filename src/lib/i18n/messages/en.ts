/**
 * English messages — the SOURCE OF TRUTH for every user-facing string.
 *
 * `bn.ts` is typed `typeof en`, so it must mirror this object key-for-key:
 * adding a key here without adding it there is a compile error, and vice versa.
 * That compile-time parity is what makes shipping a translation safe — a
 * missing Bangla string can never silently leak English.
 *
 * Conventions:
 * - Namespaces mirror feature areas (`common`, `locale`, `shell`, `onboarding`, …).
 * - Strings reused across screens live under `common`.
 * - Interpolation uses `{param}` placeholders: `t("a.key", { count })`.
 * - Plurals use explicit `_one` / `_other` suffixed keys: `tp("a.count", n)`.
 * - Add new strings to both dictionaries in the same change.
 */
export const en = {
  common: {
    back: "Back",
    continue: "Continue",
    cancel: "Cancel",
    close: "Close",
    optional: "optional",
    /** Copyright footer shown on every screen. {year} is the current year. */
    footerCopyright:
      "© {year} BenkyoAI — copyrighted by Al Muhimen, Nishat Tasnim Meem, Fariha Tasnim Amir",
  },
  locale: {
    /** Accessible label for the language toggle group. */
    toggleLabel: "Language",
  },
  shell: {
    nav: {
      today: "Today",
      vault: "Vault",
      settings: "Settings",
    },
    keyStatus: {
      /** {provider} is the provider's brand name. */
      ariaConnected: "AI key connected to {provider}. Manage it in settings.",
      ariaNone: "No AI key connected. Connect one in settings.",
      noKey: "No key",
    },
    keyGate: {
      heading: "Connect an AI key",
      body: "No key connected, so nothing can run. Your roadmap, materials and progress are untouched — connect a key and you'll pick up exactly where you were.",
    },
    gitHub: {
      aria: "View BenkyoAI on GitHub",
    },
  },
  onboarding: {
    header: {
      noAccounts: "No accounts · Runs on your key",
    },
    hero: {
      /** Full headline, read by screen readers as one sentence. */
      headline: "Study that remembers what you got wrong.",
      /** Sentence-ending mark; Bangla uses the danda (।). */
      fullStop: ".",
      line1: "Study that",
      line2: "remembers what",
      line3: "you got wrong",
      lede: "A roadmap built around where you actually are. Practice at every step. Old mistakes folded quietly back in until they stop being mistakes.",
    },
    steps: {
      key: "Connect a key",
      topic: "Your topic",
      level: "Your level",
      purpose: "Your reason",
    },
    /** Sidebar progress label. {index} and {total} are zero-padded. */
    stepCounter: "Step {index} of {total}",
    reconnect: {
      heading: "Reconnect an AI key",
      firstHeading: "First, connect an AI key",
      note: "Your key was removed. Your roadmap, materials and progress are untouched — connect a key and you'll land straight back on them.",
    },
    error:
      "The roadmap didn't come back. Check your key in step one and try again.",
    building: {
      eyebrow: "Building",
      reading: "Reading what you gave it",
      placing: "Placing you on the map",
      ordering: "Ordering the steps",
      pacing: "Setting the pace",
    },
  },
  byok: {
    defaultHeading: "Connect your AI key",
    intro:
      "BenkyoAI has no accounts and nothing to sign up for. It runs on an API key — a long string you get from an AI provider that lets this app ask questions on your behalf. Getting one takes about a minute and most providers start you off free.",
    facts: {
      device: {
        title: "Stays on this device",
        body: "The key is saved in this browser only. BenkyoAI has no server that holds it.",
      },
      usage: {
        title: "Your usage, your cost",
        body: "Requests are billed to your provider account, at their rates. No subscription here.",
      },
      revoke: {
        title: "Revoke whenever",
        body: "Delete the key at the provider and it stops working immediately, everywhere.",
      },
    },
    pickProvider: "Pick a provider",
    providerAria: "AI provider",
    /** Link to the provider console. {name} is the provider's brand name. */
    openProvider: "Open {name}",
    connected: {
      /** Confirmation after a successful check. {name} is the provider's name. */
      title: "{name} connected",
      body: "Saved to this browser. You won't see the key again — replace it any time in Settings.",
    },
    keyField: {
      paste: "Paste your key",
      /** Hint above the key field. {prefix} is the expected key prefix. */
      hint: "Starts with {prefix}. Checked as soon as you connect.",
      show: "Show key",
      hide: "Hide key",
    },
    model: {
      label: "Model",
      /** {model} is the provider's default model id. */
      hint: "Leave blank for {model}.",
    },
    failure:
      "Couldn't reach the provider. Check your connection and try again.",
    notSaved: "Nothing was saved. Fix the key above and try again.",
    /** Shown on the submit button while validating. {name} is the provider's name. */
    checking: "Checking with {name}…",
    submit: "Connect key",
    continue: "Continue",
  },
  providers: {
    /**
     * Per-provider setup copy. Brand names stay as-is; the guidance around
     * them is translated. Keys are looked up through `providerMessages.ts`.
     */
    google: {
      freeTierNote: "Has a free tier that covers ordinary studying.",
      steps: {
        signIn: "Open aistudio.google.com/apikey and sign in with a Google account.",
        create: "Select Create API key, then pick or create a project.",
        copy: "Copy the key it shows you — it starts with AIza or AQ.",
        paste: "Paste it below. BenkyoAI checks it right away.",
      },
    },
    openai: {
      freeTierNote: "Pay as you go. Add a small credit balance before you start.",
      steps: {
        signIn: "Open platform.openai.com/api-keys and sign in.",
        create: "Select Create new secret key and give it a name like BenkyoAI.",
        copy: "Copy the key straight away — OpenAI shows it once.",
        paste: "Paste it below. BenkyoAI checks it right away.",
      },
    },
    anthropic: {
      freeTierNote: "Pay as you go. Add a small credit balance before you start.",
      steps: {
        signIn: "Open console.anthropic.com/settings/keys and sign in.",
        create: "Select Create key and give it a name like BenkyoAI.",
        copy: "Copy the key it shows you — it starts with sk-ant-.",
        paste: "Paste it below. BenkyoAI checks it right away.",
      },
    },
    ollama: {
      credentialLabel: "Ollama address",
      freeTierNote:
        "Free, private and offline: the model runs on your own computer. Works when BenkyoAI also runs on this machine (npm run dev).",
      steps: {
        signIn: "Install Ollama from ollama.com/download and start it.",
        create: "Pull a model in a terminal, for example: ollama pull gemma3:4b",
        copy: "Run BenkyoAI locally with npm run dev — a hosted site can't reach your computer.",
        paste:
          "Paste http://localhost:11434 below. BenkyoAI checks the model is installed.",
      },
    },
  },
  material: {
    dropHint:
      "Slides, PDFs, photos of notes, lecture recordings — drop them here or add them one at a time.",
    add: "Add material",
    pasteNotes: "Paste notes",
    youtube: "YouTube link",
    videoPlaceholder: "https://www.youtube.com/watch?v=…",
    videoHint: "BenkyoAI reads the video's captions and cites them by timestamp.",
    videoInvalid: "That doesn't look like a YouTube link.",
    videoCaptions: "Couldn't read that video's captions.",
    addVideo: "Add video",
    addNotes: "Add notes",
    notesPlaceholder: "Paste a syllabus, lecture notes, a problem set…",
    /** Accessible label for the remove button. {name} is the material's name. */
    removeAria: "Remove {name}",
    pastedNotes: "Pasted notes",
    /** Auto size label for pasted notes. {count} is the word count. */
    words: "{count} words",
    /** Size label after reading a video. {count} is the number of caption parts. */
    youtubeParts: "YouTube · {count} timestamped parts",
    status: {
      indexing: "indexing…",
      notIndexed: "not indexed",
      storedOnly: "stored, not searchable",
      semantic: "semantic + keyword",
      keyword: "keyword",
      /** {count} is the passage count, {kind} the search kind. */
      indexed_one: "{count} passage · {kind} search",
      indexed_other: "{count} passages · {kind} search",
    },
  },
  topic: {
    heading: "What do you want to learn?",
    lede: "Write it the way you'd say it out loud. A subject, a chapter, a skill, a thing you keep failing questions on.",
    fieldLabel: "Your topic",
    fieldHint:
      "Specific beats broad: “SN1 vs SN2 mechanisms” gets you a sharper roadmap than “chemistry”.",
    placeholder:
      "e.g. Organic chemistry — substitution and elimination mechanisms, for my end-of-term exam",
    materialHeading: "Add your own material",
    materialHint:
      "If you have slides or notes, the roadmap is built around them instead of a generic outline.",
  },
  calibration: {
    heading: "Where are you starting from?",
    lede: "Three questions. Answer honestly — overstating it just means the first few sessions feel like a wall.",
    /**
     * The calibration questions are defined by the API route; these mirror them
     * by id so the copy can be translated client-side. Unknown ids fall back to
     * the text the server sent.
     */
    questions: {
      q_seen: {
        prompt: "How much of {topic} have you met before?",
        options: {
          option1: "First time — start me at zero",
          option2: "I've read around it a bit",
          option3: "I studied it before and it faded",
          option4: "I'm actively studying it now",
        },
      },
      q_solo: {
        prompt: "Handed a typical problem in this area, what happens?",
        options: {
          option1: "I wouldn't know where to start",
          option2: "I'd need the notes open",
          option3: "I'd get most of the way",
          option4: "I'd finish it and check my work",
        },
      },
      q_explain: {
        prompt: "Could you explain the main idea to a classmate right now?",
        options: {
          option1: "Not yet",
          option2: "Roughly, with gaps",
          option3: "Yes, if they didn't push back",
          option4: "Yes, including the awkward questions",
        },
      },
    },
  },
  purpose: {
    heading: "Why this, why now?",
    lede: "This changes the roadmap, not just the tone — how fast it moves, how deep it goes, and what it's willing to skip.",
    options: {
      exam: {
        label: "An exam",
        effect: "Short cycles, heavy recall, ruthless about what's examinable.",
      },
      project: {
        label: "A project",
        effect: "Depth where you'll build, skimmed where you won't.",
      },
      job: {
        label: "Work or interviews",
        effect: "Front-loads what colleagues and interviewers assume you know.",
      },
      curiosity: {
        label: "Curiosity",
        effect: "Unhurried, follows what you find interesting.",
      },
    },
    deadline: {
      label: "Deadline",
      hintNone: "If there's a date, the roadmap paces itself to hit it.",
      /** {count} days remain. */
      daysOut_one: "{count} day out. Pacing will be set to fit.",
      daysOut_other: "{count} days out. Pacing will be set to fit.",
      hintPast: "That date has passed — pick another one.",
    },
    submit: "Build my roadmap",
  },
  preview: {
    eyebrow: "Your roadmap",
    /** {count} is the number of topics in the preview. */
    topicsCount_one: "{count} topic",
    topicsCount_other: "{count} topics",
    rows: {
      groundRules: "Ground rules",
      coreMechanics: "Core mechanics",
      applyingUnderPressure: "Applying it under pressure",
      depthAndConnections: "Depth and connections",
      bringingItTogether: "Bringing it together",
    },
    pacing: {
      exam: { label: "Tight cycles, heavy recall", sessions: "5 sessions a week · 35 min" },
      project: { label: "Deep where you'll build", sessions: "3 sessions a week · 45 min" },
      job: { label: "Front-loads the assumed basics", sessions: "4 sessions a week · 30 min" },
      curiosity: { label: "Unhurried, follows your interest", sessions: "2 sessions a week · 25 min" },
    },
    /** {count} days remain before the deadline. */
    daysLeft_one: "{count} day left",
    daysLeft_other: "{count} days left",
    pacingLabel: "pacing",
    captions: {
      brand: "Topics land here once you tell BenkyoAI what you're learning.",
      topic: "Structure first — your material reshapes it in the next step.",
      calibration:
        "Ticks show mastery. Your answers set where the first ones start.",
      purpose: "Purpose sets the pace. A deadline tightens it.",
    },
    brand: {
      tagline: "Study smarter",
    },
  },
};
