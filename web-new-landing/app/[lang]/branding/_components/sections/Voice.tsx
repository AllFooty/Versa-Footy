"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { EASE_VERSA } from "../../../../_data/motion";
import { Annotation } from "../../../../_components/primitives/Annotation";
import { Chip } from "../../../../_components/primitives/Chip";
import { PhoneCard, type PhoneCardData } from "../../../../_components/primitives/PhoneCard";

type Slot = {
  data: PhoneCardData;
  top: string;
  left: string;
  rotate: number;
  depth: number;
  delay: number;
};

const slots: Slot[] = [
  { data: { time: "6:42 AM", body: "Versa is waiting." }, top: "6%", left: "4%", rotate: -8, depth: 0.7, delay: 0 },
  { data: { time: "Now", body: "You weren't here yesterday. The ball was. Come back." }, top: "14%", left: "32%", rotate: 4, depth: 0.3, delay: 0.1 },
  { data: { time: "2 min ago", body: "Mastered. Next." }, top: "8%", left: "62%", rotate: 10, depth: 0.55, delay: 0.2 },
  { data: { time: "11:08 PM", body: "Close. Adjust your plant foot. Again." }, top: "46%", left: "8%", rotate: 6, depth: 0.45, delay: 0.3 },
  { data: { time: "Today", body: "Speed Demon. Earned." }, top: "44%", left: "40%", rotate: -6, depth: 0.85, delay: 0.4 },
  { data: { time: "Streak", body: "Five days. Don't lose it now." }, top: "48%", left: "68%", rotate: 9, depth: 0.2, delay: 0.5 },
];

type Rule = {
  no: string;
  title: string;
  body: string;
  kind: "negation" | "craft";
};

const rules: Rule[] = [
  {
    no: "01",
    title: "We are coaches, not cheerleaders",
    body: "Real coaches don't shower kids with empty praise. They acknowledge effort, name what went well, ask for one more.",
    kind: "negation",
  },
  {
    no: "02",
    title: "We are brief",
    body: "When in doubt, cut a sentence. One beat shorter than feels comfortable is usually right.",
    kind: "negation",
  },
  {
    no: "03",
    title: "We don't use exclamation marks",
    body: "Our voice has weight. The strongest sentences land harder without them.",
    kind: "negation",
  },
  {
    no: "04",
    title: "See. Name. Nudge.",
    body: "The coaching method, embedded in the voice. Name what went well, then ask for one more. New in v1.0, the only positive rule, and the load-bearing one.",
    kind: "craft",
  },
];

type Register = {
  name: string;
  rule: string;
  examples: string[];
};

const registers: Register[] = [
  {
    name: "Versa speaks",
    rule: "Brief, observational. Fragments OK. ≤ 12 words, ≤ 2 sentences. The in-app voice. He speaks briefly, not constantly, only when there is something worth saying.",
    examples: [
      "Mastered. Next.",
      "Speed Demon. Earned.",
      "Five days. Don't lose it now.",
      "Close. Adjust your plant foot. Again.",
      "You weren't here yesterday. The ball was. Come back.",
      "Versa is waiting.",
    ],
  },
  {
    name: "About Versa",
    rule: "Poetic, third-person, reflective. Longer sentences allowed. Used in character bible, app intro, “About” copy.",
    examples: [
      "Takes football seriously. Takes himself lightly.",
      "Speaks rarely, in short sentences.",
      "Sulks honestly when his player skips a day.",
    ],
  },
  {
    name: "The brand speaks",
    rule: "Editorial, declarative, expansive. Parallel structure encouraged. Used in marketing, headlines, manifesto. Eight verbatim lines below, ranked: declarative · sober · poetic · triumphant.",
    examples: [
      "Every kid deserves a coach.",
      "We are that coach.",
      "We close the hours gap.",
      "Talent isn't decided by what your family can afford.",
      "The hours decide. We give you the hours.",
      "Coached, not just played.",
      "A coach in every pocket.",
      "Versatility wins.",
    ],
  },
];

const antiList = [
  "Awesome!",
  "You got this 💪",
  "Way to go!",
  "Don't give up champion!",
  "Try your best!",
  "You're the best!",
  "Keep going superstar ✨",
];

