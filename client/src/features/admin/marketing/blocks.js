// Block schema for the marketing email composer.
// A campaign body is an array of blocks. Each block is { id, type, ...fields }.
// Renderer (renderEmail.jsx) turns this into email-safe HTML via @react-email.

export const BLOCK_TYPES = {
  heading: 'heading',
  paragraph: 'paragraph',
  image: 'image',
  button: 'button',
  divider: 'divider',
  spacer: 'spacer',
  two_column: 'two_column',
  footer: 'footer',
};

export const BRAND = {
  primary: '#E63946',
  bg: '#f9fafb',
  card: '#ffffff',
  text: '#374151',
  heading: '#111827',
  muted: '#6b7280',
  border: '#e5e7eb',
};

let _idCounter = 0;
function newId() {
  _idCounter += 1;
  return `b_${Date.now().toString(36)}_${_idCounter}`;
}

export function createBlock(type) {
  const id = newId();
  switch (type) {
    case BLOCK_TYPES.heading:
      return { id, type, level: 1, align: 'left', text: 'Your headline goes here' };
    case BLOCK_TYPES.paragraph:
      // Light markdown: **bold**, *italic*, [text](url). Newlines = paragraph breaks.
      return { id, type, text: 'Write your paragraph here. Use **bold**, *italic*, or [links](https://versafooty.com).' };
    case BLOCK_TYPES.image:
      return { id, type, src: '', alt: '', width: 480, href: '' };
    case BLOCK_TYPES.button:
      return { id, type, text: 'Open Versa Footy', href: 'https://versafooty.com', color: BRAND.primary };
    case BLOCK_TYPES.divider:
      return { id, type };
    case BLOCK_TYPES.spacer:
      return { id, type, height: 24 };
    case BLOCK_TYPES.two_column:
      return {
        id,
        type,
        left: [createBlock(BLOCK_TYPES.paragraph)],
        right: [createBlock(BLOCK_TYPES.paragraph)],
      };
    case BLOCK_TYPES.footer:
      return {
        id,
        type,
        text: "You're receiving this because you signed up at versafooty.com.",
      };
    default:
      throw new Error(`Unknown block type: ${type}`);
  }
}

export function defaultBlocks() {
  return [
    { ...createBlock(BLOCK_TYPES.heading), text: "We're launching!" },
    { ...createBlock(BLOCK_TYPES.paragraph), text: "The wait is over. Versa Footy is officially live — your kid's personalized football training app." },
    createBlock(BLOCK_TYPES.button),
    createBlock(BLOCK_TYPES.spacer),
    createBlock(BLOCK_TYPES.footer),
  ];
}

export function validateBlocks(blocks) {
  const errors = [];
  if (!Array.isArray(blocks) || blocks.length === 0) {
    errors.push('Body must contain at least one block.');
    return errors;
  }
  for (const b of blocks) {
    if (!b?.type || !BLOCK_TYPES[b.type]) {
      errors.push(`Unknown block type: ${b?.type}`);
      continue;
    }
    if (b.type === BLOCK_TYPES.image && !b.src) {
      errors.push('Image block missing src');
    }
    if (b.type === BLOCK_TYPES.button && !b.href) {
      errors.push('Button block missing URL');
    }
  }
  return errors;
}
