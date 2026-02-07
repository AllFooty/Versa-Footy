import React, { useState, useEffect } from 'react';
import { Video, Upload, Trash2, CheckCircle, X, Plus, Check, ChevronDown, ChevronRight } from 'lucide-react';
import Modal from './Modal';
import ConfirmModal from './ConfirmModal';
import { Input, TextArea, Select, FormField, Label } from '../ui';
import { DIFFICULTY_OPTIONS, DEFAULTS, EQUIPMENT_OPTIONS } from '../../constants';
import { normalizeDifficulty } from '../../utils/difficulty';
import { uploadExerciseVideo, deleteExerciseVideo } from '../../lib/storage';

/**
 * Modal for adding/editing exercises
 * Supports multi-skill selection via exercise_skills junction table
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
    setExpandedCategories({});
  }, [editItem, isOpen, preselectedSkillId]);

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

        // Show success briefly before saving
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <FormField label="Exercise Name" id="exercise-name">
          <Input
            id="exercise-name"
            placeholder="e.g., Basic Toe Tap Drill"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
          />
        </FormField>

        {/* Multi-Skill Picker */}
        <div>
          <Label>
            Associated Skills
            {formData.skillIds && formData.skillIds.length > 1 && (
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
          {formData.skillIds && formData.skillIds.length > 0 && (
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 8,
              marginBottom: 10,
            }}>
              {formData.skillIds.map((skillId) => {
                const info = getSkillInfo(skillId);
                if (!info) return null;
                return (
                  <span
                    key={skillId}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: isMobile ? '8px 12px' : '5px 10px',
                      background: info.category?.color
                        ? `${info.category.color}20`
                        : 'rgba(139, 92, 246, 0.15)',
                      border: `1px solid ${info.category?.color
                        ? `${info.category.color}40`
                        : 'rgba(139, 92, 246, 0.3)'}`,
                      borderRadius: 6,
                      color: info.category?.color || '#8b5cf6',
                      fontSize: isMobile ? 14 : 13,
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
                (s) => (formData.skillIds || []).includes(s.id)
              ).length;

              return (
                <div key={cat.id}>
                  {/* Category header */}
                  <button
                    type="button"
                    onClick={() => toggleCategory(cat.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      width: '100%',
                      padding: isMobile ? '12px' : '8px 12px',
                      background: 'rgba(255,255,255,0.03)',
                      border: 'none',
                      borderBottom: '1px solid rgba(255,255,255,0.05)',
                      color: '#d4d4d8',
                      fontSize: isMobile ? 14 : 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                      textAlign: 'left',
                      minHeight: isMobile ? 44 : 'auto',
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

                  {/* Skills in this category */}
                  {isExpanded && (
                    <div style={{ padding: '4px 0' }}>
                      {categorySkills.map((skill) => {
                        const isSelected = (formData.skillIds || []).includes(skill.id);
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
                              padding: isMobile ? '10px 12px 10px 32px' : '6px 12px 6px 32px',
                              background: isSelected
                                ? `${cat.color || '#8b5cf6'}15`
                                : 'transparent',
                              border: 'none',
                              color: isSelected
                                ? (cat.color || '#8b5cf6')
                                : '#a1a1aa',
                              fontSize: isMobile ? 14 : 13,
                              cursor: 'pointer',
                              textAlign: 'left',
                              transition: 'all 0.15s',
                              minHeight: isMobile ? 44 : 'auto',
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

          {formData.skillIds && formData.skillIds.length === 0 && (
            <div style={{ marginTop: 6, fontSize: 12, color: '#71717a' }}>
              Select at least one skill. Multiple skills create a Combo Exercise.
            </div>
          )}
        </div>

        <div>
          <Label htmlFor="exercise-video">
            <Video size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
            Video URL
          </Label>
          <Input
            id="exercise-video"
            type="url"
            placeholder="https://youtube.com/watch?v=..."
            value={formData.videoUrl}
            onChange={(e) => handleChange('videoUrl', e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="exercise-video-file">
            <Upload size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
            Upload Video File (stores in Supabase)
          </Label>
          <input
            id="exercise-video-file"
            type="file"
            accept="video/*"
            className="input"
            onChange={handleFileChange}
            style={{ padding: 10 }}
          />
          <div style={{ marginTop: 8, color: '#71717a', fontSize: 12 }}>
            Choose a video to upload to Supabase. If both a URL and file are provided,
            the uploaded file will be used.
          </div>
          {(videoFile || formData.videoUrl) && (
            <div
              style={{
                marginTop: 8,
                padding: '10px 12px',
                background: 'rgba(255,255,255,0.04)',
                borderRadius: 8,
                color: '#d4d4d8',
                fontSize: 13,
              }}
            >
              {videoFile
                ? `Selected file: ${videoFile.name} (${(videoFile.size / (1024 * 1024)).toFixed(2)} MB)`
                : `Existing video: ${formData.videoUrl}`}
            </div>
          )}

          {/* Upload Progress Bar */}
          {uploading && (
            <div style={{ marginTop: 12 }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: 6,
                fontSize: 13,
                color: '#a1a1aa'
              }}>
                <span>Uploading video...</span>
                <span style={{ fontWeight: 600, color: '#60a5fa' }}>{uploadProgress}%</span>
              </div>
              <div style={{
                width: '100%',
                height: 8,
                background: 'rgba(255,255,255,0.1)',
                borderRadius: 4,
                overflow: 'hidden',
              }}>
                <div style={{
                  width: `${uploadProgress}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #3b82f6, #60a5fa)',
                  borderRadius: 4,
                  transition: 'width 0.3s ease',
                }} />
              </div>
              <div style={{
                marginTop: 6,
                fontSize: 12,
                color: '#71717a',
                textAlign: 'center'
              }}>
                {uploadProgress < 100
                  ? 'Please wait while your video uploads...'
                  : 'Upload complete! Saving exercise...'}
              </div>
            </div>
          )}

          {/* Upload Success Message */}
          {uploadSuccess && !uploading && (
            <div
              style={{
                marginTop: 12,
                padding: '10px 12px',
                background: 'rgba(74, 222, 128, 0.1)',
                border: '1px solid rgba(74, 222, 128, 0.3)',
                borderRadius: 8,
                color: '#4ade80',
                fontSize: 13,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <CheckCircle size={16} />
              Video uploaded successfully!
            </div>
          )}

          {/* Only show Remove button when there's a video to remove */}
          {(videoFile || formData.videoUrl) && (
            <div style={{ display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setConfirmRemoveVideo(true)}
                disabled={uploading || deleting}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Trash2 size={14} />
                {deleting ? 'Removing...' : 'Remove video'}
              </button>
            </div>
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
            <div
              style={{
                marginTop: 8,
                color: '#4ade80',
                fontSize: 13,
              }}
            >
              {deleteMessage}
            </div>
          )}
          {uploadError && (
            <div
              style={{
                marginTop: 8,
                padding: '10px 12px',
                background: 'rgba(248, 113, 113, 0.1)',
                border: '1px solid rgba(248, 113, 113, 0.3)',
                borderRadius: 8,
                color: '#f87171',
                fontSize: 13,
              }}
            >
              {uploadError}
            </div>
          )}
        </div>

        <FormField label="Difficulty (1 easy → 5 hard)" id="exercise-difficulty">
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
          <Label>Equipment Needed</Label>
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
              placeholder="Add custom equipment..."
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
            rows={4}
          />
        </FormField>
      </div>
    </Modal>
  );
};

export default ExerciseModal;
