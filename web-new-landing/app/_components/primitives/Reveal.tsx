"use client";

import { motion, useInView, type MotionProps } from "motion/react";
import { useRef, type CSSProperties, type ReactNode, type RefObject } from "react";

type Tag = "div" | "figure" | "p" | "ul" | "li" | "section" | "h2" | "h3";

const TAGS = {
  div: motion.div,
  figure: motion.figure,
  p: motion.p,
  ul: motion.ul,
  li: motion.li,
  section: motion.section,
  h2: motion.h2,
  h3: motion.h3,
} as const;

type MarginValue = `${number}%` | `${number}px`;
type Margin =
  | MarginValue
  | `${MarginValue} ${MarginValue}`
  | `${MarginValue} ${MarginValue} ${MarginValue}`
  | `${MarginValue} ${MarginValue} ${MarginValue} ${MarginValue}`;

type Props = {
  as?: Tag;
  initial?: MotionProps["initial"];
  animate?: MotionProps["animate"];
  transition?: MotionProps["transition"];
  margin?: Margin;
  amount?: "some" | "all" | number;
  className?: string;
  style?: CSSProperties;
  id?: string;
  children?: ReactNode;
  "aria-label"?: string;
  "aria-hidden"?: boolean;
};

export function Reveal({
  as = "div",
  margin = "-10%",
  amount,
  initial,
  animate,
  transition,
  ...rest
}: Props) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin, amount });
  const Tag = TAGS[as] as typeof motion.div;
  return (
    <Tag
      ref={ref as RefObject<HTMLDivElement>}
      initial={initial}
      animate={inView ? animate : initial}
      transition={transition}
      {...rest}
    />
  );
}
