import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { Input, ColorInput, FormField, FormRow } from '../ui';
import { DEFAULTS } from '../../constants';

/**
 * Modal for adding/editing categories
 */
const CategoryModal = ({ isOpen, onClose, onSave, editItem = null }) => {
  const [formData, setFormData] = useState(DEFAULTS.category);

  // Reset form when modal opens/closes or editItem changes
  useEffect(() => {
    if (editItem) {
      setFormData({
        name: editItem.name || '',
        icon: editItem.icon || '⚽',
        color: editItem.color || '#E63946',
      });
    } else {
      setFormData(DEFAULTS.category);
    }
  }, [editItem, isOpen]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (!formData.name.trim()) return;
    onSave(formData, editItem?.id);
    onClose();
  };

  return (
    <Modal
      title={editItem ? 'Edit Category' : 'Add Category'}
      isOpen={isOpen}
      onClose={onClose}
      onSave={handleSave}
      saveLabel={editItem ? 'Update' : 'Save'}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <FormField label="Category Name" id="category-name">
          <Input
            id="category-name"
            placeholder="e.g., Ball Mastery"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
          />
        </FormField>

        <FormRow>
          <FormField label="Icon (Emoji)" id="category-icon">
            <Input
              id="category-icon"
              placeholder="⚽"
              value={formData.icon}
              onChange={(e) => handleChange('icon', e.target.value)}
            />
          </FormField>

          <FormField label="Color" id="category-color">
            <ColorInput
              value={formData.color}
              onChange={(e) => handleChange('color', e.target.value)}
            />
          </FormField>
        </FormRow>
      </div>
    </Modal>
  );
};

export default CategoryModal;
