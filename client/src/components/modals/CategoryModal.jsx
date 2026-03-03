import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from './Modal';
import { Input, ColorInput, FormField, FormRow } from '../ui';
import { DEFAULTS } from '../../constants';

/**
 * Modal for adding/editing categories
 */
const CategoryModal = ({ isOpen, onClose, onSave, editItem = null }) => {
  const { t } = useTranslation();
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
      title={editItem ? t('modals.category.editTitle') : t('modals.category.addTitle')}
      isOpen={isOpen}
      onClose={onClose}
      onSave={handleSave}
      saveLabel={editItem ? t('modals.category.updateButton') : t('modals.category.saveButton')}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <FormField label={t('modals.category.nameLabel')} id="category-name">
          <Input
            id="category-name"
            placeholder={t('modals.category.namePlaceholder')}
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
          />
        </FormField>

        <FormRow>
          <FormField label={t('modals.category.iconLabel')} id="category-icon">
            <Input
              id="category-icon"
              placeholder="⚽"
              value={formData.icon}
              onChange={(e) => handleChange('icon', e.target.value)}
            />
          </FormField>

          <FormField label={t('modals.category.colorLabel')} id="category-color">
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
