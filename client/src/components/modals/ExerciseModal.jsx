import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Video, Upload, Trash2, CheckCircle, X, Plus, Check, ChevronDown, ChevronRight, Search } from 'lucide-react';
import Modal from './Modal';
import ConfirmModal from './ConfirmModal';
import { Input, TextArea, Select, FormField, Label } from '../ui';
import { DIFFICULTY_OPTIONS, DEFAULTS, EQUIPMENT_OPTIONS } from '../../constants';
import { normalizeDifficulty } from '../../utils/difficulty';
import { uploadExerciseVideo, deleteExerciseVideo } from '../../lib/storage';

/**
 * Full-screen skill picker overlay for mobile.
 * Replaces the inline nested-scroll picker with a proper full-screen sheet
 * that has its own search, category groups, and a Done button.
 */
const MobileSkillPicker = ({
  isOpen,
  onClose,
  categories,
  skills,
  selectedSkillIds,
  onToggleSkill,
}) => {
  const [search, setSearch] = useState('');
  const [expandedCategories, setExpandedCategories] = useState({});

  // Reset search when opening
  useEffect(() => {
    if (isOpen) {
      setSearch('');
      // Auto-expand categories that have selected skills
      const expanded = {};
      for (const sid of selectedSkillIds) {
        const skill = skills.find((s) => s.id === sid);
        if (skill) expanded[skill.categoryId] = true;
      }
      setExpandedCategories(expanded);
    }
  }, [isOpen, selectedSkillIds, skills]);

  // Prevent body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const filteredSkills = useMemo(() => {
    if (!search.trim()) return null; // null = show category view
    const term = search.toLowerCase();
    return skills.filter((s) => s.name.toLowerCase().includes(term));
  }, [search, skills]);

  if (!isOpen) return null;

  const toggleCategory = (catId) => {
    setExpandedCategories((prev) => ({ ...prev, [catId]: !prev[catId] }));
  };

  const selectedCount = selectedSkillIds.length;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 1100,
      background: '#0a0f1a',
      display: 'flex',
      flexDirection: 'column',
      animation: 'slideUpMobile 0.25s ease-out',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '16px 16px 12px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        flexShrink: 0,
      }}>
        <button
          type="button"
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: '#a1a1aa',
            padding: 8,
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            minWidth: 44,
            minHeight: 44,
            justifyContent: 'center',
          }}
        >
          <X size={22} />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: 17,
            fontWeight: 600,
            color: '#e4e4e7',
            fontFamily: "'Space Grotesk', sans-serif",
          }}>
            Select Skills
          </div>
          {selectedCount > 0 && (
            <div style={{ fontSize: 13, color: '#71717a', marginTop: 2 }}>
              {selectedCount} selected{selectedCount > 1 ? ' (Combo)' : ''}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          style={{
            background: '#3b82f6',
            border: 'none',
            color: '#fff',
            padding: '10px 20px',
            borderRadius: 8,
            fontSize: 15,
            fontWeight: 600,
            cursor: 'pointer',
            minHeight: 44,
          }}
        >
          Done
        </button>
      </div>

      {/* Search */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        flexShrink: 0,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 14px',
          background: 'rgba(255,255,255,0.05)',
          borderRadius: 10,
          border: '1px solid rgba(255,255,255,0.08)',
        }}>
          <Search size={18} color="#71717a" />
          <input
            type="text"
            placeholder="Search skills..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              color: '#e4e4e7',
              fontSize: 16,
              outline: 'none',
            }}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              style={{
                background: 'none',
                border: 'none',
                color: '#71717a',
                padding: 4,
                display: 'flex',
                cursor: 'pointer',
              }}
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Skill list */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
      }}>
        {filteredSkills
          ? (
            /* Search results - flat list */
            filteredSkills.length === 0
              ? (
                <div style={{
                  padding: 40,
                  textAlign: 'center',
                  color: '#52525b',
                  fontSize: 15,
                }}>
                  No skills found for "{search}"
                </div>
              )
              : filteredSkills.map((skill) => {
                const cat = categories.find((c) => c.id === skill.categoryId);
                const isSelected = selectedSkillIds.includes(skill.id);
                return (
                  <button
                    key={skill.id}
                    type="button"
                    onClick={() => onToggleSkill(skill.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      width: '100%',
                      padding: '14px 16px',
                      background: isSelected
                        ? `${cat?.color || '#8b5cf6'}12`
                        : 'transparent',
                      border: 'none',
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      color: isSelected ? (cat?.color || '#8b5cf6') : '#d4d4d8',
                      fontSize: 15,
                      cursor: 'pointer',
                      textAlign: 'left',
                      minHeight: 48,
                    }}
                  >
                    {isSelected
                      ? <Check size={18} />
                      : <div style={{ width: 18 }} />}
                    <span style={{ flex: 1 }}>{skill.name}</span>
                    <span style={{ fontSize: 12, color: '#52525b' }}>
                      {cat?.icon} {skill.ageGroup}
                    </span>
                  </button>
                );
              })
          )
          : (
            /* Category-grouped view */
            categories.map((cat) => {
              const categorySkills = skills.filter((s) => s.categoryId === cat.id);
              if (categorySkills.length === 0) return null;
              const isExpanded = expandedCategories[cat.id] || false;
              const catSelectedCount = categorySkills.filter(
                (s) => selectedSkillIds.includes(s.id)
              ).length;

              return (
                <div key={cat.id}>
                  <button
                    type="button"
                    onClick={() => toggleCategory(cat.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      width: '100%',
                      padding: '14px 16px',
                      background: 'rgba(255,255,255,0.02)',
                      border: 'none',
                      borderBottom: '1px solid rgba(255,255,255,0.05)',
                      color: '#e4e4e7',
                      fontSize: 15,
                      fontWeight: 600,
                      cursor: 'pointer',
                      textAlign: 'left',
                      minHeight: 48,
                    }}
                  >
                    {isExpanded
                      ? <ChevronDown size={16} color="#71717a" />
                      : <ChevronRight size={16} color="#71717a" />}
                    <span>{cat.icon} {cat.name}</span>
                    <span style={{ fontSize: 12, color: '#52525b', fontWeight: 400, marginLeft: 4 }}>
                      {categorySkills.length}
                    </span>
                    {catSelectedCount > 0 && (
                      <span style={{
                        marginLeft: 'auto',
                        padding: '2px 8px',
                        background: `${cat.color || '#8b5cf6'}25`,
                        borderRadius: 10,
                        color: cat.color || '#8b5cf6',
                        fontSize: 12,
                        fontWeight: 700,
                      }}>
                        {catSelectedCount}
                      </span>
                    )}
                  </button>

                  {isExpanded && categorySkills.map((skill) => {
                    const isSelected = selectedSkillIds.includes(skill.id);
                    return (
                      <button
                        key={skill.id}
                        type="button"
                        onClick={() => onToggleSkill(skill.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          width: '100%',
                          padding: '12px 16px 12px 44px',
                          background: isSelected
                            ? `${cat.color || '#8b5cf6'}12`
                            : 'transparent',
                          border: 'none',
                          borderBottom: '1px solid rgba(255,255,255,0.03)',
                          color: isSelected ? (cat.color || '#8b5cf6') : '#a1a1aa',
                          fontSize: 15,
                          cursor: 'pointer',
                          textAlign: 'left',
                          minHeight: 48,
                        }}
                      >
                        {isSelected
                          ? <Check size={18} />
                          : <Plus size={16} style={{ opacity: 0.4 }} />}
                        <span style={{ flex: 1 }}>{skill.name}</span>
                        <span style={{ fontSize: 12, color: '#52525b' }}>
                          {skill.ageGroup}
                        </span>
                      </button>
                    );
                  })}
                </div>
              );
            })
          )}

        {/* Bottom safe area */}
        <div style={{ height: 'env(safe-area-inset-bottom, 0px)' }} />
      </div>
    </div>
  );
};

