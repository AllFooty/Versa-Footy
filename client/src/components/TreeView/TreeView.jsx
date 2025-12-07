import React, { useState } from 'react';
import CategoryItem from './CategoryItem';

/**
 * Main tree view container for categories, skills, and exercises
 */
const TreeView = ({
  categories,
  getSkillsForCategory,
  getExercisesForSkill,
  searchTerm,
  filterAgeGroup,
  // Category actions
  onEditCategory,
  onDeleteCategory,
  // Skill actions
  onAddSkill,
  onEditSkill,
  onDeleteSkill,
  // Exercise actions
  onAddExercise,
  onPreviewExercise,
  onEditExercise,
  onDeleteExercise,
}) => {
  const [expandedCategories, setExpandedCategories] = useState({});

  const toggleCategory = (categoryId) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  return (
    <div
      className="tree-view scrollbar"
      style={{ maxHeight: 'calc(100vh - 280px)', overflowY: 'auto' }}
    >
      {categories.map((category) => {
        const skills = getSkillsForCategory(category.id, {
          searchTerm,
          filterAgeGroup,
        });
        const isExpanded = expandedCategories[category.id];

        return (
          <CategoryItem
            key={category.id}
            category={category}
            skills={skills}
            isExpanded={isExpanded}
            onToggle={toggleCategory}
            onEditCategory={onEditCategory}
            onDeleteCategory={onDeleteCategory}
            onAddSkill={onAddSkill}
            onEditSkill={onEditSkill}
            onDeleteSkill={onDeleteSkill}
            onAddExercise={onAddExercise}
            onPreviewExercise={onPreviewExercise}
            onEditExercise={onEditExercise}
            onDeleteExercise={onDeleteExercise}
            getExercisesForSkill={(skillId) =>
              getExercisesForSkill(skillId, { searchTerm })
            }
          />
        );
      })}
    </div>
  );
};

export default TreeView;
