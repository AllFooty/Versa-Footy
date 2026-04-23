-- ============================================
-- Migration 017: Seed Arabic Translations for Achievements
--
-- Backfills name_ar / description_ar on the seed achievement rows
-- inserted by migration 004. The Arabic columns themselves were
-- added in migration 007. Matching is done by English name to keep
-- this idempotent regardless of the auto-assigned serial id.
-- ============================================

UPDATE public.achievements SET
  name_ar = 'الخطوات الأولى',
  description_ar = 'أكمل تمرينك الأول'
WHERE name = 'First Steps';

UPDATE public.achievements SET
  name_ar = 'البداية',
  description_ar = 'اكسب ١٠٠ نقطة خبرة'
WHERE name = 'Getting Started';

UPDATE public.achievements SET
  name_ar = 'الثلاثية',
  description_ar = 'أكمل ١٠ تمارين'
WHERE name = 'Triple Threat';

UPDATE public.achievements SET
  name_ar = 'نادي المئة',
  description_ar = 'أكمل ١٠٠ تمرين'
WHERE name = 'Century Club';

UPDATE public.achievements SET
  name_ar = 'صياد الخبرة',
  description_ar = 'اكسب ١٬٠٠٠ نقطة خبرة إجمالية'
WHERE name = 'XP Hunter';

UPDATE public.achievements SET
  name_ar = 'سيد الخبرة',
  description_ar = 'اكسب ١٠٬٠٠٠ نقطة خبرة إجمالية'
WHERE name = 'XP Master';

UPDATE public.achievements SET
  name_ar = 'خانتان',
  description_ar = 'الوصول إلى المستوى ١٠'
WHERE name = 'Double Digits';

UPDATE public.achievements SET
  name_ar = 'ثلاث على التوالي',
  description_ar = 'حافظ على سلسلة لمدة ٣ أيام'
WHERE name = 'Three-peat';

UPDATE public.achievements SET
  name_ar = 'محارب الأسبوع',
  description_ar = 'حافظ على سلسلة لمدة ٧ أيام'
WHERE name = 'Week Warrior';

UPDATE public.achievements SET
  name_ar = 'تركيز أسبوعين',
  description_ar = 'حافظ على سلسلة لمدة ١٤ يومًا'
WHERE name = 'Fortnight Focus';

UPDATE public.achievements SET
  name_ar = 'سيد الشهر',
  description_ar = 'حافظ على سلسلة لمدة ٣٠ يومًا'
WHERE name = 'Monthly Master';

UPDATE public.achievements SET
  name_ar = 'بداية المهارة',
  description_ar = 'أتقن مهارتك الأولى'
WHERE name = 'Skill Starter';

UPDATE public.achievements SET
  name_ar = 'متعدد المهارات',
  description_ar = 'أتقن ٥ مهارات'
WHERE name = 'Versatile';

UPDATE public.achievements SET
  name_ar = 'جامع المهارات',
  description_ar = 'أتقن ١٠ مهارات'
WHERE name = 'Skill Collector';

UPDATE public.achievements SET
  name_ar = 'مستكشف',
  description_ar = 'جرّب تمارين من ٣ فئات مختلفة'
WHERE name = 'Explorer';

UPDATE public.achievements SET
  name_ar = 'شامل',
  description_ar = 'جرّب تمارين من جميع الفئات'
WHERE name = 'All-Rounder';

UPDATE public.achievements SET
  name_ar = 'باحث عن التحدي',
  description_ar = 'أكمل تمرينًا بصعوبة ٥ نجوم'
WHERE name = 'Challenge Seeker';
