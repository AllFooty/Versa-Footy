import { Fragment, type ReactNode } from "react";
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Row,
  Column,
  Heading,
  Text,
  Img,
  Button,
  Hr,
  Link,
  Preview,
} from "@react-email/components";
import { render } from "@react-email/render";
import {
  BRAND,
  type Block,
  type HeadingBlock,
  type ParagraphBlock,
  type ImageBlock,
  type ButtonBlock,
  type SpacerBlock,
  type TwoColumnBlock,
  type FooterBlock,
} from "./blocks";

// Light inline parser: **bold**, *italic*, [text](url). Process links first
// (they can contain literal *), then bold, then italic.
function parseInline(text: string | undefined, keyPrefix = ""): ReactNode {
  if (!text) return null;
  const re = /\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*/g;
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let i = 0;
  while ((match = re.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(
        <Fragment key={`${keyPrefix}t${i++}`}>{text.slice(lastIndex, match.index)}</Fragment>,
      );
    }
    if (match[1] !== undefined) {
      nodes.push(
        <Link
          key={`${keyPrefix}l${i++}`}
          href={match[2]}
          style={{ color: BRAND.primary, textDecoration: "underline" }}
        >
          {match[1]}
        </Link>,
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

function HeadingNode({ block }: { block: HeadingBlock }) {
  const sizes: Record<number, number> = { 1: 28, 2: 22, 3: 18 };
  return (
    <Heading
      as={`h${block.level || 1}` as "h1" | "h2" | "h3"}
      style={{
        margin: "0 0 12px 0",
        fontSize: sizes[block.level] || 28,
        color: BRAND.heading,
        textAlign: block.align || "left",
        fontWeight: 700,
        lineHeight: 1.3,
      }}
    >
      {parseInline(block.text, block.id)}
    </Heading>
  );
}

function ParagraphNode({ block }: { block: ParagraphBlock }) {
  const paragraphs = (block.text ?? "").split(/\n\s*\n/);
  return (
    <>
      {paragraphs.map((p, idx) => (
        <Text
          key={`${block.id}p${idx}`}
          style={{ margin: "0 0 14px 0", fontSize: 16, lineHeight: 1.6, color: BRAND.text }}
        >
          {parseInline(p, `${block.id}p${idx}`)}
        </Text>
      ))}
    </>
  );
}

function ImageNode({ block }: { block: ImageBlock }) {
  const img = (
    <Img
      src={block.src}
      alt={block.alt || ""}
      width={block.width || 480}
      style={{
        display: "block",
        maxWidth: "100%",
        height: "auto",
        margin: "0 auto",
        borderRadius: 8,
      }}
    />
  );
  return (
    <Section style={{ textAlign: "center", margin: "0 0 16px 0" }}>
      {block.href ? <Link href={block.href}>{img}</Link> : img}
    </Section>
  );
}

function ButtonNode({ block }: { block: ButtonBlock }) {
  return (
    <Section style={{ textAlign: "center", margin: "24px 0" }}>
      <Button
        href={block.href}
        style={{
          backgroundColor: block.color || BRAND.primary,
          color: "#ffffff",
          padding: "14px 28px",
          borderRadius: 8,
          textDecoration: "none",
          fontWeight: 700,
          fontSize: 16,
          display: "inline-block",
        }}
      >
        {block.text}
      </Button>
    </Section>
  );
}

function DividerNode() {
  return <Hr style={{ borderColor: BRAND.border, margin: "24px 0" }} />;
}

function SpacerNode({ block }: { block: SpacerBlock }) {
  return (
    <Section
      style={{
        height: block.height ?? 24,
        lineHeight: `${block.height ?? 24}px`,
        fontSize: 1,
      }}
    >
      &nbsp;
    </Section>
  );
}

function TwoColumnNode({ block }: { block: TwoColumnBlock }) {
  return (
    <Section style={{ margin: "0 0 16px 0" }}>
      <Row>
        <Column style={{ verticalAlign: "top", paddingRight: 8, width: "50%" }}>
          {(block.left || []).map((b) => (
            <BlockNode key={b.id} block={b} />
          ))}
        </Column>
        <Column style={{ verticalAlign: "top", paddingLeft: 8, width: "50%" }}>
          {(block.right || []).map((b) => (
            <BlockNode key={b.id} block={b} />
          ))}
        </Column>
      </Row>
    </Section>
  );
}

function FooterNode({ block }: { block: FooterBlock }) {
  // {{unsubscribe_url}} is replaced server-side by send-marketing-email per recipient.
  return (
    <Section style={{ margin: "32px 0 0 0" }}>
      <Hr style={{ borderColor: BRAND.border, margin: "0 0 16px 0" }} />
      <Text
        style={{
          fontSize: 12,
          color: BRAND.muted,
          textAlign: "center",
          margin: 0,
          lineHeight: 1.5,
        }}
      >
        {block.text}{" "}
        <Link
          href="{{unsubscribe_url}}"
          style={{ color: BRAND.muted, textDecoration: "underline" }}
        >
          Unsubscribe
        </Link>
        .
      </Text>
    </Section>
  );
}

function BlockNode({ block }: { block: Block }) {
  switch (block.type) {
    case "heading":
      return <HeadingNode block={block} />;
    case "paragraph":
      return <ParagraphNode block={block} />;
    case "image":
      return <ImageNode block={block} />;
    case "button":
      return <ButtonNode block={block} />;
    case "divider":
      return <DividerNode />;
    case "spacer":
      return <SpacerNode block={block} />;
    case "two_column":
      return <TwoColumnNode block={block} />;
    case "footer":
      return <FooterNode block={block} />;
  }
}

export function EmailDoc({
  blocks,
  previewText,
}: {
  blocks: Block[];
  previewText?: string;
}) {
  return (
    <Html>
      <Head />
      {previewText ? <Preview>{previewText}</Preview> : null}
      <Body
        style={{
          margin: 0,
          padding: 0,
          background: BRAND.bg,
          fontFamily: "Inter, Arial, sans-serif",
        }}
      >
        <Container style={{ maxWidth: 600, margin: "0 auto", padding: "40px 16px" }}>
          <Section style={{ background: BRAND.card, borderRadius: 12, padding: 32 }}>
            {blocks.map((b) => (
              <BlockNode key={b.id} block={b} />
            ))}
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export async function renderEmailHtml(
  blocks: Block[],
  opts?: { previewText?: string },
): Promise<string> {
  return await render(<EmailDoc blocks={blocks} previewText={opts?.previewText} />, {
    pretty: false,
  });
}
