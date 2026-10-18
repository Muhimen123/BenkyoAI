/**
 * English message dictionary — the SOURCE OF TRUTH for every UI string.
 *
 * Bangla (`bn.ts`) is typed `typeof en`, so it must mirror this shape key-for-key;
 * adding a key here without adding it there is a compile error, and vice versa.
 *
 * Organisation: namespaces mirror feature areas (common, shell, onboarding,
 * dashboard, …). Shared/recurring strings live under `common`. Plurals use
 * explicit `_one` / `_other` suffixed keys, resolved via `t.tp(base, count)`.
 *
 * Interpolation: `{param}` placeholders, filled by `t.t(key, { param })`.
 */

export const en = {
  common: {
    back: "Back",
    continue: "Continue",
    cancel: "Cancel",
    close: "Close",
    save: "Save",
    optional: "optional",
    loading: "Loading…",
    retry: "Try again",
    /** Generic "Connect key" button label, reused by KeyGate and BYOK setup. */
    connectKey: "Connect key",
    /** Copyright footer shared across screens. {year} is the current year. */
    footerCopyright:
      "© {year} BenkyoAI — copyrighted by Al Muhimen, Nishat Tasnim Meem, Fariha Tasnim Amir",
  },
  locale: {
    /** Visually-hidden label for the language toggle (aria-label). */
    toggleLabel: "Language",
  },
  shell: {
    nav: {
      today: "Today",
      vault: "Vault",
      settings: "Settings",
    },
    keyStatus: {
      /** {provider} is the provider display name, e.g. "Google AI Studio". */
      ariaConnected: "AI key connected to {provider}. Manage it in settings.",
      ariaNone: "No AI key connected. Connect one in settings.",
      noKey: "No key",
    },
    keyGate: {
      heading: "Connect an AI key",
      body: "No key connected, so nothing can run. Your roadmap, materials and progress are untouched — connect a key and you'll pick up exactly where you were.",
    },
    gitHub: {
      /** Brand name stays untranslated; only the aria-label is localised. */
      aria: "View BenkyoAI on GitHub",
    },
  },
  onboarding: {
    header: {
      noAccounts: "No accounts · Runs on your key",
    },
    hero: {
      line1: "Study that",
      line2: "remembers what",
      /** Highlighted span — the "mistakes" payoff. */
      line3: "you got wrong.",
      lede: "A roadmap built around where you actually are. Practice at every step. Old mistakes folded quietly back in until they stop being mistakes.",
    },
    /** The four flow-step labels shown as a typed sequence + the aside counter. */
    steps: {
      key: "Connect a key",
      topic: "Your topic",
      level: "Your level",
      purpose: "Your reason",
    },
    /** "Step 01 of 04" counter in the aside. */
    stepOf: "Step {n} of {m}",
    error: {
      roadmapFailed:
        "The roadmap didn't come back. Check your key in step one and try again.",
    },
    reconnect: {
      heading: "Reconnect an AI key",
      firstHeading: "First, connect an AI key",
    },
    topic: {
      heading: "What do you want to learn?",
      lede: "Write it the way you'd say it out loud. A subject, a chapter, a skill, a thing you keep failing questions on.",
      fieldLabel: "Your topic",
      hint: 'Specific beats broad: "SN1 vs SN2 mechanisms" gets you a sharper roadmap than "chemistry".',
      placeholder:
        "e.g. Organic chemistry — substitution and elimination mechanisms, for my end-of-term exam",
      addMaterial: "Add your own material",
      materialLede:
        "If you have slides or notes, the roadmap is built around them instead of a generic outline.",
    },
    calibration: {
      heading: "Where are you starting from?",
      lede: "Three questions. Answer honestly — overstating it just means the first few sessions feel like a wall.",
    },
    purpose: {
      heading: "Why this, why now?",
      lede: "This changes the roadmap, not just the tone — how fast it moves, how deep it goes, and what it's willing to skip.",
      exam: { label: "An exam", effect: "Short cycles, heavy recall, ruthless about what's examinable." },
      project: { label: "A project", effect: "Depth where you'll build, skimmed where you won't." },
      job: { label: "Work or interviews", effect: "Front-loads what colleagues and interviewers assume you know." },
      curiosity: { label: "Curiosity", effect: "Unhurried, follows what you find interesting." },
      deadlineLabel: "Deadline",
      deadlineHintNone: "If there's a date, the roadmap paces itself to hit it.",
      /** {days} is a number of days remaining. */
      deadlineHintDays: "{days} days out. Pacing will be set to fit.",
      deadlineHintPast: "That date has passed — pick another one.",
      submit: "Build my roadmap",
    },
    building: {
      label: "Building",
      reading: "Reading what you gave it",
      placing: "Placing you on the map",
      ordering: "Ordering the steps",
      pacing: "Setting the pace",
    },
    preview: {
      headerLabel: "Your roadmap",
      /** {n} is a topic count. */
      topicsCount: "{n} topics",
      /** {days} is days remaining until a deadline. */
      daysLeft: "{days} days left",
      pacing: "pacing",
      caption0: "Topics land here once you tell BenkyoAI what you're learning.",
      caption1: "Structure first — your material reshapes it in the next step.",
      caption2: "Ticks show mastery. Your answers set where the first ones start.",
      caption3: "Purpose sets the pace. A deadline tightens it.",
      /** Illustrative skeleton-row titles shown in the live preview. */
      skeleton: {
        groundRules: "Ground rules",
        coreMechanics: "Core mechanics",
        applyingPressure: "Applying it under pressure",
        depthConnections: "Depth and connections",
        bringingTogether: "Bringing it together",
      },
      /** Per-purpose pacing copy in the preview footer. */
      pacingCopy: {
        exam: { label: "Tight cycles, heavy recall", sessions: "5 sessions a week · 35 min" },
        project: { label: "Deep where you'll build", sessions: "3 sessions a week · 45 min" },
        job: { label: "Front-loads the assumed basics", sessions: "4 sessions a week · 30 min" },
        curiosity: { label: "Unhurried, follows your interest", sessions: "2 sessions a week · 25 min" },
      },
    },
    memory: {
      label: "One mistake, over three sessions",
      missed: "missed",
      blended: "blended back in",
      held: "held, unaided",
      day1: "day 1",
      day3: "day 3",
      day9: "day 9",
    },
    brand: {
      subtitle: "Study smarter",
      caption: "Topics land here once you tell BenkyoAI what you're learning.",
    },
    byok: {
      facts: {
        stays: {
          title: "Stays on this device",
          body: "The key is saved in this browser only. BenkyoAI has no server that holds it.",
        },
        wallet: {
          title: "Your usage, your cost",
          body: "Requests are billed to your provider account, at their rates. No subscription here.",
        },
        shield: {
          title: "Revoke whenever",
          body: "Delete the key at the provider and it stops working immediately, everywhere.",
        },
      },
      heading: "Connect your AI key",
      explainer:
        "BenkyoAI has no accounts and nothing to sign up for. It runs on an API key — a long string you get from an AI provider that lets this app ask questions on your behalf. Getting one takes about a minute and most providers start you off free.",
      pickProvider: "Pick a provider",
      /** {name} is the provider display name. */
      openProvider: "Open {name}",
      connected: "{name} connected",
      savedNote:
        "Saved to this browser. You won't see the key again — replace it any time in Settings.",
      keyLabel: "Paste your key",
      keyHint: "Starts with {prefix}. Checked as soon as you connect.",
      showKey: "Show key",
      hideKey: "Hide key",
      modelLabel: "Model",
      /** {model} is the default model id, rendered in mono. */
      modelHint: "Leave blank for {model}.",
      notSaved: "Nothing was saved. Fix the key above and try again.",
      errorUnreachable:
        "Couldn't reach the provider. Check your connection and try again.",
      /** {name} is the provider display name. */
      checkingWith: "Checking with {name}…",
    },
  },
  dashboard: {
    purpose: {
      exam: "Studying for an exam",
      project: "Learning for a project",
      job: "Learning for work",
      curiosity: "Learning out of curiosity",
    },
    switchRoadmap: "Switch roadmap",
    newRoadmap: "New roadmap",
    openVault: "Open vault",
    congrats: {
      /** {title} is the roadmap title (AI-generated, stays English). */
      heading: "Congratulations — you've mastered {title}!",
      body: "Every step is at mastery level. Do a final exam-night pass to lock it in, or start another roadmap.",
      finalPass: "Final revision pass",
      startNew: "Start a new roadmap",
    },
    next: {
      unfinished: "Unfinished session",
      nextStep: "Next step",
      fallbackTitle: "Your next learning milestone",
      hoverHint: "Hover to open book ✦",
      allMastered: "Everything is mastered",
      /** {topic} is the topic title (AI-generated). */
      resumeDetail: "{topic} · stopped at question {n}",
      /** {topic} is the topic title, {min} minutes. */
      nextDetail: "{topic} · about {min} min",
      emptyDetail:
        "Add a topic in the vault, or run an exam-night pass over everything.",
      resume: "Resume session",
      startStep: "Start this step",
      /** Plural: "{count} weak point(s) blended in". */
      weakPoints_one: "{count} weak point blended in",
      weakPoints_other: "{count} weak points blended in",
    },
    roadmapHeading: "Your roadmap",
    seeEverything: "See everything",
    sinceStarted: "Since you started",
    progress: "Progress",
    /** {done} steps done, {total} total. */
    stepsMastered: "{done} of {total} steps mastered",
    activeRecall: "Active recall",
    dueForReview: "{count} due for review",
    recall: {
      fromLastSession: "From last session",
      fromLastSessionBody: "What you covered, plus anything left unresolved.",
      upToMilestone: "Up to a milestone",
      /** {title} is the milestone topic title (AI-generated). */
      upToMilestoneBody: "Everything through {title}.",
      upToMilestoneBodyEmpty: "Everything up to your first milestone.",
      examNight: "Exam night",
      examNightTitle: "Revise the whole vault",
      examNightBody:
        "One pass across everything you've studied, weakest first. Dimmed interface, no explanations — recall only.",
    },
  },
  roadmap: {
    /** {when} is a relative-time string (browser locale, out of scope). */
    adjusted: "Updated {when} based on your recent answers.",
    milestone: "milestone",
    yours: "yours",
    /** {n} is the estimated minutes. */
    minCount: "{n} min",
    /** Plural: "{count} session(s)". */
    sessionCount_one: "{count} session",
    sessionCount_other: "{count} sessions",
    blendedReview: "blended review",
    /** {title} is the topic title (AI-generated). */
    openTopic: "Open {title}",
    controls: {
      addByMyself: "Add by myself",
      modifyPrompt: "Modify prompt",
      addTitle: "Add a topic yourself",
      addDescription:
        "Anything the roadmap missed — a chapter your lecturer added, a gap you noticed.",
      addTopic: "Add topic",
      topicLabel: "Topic",
      topicPlaceholder: "e.g. Stereochemistry of ring systems",
      subtopicsLabel: "Subtopics",
      subtopicsHint:
        "One per line. Leave it blank and BenkyoAI fills them in when you open the topic.",
      modifyTitle: "Modify the instruction",
      modifyDescription:
        "This is what BenkyoAI works from when it builds or adjusts your roadmap. Edit it directly.",
      rebuild: "Rebuild roadmap",
      rebuildNote:
        "Rebuilding keeps your mastery on topics that survive the change. Anything that disappears takes its practice history with it.",
    },
  },
  pacing: {
    /** {note} is the AI-generated pacing note. */
    noDeadline: "No deadline set. {note}",
    /** {days} days, {date} a formatted date (browser locale). */
    daysTo: "{days} days to {date}",
    deadlinePassed: "Deadline passed",
    behind: "behind pace",
    onPace: "on pace",
    /** {perWeek} sessions/week, {perSession} min each, {note} AI pacing note. */
    sessionsNote: "{perWeek} sessions a week · {perSession} min each. {note}",
  },
  callback: {
    /** {when} is a relative-time string (browser locale). */
    pickingUp: "Picking up from {when}",
    checkStuck: "Check if it stuck",
    rereadFirst: "Re-read it first",
  },
  usage: {
    eyebrow: "AI usage on your key",
    estOnRoadmap: "est. on this roadmap",
    calls: "Calls",
    tokensIn: "Tokens in",
    tokensOut: "Tokens out",
    /** {calls} number of calls today, {cost} a formatted cost string. */
    todayNote:
      "Today across all roadmaps: {calls} calls, {cost}. Gemini is estimated at paid-tier list prices (free-tier keys are not charged), local Ollama models are free, and other providers are counted in tokens only.",
  },
  topic: {
    empty: {
      title: "That topic isn't in your vault",
      body: "It may have been removed when the roadmap was rebuilt.",
      back: "Back to vault",
    },
    /** {n} index, {m} total topics. */
    eyebrow: "Topic {n} of {m}",
    milestoneNote: "A milestone — recall runs against everything up to here.",
    reviewBlended: "review blended in",
    nextTopic: "Next topic",
    topicMastery: "Topic mastery",
    /** {done} mastered, {total} total subtopics. */
    stepsMastered: "{done} of {total} steps mastered.",
    depthNote:
      "Applies to explanations across this topic. You can change it mid-step without losing your place.",
  },
};
