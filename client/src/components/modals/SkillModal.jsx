import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from './Modal';
import { Input, TextArea, Select, FormField, FormRow } from '../ui';
import { AGE_GROUPS, DEFAULTS } from '../../constants';

/**
 * Modal for adding/editing skills
 */
const SkillModal = ({
  isOpen,
  onClose,
  onSave,
  editItem = null,
  categories = [],
  preselectedCategoryId = null,
}) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState(DEFAULTS.skill);

  // Reset form when modal opens/closes or editItem changes
  useEffect(() => {
    if (editItem) {
      setFormData({
        name: editItem.name || '',
        categoryId: editItem.categoryId || '',
        ageGroup: editItem.ageGroup || 'U-7',
        description: editItem.description || '',
      });
    } else {
      setFormData({
        ...DEFAULTS.skill,
        categoryId: preselectedCategoryId || '',
      });
    }
  }, [editItem, isOpen, preselectedCategoryId]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (!formData.name.trim() || !formData.categoryId) return;
    onSave(formData, editItem?.id);
    onClose();
  };

  return (
    <Modal
      title={editItem ? t('modals.skill.editTitle') : t('modals.skill.addTitle')}
      isOpen={isOpen}
      onClose={onClose}
      onSave={handleSave}
      saveLabel={editItem ? t('modals.skill.updateButton') : t('modals.skill.saveButton')}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <FormField label={t('modals.skill.nameLabel')} id="skill-name">
          <Input
            id="skill-name"
            placeholder={t('modals.skill.namePlaceholder')}
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
          />
        </FormField>

        <FormRow>
          <FormField label={t('modals.skill.categoryLabel')} id="skill-category">
            <Select
              id="skill-category"
              value={formData.categoryId}
              onChange={(e) => handleChange('categoryId', e.target.value)}
            >
              <option value="">{t('modals.skill.selectCategory')}</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label={t('modals.skill.ageGroupLabel')} id="skill-age">
            <Select
              id="skill-age"
              value={formData.ageGroup}
              onChange={(e) => handleChange('ageGroup', e.target.value)}
            >
              {AGE_GROUPS.map((age) => (
                <option key={age} value={age}>
                  {age}
                </option>
              ))}
            </Select>
          </FormField>
        </FormRow>

        <FormField label={t('modals.skill.descriptionLabel')} id="skill-description">
          <TextArea
            id="skill-description"
            placeholder={t('modals.skill.descriptionPlaceholder')}
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            rows={3}
          />
        </FormField>
      </div>
    </Modal>
  );
};

export default SkillModal;
