import React from 'react';
import { FileText, Plus, Edit3, Trash2 } from 'lucide-react';
import { IconButton, AgeBadge, SkillCountBadge } from '../ui';
import ExerciseItem from './ExerciseItem';

/**
 * Single skill item with its exercises
 */
const SkillItem = ({
  skill,
  exercises,
  onAddExercise,
  onEditSkill,
  onDeleteSkill,
  onPreviewExercise,
  onEditExercise,
  onDeleteExercise,
}) => {
  const handleDeleteSkill = () => {
    const exerciseCount = exercises.length;
    const confirmed = window.confirm(
      exerciseCount > 0
        ? `Delete skill "${skill.name}" and its ${exerciseCount} exercise${exerciseCount === 1 ? '' : 's'}?`
        : `Delete skill "${skill.name}"?`
    );

    if (!confirmed) return;
    onDeleteSkill(skill.id);
  };

  return (
    <div>
      {/* Skill Header */}
      <div
        className="tree-skill"
        style={{ display: 'flex', alignItems: 'center', gap: 12 }}
      >
        <FileText size={16} color="#71717a" />
        
        <span style={{ flex: 1, fontWeight: 500 }}>{skill.name}</span>
        
        <AgeBadge age={skill.ageGroup} />
        <SkillCountBadge count={exercises.length} />

        {/* Actions */}
        <div style={{ display: 'flex', gap: 4 }}>
          <IconButton onClick={() => onAddExercise(skill)} title="Add exercise to this skill">
            <Plus size={14} />
          </IconButton>
          <IconButton onClick={() => onEditSkill(skill)} title="Edit skill">
            <Edit3 size={14} />
          </IconButton>
          <IconButton danger onClick={handleDeleteSkill} title="Delete skill">
            <Trash2 size={14} />
          </IconButton>
        </div>
      </div>

      {/* Exercises List */}
      {exercises.length > 0 && (
        <div style={{ marginLeft: 64, marginTop: 4 }}>
          {exercises.map((exercise) => (
            <ExerciseItem
              key={exercise.id}
              exercise={exercise}
              onPreview={onPreviewExercise}
              onEdit={onEditExercise}
              onDelete={onDeleteExercise}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default SkillItem;
