import type { ProductDict } from "./en";

export const productAr: ProductDict = {
  common: {
    appName: "فيرسا فوتي",
    loading: "جارٍ التحميل…",
    save: "حفظ",
    cancel: "إلغاء",
    delete: "حذف",
    confirm: "تأكيد",
    back: "رجوع",
    next: "التالي",
    edit: "تعديل",
    retry: "إعادة المحاولة",
    signOut: "تسجيل الخروج",
    requiredField: "مطلوب",
    genericError: "حدث خطأ ما. حاول مرة أخرى.",
  },
  shell: {
    nav: {
      home: "الرئيسية",
      academy: "الأكاديمية",
      library: "المكتبة",
      settings: "الإعدادات",
    },
    orgSwitcher: {
      ariaLabel: "تبديل المنظمة",
      empty: "لا توجد منظمات",
    },
  },
  login: {
    title: "تسجيل الدخول إلى فيرسا فوتي",
    subtitle: "أدخل بريدك الإلكتروني لاستلام رمز التحقق.",
    emailLabel: "البريد الإلكتروني",
    emailPlaceholder: "you@example.com",
    sendCode: "إرسال الرمز",
    codeLabel: "رمز التحقق",
    codePlaceholder: "رمز من ٦ أرقام",
    verify: "تحقق",
    resend: "إعادة إرسال الرمز",
    usePassword: "استخدم كلمة مرور بدلًا من ذلك",
    passwordLabel: "كلمة المرور",
    signIn: "تسجيل الدخول",
    errors: {
      invalidEmail: "يرجى إدخال بريد إلكتروني صحيح.",
      invalidCode: "رمز غير صالح أو منتهي.",
      generic: "تعذر تسجيل الدخول. حاول مرة أخرى.",
    },
    successCodeSent: "تحقق من بريدك للحصول على الرمز.",
  },
};
