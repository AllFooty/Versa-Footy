import React from 'react';

/**
 * Form label component
 */
export const Label = ({ children, htmlFor }) => (
  <label
    htmlFor={htmlFor}
    style={{
      display: 'block',
      marginBottom: 8,
      fontSize: 13,
      color: '#a1a1aa',
    }}
  >
    {children}
  </label>
);

/**
 * Text input component
 */
export const Input = ({
  id,
  type = 'text',
  placeholder,
  value,
  onChange,
  style = {},
}) => (
  <input
    id={id}
    type={type}
    className="input"
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    style={style}
  />
);

/**
 * Textarea component
 */
export const TextArea = ({
  id,
  placeholder,
  value,
  onChange,
  rows = 3,
}) => (
  <textarea
    id={id}
    className="input"
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    rows={rows}
    style={{ resize: 'vertical' }}
  />
);

/**
 * Select dropdown component
 */
export const Select = ({
  id,
  value,
  onChange,
  children,
  style = {},
}) => (
  <select
    id={id}
    className="select"
    value={value}
    onChange={onChange}
    style={style}
  >
    {children}
  </select>
);

/**
 * Color picker input
 */
export const ColorInput = ({ value, onChange }) => (
  <input
    type="color"
    className="input"
    value={value}
    onChange={onChange}
    style={{ height: 46, cursor: 'pointer' }}
  />
);

/**
 * Form field wrapper with label
 */
export const FormField = ({ label, children, id }) => (
  <div>
    <Label htmlFor={id}>{label}</Label>
    {children}
  </div>
);

/**
 * Two-column form row
 */
export const FormRow = ({ children }) => (
  <div className="form-row" style={{ display: 'flex', gap: 16 }}>
    {React.Children.map(children, (child) => (
      <div style={{ flex: 1 }}>{child}</div>
    ))}
  </div>
);

export default {
  Label,
  Input,
  TextArea,
  Select,
  ColorInput,
  FormField,
  FormRow,
};
