// English dictionary — source of truth for landing page copy.
// Keep keys in section order to mirror the page narrative.

export const en = {
  meta: {
    title: "Versa Footy · A coach in every pocket",
    titleTemplate: "%s · Versa Footy",
    description:
      "AI football training for kids ages 7–14. Personalized sessions, 170 skills and 1,000+ drills. Launching in Saudi Arabia and the GCC.",
    ogDescription:
      "AI football training for kids ages 7–14. Launching across Saudi Arabia and the GCC.",
  },
  nav: {
    items: [
      { label: "Manifesto", id: "manifesto" },
      { label: "The Problem", id: "the-problem" },
      { label: "Meet Versa", id: "meet-versa" },
      { label: "The App", id: "the-app" },
      { label: "Skills", id: "skills" },
      { label: "For Coaches", id: "for-coaches" },
      { label: "FAQ", id: "faq" },
    ],
    cta: "Get Started",
    login: "Login",
    homeAria: "Versa Footy home",
    mainAria: "Main",
  },
  hero: {
    eyebrow: "For kids ages 7–14",
    headlineA: "Your kid deserves",
    headlineB: "a private coach",
    sub: "Meet Versa, an AI coach for football's technical skills.",
    stats: [
      { to: 170, suffix: "", label: "technical skills" },
      { to: 1000, suffix: "+", label: "drills" },
      { to: 10, suffix: "", label: "categories" },
    ],
    nameplate: { name: "Versa", role: "AI Football Coach" },
    versaAlt: "Versa, your kid’s AI coach",
  },
  manifesto: {
    chip: "Our Thesis",
    photoCaption: "Arsène Wenger",
    photoRole: "Former Arsenal Manager · FIFA Chief of Global Football Development",
    quotePartA: "You build a player like you build a house. First comes the basement, the base of a player is ",
    quoteTechnique: "technique",
    quotePartB: ". You get that between the ages of ",
    quoteAges: "7 and 14",
    quotePartC: ". If you have no technical skill at 14, forget it. You will never be a football player.",
    closingA: "Talent alone isn’t enough.",
    closingB: "The window closes at 15.",
    closingC: "But yours is still open.",
    seeMath: "See the math",
  },
  hoursGap: {
    chip: "Do the math",
    headlineA: "10,000 hours",
    headlineB: "170 skills",
    headlineC: "One window",
    intro:
      "Three numbers stand between an ordinary kid and an elite one. None of them close on their own. Here’s why.",
    path: {
      eyebrow: "The 10,000-hour path",
      sub: "Cumulative deliberate technical practice",
      target: "target",
      withoutLabel: "Without Versa",
      withLabel: "With Versa",
      hrs: "hrs",
      ofGoal: "% of the goal",
      withoutCaption: "Club training + matches + pickup",
      withCaption: "Same base + Versa’s daily technical reps",
    },
    skills: {
      eyebrow: "Not just hours",
      number: "170",
      unit: "skills",
      caption: "to master before 15",
      body:
        "Across 10 categories, from ball mastery and dribbling to crossing and finishing. Club training touches a handful per session. Most kids never get a structured tour of all 170.",
    },
    cost: {
      eyebrow: "The hidden cost",
      number: "150–300",
      unit: "SAR",
      caption: "per hour, private coaching",
      body:
        "That’s the entry fee to close the gaps before 15. Most families can’t sustain it. So the window closes, and the gaps stay open.",
    },
    closer: "We close the gaps.",
  },
  meetVersa: {
    chip: "",
    headlineA: "Meet",
    headlineB: "Versa",
    sub: "An AI coach companion designed to do everything a complete footballer does.",
    traits: [
      { label: "Species", value: "Desert falcon" },
      { label: "Age", value: "Acts fourteen" },
      { label: "Speaks", value: "Briefly, with weight" },
      { label: "Mission", value: "Close the gaps" },
    ],
    quote: [
      "Takes football seriously.",
      "Takes himself lightly.",
      "Speaks rarely, in short sentences.",
      "Sulks honestly when his player skips a day.",
    ],
    quoteAttribution: "",
    versaAlt: "Versa, the AI coach",
  },
  appShowcase: {
    chip: "The App",
    headlineA: "Your kid’s",
    headlineB: "pocket coach",
    sub: "Personalized sessions. Mastery tracking. Gamification that works. Available whenever they’re ready to train.",
    screens: [
      { title: "Skill Tree", caption: "Track mastery visually", alt: "Skill Tree: track mastery across 170 skills" },
      { title: "Daily Training", caption: "Versa coaches every rep", alt: "Training Drill: Versa coaches you through each rep" },
      { title: "Achievements", caption: "Celebrate every win", alt: "Achievement Unlocked: celebrate every milestone" },
    ],
  },
  skillUniverse: {
    chip: "The Library",
    headlineA: "skills",
    headlineB: "10 categories",
    sub:
      "Every skill a complete player needs. Every drill tested with real coaches. Adapted per age, level, and skill gap.",
    pickCluster: "Pick a cluster",
    pickClusterBody:
      "Each cluster is a category. Each dot is a skill. Hover to see how many a category holds.",
    skillsLabel: "skills",
    skillsBody:
      "Each skill builds through progressive drills, adapted to the player’s age and level.",
    legendSkills: "skills",
    legendDrills: "drills",
    legendCategories: "10 categories",
    adapted: "Adapted per age · level · gap",
    bottomStats: ["{total} total skills", "{drills} drills", "AI-adapted per player"],
  },
  voice: {
    chip: "The Voice",
    headlineA: "Coaches,",
    headlineB: "not cheerleaders",
    versaAlt: "Versa winking",
    notificationsAria: "Sample notifications from Versa",
    notifications: [
      { time: "6:42 AM", body: "Versa is waiting." },
      { time: "Now", body: "The ball is waiting. Twenty minutes today?" },
      { time: "2 min ago", body: "Mastered. Next." },
      { time: "Streak", body: "Five days strong. Same time tomorrow?" },
    ],
    ruleLabel: "Rule",
    rules: [
      {
        n: "01",
        title: "Coaches, not cheerleaders",
        body:
          "Real coaches don’t shower kids with empty praise. They acknowledge effort, name what went well, ask for one more.",
      },
      {
        n: "02",
        title: "We are brief",
        body:
          "When in doubt, cut a sentence. One beat shorter than feels comfortable is usually right.",
      },
      {
        n: "03",
        title: "No exclamation marks",
        body:
          "Our voice has weight. The strongest sentences land harder without them.",
      },
    ],
  },
  faq: {
    chip: "FAQ",
    headlineA: "Questions,",
    headlineB: "answered",
    sub: "What parents and coaches ask before they sign their kid up.",
    showMore: "Show more questions",
    showLess: "Show fewer questions",
    items: [
      {
        q: "Who is Versa Footy for?",
        a: "Kids ages 7–14, at any level. Beginners get patient fundamentals. Advanced players get harder reps. Versa adapts to where your kid actually is, not where their age group is supposed to be.",
      },
      {
        q: "Do players need a club or coach to use it?",
        a: "No. Versa works on its own. A kid with a ball, a bit of space, and a phone is enough. If they already train with a club, Versa fills the hours between sessions.",
      },
      {
        q: "How much time does it take?",
        a: "Sessions are short on purpose, usually 15 to 25 minutes. The point is daily reps, not long workouts. Five focused days a week beats one long one.",
      },
      {
        q: "What equipment do you need?",
        a: "A ball and a phone. Most drills run in a small patch of space: a backyard, a driveway, a corner of a pitch. Cones help but aren't required.",
      },
      {
        q: "How does Versa track progress without grading kids?",
        a: "Versa tracks mastery as a journey, not a score. The app shows what's been worked on and what's next. Kids see growth; they don't see rankings or percentages that could turn training into pressure.",
      },
      {
        q: "Can coaches and academies use it with a whole squad?",
        a: "Yes. We offer institutional pricing and a coach dashboard that shows team analytics and where each player is climbing fastest. Academy partnerships are open now.",
      },
      {
        q: "When is it available and how much does it cost?",
        a: "Versa Footy is launching across Saudi Arabia and the GCC. Pricing for families and academies will be shared at launch. Drop your details on the site and we'll let you know the moment it's live.",
      },
      {
        q: "Is the training safe for young kids?",
        a: "Yes. Drills are built for the body of a 7–14 year old: short reps, low impact, no contact, no heavy load work. Versa pushes effort, not exhaustion, and tells kids to stop when form breaks down.",
      },
      {
        q: "How does Versa's AI personalization work?",
        a: "Versa picks each day's session based on your kid's age, level, and what they've worked on recently. If a skill is sticking, Versa moves on. If it isn't, the next session circles back with a slightly different angle until it clicks.",
      },
      {
        q: "Can Versa help with weak-foot development?",
        a: "Yes. It's one of the gaps Versa actively closes. The program checks both feet across most skills and assigns extra reps to whichever side is lagging, so kids stop being one-footed by accident.",
      },
      {
        q: "How can parents be involved in the training?",
        a: "Parents don't need to coach. Versa runs the session; the parent's job is to make space and show up. The app gives you a simple weekly view so you can see what your kid worked on without having to quiz them about it.",
      },
      {
        q: "Is the methodology backed by science?",
        a: "Versa's framework is built on the same youth development principles used by elite academies: deliberate practice, age-appropriate progressions, and the technical window between 7 and 14. Every drill in the library is tested with real coaches before it ships.",
      },
    ],
  },
  forCoaches: {
    chip: "For Coaches & Academies",
    headlineA: "Extend",
    headlineB: "your reach",
    sub:
      "Your players train with Versa between sessions. You get the analytics. The skill gaps they fill at home show up in your next practice.",
    bullets: [
      "Coach dashboard with team analytics",
      "Player progress visible week-to-week",
      "Institutional pricing per player",
      "Your coaching, amplified, not replaced",
    ],
    cta: "Partner with us",
    ctaNote: "Academy partnerships now open. Get in touch to onboard your players.",
    dashboard: {
      label: "Academy Dashboard Preview",
      sessions: "Sessions this month",
      sessionsValue: "380",
      active: "Active this week",
      activeValue: "23/28",
      highlightLabel: "Player highlight",
      highlightBody: "Ahmad K. · climbing fastest in dribbling",
    },
  },
  finalCta: {
    headlineA: "Versatility",
    headlineB: "wins",
    sub: "Download Versa Footy. Start training today.",
    wordmarkAlt: "VERSA FOOTY",
    versaAlt: "Versa celebrating",
  },
  stores: {
    heading: "Download Versa Footy",
    appStore: {
      caption: "Download on the",
      name: "App Store",
      ariaLabel: "Download Versa Footy on the App Store",
    },
    googlePlay: {
      caption: "Coming soon to",
      name: "Google Play",
      badge: "Coming soon",
      ariaLabel: "Versa Footy is coming soon to Google Play",
    },
  },
  family: {
    eyebrow: "Part of the",
    headlineA: "ALL Footy",
    headlineB: "Family",
    sub: "One mission. Four products. Every part of the game.",
    youreHere: "you’re here",
    visitAria: "Visit {name}",
    brands: {
      versa: "VERSA Footy",
      fair: "FAIR Footy",
      kaas: "KAAS Footy",
      juggle: "JUGGLE Footy",
    },
  },
  about: {
    meta: {
      title: "About Versa Footy",
      description:
        "How Versa Footy was built, the coaching belief behind every drill, and the team closing the technical window for kids ages 7–14.",
    },
    nav: { label: "About" },
    hero: {
      eyebrow: "About Versa Footy",
      headlineA: "We're closing",
      headlineB: "the window",
      sub: "A coach in every pocket, built so the next generation of players doesn't run out of time before they run out of talent.",
      versaAlt: "Versa, focused",
    },
    mission: {
      chip: "Our Mission",
      headlineA: "Mastery",
      headlineB: "for every kid",
      body:
        "Elite training is locked behind private coaching most families can't sustain. Versa Footy makes deliberate, structured technical practice available to any kid with a ball and a phone, every day, between the ages where it actually counts.",
      pillars: [
        {
          title: "The technical window",
          body:
            "Between 7 and 14, the body learns football the way it never will again. Miss it and the gaps stay open. Our entire product is built around that window.",
        },
        {
          title: "Coaches, not cheerleaders",
          body:
            "Versa speaks with the weight of a real coach: brief, honest, focused on the next rep. No empty praise. No turning training into a leaderboard.",
        },
        {
          title: "Mastery as a journey",
          body:
            "Progress is shown the way a coach sees it: what's been worked, what's next, where the gaps still are. We don't reduce a kid's growth to a number.",
        },
      ],
    },
    story: {
      chip: "Our Story",
      headlineA: "Why",
      headlineB: "Versa exists",
      paragraphs: [
        "Versa Footy started with a question every football parent asks: my kid loves the game, what now? Club practice is twice a week. Real technical work is hours of focused reps. Most families can't bridge that gap on their own.",
        "We saw the same pattern across Saudi Arabia and the GCC. Talented kids, real ambition, and a hard window that closes at fifteen. Private coaches close it for the few. Everyone else runs out of time.",
        "So we built Versa, an AI coach designed to live in a kid's pocket and put deliberate technical practice in their day, every day, the way an elite academy would. Built with real coaches. Tuned to the body of a 7–14 year old. Honest about effort, patient about progress.",
      ],
      pullQuote:
        "If you have no technical skill at 14, forget it. You will never be a football player.",
      pullQuoteAttribution: "Arsène Wenger",
    },
    team: {
      chip: "The Team",
      headlineA: "Built by",
      headlineB: "people who play",
      sub: "Founders, coaches, and engineers building Versa from Riyadh.",
      members: [
        {
          name: "Mubdu Alali",
          role: "Co-founder & CEO",
          bio: "A visionary entrepreneur and Top 30 Under 30 Innovator, Mubdu brings extensive experience in sports technology and startup development to Versa Footy. His passion for social entrepreneurship and youth development drives the company's mission to empower young athletes through AI-powered training.",
          imageAlt: "Mubdu Alali, Co-founder & CEO",
        },
        {
          name: "Hussain Bin Ahmed",
          role: "Co-founder & COO",
          bio: "Hussain combines his expertise as a physiotherapist with his experience as a media content creator to drive Versa Footy's operations and content strategy. His background in sports training and rehabilitation informs the company's science-based methodology for holistic athlete development.",
          imageAlt: "Hussain Bin Ahmed, Co-founder & COO",
        },
      ],
    },
    family: {
      chip: "All Footy",
      headlineA: "Part of the",
      headlineB: "ALL Footy family",
      body:
        "Versa Footy is one of four products under All Footy, each tackling a different part of the game. Same mission. Different angles.",
    },
    backToHome: "Back to home",
  },
  footer: {
    subBrand: "A sub-brand of All Footy",
    location: "Riyadh, Saudi Arabia",
    year: "2026",
    logoAlt: "Versa Footy",
  },
  switcher: {
    label: "Language",
    en: "EN",
    ar: "ع",
  },
  a11y: {
    skipToContent: "Skip to main content",
  },
  getStartedModal: {
    title: "How would you like to get started?",
    subtitle: "Download the app to train with Versa, or sign in to your existing account.",
    download: {
      label: "Download the app",
      description: "Get Versa on the App Store. Google Play coming soon.",
    },
    login: {
      label: "Log in",
      description: "Continue with your existing Versa Footy account.",
    },
    closeAria: "Close",
  },
  privacy: {
    nav: { label: "Privacy" },
    meta: {
      title: "Privacy Policy",
      description: "How Versa Footy collects, uses, and protects your data.",
    },
    title: "Privacy Policy",
    lastUpdated: "Last updated: May 17, 2026",
    intro:
      "This Privacy Policy explains how Versa Footy (\"we\", \"us\", \"our\") collects, uses, shares, and protects your information when you use the Versa Footy mobile app and website (the \"Service\"). By using the Service, you agree to the terms described here.",
    sections: [
      {
        heading: "Information We Collect",
        body: "We collect information you provide directly (such as your name, email, and a child's age range when signing up) and limited technical data (device type, app version, anonymized usage events) needed to deliver and improve training sessions.",
      },
      {
        heading: "How We Use Your Information",
        body: "We use your information to personalize training drills, communicate important account and product updates, measure aggregated product performance, and comply with legal obligations. We do not sell your personal data.",
      },
      {
        heading: "Children's Privacy",
        body: "Versa Footy is designed for kids 7–14 and we take children's privacy seriously. Accounts must be created and managed by a parent or legal guardian. We collect the minimum information necessary to deliver personalized training and never use a child's data for advertising.",
      },
      {
        heading: "Data Sharing",
        body: "We share data only with vetted infrastructure providers (such as our hosting and authentication partners) under strict contractual safeguards, and when required by law. We never sell data to advertisers or third parties.",
      },
      {
        heading: "Your Rights",
        body: "You may access, update, export, or delete your account information at any time from the app settings, or by contacting us. We honor data-protection rights under applicable law, including the right to withdraw consent.",
      },
      {
        heading: "Contact Us",
        body: "Questions about this policy? Email privacy@versafooty.com and we will respond within 7 business days.",
      },
    ],
  },
};

export type Dict = typeof en;
