export const productEn = {
  common: {
    appName: "Versa Footy",
    loading: "Loading…",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    confirm: "Confirm",
    back: "Back",
    next: "Next",
    edit: "Edit",
    retry: "Retry",
    signOut: "Sign out",
    requiredField: "Required",
    genericError: "Something went wrong. Please try again.",
  },
  shell: {
    nav: {
      home: "Home",
      academy: "Academy",
      library: "Library",
      settings: "Settings",
    },
    orgSwitcher: {
      ariaLabel: "Switch organization",
      empty: "No organizations",
    },
  },
  login: {
    eyebrowEmail: "Sign in",
    eyebrowOtp: "Verify",
    titleEmail: "Welcome to Versa Footy",
    titleOtp: "Enter your code",
    subtitleEmail: "Enter your email and we'll send you a one-time code.",
    subtitleOtp: "We sent a 6-digit code to {{email}}. Enter it below to continue.",
    emailLabel: "Email address",
    emailPlaceholder: "coach@example.com",
    sendCode: "Send code",
    sendingCode: "Sending…",
    codeLabel: "Verification code",
    codePlaceholder: "••••••",
    verify: "Sign in",
    verifying: "Verifying…",
    resend: "Resend code",
    resendCooldown: "Resend in {{seconds}}s",
    useDifferentEmail: "Use a different email",
    backToHome: "Back to home",
    success: "Signed in. Redirecting…",
    devToggleShow: "Developer sign-in",
    devToggleHide: "Hide developer sign-in",
    devPasswordPlaceholder: "Password",
    devSignIn: "Sign in with password",
    devSigningIn: "Signing in…",
    errors: {
      enterEmail: "Please enter your email.",
      invalidEmail: "Please enter a valid email.",
      enterOtp: "Please enter the code.",
      enterOtp6Digit: "Please enter all 6 digits.",
      resendFailed: "Couldn't resend the code. Try again.",
      generic: "Something went wrong. Please try again.",
    },
    codeSent: "Check your email for the code.",
    newCodeSent: "A new code has been sent.",
  },
  home: {
    eyebrow: "Dashboard",
    welcomeBack: "Welcome back, {{firstName}}",
    welcomeGeneric: "Welcome to Versa Footy",
    subtitle: "Here's a quick look at your academies and what to do next.",
    whereToGo: "Pick where you want to go next.",
    noOrgsTitle: "Create your academy",
    noOrgsDescription: "Set up an organization to start adding coaches and players.",
    createCta: "Create",
    haveInviteCode: "Have an invite code?",
    stats: {
      myAcademies: "My Academies",
      activeAcademy: "Active Academy",
      pendingInvitations: "Pending Invitations",
    },
    quickActions: "Quick actions",
    actions: {
      academy: {
        title: "Academy Dashboard",
        description: "Players, coaches, and team performance.",
      },
      createAcademy: {
        title: "Create Academy",
        description: "Spin up a new organization in minutes.",
      },
      library: {
        title: "Exercise Library",
        description: "Manage skills, drills, and videos.",
      },
      videosAudit: {
        title: "Videos Audit",
        description: "Review and moderate uploaded videos.",
      },
      account: {
        title: "Account",
        description: "Profile and account settings.",
      },
    },
  },
  settings: {
    eyebrow: "Account",
    title: "Settings",
    subtitle: "Update your profile and manage your account.",
    backToHome: "Back to dashboard",
    profileInfo: "Profile",
    yourName: "Your name",
    fullNameLabel: "Full name",
    fullNamePlaceholder: "How should we address you?",
    emailLabel: "Email",
    emailCannotChange: "Email is tied to your account and can't be changed here.",
    saveChanges: "Save changes",
    saving: "Saving…",
    profileSaved: "Profile updated.",
    editCooldownLocked:
      "You recently updated your name. You can edit it again in {{days}} day(s).",
    enterNameError: "Please enter your name.",
    dangerZone: "Danger zone",
    deleteAccountTitle: "Delete account",
    deleteAccountWarning:
      "Deleting your account permanently removes your profile, organizations, and data. This cannot be undone.",
    deleteAccountButton: "Delete my account",
    deleting: "Deleting…",
    deleteConfirmTitle: "Delete account?",
    deleteConfirmDescription:
      "This will permanently remove your profile and all related data. This cannot be undone.",
    deleteConfirmButton: "Yes, delete my account",
  },
  preferences: {
    title: "Email preferences",
    loadingTitle: "Loading your preferences…",
    introUser: "Choose what kind of emails you want from Versa Footy at {{email}}.",
    introUserNoEmail: "Choose what kind of emails you want from Versa Footy.",
    introWaitlist:
      "You're on the Android waitlist. We'll only email you about the launch.",
    categories: {
      product_updates: {
        label: "Product updates",
        description: "New features, releases, and what we shipped.",
      },
      training_tips: {
        label: "Training tips",
        description: "Coaching content and how-to-train-better posts.",
      },
      promotions: {
        label: "Promotions",
        description: "Discounts, special offers, and event invites.",
      },
    },
    save: "Save preferences",
    saving: "Saving…",
    saved: "Preferences saved.",
    unsubAll: "Unsubscribe from everything",
    transactionalNote:
      "Note: you'll still receive transactional emails like login codes if you have an account.",
    backToHome: "Back to Versa Footy",
    errors: {
      missingToken: "Missing token in URL.",
      invalidToken: "This link is invalid or has expired.",
      loadFailed: "Could not load your preferences.",
      saveFailed: "Could not save preferences.",
    },
    supportFallback:
      "If this keeps happening, email hi@all4footy.com and we'll fix it manually.",
  },
  unsubscribe: {
    title: "Unsubscribe",
    processing: "Processing your request…",
    successHeading: "You've been unsubscribed",
    successWithEmail:
      "We've removed {{email}} from our marketing list. You won't receive any more marketing emails from us.",
    successNoEmail:
      "We've removed your email from our marketing list. You won't receive any more marketing emails from us.",
    transactionalNote:
      "Note: you'll still receive transactional emails like login codes if you have an account.",
    alreadyHeading: "Already unsubscribed",
    alreadyBody:
      "This email is already removed from our marketing list. No further action needed.",
    errorHeading: "Something went wrong",
    errors: {
      missingToken: "Missing unsubscribe token in URL.",
      invalidToken: "This unsubscribe link is invalid or has expired.",
      generic: "Could not process unsubscribe. Please try again.",
    },
    supportFallback:
      "If this keeps happening, email hi@all4footy.com and we'll remove you manually.",
    backToHome: "Back to Versa Footy",
  },
  terms: {
    nav: { label: "Terms" },
    meta: {
      title: "Terms of Service",
      description: "The terms that govern your use of Versa Footy.",
    },
    title: "Terms of Service",
    lastUpdated: "Last updated: May 17, 2026",
    intro:
      "These Terms of Service (\"Terms\") govern your access to and use of the Versa Footy mobile app and website (the \"Service\"). By using the Service, you agree to these Terms.",
    sections: [
      {
        heading: "Eligibility & accounts",
        body: "Versa Footy is built for kids ages 7–14. Accounts must be created and managed by a parent or legal guardian. You are responsible for keeping your account credentials secure and for activity on your account.",
      },
      {
        heading: "Acceptable use",
        body: "You agree not to misuse the Service, including by attempting to disrupt it, reverse-engineer it, or use it to harass other users. We may suspend or terminate accounts that violate these Terms.",
      },
      {
        heading: "Content and licenses",
        body: "Content you submit (notes, video uploads, profile data) remains yours. You grant Versa Footy a limited license to host, display, and process that content to operate the Service. Coaching content, drills, and videos provided by Versa Footy remain our property.",
      },
      {
        heading: "Subscriptions and payments",
        body: "Some features require a paid subscription. Billing terms, renewal, and refund policies will be presented at purchase. Trials and promotions may have specific eligibility rules.",
      },
      {
        heading: "Disclaimers",
        body: "The Service is provided \"as is\" without warranties. Coaching content is educational and is not a substitute for in-person supervision or medical advice. Use sound judgment about player safety.",
      },
      {
        heading: "Limitation of liability",
        body: "To the maximum extent permitted by law, Versa Footy and All Footy are not liable for indirect, incidental, or consequential damages arising from your use of the Service.",
      },
      {
        heading: "Changes",
        body: "We may update these Terms from time to time. We'll post the new effective date here, and notify you in-app for material changes.",
      },
      {
        heading: "Contact",
        body: "Questions? Email hi@all4footy.com.",
      },
    ],
  },
};

export type ProductDict = typeof productEn;
