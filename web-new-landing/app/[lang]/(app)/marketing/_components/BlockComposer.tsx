"use client";

import { useRef, useState, type ReactNode } from "react";
import { supabase } from "../../../../_lib/supabase";
import {
  BLOCK_TYPES,
  createBlock,
  type Block,
  type BlockType,
  type HeadingBlock,
  type ParagraphBlock,
  type ImageBlock,
  type ButtonBlock,
  type SpacerBlock,
  type TwoColumnBlock,
  type FooterBlock,
} from "../_lib/blocks";
import type { ProductDict } from "../../../../_dictionaries/product";

type BlocksT = ProductDict["marketing"]["blocks"];

const ADDABLE_TYPES: BlockType[] = [
  "heading",
  "paragraph",
  "image",
  "button",
  "divider",
  "spacer",
  "two_column",
  "footer",
];

function fmt(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, k) => String(vars[k] ?? ""));
}

const inputCls =
  "w-full rounded-lg border border-accent-dark/15 bg-cream px-3 py-2 font-sans text-body-s text-accent-dark placeholder:text-warm-shadow/60 focus:border-glyph-gold focus:outline-none";

export function BlockComposer({
  blocks,
  onChange,
  allowTwoColumn = true,
  depth = 0,
  dict,
}: {
  blocks: Block[];
  onChange: (next: Block[]) => void;
  allowTwoColumn?: boolean;
  depth?: number;
  dict: ProductDict;
}) {
  const t = dict.marketing.blocks;
  const update = (id: string, patch: Partial<Block>) =>
    onChange(blocks.map((b) => (b.id === id ? ({ ...b, ...patch } as Block) : b)));

  const remove = (id: string) => onChange(blocks.filter((b) => b.id !== id));

  const move = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= blocks.length) return;
    const next = blocks.slice();
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(next);
  };

  const add = (type: BlockType) => onChange([...blocks, createBlock(type)]);

  const visibleTypes = allowTwoColumn
    ? ADDABLE_TYPES
    : ADDABLE_TYPES.filter((type) => type !== "two_column");

  return (
    <div>
      {blocks.map((block, idx) => (
        <BlockCard
          key={block.id}
          block={block}
          isFirst={idx === 0}
          isLast={idx === blocks.length - 1}
          onUpdate={(patch) => update(block.id, patch)}
          onRemove={() => remove(block.id)}
          onMoveUp={() => move(idx, -1)}
          onMoveDown={() => move(idx, +1)}
          allowTwoColumn={allowTwoColumn && depth < 1}
          depth={depth}
          dict={dict}
        />
      ))}
      <AddBlockMenu types={visibleTypes} onAdd={add} t={t} />
    </div>
  );
}

function BlockCard({
  block,
  isFirst,
  isLast,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
  allowTwoColumn,
  depth,
  dict,
}: {
  block: Block;
  isFirst: boolean;
  isLast: boolean;
  onUpdate: (patch: Partial<Block>) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  allowTwoColumn: boolean;
  depth: number;
  dict: ProductDict;
}) {
  const t = dict.marketing.blocks;
  const iconBtn =
    "inline-flex h-7 w-7 items-center justify-center rounded-md border border-accent-dark/15 bg-cream font-mono text-accent-dark transition-colors hover:bg-accent-dark hover:text-cream disabled:cursor-not-allowed disabled:opacity-30";
  return (
    <div className="mb-3 rounded-xl border border-accent-dark/10 bg-cream/40 p-3">
      <div className="mb-3 flex items-center justify-between">
        <span className="font-display label-xs uppercase text-glyph-gold">
          {t.types[block.type]}
        </span>
        <div className="flex gap-1">
          <button type="button" onClick={onMoveUp} disabled={isFirst} title={t.moveUp} className={iconBtn}>
            ↑
          </button>
          <button type="button" onClick={onMoveDown} disabled={isLast} title={t.moveDown} className={iconBtn}>
            ↓
          </button>
          <button
            type="button"
            onClick={onRemove}
            title={t.delete}
            className={`${iconBtn} hover:border-error/50 hover:bg-error hover:text-white`}
          >
            ✕
          </button>
        </div>
      </div>
      <BlockEditor
        block={block}
        onUpdate={onUpdate}
        allowTwoColumn={allowTwoColumn}
        depth={depth}
        dict={dict}
      />
    </div>
  );
}

