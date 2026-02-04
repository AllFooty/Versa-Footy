import React, { useState, useEffect } from 'react';
import CategoryItem from './CategoryItem';

/**
 * Main tree view container for categories, skills, and exercises
 * Mobile-responsive with touch-friendly interactions
 */
const TreeView = ({
  categories,
  getSkillsForCategory,
  getExercisesForSkill,
  searchTerm,
  filterAgeGroup,
  filterHasExercises,
  exactAgeMatch,
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
  const [expandedSkills, setExpandedSkills] = useState({});
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleCategory = (categoryId) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  const toggleSkill = (skillId) => {
    setExpandedSkills((prev) => ({
      ...prev,
      [skillId]: !prev[skillId],
    }));
  };

  return (
    <div
      className="tree-view scrollbar"
      style={{ 
        maxHeight: isMobile ? 'none' : 'calc(100vh - 280px)', 
        overflowY: 'auto',
      }}
    >
      {categories.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: isMobile ? '40px 20px' : '60px 20px',
            color: '#71717a',
          }}
        >
          <div style={{ fontSize: isMobile ? 36 : 48, marginBottom: 16 }}>⚽</div>
          <p style={{ fontSize: isMobile ? 14 : 16, margin: 0 }}>
            No categories yet. Tap the + button to get started!
          </p>
        </div>
      ) : (
        categories.map((category) => {
          const skills = getSkillsForCategory(category.id, {
            searchTerm,
            filterAgeGroup,
            filterHasExercises,
            exactAgeMatch,
          });
          const isExpanded = expandedCategories[category.id];

          return (
            <CategoryItem
              key={category.id}
              category={category}
              skills={skills}
              isExpanded={isExpanded}
              onToggle={toggleCategory}
              expandedSkills={expandedSkills}
              onToggleSkill={toggleSkill}
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
              isMobile={isMobile}
            />
          );
        })
      )}
    </div>
  );
};

export default TreeView;
