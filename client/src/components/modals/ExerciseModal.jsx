import React, { useState, useEffect } from 'react';
import { Video, Upload, Trash2 } from 'lucide-react';
import Modal from './Modal';
import { Input, TextArea, Select, FormField, Label } from '../ui';
import { DIFFICULTY_OPTIONS, DEFAULTS } from '../../constants';
import { normalizeDifficulty } from '../../utils/difficulty';
import { uploadExerciseVideo, deleteExerciseVideo } from '../../lib/storage';

/**
 * Modal for adding/editing exercises
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
  const [uploadError, setUploadError] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState(null);

  // Reset form when modal opens/closes or editItem changes
  useEffect(() => {
    if (editItem) {
      setFormData({
        name: editItem.name || '',
        skillId: editItem.skillId || '',
        videoUrl: editItem.videoUrl || '',
        difficulty: normalizeDifficulty(editItem.difficulty),
        description: editItem.description || '',
      });
    } else {
      setFormData({
        ...DEFAULTS.exercise,
        skillId: preselectedSkillId || '',
      });
    }
    setVideoFile(null);
    setUploadError(null);
    setDeleting(false);
    setDeleteMessage(null);
  }, [editItem, isOpen, preselectedSkillId]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    setVideoFile(file || null);
    setUploadError(null);
  };

  const handleSave = async () => {
    if (uploading || deleting) return;
    if (!formData.name.trim() || !formData.skillId) return;

    try {
      setUploadError(null);
      let nextVideoUrl = formData.videoUrl;

      if (videoFile) {
        setUploading(true);
        const { publicUrl } = await uploadExerciseVideo(
          videoFile,
          editItem?.id || formData.skillId
        );
        nextVideoUrl = publicUrl;
      }

      await onSave(
        {
          ...formData,
          videoUrl: nextVideoUrl,
        },
        editItem?.id
      );

      onClose();
      setVideoFile(null);
      setDeleteMessage(null);
    } catch (err) {
      setUploadError(err.message || 'Failed to upload video.');
      console.error('Video upload/save error:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveVideo = async () => {
    if (uploading || deleting) return;
    if (!formData.videoUrl && !videoFile) return;

    const confirmed = window.confirm(
      'Remove the current video? This will delete the uploaded file and clear the URL.'
    );
    if (!confirmed) return;

    setDeleting(true);
    setDeleteMessage(null);
    setUploadError(null);

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

  return (
    <Modal
      title={editItem ? 'Edit Exercise' : 'Add Exercise'}
      isOpen={isOpen}
      onClose={onClose}
      onSave={handleSave}
      saveLabel={
        uploading ? 'Uploading...' : deleting ? 'Removing...' : editItem ? 'Update' : 'Save'
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

        <FormField label="Associated Skill" id="exercise-skill">
          <Select
            id="exercise-skill"
            value={formData.skillId}
            onChange={(e) => handleChange('skillId', e.target.value)}
          >
            <option value="">Select Skill</option>
            {categories.map((cat) => {
              const categorySkills = skills.filter((s) => s.categoryId === cat.id);
              if (categorySkills.length === 0) return null;
              return (
                <optgroup key={cat.id} label={`${cat.icon} ${cat.name}`}>
                  {categorySkills.map((skill) => (
                    <option key={skill.id} value={skill.id}>
                      {skill.name}
                    </option>
                  ))}
                </optgroup>
              );
            })}
          </Select>
        </FormField>

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
                ? `Selected file: ${videoFile.name}`
                : `Existing video: ${formData.videoUrl}`}
            </div>
          )}
          <div style={{ display: 'flex', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={handleRemoveVideo}
              disabled={uploading || deleting}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Trash2 size={14} />
              Remove video
            </button>
          </div>
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

        <FormField label="Description / Instructions" id="exercise-description">
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