function BlockEditor({
  block,
  onUpdate,
  allowTwoColumn,
  depth,
  dict,
}: {
  block: Block;
  onUpdate: (patch: Partial<Block>) => void;
  allowTwoColumn: boolean;
  depth: number;
  dict: ProductDict;
}) {
  const t = dict.marketing.blocks;
  const f = t.fields;
  switch (block.type) {
    case "heading":
      return <HeadingEditor block={block} onUpdate={onUpdate as (p: Partial<HeadingBlock>) => void} f={f} />;
    case "paragraph":
      return <ParagraphEditor block={block} onUpdate={onUpdate as (p: Partial<ParagraphBlock>) => void} f={f} />;
    case "image":
      return <ImageEditor block={block} onUpdate={onUpdate as (p: Partial<ImageBlock>) => void} f={f} />;
    case "button":
      return <ButtonEditor block={block} onUpdate={onUpdate as (p: Partial<ButtonBlock>) => void} f={f} />;
    case "divider":
      return <p className="font-sans text-body-xs text-warm-shadow">{f.dividerHint}</p>;
    case "spacer":
      return (
        <Field label={f.spacerHeight}>
          <input
            type="number"
            value={(block as SpacerBlock).height}
            onChange={(e) => onUpdate({ height: parseInt(e.target.value, 10) || 0 } as Partial<SpacerBlock>)}
            className={inputCls}
          />
        </Field>
      );
    case "two_column": {
      const b = block as TwoColumnBlock;
      return (
        <div className="flex flex-wrap gap-3">
          <div className="min-w-[200px] flex-1 border-r border-accent-dark/10 pr-3">
            <p className="mb-2 font-display label-xs uppercase text-warm-shadow">{f.leftColumn}</p>
            <BlockComposer
              blocks={b.left ?? []}
              onChange={(left) => onUpdate({ left } as Partial<TwoColumnBlock>)}
              allowTwoColumn={false}
              depth={depth + 1}
              dict={dict}
            />
          </div>
          <div className="min-w-[200px] flex-1 pl-3">
            <p className="mb-2 font-display label-xs uppercase text-warm-shadow">{f.rightColumn}</p>
            <BlockComposer
              blocks={b.right ?? []}
              onChange={(right) => onUpdate({ right } as Partial<TwoColumnBlock>)}
              allowTwoColumn={false}
              depth={depth + 1}
              dict={dict}
            />
          </div>
        </div>
      );
    }
    case "footer":
      return (
        <Field label={f.footerText} hint={f.footerHint}>
          <textarea
            value={(block as FooterBlock).text}
            onChange={(e) => onUpdate({ text: e.target.value } as Partial<FooterBlock>)}
            rows={2}
            className={`${inputCls} resize-y`}
          />
        </Field>
      );
    default: {
      const unknown: { type?: string } = block as { type?: string };
      return (
        <p className="font-sans text-body-xs text-warm-shadow">
          {fmt(f.unknownType, { type: unknown.type ?? "" })}
        </p>
      );
    }
  }
  // `allowTwoColumn` is read only by the recursive call inside two_column above.
  void allowTwoColumn;
}

function HeadingEditor({
  block,
  onUpdate,
  f,
}: {
  block: HeadingBlock;
  onUpdate: (p: Partial<HeadingBlock>) => void;
  f: BlocksT["fields"];
}) {
  return (
    <>
      <Field label={f.text}>
        <input
          type="text"
          value={block.text}
          onChange={(e) => onUpdate({ text: e.target.value })}
          className={inputCls}
        />
      </Field>
      <Row>
        <Field label={f.level} flex={1}>
          <select
            value={block.level}
            onChange={(e) => onUpdate({ level: parseInt(e.target.value, 10) as 1 | 2 | 3 })}
            className={inputCls}
          >
            <option value={1}>{f.levelH1}</option>
            <option value={2}>{f.levelH2}</option>
            <option value={3}>{f.levelH3}</option>
          </select>
        </Field>
        <Field label={f.align} flex={1}>
          <select
            value={block.align}
            onChange={(e) => onUpdate({ align: e.target.value as HeadingBlock["align"] })}
            className={inputCls}
          >
            <option value="left">{f.alignLeft}</option>
            <option value="center">{f.alignCenter}</option>
            <option value="right">{f.alignRight}</option>
          </select>
        </Field>
      </Row>
    </>
  );
}

function ParagraphEditor({
  block,
  onUpdate,
  f,
}: {
  block: ParagraphBlock;
  onUpdate: (p: Partial<ParagraphBlock>) => void;
  f: BlocksT["fields"];
}) {
  return (
    <Field label={f.text} hint={f.paragraphHint}>
      <textarea
        value={block.text}
        onChange={(e) => onUpdate({ text: e.target.value })}
        rows={4}
        className={`${inputCls} resize-y`}
      />
    </Field>
  );
}

