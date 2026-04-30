import React, { useRef, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { BLOCK_TYPES, createBlock } from './blocks.js';

const ADDABLE_TYPES = [
  { type: BLOCK_TYPES.heading, label: 'Heading' },
  { type: BLOCK_TYPES.paragraph, label: 'Paragraph' },
  { type: BLOCK_TYPES.image, label: 'Image' },
  { type: BLOCK_TYPES.button, label: 'Button' },
  { type: BLOCK_TYPES.divider, label: 'Divider' },
  { type: BLOCK_TYPES.spacer, label: 'Spacer' },
  { type: BLOCK_TYPES.two_column, label: 'Two columns' },
  { type: BLOCK_TYPES.footer, label: 'Footer' },
];

export default function BlockComposer({ blocks, onChange, allowTwoColumn = true, depth = 0 }) {
  const update = (id, patch) =>
    onChange(blocks.map((b) => (b.id === id ? { ...b, ...patch } : b)));

  const remove = (id) => onChange(blocks.filter((b) => b.id !== id));

  const move = (idx, dir) => {
    const target = idx + dir;
    if (target < 0 || target >= blocks.length) return;
    const next = blocks.slice();
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(next);
  };

  const add = (type) => onChange([...blocks, createBlock(type)]);

  const visibleTypes = allowTwoColumn ? ADDABLE_TYPES : ADDABLE_TYPES.filter((t) => t.type !== BLOCK_TYPES.two_column);

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
        />
      ))}
      <AddBlockMenu types={visibleTypes} onAdd={add} />
    </div>
  );
}

function BlockCard({ block, isFirst, isLast, onUpdate, onRemove, onMoveUp, onMoveDown, allowTwoColumn, depth }) {
  return (
    <div style={blockCardStyle}>
      <div style={blockHeaderStyle}>
        <span style={blockTypeBadge}>{block.type.replace('_', ' ')}</span>
        <div style={{ display: 'flex', gap: 4 }}>
          <button type="button" style={iconBtnStyle} onClick={onMoveUp} disabled={isFirst} title="Move up">↑</button>
          <button type="button" style={iconBtnStyle} onClick={onMoveDown} disabled={isLast} title="Move down">↓</button>
          <button type="button" style={{ ...iconBtnStyle, color: '#fca5a5' }} onClick={onRemove} title="Delete">✕</button>
        </div>
      </div>
      <BlockEditor block={block} onUpdate={onUpdate} allowTwoColumn={allowTwoColumn} depth={depth} />
    </div>
  );
}

function BlockEditor({ block, onUpdate, allowTwoColumn, depth }) {
  switch (block.type) {
    case BLOCK_TYPES.heading:
      return (
        <>
          <Field label="Text">
            <input type="text" value={block.text} onChange={(e) => onUpdate({ text: e.target.value })} style={inputStyle} />
          </Field>
          <Row>
            <Field label="Level" flex={1}>
              <select value={block.level} onChange={(e) => onUpdate({ level: parseInt(e.target.value, 10) })} style={inputStyle}>
                <option value={1}>H1 — large</option>
                <option value={2}>H2 — medium</option>
                <option value={3}>H3 — small</option>
              </select>
            </Field>
            <Field label="Align" flex={1}>
              <select value={block.align} onChange={(e) => onUpdate({ align: e.target.value })} style={inputStyle}>
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </Field>
          </Row>
        </>
      );

    case BLOCK_TYPES.paragraph:
      return (
        <Field label="Text" hint="Use **bold**, *italic*, [text](url). Blank lines = new paragraph.">
          <textarea
            value={block.text}
            onChange={(e) => onUpdate({ text: e.target.value })}
            rows={4}
            style={{ ...inputStyle, fontFamily: 'inherit', resize: 'vertical' }}
          />
        </Field>
      );

    case BLOCK_TYPES.image:
      return (
        <>
          <ImageUploader
            currentSrc={block.src}
            onUploaded={(src) => onUpdate({ src })}
          />
          <Row>
            <Field label="Alt text" flex={2}>
              <input type="text" value={block.alt} onChange={(e) => onUpdate({ alt: e.target.value })} style={inputStyle} />
            </Field>
            <Field label="Width (px)" flex={1}>
              <input type="number" value={block.width} onChange={(e) => onUpdate({ width: parseInt(e.target.value, 10) || 0 })} style={inputStyle} />
            </Field>
          </Row>
          <Field label="Click-through URL (optional)">
            <input type="url" value={block.href} onChange={(e) => onUpdate({ href: e.target.value })} style={inputStyle} placeholder="https://..." />
          </Field>
        </>
      );

    case BLOCK_TYPES.button:
      return (
        <>
          <Row>
            <Field label="Button text" flex={2}>
              <input type="text" value={block.text} onChange={(e) => onUpdate({ text: e.target.value })} style={inputStyle} />
            </Field>
            <Field label="Color" flex={1}>
              <input type="color" value={block.color} onChange={(e) => onUpdate({ color: e.target.value })} style={{ ...inputStyle, padding: 4, height: 40 }} />
            </Field>
          </Row>
          <Field label="URL">
            <input type="url" value={block.href} onChange={(e) => onUpdate({ href: e.target.value })} style={inputStyle} placeholder="https://..." />
          </Field>
        </>
      );

    case BLOCK_TYPES.divider:
      return <p style={hintStyle}>Horizontal divider line.</p>;

    case BLOCK_TYPES.spacer:
      return (
        <Field label="Height (px)">
          <input type="number" value={block.height} onChange={(e) => onUpdate({ height: parseInt(e.target.value, 10) || 0 })} style={inputStyle} />
        </Field>
      );

    case BLOCK_TYPES.two_column:
      return (
        <Row>
          <div style={{ flex: 1, paddingRight: 8, borderRight: '1px solid rgba(255,255,255,0.08)' }}>
            <p style={subLabelStyle}>Left column</p>
            <BlockComposer
              blocks={block.left || []}
              onChange={(left) => onUpdate({ left })}
              allowTwoColumn={false}
              depth={depth + 1}
            />
          </div>
          <div style={{ flex: 1, paddingLeft: 8 }}>
            <p style={subLabelStyle}>Right column</p>
            <BlockComposer
              blocks={block.right || []}
              onChange={(right) => onUpdate({ right })}
              allowTwoColumn={false}
              depth={depth + 1}
            />
          </div>
        </Row>
      );

    case BLOCK_TYPES.footer:
      return (
        <Field label="Footer text" hint="Unsubscribe link is auto-appended per recipient.">
          <textarea
            value={block.text}
            onChange={(e) => onUpdate({ text: e.target.value })}
            rows={2}
            style={{ ...inputStyle, fontFamily: 'inherit', resize: 'vertical' }}
          />
        </Field>
      );

    default:
      return <p style={hintStyle}>Unknown block type: {block.type}</p>;
  }
}