/**
 * Modal for adding/editing exercises
 * Supports multi-skill selection via exercise_skills junction table
 * Mobile-optimized with full-screen skill picker overlay
 */
const ExerciseModal = ({
  isOpen,
  onClose,
  onSave,
  editItem = null,
  categories = [],
  skills = [],
  preselectedSkillId = null,
}) => {
  const [formData, setFormData] = useState(DEFAULTS.exercise);
  const [videoFile, setVideoFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState(null);
  const [customEquipment, setCustomEquipment] = useState('');
  const [confirmRemoveVideo, setConfirmRemoveVideo] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [skillPickerOpen, setSkillPickerOpen] = useState(false);

  // Reset form when modal opens/closes or editItem changes
  useEffect(() => {
    if (editItem) {
      setFormData({
        name: editItem.name || '',
        skillIds: editItem.skillIds || (editItem.skillId ? [editItem.skillId] : []),
        videoUrl: editItem.videoUrl || '',
        difficulty: normalizeDifficulty(editItem.difficulty),
        description: editItem.description || '',
        equipment: editItem.equipment || [],
      });
    } else {
      setFormData({
        ...DEFAULTS.exercise,
        skillIds: preselectedSkillId ? [preselectedSkillId] : [],
      });
    }
    setCustomEquipment('');
    setVideoFile(null);
    setUploadError(null);
    setUploadProgress(0);
    setUploadSuccess(false);
    setDeleting(false);
    setDeleteMessage(null);
    setConfirmRemoveVideo(false);
    setSkillPickerOpen(false);

    // Auto-expand categories that have selected skills (desktop)
    if (editItem?.skillIds?.length) {
      const expanded = {};
      for (const sid of editItem.skillIds) {
        const skill = skills.find((s) => s.id === sid);
        if (skill) expanded[skill.categoryId] = true;
      }
      setExpandedCategories(expanded);
    } else if (preselectedSkillId) {
      const skill = skills.find((s) => s.id === preselectedSkillId);
      if (skill) setExpandedCategories({ [skill.categoryId]: true });
    } else {
      setExpandedCategories({});
    }
  }, [editItem, isOpen, preselectedSkillId, skills]);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleSkill = (skillId) => {
    setFormData((prev) => {
      const current = prev.skillIds || [];
      if (current.includes(skillId)) {
        return { ...prev, skillIds: current.filter((id) => id !== skillId) };
      }
      return { ...prev, skillIds: [...current, skillId] };
    });
  };

  const toggleCategory = (catId) => {
    setExpandedCategories((prev) => ({ ...prev, [catId]: !prev[catId] }));
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    setVideoFile(file || null);
    setUploadError(null);
    setUploadProgress(0);
    setUploadSuccess(false);
  };

  const handleSave = async () => {
    if (uploading || deleting) return;
    if (!formData.name.trim() || !formData.skillIds || formData.skillIds.length === 0) return;

    try {
      setUploadError(null);
      setUploadSuccess(false);
      let nextVideoUrl = formData.videoUrl;

      if (videoFile) {
        setUploading(true);
        setUploadProgress(0);

        const { publicUrl } = await uploadExerciseVideo(
          videoFile,
          editItem?.id || formData.skillIds[0],
          (progress) => setUploadProgress(progress)
        );
        nextVideoUrl = publicUrl;

        setUploadSuccess(true);
        setUploadProgress(100);
      }

      await onSave(
        {
          ...formData,
          videoUrl: nextVideoUrl,
          equipment: formData.equipment || [],
        },
        editItem?.id
      );

      onClose();
      setVideoFile(null);
      setDeleteMessage(null);
      setUploadSuccess(false);
    } catch (err) {
      setUploadError(err.message || 'Failed to upload video.');
      console.error('Video upload/save error:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveVideo = async () => {
    if (uploading || deleting) return;

    setConfirmRemoveVideo(false);
    setDeleting(true);
    setDeleteMessage(null);
    setUploadError(null);
    setUploadProgress(0);
    setUploadSuccess(false);

    try {
      if (formData.videoUrl) {
        await deleteExerciseVideo(formData.videoUrl);
      }
      setFormData((prev) => ({ ...prev, videoUrl: '' }));
      setVideoFile(null);
      setDeleteMessage('Video removed. Save to confirm.');
    } catch (err) {
      setUploadError(err.message || 'Failed to remove video.');
    } finally {
      setDeleting(false);
    }
  };

  // Helper to get skill info for selected chips
  const getSkillInfo = (skillId) => {
    const skill = skills.find((s) => s.id === skillId);
    if (!skill) return null;
    const category = categories.find((c) => c.id === skill.categoryId);
    return { skill, category };
  };

  // ============ Render skill picker section (different for mobile vs desktop) ============

  const renderSkillPicker = () => {
    const selectedIds = formData.skillIds || [];

    // ---- Mobile: button that opens full-screen picker ----
    if (isMobile) {
      return (
        <div>
          <Label>
            Associated Skills
            {selectedIds.length > 1 && (
              <span style={{
                marginLeft: 8,
                padding: '2px 8px',
                background: 'rgba(251, 191, 36, 0.15)',
                borderRadius: 4,
                color: '#fbbf24',
                fontSize: 11,
                fontWeight: 600,
              }}>
                Combo
              </span>
            )}
          </Label>

          {/* Selected skill chips */}
          {selectedIds.length > 0 && (
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 8,
              marginBottom: 10,
            }}>
              {selectedIds.map((skillId) => {
                const info = getSkillInfo(skillId);
                if (!info) return null;
                return (
                  <span
                    key={skillId}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '8px 12px',
                      background: info.category?.color
                        ? `${info.category.color}20`
                        : 'rgba(139, 92, 246, 0.15)',
                      border: `1px solid ${info.category?.color
                        ? `${info.category.color}40`
                        : 'rgba(139, 92, 246, 0.3)'}`,
                      borderRadius: 8,
                      color: info.category?.color || '#8b5cf6',
                      fontSize: 14,
                    }}
                  >
                    {info.category?.icon} {info.skill.name}
                    <button
                      type="button"
                      onClick={() => toggleSkill(skillId)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: info.category?.color || '#8b5cf6',
                        cursor: 'pointer',
                        padding: 4,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: 28,
                        minHeight: 28,
                      }}
                    >
                      <X size={16} />
                    </button>
                  </span>
                );
              })}
            </div>
          )}

          {/* Open picker button */}
          <button
            type="button"
            onClick={() => setSkillPickerOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              width: '100%',
              padding: '14px 16px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px dashed rgba(255,255,255,0.15)',
              borderRadius: 10,
              color: '#93c5fd',
              fontSize: 15,
              fontWeight: 500,
              cursor: 'pointer',
              minHeight: 48,
            }}
          >
            <Plus size={18} />
            {selectedIds.length === 0
              ? 'Select Skills'
              : 'Add / Remove Skills'}
          </button>

          {selectedIds.length === 0 && (
            <div style={{ marginTop: 6, fontSize: 12, color: '#71717a' }}>
              Tap to browse skills by category. Multiple skills = Combo Exercise.
            </div>
          )}

          {/* Full-screen picker overlay — portal to escape modal transform */}
          {skillPickerOpen && createPortal(
            <MobileSkillPicker
              isOpen={skillPickerOpen}
              onClose={() => setSkillPickerOpen(false)}
              categories={categories}
              skills={skills}
              selectedSkillIds={selectedIds}
              onToggleSkill={toggleSkill}
            />,
            document.body
          )}
        </div>
      );
    }

    // ---- Desktop: inline collapsible picker ----
    return (
      <div>
        <Label>
          Associated Skills
          {selectedIds.length > 1 && (
            <span style={{
              marginLeft: 8,
              padding: '2px 8px',
              background: 'rgba(251, 191, 36, 0.15)',
              borderRadius: 4,
              color: '#fbbf24',
              fontSize: 11,
              fontWeight: 600,
            }}>
              Combo
            </span>
          )}
        </Label>

        {/* Selected skill chips */}
        {selectedIds.length > 0 && (
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            marginBottom: 10,
          }}>
            {selectedIds.map((skillId) => {
              const info = getSkillInfo(skillId);
              if (!info) return null;
              return (
                <span
                  key={skillId}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '5px 10px',
                    background: info.category?.color
                      ? `${info.category.color}20`
                      : 'rgba(139, 92, 246, 0.15)',
                    border: `1px solid ${info.category?.color
                      ? `${info.category.color}40`
                      : 'rgba(139, 92, 246, 0.3)'}`,
                    borderRadius: 6,
                    color: info.category?.color || '#8b5cf6',
                    fontSize: 13,
                  }}
                >
                  {info.category?.icon} {info.skill.name}
                  <button
                    type="button"
                    onClick={() => toggleSkill(skillId)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: info.category?.color || '#8b5cf6',
                      cursor: 'pointer',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <X size={14} />
                  </button>
                </span>
              );
            })}
          </div>
        )}

        {/* Category-grouped skill picker */}
        <div style={{
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 8,
          overflow: 'hidden',
          maxHeight: 280,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
        }}>
          {categories.map((cat) => {
            const categorySkills = skills.filter((s) => s.categoryId === cat.id);
            if (categorySkills.length === 0) return null;
            const isExpanded = expandedCategories[cat.id] || false;
            const selectedCount = categorySkills.filter(
              (s) => selectedIds.includes(s.id)
            ).length;

            return (
              <div key={cat.id}>
                <button
                  type="button"
                  onClick={() => toggleCategory(cat.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    width: '100%',
                    padding: '8px 12px',
                    background: 'rgba(255,255,255,0.03)',
                    border: 'none',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    color: '#d4d4d8',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  {isExpanded
                    ? <ChevronDown size={14} color="#71717a" />
                    : <ChevronRight size={14} color="#71717a" />}
                  <span>{cat.icon} {cat.name}</span>
                  {selectedCount > 0 && (
                    <span style={{
                      marginLeft: 'auto',
                      padding: '1px 7px',
                      background: `${cat.color || '#8b5cf6'}30`,
                      borderRadius: 10,
                      color: cat.color || '#8b5cf6',
                      fontSize: 11,
                      fontWeight: 700,
                    }}>
                      {selectedCount}
                    </span>
                  )}
                </button>

                {isExpanded && (
                  <div style={{ padding: '4px 0' }}>
                    {categorySkills.map((skill) => {
                      const isSelected = selectedIds.includes(skill.id);
                      return (
                        <button
                          key={skill.id}
                          type="button"
                          onClick={() => toggleSkill(skill.id)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            width: '100%',
                            padding: '6px 12px 6px 32px',
                            background: isSelected
                              ? `${cat.color || '#8b5cf6'}15`
                              : 'transparent',
                            border: 'none',
                            color: isSelected
                              ? (cat.color || '#8b5cf6')
                              : '#a1a1aa',
                            fontSize: 13,
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'all 0.15s',
                          }}
                        >
                          {isSelected
                            ? <Check size={14} />
                            : <Plus size={12} style={{ opacity: 0.5 }} />}
                          <span style={{ flex: 1 }}>{skill.name}</span>
                          <span style={{ fontSize: 11, color: '#52525b' }}>
                            {skill.ageGroup}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {selectedIds.length === 0 && (
          <div style={{ marginTop: 6, fontSize: 12, color: '#71717a' }}>
            Select at least one skill. Multiple skills create a Combo Exercise.
          </div>
        )}
      </div>
    );
  };

  return (
    <Modal
      title={editItem ? 'Edit Exercise' : 'Add Exercise'}
      isOpen={isOpen}
      onClose={onClose}
      onSave={handleSave}
      saveLabel={
        uploading
          ? `Uploading${uploadProgress > 0 ? ` ${uploadProgress}%` : '...'}`
          : deleting
            ? 'Removing...'
            : editItem
              ? 'Update'
              : 'Save'
      }
      saveDisabled={uploading || deleting}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 16 : 20 }}>
        <FormField label="Exercise Name" id="exercise-name">
          <Input
            id="exercise-name"
            placeholder="e.g., Basic Toe Tap Drill"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
          />
        </FormField>

        {renderSkillPicker()}

        {/* Video section - compact on mobile */}
        <div>
          <Label htmlFor="exercise-video">
            <Video size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
            Video {isMobile ? '' : 'URL'}
          </Label>
          <Input
            id="exercise-video"
            type="url"
            placeholder="https://youtube.com/watch?v=..."
            value={formData.videoUrl}
            onChange={(e) => handleChange('videoUrl', e.target.value)}
          />

          <div style={{ marginTop: isMobile ? 10 : 12 }}>
            <label
              htmlFor="exercise-video-file"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: isMobile ? '12px 16px' : '10px 14px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px dashed rgba(255,255,255,0.12)',
                borderRadius: 8,
                color: '#a1a1aa',
                fontSize: isMobile ? 14 : 13,
                cursor: 'pointer',
                minHeight: isMobile ? 48 : 'auto',
              }}
            >
              <Upload size={16} />
              {videoFile
                ? `${videoFile.name} (${(videoFile.size / (1024 * 1024)).toFixed(1)} MB)`
                : formData.videoUrl
                  ? 'Replace with file upload'
                  : 'Or upload a video file'}
            </label>
            <input
              id="exercise-video-file"
              type="file"
              accept="video/*"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </div>

          {/* Upload Progress Bar */}
          {uploading && (
            <div style={{ marginTop: 10 }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: 4,
                fontSize: 12,
                color: '#a1a1aa'
              }}>
                <span>Uploading...</span>
                <span style={{ fontWeight: 600, color: '#60a5fa' }}>{uploadProgress}%</span>
              </div>
              <div style={{
                width: '100%',
                height: 6,
                background: 'rgba(255,255,255,0.1)',
                borderRadius: 3,
                overflow: 'hidden',
              }}>
                <div style={{
                  width: `${uploadProgress}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #3b82f6, #60a5fa)',
                  borderRadius: 3,
                  transition: 'width 0.3s ease',
                }} />
              </div>
            </div>
          )}

          {uploadSuccess && !uploading && (
            <div style={{
              marginTop: 8,
              padding: '8px 12px',
              background: 'rgba(74, 222, 128, 0.1)',
              border: '1px solid rgba(74, 222, 128, 0.3)',
              borderRadius: 8,
              color: '#4ade80',
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
              <CheckCircle size={14} />
              Video uploaded!
            </div>
          )}

          {/* Remove video button */}
          {(videoFile || formData.videoUrl) && (
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setConfirmRemoveVideo(true)}
              disabled={uploading || deleting}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                marginTop: 8,
                minHeight: isMobile ? 44 : 'auto',
              }}
            >
              <Trash2 size={14} />
              {deleting ? 'Removing...' : 'Remove video'}
            </button>
          )}

          <ConfirmModal
            isOpen={confirmRemoveVideo}
            title="Remove Video"
            message="Remove the current video? This will delete the uploaded file and clear the URL."
            confirmLabel="Remove"
            confirmDanger
            onConfirm={handleRemoveVideo}
            onClose={() => setConfirmRemoveVideo(false)}
          />

          {deleteMessage && (
            <div style={{ marginTop: 6, color: '#4ade80', fontSize: 12 }}>
              {deleteMessage}
            </div>
          )}
          {uploadError && (
            <div style={{
              marginTop: 6,
              padding: '8px 12px',
              background: 'rgba(248, 113, 113, 0.1)',
              border: '1px solid rgba(248, 113, 113, 0.3)',
              borderRadius: 8,
              color: '#f87171',
              fontSize: 12,
            }}>
              {uploadError}
            </div>
          )}
        </div>

        <FormField label={isMobile ? 'Difficulty' : 'Difficulty (1 easy → 5 hard)'} id="exercise-difficulty">
          <Select
            id="exercise-difficulty"
            value={formData.difficulty}
            onChange={(e) => handleChange('difficulty', parseInt(e.target.value, 10))}
          >
            {DIFFICULTY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </FormField>

        <div>
          <Label>Equipment</Label>
          {/* Selected equipment tags */}
          {formData.equipment && formData.equipment.length > 0 && (
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 8,
              marginBottom: 10,
            }}>
              {formData.equipment.map((item) => (
                <span
                  key={item}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: isMobile ? '8px 12px' : '5px 10px',
                    background: 'rgba(59, 130, 246, 0.15)',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    borderRadius: 6,
                    color: '#93c5fd',
                    fontSize: isMobile ? 14 : 13,
                  }}
                >
                  {item}
                  <button
                    type="button"
                    onClick={() => handleChange('equipment', formData.equipment.filter((e) => e !== item))}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#93c5fd',
                      cursor: 'pointer',
                      padding: isMobile ? 4 : 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minWidth: isMobile ? 28 : 'auto',
                      minHeight: isMobile ? 28 : 'auto',
                    }}
                  >
                    <X size={isMobile ? 16 : 14} />
                  </button>
                </span>
              ))}
            </div>
          )}
          {/* Equipment option buttons */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: isMobile ? 8 : 6,
            marginBottom: 10,
          }}>
            {EQUIPMENT_OPTIONS.filter((opt) => !(formData.equipment || []).includes(opt)).map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => handleChange('equipment', [...(formData.equipment || []), opt])}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: isMobile ? 6 : 4,
                  padding: isMobile ? '10px 14px' : '5px 10px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: isMobile ? 8 : 6,
                  color: '#a1a1aa',
                  fontSize: isMobile ? 14 : 13,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  minHeight: isMobile ? 44 : 'auto',
                }}
              >
                <Plus size={isMobile ? 14 : 12} />
                {opt}
              </button>
            ))}
          </div>
          {/* Custom equipment input */}
          <div style={{ display: 'flex', gap: 8 }}>
            <Input
              placeholder="Add custom..."
              value={customEquipment}
              onChange={(e) => setCustomEquipment(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && customEquipment.trim()) {
                  e.preventDefault();
                  const val = customEquipment.trim();
                  if (!(formData.equipment || []).includes(val)) {
                    handleChange('equipment', [...(formData.equipment || []), val]);
                  }
                  setCustomEquipment('');
                }
              }}
              style={{ flex: 1 }}
            />
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                const val = customEquipment.trim();
                if (val && !(formData.equipment || []).includes(val)) {
                  handleChange('equipment', [...(formData.equipment || []), val]);
                }
                setCustomEquipment('');
              }}
              disabled={!customEquipment.trim()}
              style={{
                padding: isMobile ? '12px 18px' : '8px 14px',
                fontSize: isMobile ? 14 : 13,
                minHeight: isMobile ? 44 : 'auto',
              }}
            >
              Add
            </button>
          </div>
        </div>

        <FormField label="Description" id="exercise-description">
          <TextArea
            id="exercise-description"
            placeholder="Detailed instructions for this exercise..."
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            rows={isMobile ? 3 : 4}
          />
        </FormField>
      </div>
    </Modal>
  );
};

export default ExerciseModal;