function ImageEditor({
  block,
  onUpdate,
  f,
}: {
  block: ImageBlock;
  onUpdate: (p: Partial<ImageBlock>) => void;
  f: BlocksT["fields"];
}) {
  return (
    <>
      <ImageUploader
        currentSrc={block.src}
        onUploaded={(src) => onUpdate({ src })}
        f={f}
      />
      <Row>
        <Field label={f.imageAlt} flex={2}>
          <input
            type="text"
            value={block.alt}
            onChange={(e) => onUpdate({ alt: e.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label={f.imageWidth} flex={1}>
          <input
            type="number"
            value={block.width}
            onChange={(e) => onUpdate({ width: parseInt(e.target.value, 10) || 0 })}
            className={inputCls}
          />
        </Field>
      </Row>
      <Field label={f.imageHref}>
        <input
          type="url"
          value={block.href}
          onChange={(e) => onUpdate({ href: e.target.value })}
          placeholder={f.imageHrefPlaceholder}
          className={inputCls}
        />
      </Field>
    </>
  );
}

function ButtonEditor({
  block,
  onUpdate,
  f,
}: {
  block: ButtonBlock;
  onUpdate: (p: Partial<ButtonBlock>) => void;
  f: BlocksT["fields"];
}) {
  return (
    <>
      <Row>
        <Field label={f.buttonText} flex={2}>
          <input
            type="text"
            value={block.text}
            onChange={(e) => onUpdate({ text: e.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label={f.buttonColor} flex={1}>
          <input
            type="color"
            value={block.color}
            onChange={(e) => onUpdate({ color: e.target.value })}
            className={`${inputCls} h-10 p-1`}
          />
        </Field>
      </Row>
      <Field label={f.buttonUrl}>
        <input
          type="url"
          value={block.href}
          onChange={(e) => onUpdate({ href: e.target.value })}
          placeholder={f.imageHrefPlaceholder}
          className={inputCls}
        />
      </Field>
    </>
  );
}

function ImageUploader({
  currentSrc,
  onUploaded,
  f,
}: {
  currentSrc: string;
  onUploaded: (url: string) => void;
  f: BlocksT["fields"];
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() ?? "bin";
      const path = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("marketing-assets")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("marketing-assets").getPublicUrl(path);
      onUploaded(data.publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <Field label={f.image}>
      {currentSrc && (
        <img
          src={currentSrc}
          alt={f.imagePreviewAlt}
          className="mb-2 max-h-40 max-w-full rounded-md bg-accent-dark/5"
        />
      )}
      <div className="flex items-center gap-3">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={(e) => void handleFile(e)}
          className="flex-1 font-sans text-body-xs text-accent-dark"
        />
        {uploading && (
          <span className="font-sans text-body-xs text-warm-shadow">{f.uploading}</span>
        )}
      </div>
      <input
        type="url"
        value={currentSrc}
        onChange={(e) => onUploaded(e.target.value)}
        placeholder={f.imagePastePlaceholder}
        className={`${inputCls} mt-2`}
      />
      {error && <p className="mt-1 font-sans text-body-xs text-error">{error}</p>}
    </Field>
  );
}

function AddBlockMenu({
  types,
  onAdd,
  t,
}: {
  types: BlockType[];
  onAdd: (type: BlockType) => void;
  t: BlocksT;
}) {
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-xl border border-dashed border-glyph-gold/50 bg-glyph-gold/8 px-3 py-3 font-display label-xs uppercase text-accent-dark transition-colors hover:bg-glyph-gold/15"
      >
        {t.addBlock}
      </button>
    );
  }
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-1.5 rounded-xl border border-glyph-gold/40 bg-glyph-gold/8 p-2">
      {types.map((type) => (
        <button
          key={type}
          type="button"
          onClick={() => {
            onAdd(type);
            setOpen(false);
          }}
          className="rounded-md border border-accent-dark/15 bg-cream px-3 py-2 text-left font-sans text-body-xs text-accent-dark transition-colors hover:bg-accent-dark hover:text-cream"
        >
          {t.types[type]}
        </button>
      ))}
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="rounded-md border border-accent-dark/15 bg-cream px-3 py-2 text-left font-sans text-body-xs text-warm-shadow transition-colors hover:bg-accent-dark hover:text-cream"
      >
        {t.cancel}
      </button>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
  flex,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  flex?: number;
}) {
  return (
    <div className="mb-3" style={flex ? { flex } : undefined}>
      <label className="mb-1 block font-display label-xs uppercase text-accent-dark/80">
        {label}
      </label>
      {hint && <p className="mb-1 font-sans text-body-xs text-warm-shadow">{hint}</p>}
      {children}
    </div>
  );
}

function Row({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap gap-3">{children}</div>;
}
