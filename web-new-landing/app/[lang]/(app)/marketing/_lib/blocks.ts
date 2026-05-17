// Block schema for the marketing email composer. A campaign body is an array
// of blocks; renderEmail.tsx turns this into email-safe HTML via @react-email.

export const BLOCK_TYPES = {
  heading: "heading",
  paragraph: "paragraph",
  image: "image",
  button: "button",
  divider: "divider",
  spacer: "spacer",
  two_column: "two_column",
  footer: "footer",
} as const;

export type BlockType = keyof typeof BLOCK_TYPES;

export const BRAND = {
  primary: "#E63946",
  bg: "#f9fafb",
  card: "#ffffff",
  text: "#374151",
  heading: "#111827",
  muted: "#6b7280",
  border: "#e5e7eb",
} as const;

export type HeadingBlock = {
  id: string;
  type: "heading";
  level: 1 | 2 | 3;
  align: "left" | "center" | "right";
  text: string;
};
export type ParagraphBlock = {
  id: string;
  type: "paragraph";
  text: string;
};
export type ImageBlock = {
  id: string;
  type: "image";
  src: string;
  alt: string;
  width: number;
  href: string;
};
export type ButtonBlock = {
  id: string;
  type: "button";
  text: string;
  href: string;
  color: string;
};
export type DividerBlock = { id: string; type: "divider" };
export type SpacerBlock = { id: string; type: "spacer"; height: number };
export type TwoColumnBlock = {
  id: string;
  type: "two_column";
  left: Block[];
  right: Block[];
};
export type FooterBlock = { id: string; type: "footer"; text: string };

export type Block =
  | HeadingBlock
  | ParagraphBlock
  | ImageBlock
  | ButtonBlock
  | DividerBlock
  | SpacerBlock
  | TwoColumnBlock
  | FooterBlock;

function newId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `b_${crypto.randomUUID()}`;
  }
  return `b_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function createBlock(type: BlockType): Block {
  const id = newId();
  switch (type) {
    case "heading":
      return { id, type, level: 1, align: "left", text: "Your headline goes here" };
    case "paragraph":
      return {
        id,
        type,
        text: "Write your paragraph here. Use **bold**, *italic*, or [links](https://versafooty.com).",
      };
    case "image":
      return { id, type, src: "", alt: "", width: 480, href: "" };
    case "button":
      return {
        id,
        type,
        text: "Open Versa Footy",
        href: "https://versafooty.com",
        color: BRAND.primary,
      };
    case "divider":
      return { id, type };
    case "spacer":
      return { id, type, height: 24 };
    case "two_column":
      return {
        id,
        type,
        left: [createBlock("paragraph")],
        right: [createBlock("paragraph")],
      };
    case "footer":
      return {
        id,
        type,
        text: "You're receiving this because you signed up at versafooty.com.",
      };
  }
}

export function defaultBlocks(): Block[] {
  return [
    { ...(createBlock("heading") as HeadingBlock), text: "We're launching!" },
    {
      ...(createBlock("paragraph") as ParagraphBlock),
      text: "The wait is over. Versa Footy is officially live — your kid's personalized football training app.",
    },
    createBlock("button"),
    createBlock("spacer"),
    createBlock("footer"),
  ];
}

export function validateBlocks(blocks: Block[] | unknown): string[] {
  const errors: string[] = [];
  if (!Array.isArray(blocks) || blocks.length === 0) {
    errors.push("Body must contain at least one block.");
    return errors;
  }
  for (const b of blocks as Block[]) {
    if (!b?.type || !(b.type in BLOCK_TYPES)) {
      errors.push(`Unknown block type: ${(b as { type?: string })?.type ?? ""}`);
      continue;
    }
    if (b.type === "image" && !b.src) errors.push("Image block missing src");
    if (b.type === "button" && !b.href) errors.push("Button block missing URL");
  }
  return errors;
}
