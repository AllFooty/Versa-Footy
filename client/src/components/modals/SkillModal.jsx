import React, { useState, useEffect } from 'react';
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
      title={editItem ? 'Edit Skill' : 'Add Skill'}
      isOpen={isOpen}
      onClose={onClose}
      onSave={handleSave}
      saveLabel={editItem ? 'Update' : 'Save'}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <FormField label="Skill Name" id="skill-name">
          <Input
            id="skill-name"
            placeholder="e.g., Toe Taps"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
          />
        </FormField>

        <FormRow>
          <FormField label="Category" id="skill-category">
            <Select
              id="skill-category"
              value={formData.categoryId}
              onChange={(e) => handleChange('categoryId', e.target.value)}
            >
              <option value="">Select Category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="Age Group" id="skill-age">
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

        <FormField label="Description" id="skill-description">
          <TextArea
            id="skill-description"
            placeholder="Brief description of this skill..."
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
