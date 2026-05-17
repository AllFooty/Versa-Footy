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
    title: "Sign in to Versa Footy",
    subtitle: "Enter your email to receive a one-time code.",
    emailLabel: "Email",
    emailPlaceholder: "you@example.com",
    sendCode: "Send code",
    codeLabel: "Verification code",
    codePlaceholder: "6-digit code",
    verify: "Verify",
    resend: "Resend code",
    usePassword: "Use a password instead",
    passwordLabel: "Password",
    signIn: "Sign in",
    errors: {
      invalidEmail: "Please enter a valid email.",
      invalidCode: "Invalid or expired code.",
      generic: "Could not sign you in. Please try again.",
    },
    successCodeSent: "Check your email for the code.",
  },
};

export type ProductDict = typeof productEn;
