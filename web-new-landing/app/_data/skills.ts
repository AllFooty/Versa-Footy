export type SkillCluster = {
  id: string;
  label: string;
  ar: string;
  cx: number;
  cy: number;
  radius: number;
  skills: number;
  color: string;
};

// Versa Footy skill categories — 10 clusters covering every technical area
// a complete 7–14 year-old player works through. Skill counts are the real
// per-category numbers; total is 170. Specific drill names, exact drill
// counts, and any mastery data are intentionally kept off the public site.
//
// Constellation layout (cx, cy, radius) places the biggest clusters across
// the top and centre, with the narrowest specialism (Throw-Ins) tucked in
// the bottom-right.
//
// Arabic strings are best-effort placeholders. They power the future ar-SA
// locale (Tajawal font is wired but disabled in app/layout.tsx). Have a
// native reviewer pass over them before the Arabic locale ships.
export const SKILL_CLUSTERS: SkillCluster[] = [
  { id: "drib",  label: "Dribbling",               ar: "المراوغة",                  cx: 50, cy: 22, radius: 13,  skills: 42, color: "#FFD24A" },
  { id: "shoot", label: "Shooting & Finishing",    ar: "التسديد والإنهاء",          cx: 22, cy: 30, radius: 12,  skills: 36, color: "#E8A93C" },
  { id: "mast",  label: "Ball Mastery",            ar: "إتقان الكرة",               cx: 78, cy: 30, radius: 9,   skills: 21, color: "#BB5A2B" },
  { id: "turn",  label: "Turning",                 ar: "الالتفاف",                  cx: 15, cy: 58, radius: 9,   skills: 20, color: "#FFD24A" },
  { id: "pass",  label: "Passing & First Touch",   ar: "التمرير واللمسة الأولى",    cx: 62, cy: 52, radius: 8.5, skills: 18, color: "#E8A93C" },
  { id: "cross", label: "Crossing & Long Passing", ar: "العرضيات والتمرير الطويل",  cx: 85, cy: 58, radius: 6,   skills: 9,  color: "#BB5A2B" },
  { id: "jug",   label: "Juggling",                ar: "تنطيط الكرة",               cx: 38, cy: 52, radius: 6,   skills: 8,  color: "#FFD24A" },
  { id: "def",   label: "Defending & Tackling",    ar: "الدفاع والعرقلة",           cx: 28, cy: 80, radius: 5.5, skills: 7,  color: "#7A1F2E" },
  { id: "head",  label: "Heading",                 ar: "الرأسيات",                  cx: 55, cy: 82, radius: 5.5, skills: 7,  color: "#E8A93C" },
  { id: "throw", label: "Throw-Ins",               ar: "رميات التماس",              cx: 80, cy: 80, radius: 4,   skills: 2,  color: "#7A1F2E" },
];

export const TOTAL_SKILLS = SKILL_CLUSTERS.reduce((sum, c) => sum + c.skills, 0);

// Marketing-rounded drill count. Exact per-cluster drill counts are private
// and the library keeps growing, so the public site only ever shows the
// floor — "1,000+ drills" — never a specific number.
export const DRILL_COUNT_LABEL = "1,000+";

export type SkillDot = {
  x: number;
  y: number;
  r: number;
  delay: number;
  cluster: string;
};

// Integer-only hash (bit-exact across JS engines, so SSR == client)
function rand01(n: number): number {
  let x = Math.imul(n | 0, 2654435761);
  x = Math.imul(x ^ (x >>> 16), 2246822507);
  x = Math.imul(x ^ (x >>> 13), 3266489909);
  x ^= x >>> 16;
  return (x >>> 0) / 4294967296;
}

export function buildSkillDots(): SkillDot[] {
  const dots: SkillDot[] = [];
  let i = 0;
  SKILL_CLUSTERS.forEach((c) => {
    for (let k = 0; k < c.skills; k++) {
      const u = rand01(i * 4 + 1) * 2 - 1;
      const v = rand01(i * 4 + 2) * 2 - 1;
      const r = 1 + rand01(i * 4 + 3) * 1.6;
      dots.push({
        x: c.cx + u * c.radius * 0.85,
        y: c.cy + v * c.radius * 0.85,
        r,
        delay: rand01(i * 4 + 4) * 4,
        cluster: c.id,
      });
      i++;
    }
  });
  return dots;
}
