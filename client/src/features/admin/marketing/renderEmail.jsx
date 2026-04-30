import React, { Fragment } from 'react';
import {
  Html, Head, Body, Container, Section, Row, Column,
  Heading, Text, Img, Button, Hr, Link, Preview,
} from '@react-email/components';
import { render } from '@react-email/render';
import { BLOCK_TYPES, BRAND } from './blocks.js';

// Light inline parser: **bold**, *italic*, [text](url). Returns array of React nodes.
// Order of replacement matters — process links first (they may contain literal *), then bold, then italic.
function parseInline(text, keyPrefix = '') {
  if (!text) return null;
  // Tokenize by regex with alternation; capture groups identify which token matched.
  const re = /\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*/g;
  const nodes = [];
  let lastIndex = 0;
  let match;
  let i = 0;
  while ((match = re.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(<Fragment key={`${keyPrefix}t${i++}`}>{text.slice(lastIndex, match.index)}</Fragment>);
    }
    if (match[1] !== undefined) {
      nodes.push(
        <Link key={`${keyPrefix}l${i++}`} href={match[2]} style={{ color: BRAND.primary, textDecoration: 'underline' }}>
          {match[1]}
        </Link>
      );
    } else if (match[3] !== undefined) {
      nodes.push(<strong key={`${keyPrefix}b${i++}`}>{match[3]}</strong>);
    } else if (match[4] !== undefined) {
      nodes.push(<em key={`${keyPrefix}i${i++}`}>{match[4]}</em>);
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    nodes.push(<Fragment key={`${keyPrefix}t${i++}`}>{text.slice(lastIndex)}</Fragment>);
  }
  return nodes;
}

function HeadingBlock({ block }) {
  const sizes = { 1: 28, 2: 22, 3: 18 };
  return (
    <Heading
      as={`h${block.level || 1}`}
      style={{
        margin: '0 0 12px 0',
        fontSize: sizes[block.level] || 28,
        color: BRAND.heading,
        textAlign: block.align || 'left',
        fontWeight: 700,
        lineHeight: 1.3,
      }}
    >
      {parseInline(block.text, block.id)}
    </Heading>
  );
}

function ParagraphBlock({ block }) {
  // Split on blank lines into separate paragraphs.
  const paragraphs = (block.text ?? '').split(/\n\s*\n/);
  return (
    <>
      {paragraphs.map((p, idx) => (
        <Text
          key={`${block.id}p${idx}`}
          style={{ margin: '0 0 14px 0', fontSize: 16, lineHeight: 1.6, color: BRAND.text }}
        >
          {parseInline(p, `${block.id}p${idx}`)}
        </Text>
      ))}
    </>
  );
}

function ImageBlock({ block }) {
  const img = (
    <Img
      src={block.src}
      alt={block.alt || ''}
      width={block.width || 480}
      style={{ display: 'block', maxWidth: '100%', height: 'auto', margin: '0 auto', borderRadius: 8 }}
    />
  );
  return (
    <Section style={{ textAlign: 'center', margin: '0 0 16px 0' }}>
      {block.href ? <Link href={block.href}>{img}</Link> : img}
    </Section>
  );
}

function ButtonBlock({ block }) {
  return (
    <Section style={{ textAlign: 'center', margin: '24px 0' }}>
      <Button
        href={block.href}
        style={{
          backgroundColor: block.color || BRAND.primary,
          color: '#ffffff',
          padding: '14px 28px',
          borderRadius: 8,
          textDecoration: 'none',
          fontWeight: 700,
          fontSize: 16,
          display: 'inline-block',
        }}
      >
        {block.text}
      </Button>
    </Section>
  );
}

function DividerBlock() {
  return <Hr style={{ borderColor: BRAND.border, margin: '24px 0' }} />;
}

function SpacerBlock({ block }) {
  return <Section style={{ height: block.height ?? 24, lineHeight: `${block.height ?? 24}px`, fontSize: 1 }}>&nbsp;</Section>;
}

function TwoColumnBlock({ block }) {
  return (
    <Section style={{ margin: '0 0 16px 0' }}>
      <Row>
        <Column style={{ verticalAlign: 'top', paddingRight: 8, width: '50%' }}>
          {(block.left || []).map((b) => <BlockNode key={b.id} block={b} />)}
        </Column>
        <Column style={{ verticalAlign: 'top', paddingLeft: 8, width: '50%' }}>
          {(block.right || []).map((b) => <BlockNode key={b.id} block={b} />)}
        </Column>
      </Row>
    </Section>
  );
}

function FooterBlock({ block }) {
  // {{unsubscribe_url}} is replaced server-side by send-marketing-email per recipient.
  return (
    <Section style={{ margin: '32px 0 0 0' }}>
      <Hr style={{ borderColor: BRAND.border, margin: '0 0 16px 0' }} />
      <Text style={{ fontSize: 12, color: BRAND.muted, textAlign: 'center', margin: 0, lineHeight: 1.5 }}>
        {block.text}
        {' '}
        <Link href="{{unsubscribe_url}}" style={{ color: BRAND.muted, textDecoration: 'underline' }}>
          Unsubscribe
        </Link>
        .
      </Text>
    </Section>
  );
}

function BlockNode({ block }) {
  switch (block.type) {
    case BLOCK_TYPES.heading: return <HeadingBlock block={block} />;
    case BLOCK_TYPES.paragraph: return <ParagraphBlock block={block} />;
    case BLOCK_TYPES.image: return <ImageBlock block={block} />;
    case BLOCK_TYPES.button: return <ButtonBlock block={block} />;
    case BLOCK_TYPES.divider: return <DividerBlock />;
    case BLOCK_TYPES.spacer: return <SpacerBlock block={block} />;
    case BLOCK_TYPES.two_column: return <TwoColumnBlock block={block} />;
    case BLOCK_TYPES.footer: return <FooterBlock block={block} />;
    default: return null;
  }
}

export function EmailDoc({ blocks, previewText }) {
  return (
    <Html>
      <Head />
      {previewText ? <Preview>{previewText}</Preview> : null}
      <Body style={{ margin: 0, padding: 0, background: BRAND.bg, fontFamily: "Inter, Arial, sans-serif" }}>
        <Container style={{ maxWidth: 600, margin: '0 auto', padding: '40px 16px' }}>
          <Section style={{ background: BRAND.card, borderRadius: 12, padding: 32 }}>
            {blocks.map((b) => <BlockNode key={b.id} block={b} />)}
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Render block JSON to email-safe HTML. Async (react-email/render is async in v1+).
export async function renderEmailHtml(blocks, { previewText } = {}) {
  return await render(<EmailDoc blocks={blocks} previewText={previewText} />, { pretty: false });
}
