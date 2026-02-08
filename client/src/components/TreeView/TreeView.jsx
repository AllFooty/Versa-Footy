import React, { useState, useEffect, useMemo } from 'react';
import CategoryItem from './CategoryItem';
import { isSearchActive, normalizeSearchTerm } from '../../utils/search';

/**
 * Main tree view container for categories, skills, and exercises
 * Mobile-responsive with touch-friendly interactions
 */
const TreeView = ({
  categories,
  getSkillsForCategory,
  getExercisesForSkill,
  getCategoriesMatchingSearch,
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

  const isSearching = isSearchActive(searchTerm) || !!filterAgeGroup || filterHasExercises;

  // Pre-compute filtered skills per category
  const categoriesWithResults = useMemo(() => {
    return categories.map((category) => {
      const filteredSkills = getSkillsForCategory(category.id, {
        searchTerm,
        filterAgeGroup,
        filterHasExercises,
        exactAgeMatch,
      });
      return { category, filteredSkills };
    });
  }, [categories, getSkillsForCategory, searchTerm, filterAgeGroup, filterHasExercises, exactAgeMatch]);

  // During active search, hide categories with no matching skills
  // (unless the category name itself matches the search)
  const categoryNameMatches = useMemo(
    () => getCategoriesMatchingSearch(searchTerm),
    [getCategoriesMatchingSearch, searchTerm]
  );

  const visibleCategories = isSearching
    ? categoriesWithResults.filter(
        ({ category, filteredSkills }) =>
          filteredSkills.length > 0 || categoryNameMatches.has(category.id)
      )
    : categoriesWithResults;

  // Count totals for result feedback
  const resultCounts = useMemo(() => {
    if (!isSearching) return null;
    let totalSkills = 0;
    let totalExercises = 0;
    for (const { filteredSkills } of visibleCategories) {
      totalSkills += filteredSkills.length;
      for (const skill of filteredSkills) {
        totalExercises += getExercisesForSkill(skill.id, { searchTerm }).length;
      }
    }
    return { totalSkills, totalExercises, totalCategories: visibleCategories.length };
  }, [isSearching, visibleCategories, getExercisesForSkill, searchTerm]);

  return (
    <div
      className="tree-view"
      onTouchStart={() => {
        // Dismiss mobile keyboard when tapping on results
        if (document.activeElement?.tagName === 'INPUT') {
          document.activeElement.blur();
        }
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
        <>
          {/* Search result summary */}
          {isSearching && visibleCategories.length > 0 && resultCounts && (
            <div
              style={{
                padding: '8px 16px',
                marginBottom: 12,
                color: '#71717a',
                fontSize: 13,
              }}
            >
              Found {resultCounts.totalSkills} skill{resultCounts.totalSkills !== 1 ? 's' : ''}
              {' '}and {resultCounts.totalExercises} exercise{resultCounts.totalExercises !== 1 ? 's' : ''}
              {' '}across {resultCounts.totalCategories} categor{resultCounts.totalCategories !== 1 ? 'ies' : 'y'}
            </div>
          )}

          {/* No results state */}
          {isSearching && visibleCategories.length === 0 && (
            <div
              style={{
                textAlign: 'center',
                padding: isMobile ? '40px 20px' : '60px 20px',
                color: '#71717a',
              }}
            >
              <div style={{ fontSize: isMobile ? 36 : 48, marginBottom: 16 }}>🔍</div>
              <p style={{ fontSize: isMobile ? 14 : 16, margin: '0 0 8px' }}>
                No results found
              </p>
              <p style={{ fontSize: 13, margin: 0, color: '#52525b' }}>
                Try different keywords or adjust your filters
              </p>
            </div>
          )}

          {/* Category list */}
          {visibleCategories.map(({ category, filteredSkills }) => {
            const isExpanded = isSearching || expandedCategories[category.id];

            return (
              <CategoryItem
                key={category.id}
                category={category}
                skills={filteredSkills}
                isExpanded={isExpanded}
                isSearching={isSearching}
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
          })}
        </>
      )}
    </div>
  );
};

export default TreeView;