export function VoiceSection() {
  const fanRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: fanRef,
    offset: ["start end", "end start"],
  });

  return (
    <section
      id="voice"
      className="relative isolate w-full overflow-hidden bg-cream py-28"
    >
      <div aria-hidden className="bg-noise absolute inset-0 opacity-20" />

      <div className="relative z-10 mx-auto flex w-full max-w-[1500px] flex-col gap-20 px-6 md:px-10 lg:px-16">
        {/* header */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
          <div className="md:col-span-4">
            <Chip tone="burgundy" size="xs">
              06 · Voice & Tone
            </Chip>
            <h2 className="mt-4 font-display font-black uppercase leading-[0.95] text-accent-dark text-[clamp(36px,5vw,72px)] tracking-[-0.02em]">
              Coaches.
              <span className="block">Not cheerleaders.</span>
              <span className="block text-burgundy">Brief. With weight.</span>
            </h2>
          </div>
          <div className="md:col-span-8 md:pt-2">
            <p className="font-sans text-[clamp(15px,1.4vw,19px)] leading-snug text-warm-shadow">
              Four rules. One test. A 12-word ceiling for anything Versa says. Three registers: what Versa says, what we say about him, what the brand says. And a short list of things we will not say, ever.
            </p>
          </div>
        </div>

        {/* the four rules */}
        <div className="flex flex-col gap-6">
          <div className="flex items-baseline justify-between">
            <h3 className="font-display uppercase text-heading-s tracking-[0.04em] text-accent-dark">
              The four rules
            </h3>
            <span className="font-display uppercase label-xs text-accent-dark/70">
              Three negation · one craft
            </span>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {rules.map((r, i) => (
              <motion.div
                key={r.no}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-10% 0px" }}
                transition={{ duration: 0.6, delay: i * 0.08, ease: EASE_VERSA }}
                className={`rounded-2xl border p-6 backdrop-blur ${
                  r.kind === "craft"
                    ? "border-glyph-gold/60 bg-glyph-gold/10"
                    : "border-accent-dark/10 bg-cream/40"
                }`}
              >
                <div className="flex items-baseline justify-between">
                  <span className="font-display uppercase label-xs text-burgundy">
                    {r.no} · {r.kind === "craft" ? "Craft rule" : "Rule"}
                  </span>
                  {r.kind === "craft" && (
                    <span className="rounded-full bg-glyph-gold px-2 py-0.5 font-display label-xs uppercase text-accent-dark">
                      new · v1.0
                    </span>
                  )}
                </div>
                <h4 className="mt-3 font-display uppercase text-heading-s tracking-[0.02em] text-accent-dark leading-snug">
                  {r.title}
                </h4>
                <p className="mt-3 font-sans text-body-s leading-snug text-accent-dark/75">
                  {r.body}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* the voice test — phone fan + centered capsule */}
        <div ref={fanRef} className="relative">
          {/* warm vignette */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -mx-6 md:-mx-10 lg:-mx-16"
            style={{
              background:
                "radial-gradient(120% 80% at 50% 40%, rgba(255,255,255,0) 0%, rgba(255,210,74,0.10) 50%, rgba(187,90,43,0.14) 85%, rgba(36,23,15,0.14) 100%)",
            }}
          />

          {/* desktop fan */}
          <div className="relative hidden h-[860px] w-full md:block">
            {slots.map((s, i) => (
              <ParallaxSlot
                key={i}
                scrollYProgress={scrollYProgress}
                depth={s.depth}
                style={{ top: s.top, left: s.left }}
                className="absolute"
              >
                <PhoneCard data={s.data} rotate={s.rotate} delay={s.delay} />
              </ParallaxSlot>
            ))}

            {/* centered voice-test capsule */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10% 0px" }}
              transition={{ duration: 1, delay: 0.6, ease: EASE_VERSA }}
              className="pointer-events-none absolute left-1/2 top-[36%] z-30 w-[min(560px,90%)] -translate-x-1/2 -translate-y-1/2"
            >
              <div className="rounded-3xl border border-accent-dark/15 bg-cream/80 px-8 py-9 text-center backdrop-blur-xl shadow-floating">
                <p className="font-display uppercase label-xs text-burgundy">
                  The voice test
                </p>
                <p className="mt-4 font-display font-black leading-[1.1] text-accent-dark text-[clamp(22px,2.6vw,34px)] tracking-[-0.01em]">
                  &ldquo;Would a real coach say this to a real player?&rdquo;
                </p>
                <p className="mt-3 font-sans text-[clamp(13px,1.1vw,15px)] text-warm-shadow">
                  If yes, ship it. If no, cut.
                </p>
              </div>
            </motion.div>
          </div>

          {/* mobile stack */}
          <div className="relative flex w-full flex-col items-center gap-6 md:hidden">
            {slots.map((s, i) => (
              <PhoneCard
                key={i}
                data={s.data}
                rotate={0}
                delay={Math.min(s.delay, 0.3)}
              />
            ))}
            <div className="mt-2 w-full rounded-3xl border border-accent-dark/15 bg-cream/80 px-6 py-8 text-center backdrop-blur-xl shadow-floating">
              <p className="font-display uppercase label-xs text-burgundy">
                The voice test
              </p>
              <p className="mt-3 font-display font-black leading-[1.1] text-accent-dark text-[clamp(20px,5vw,28px)] tracking-[-0.01em]">
                &ldquo;Would a real coach say this to a real player?&rdquo;
              </p>
              <p className="mt-3 font-sans text-body-s text-warm-shadow">
                If yes, ship it. If no, cut.
              </p>
            </div>
          </div>
        </div>

        {/* brevity budget */}
        <div className="grid grid-cols-1 gap-10 md:grid-cols-12">
          <div className="md:col-span-4">
            <span className="font-display uppercase label-xs text-burgundy">
              Brevity budget
            </span>
            <h3 className="mt-3 font-display uppercase text-heading-s tracking-[0.04em] text-accent-dark">
              Twelve words. Two sentences.
            </h3>
            <p className="mt-3 font-sans text-caption leading-snug text-accent-dark/70">
              The cap applies only when Versa speaks. About-Versa and Brand copy have their own latitude.
            </p>
          </div>
          <div className="md:col-span-8 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-deep-teal/30 bg-deep-teal/[0.04] p-6">
              <div className="font-display uppercase label-xs text-deep-teal">
                ✓ Within budget
              </div>
              <ul className="mt-4 space-y-3 font-sans text-body-s leading-snug text-accent-dark">
                <li>
                  &ldquo;Mastered. Next.&rdquo;
                  <span className="ml-2 font-display label-xs text-accent-dark/70">2 words</span>
                </li>
                <li>
                  &ldquo;Speed Demon. Earned.&rdquo;
                  <span className="ml-2 font-display label-xs text-accent-dark/70">3 words</span>
                </li>
                <li>
                  &ldquo;Close. Adjust your plant foot. Again.&rdquo;
                  <span className="ml-2 font-display label-xs text-accent-dark/70">6 words</span>
                </li>
                <li>
                  &ldquo;Five days. Don&rsquo;t lose it now.&rdquo;
                  <span className="ml-2 font-display label-xs text-accent-dark/70">7 words</span>
                </li>
              </ul>
            </div>
            <div className="rounded-2xl border border-burgundy/30 bg-burgundy/[0.04] p-6">
              <div className="font-display uppercase label-xs text-burgundy">
                ✗ Over budget
              </div>
              <ul className="mt-4 space-y-3 font-sans text-body-s leading-snug text-accent-dark">
                <li>
                  &ldquo;Hey there! Great work today, you really smashed that drill. Let&apos;s keep that energy going!&rdquo;
                  <span className="ml-2 font-display label-xs text-burgundy">17 words</span>
                </li>
                <li>
                  &ldquo;Don&apos;t worry if you didn&apos;t get it perfect, the important thing is you tried.&rdquo;
                  <span className="ml-2 font-display label-xs text-burgundy">15 words</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* the three registers */}
        <div className="flex flex-col gap-6">
          <div className="flex items-baseline justify-between">
            <h3 className="font-display uppercase text-heading-s tracking-[0.04em] text-accent-dark">
              Three registers
            </h3>
            <span className="font-display uppercase label-xs text-accent-dark/70">
              Pick before you write
            </span>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {registers.map((r, i) => (
              <motion.div
                key={r.name}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-10% 0px" }}
                transition={{ duration: 0.6, delay: i * 0.08, ease: EASE_VERSA }}
                className="rounded-2xl border border-accent-dark/10 bg-cream/40 p-6 backdrop-blur"
              >
                <span className="font-display uppercase label-xs text-burgundy">
                  Register · {String(i + 1).padStart(2, "0")}
                </span>
                <h4 className="mt-3 font-display uppercase text-heading-s tracking-[0.04em] text-accent-dark">
                  {r.name}
                </h4>
                <p className="mt-3 font-sans text-caption leading-snug text-accent-dark/70">
                  {r.rule}
                </p>
                <div className="mt-5 border-t border-accent-dark/10 pt-4">
                  <span className="font-display uppercase label-xs text-accent-dark/70">
                    Verbatim examples
                  </span>
                  <ul className="mt-3 space-y-2 font-sans text-[13.5px] leading-snug text-accent-dark/85">
                    {r.examples.map((ex) => (
                      <li key={ex}>&ldquo;{ex}&rdquo;</li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* anti-list */}
        <div className="grid grid-cols-1 gap-10 md:grid-cols-12">
          <div className="md:col-span-4">
            <span className="font-display uppercase label-xs text-burgundy">
              The anti-list
            </span>
            <h3 className="mt-3 font-display uppercase text-heading-s tracking-[0.04em] text-accent-dark">
              What we will never say.
            </h3>
            <p className="mt-3 font-sans text-caption leading-snug text-accent-dark/70">
              The rule is &ldquo;coaches, not cheerleaders.&rdquo; The visceral version is the list to the right. If the line you wrote sounds like one of these, cut it.
            </p>
          </div>
          <div className="md:col-span-8">
            <div className="rounded-2xl border border-burgundy/40 bg-burgundy/[0.04] p-6 md:p-8">
              <ul className="flex flex-col gap-3 font-sans text-[clamp(20px,2.4vw,30px)] font-bold leading-[1.2] text-accent-dark">
                {antiList.map((line, i) => (
                  <motion.li
                    key={line}
                    initial={{ opacity: 0, x: -16 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-10% 0px" }}
                    transition={{ duration: 0.6, delay: i * 0.05, ease: EASE_VERSA }}
                    className="flex items-baseline gap-4"
                  >
                    <span className="font-display label-md uppercase text-burgundy">✗</span>
                    <span className="line-through decoration-burgundy/60 decoration-[3px] underline-offset-2">
                      &ldquo;{line}&rdquo;
                    </span>
                  </motion.li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* arabic note */}
        <div className="rounded-2xl border border-deep-teal/30 bg-deep-teal/[0.04] p-6">
          <span className="font-display uppercase label-xs text-deep-teal">
            Open question · Arabic
          </span>
          <p className="mt-2 max-w-3xl font-sans text-body-s leading-snug text-accent-dark/80">
            &ldquo;We are brief,&rdquo; &ldquo;no exclamation marks,&rdquo; and &ldquo;weight without volume&rdquo; need a translation pass for the Arabic locale, where rhetorical structures and exclamations work differently. Resolved when the Arabic build begins.
          </p>
        </div>
      </div>

      <Annotation
        size="xs"
        position="tr"
        tone="dark"
        n="06"
        title="VOICE & TONE"
        caption="Four rules. Twelve words. Three registers. And a short list of things we'll never say."
      />
    </section>
  );
}

function ParallaxSlot({
  scrollYProgress,
  depth,
  children,
  className = "",
  style,
}: {
  scrollYProgress: ReturnType<typeof useScroll>["scrollYProgress"];
  depth: number;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  const y = useTransform(scrollYProgress, [0, 1], [60 * depth, -100 * depth]);
  return (
    <motion.div style={{ ...style, y }} className={className}>
      {children}
    </motion.div>
  );
}