function ImageUploader({ currentSrc, onUploaded }) {
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('marketing-assets')
        .upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from('marketing-assets').getPublicUrl(path);
      onUploaded(data.publicUrl);
    } catch (err) {
      setError(err?.message || String(err));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  return (
    <Field label="Image">
      {currentSrc && (
        <img
          src={currentSrc}
          alt="preview"
          style={{ maxWidth: '100%', maxHeight: 160, borderRadius: 6, marginBottom: 8, background: 'rgba(0,0,0,0.2)' }}
        />
      )}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ flex: 1, color: '#d1d5db', fontSize: 12 }} />
        {uploading && <span style={hintStyle}>Uploading...</span>}
      </div>
      <input
        type="url"
        value={currentSrc || ''}
        onChange={(e) => onUploaded(e.target.value)}
        placeholder="...or paste an image URL"
        style={{ ...inputStyle, marginTop: 8 }}
      />
      {error && <p style={{ ...hintStyle, color: '#fca5a5' }}>{error}</p>}
    </Field>
  );
}

function AddBlockMenu({ types, onAdd }) {
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <button type="button" style={addButtonStyle} onClick={() => setOpen(true)}>
        + Add block
      </button>
    );
  }
  return (
    <div style={addMenuStyle}>
      {types.map((t) => (
        <button
          key={t.type}
          type="button"
          style={addMenuItemStyle}
          onClick={() => { onAdd(t.type); setOpen(false); }}
        >
          {t.label}
        </button>
      ))}
      <button type="button" style={{ ...addMenuItemStyle, color: '#9ca3af' }} onClick={() => setOpen(false)}>
        Cancel
      </button>
    </div>
  );
}

function Field({ label, hint, children, flex }) {
  return (
    <div style={{ marginBottom: 12, flex }}>
      <label style={fieldLabelStyle}>{label}</label>
      {hint && <p style={hintStyle}>{hint}</p>}
      {children}
    </div>
  );
}

function Row({ children }) {
  return <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>{children}</div>;
}

const blockCardStyle = {
  background: 'rgba(0,0,0,0.25)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 8,
  padding: 14,
  marginBottom: 10,
};

const blockHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 10,
};

const blockTypeBadge = {
  fontSize: 10,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: '#22d3ee',
  fontWeight: 700,
};

const iconBtnStyle = {
  background: 'transparent',
  border: '1px solid rgba(255,255,255,0.1)',
  color: '#e5e7eb',
  borderRadius: 6,
  width: 28,
  height: 28,
  cursor: 'pointer',
  fontSize: 14,
  padding: 0,
};

const fieldLabelStyle = {
  display: 'block',
  fontSize: 11,
  fontWeight: 600,
  color: '#d1d5db',
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  marginBottom: 4,
};

const subLabelStyle = {
  fontSize: 11,
  fontWeight: 700,
  color: '#9ca3af',
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
  margin: '0 0 8px 0',
};

const hintStyle = {
  fontSize: 11,
  color: '#9ca3af',
  margin: '0 0 6px 0',
  lineHeight: 1.4,
};

const inputStyle = {
  width: '100%',
  padding: '8px 10px',
  background: 'rgba(0,0,0,0.3)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 6,
  color: '#f4f4f5',
  fontSize: 13,
  boxSizing: 'border-box',
};

const addButtonStyle = {
  width: '100%',
  padding: '10px',
  background: 'rgba(34,211,238,0.06)',
  border: '1px dashed rgba(34,211,238,0.4)',
  color: '#22d3ee',
  borderRadius: 8,
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 600,
};

const addMenuStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
  gap: 6,
  padding: 8,
  background: 'rgba(34,211,238,0.06)',
  border: '1px solid rgba(34,211,238,0.3)',
  borderRadius: 8,
};

const addMenuItemStyle = {
  padding: '8px 10px',
  background: 'rgba(0,0,0,0.3)',
  border: '1px solid rgba(255,255,255,0.08)',
  color: '#e5e7eb',
  borderRadius: 6,
  cursor: 'pointer',
  fontSize: 12,
  textAlign: 'left',
};
