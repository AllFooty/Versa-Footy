import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../../lib/supabase';
import { FIELDS, OPERATORS, getField, emptyRule, coerceValue } from './segments.js';

export default function SegmentBuilder({ value, onChange }) {
  const { t } = useTranslation();
  const filter = value || { match: 'all', rules: [emptyRule()] };
  const [count, setCount] = useState(null);
  const [counting, setCounting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setCounting(true);
    const id = setTimeout(async () => {
      const { data, error } = await supabase.rpc('marketing_segment_count', { p_filter: filter });
      if (cancelled) return;
      setCounting(false);
      if (error) setCount(null);
      else setCount(data);
    }, 300);
    return () => { cancelled = true; clearTimeout(id); };
  }, [JSON.stringify(filter)]);

  const setMatch = (m) => onChange({ ...filter, match: m });
  const setRule = (idx, rule) => onChange({ ...filter, rules: filter.rules.map((r, i) => i === idx ? rule : r) });
  const addRule = () => onChange({ ...filter, rules: [...filter.rules, emptyRule()] });
  const removeRule = (idx) => onChange({ ...filter, rules: filter.rules.filter((_, i) => i !== idx) });

  return (
    <div>
      <div style={topRowStyle}>
        <span style={{ color: '#9ca3af', fontSize: 13 }}>{t('admin.segments.builder.match')}</span>
        <select value={filter.match} onChange={(e) => setMatch(e.target.value)} style={smallSelectStyle}>
          <option value="all">{t('admin.segments.builder.matchAll')}</option>
          <option value="any">{t('admin.segments.builder.matchAny')}</option>
        </select>
        <span style={{ flex: 1 }} />
        <span style={{ color: counting ? '#9ca3af' : '#22d3ee', fontSize: 13, fontWeight: 600 }}>
          {counting
            ? '…'
            : count != null
              ? t('admin.common.recipients', { count })
              : t('admin.segments.builder.countAvailable')}
        </span>
      </div>

      <div>
        {filter.rules.map((rule, idx) => (
          <RuleRow
            key={idx}
            rule={rule}
            onChange={(r) => setRule(idx, r)}
            onRemove={() => removeRule(idx)}
            canRemove={filter.rules.length > 1}
          />
        ))}
      </div>

      <button type="button" style={addBtnStyle} onClick={addRule}>
        {t('admin.segments.builder.addRule')}
      </button>
    </div>
  );
}

function RuleRow({ rule, onChange, onRemove, canRemove }) {
  const { t } = useTranslation();
  const field = getField(rule.field) ?? FIELDS[0];
  const op = rule.op;
  const opMeta = OPERATORS[op] ?? {};
  const valueless = opMeta.valueless;

  function onFieldChange(newKey) {
    const next = getField(newKey);
    const newOp = next.ops.includes(op) ? op : next.ops[0];
    onChange({ field: newKey, op: newOp, value: undefined });
  }
  function onOpChange(newOp) {
    onChange({ ...rule, op: newOp, value: OPERATORS[newOp]?.valueless ? undefined : rule.value });
  }
  function onValueChange(raw) {
    onChange({ ...rule, value: coerceValue(field, op, raw) });
  }

  return (
    <div style={ruleStyle}>
      <select value={rule.field} onChange={(e) => onFieldChange(e.target.value)} style={fieldSelectStyle}>
        {FIELDS.map((f) => <option key={f.key} value={f.key}>{t(`admin.segments.fields.${f.key}`)}</option>)}
      </select>
      <select value={op} onChange={(e) => onOpChange(e.target.value)} style={opSelectStyle}>
        {field.ops.map((o) => <option key={o} value={o}>{t(`admin.segments.operators.${o}`)}</option>)}
      </select>
      {!valueless && <ValueInput field={field} op={op} value={rule.value} onChange={onValueChange} />}
      <button
        type="button"
        onClick={onRemove}
        disabled={!canRemove}
        style={{ ...iconBtnStyle, color: canRemove ? '#fca5a5' : '#4b5563' }}
        title={t('admin.segments.builder.removeRule')}
      >✕</button>
    </div>
  );
}

function ValueInput({ field, op, value, onChange }) {
  const { t } = useTranslation();
  if (field.type === 'bool') {
    return (
      <select value={String(value ?? true)} onChange={(e) => onChange(e.target.value === 'true')} style={valueInputStyle}>
        <option value="true">{t('admin.segments.builder.boolTrue')}</option>
        <option value="false">{t('admin.segments.builder.boolFalse')}</option>
      </select>
    );
  }
  if (field.type === 'enum') {
    if (op === 'in') {
      return (
        <input
          type="text"
          value={Array.isArray(value) ? value.join(',') : (value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t('admin.segments.builder.csvPlaceholder')}
          style={valueInputStyle}
        />
      );
    }
    return (
      <select value={value ?? field.options[0].value} onChange={(e) => onChange(e.target.value)} style={valueInputStyle}>
        {field.options.map((o) => (
          <option key={o.value} value={o.value}>
            {t(`admin.segments.fieldEnums.${field.key}_${o.value}`)}
          </option>
        ))}
      </select>
    );
  }
  if (field.type === 'int' || op === 'within_last_days' || op === 'older_than_days') {
    return (
      <input
        type="number"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        style={valueInputStyle}
      />
    );
  }
  if (field.type === 'date' || field.type === 'timestamp') {
    return (
      <input
        type="date"
        value={typeof value === 'string' ? value.slice(0, 10) : ''}
        onChange={(e) => onChange(e.target.value)}
        style={valueInputStyle}
      />
    );
  }
  return (
    <input
      type="text"
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      style={valueInputStyle}
    />
  );
}

const topRowStyle = {
  display: 'flex', alignItems: 'center', gap: 10,
  padding: '8px 12px', marginBottom: 12,
  background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 8,
};

const ruleStyle = {
  display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8,
  padding: 10, background: 'rgba(0,0,0,0.25)',
  border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8,
};

const fieldSelectStyle = {
  flex: '1 1 200px', padding: '8px 10px',
  background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 6, color: '#f4f4f5', fontSize: 13, minWidth: 0,
};

const opSelectStyle = {
  ...fieldSelectStyle, flex: '0 0 160px',
};

const smallSelectStyle = {
  padding: '4px 8px', background: 'rgba(0,0,0,0.3)',
  border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6,
  color: '#f4f4f5', fontSize: 12,
};

const valueInputStyle = {
  flex: '1 1 140px', padding: '8px 10px',
  background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 6, color: '#f4f4f5', fontSize: 13, minWidth: 0,
};

const iconBtnStyle = {
  background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 6, width: 28, height: 28, cursor: 'pointer', fontSize: 13, padding: 0,
  flex: '0 0 auto',
};

const addBtnStyle = {
  width: '100%', padding: 10,
  background: 'rgba(34,211,238,0.06)',
  border: '1px dashed rgba(34,211,238,0.4)',
  color: '#22d3ee', borderRadius: 8, cursor: 'pointer',
  fontSize: 13, fontWeight: 600,
};
