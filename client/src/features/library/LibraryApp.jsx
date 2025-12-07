import React, { useState } from 'react';

// Components
import Header from '../../components/Header';
import SearchBar from '../../components/SearchBar';
import { TreeView } from '../../components/TreeView';
import {
  CategoryModal,
  SkillModal,
  ExerciseModal,
  PreviewModal,
} from '../../components/modals';

// Landing page components
import HeaderLanding from '../landing/components/HeaderLanding';
import FooterLanding from '../landing/components/FooterLanding';
import All4FootyFamilyBar from '../landing/components/All4FootyFamilyBar';

// Hooks
import { useData } from '../../hooks/useData';

// Styles
import '../../styles/library.css';
import '../landing/styles/landing-globals.css';

/**
 * Versa Footy Library experience.
 * This was the former top-level App component; now namespaced under features/library.
 */
export default function LibraryApp() {
  // Data management via custom hook
  const {
    categories,
    skills,
    stats,
    loading,
    error,
    addCategory,
    updateCategory,
    deleteCategory,
    addSkill,
    updateSkill,
    deleteSkill,
    addExercise,
    updateExercise,
    deleteExercise,
    getSkillById,
    getCategoryById,
    getSkillsForCategory,
    getExercisesForSkill,
  } = useData();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAgeGroup, setFilterAgeGroup] = useState('');

  // Modal state
  const [categoryModal, setCategoryModal] = useState({ open: false, item: null });
  const [skillModal, setSkillModal] = useState({ open: false, item: null, categoryId: null });
  const [exerciseModal, setExerciseModal] = useState({ open: false, item: null, skillId: null });
  const [previewExercise, setPreviewExercise] = useState(null);

  // ============ Modal Handlers ============

  const openCategoryModal = (item = null) => {
    setCategoryModal({ open: true, item });
  };

  const openSkillModal = (item = null, category = null) => {
    setSkillModal({
      open: true,
      item,
      categoryId: item?.categoryId || category?.id || null,
    });
  };

  const openExerciseModal = (item = null, skill = null) => {
    setExerciseModal({
      open: true,
      item,
      skillId: item?.skillId || skill?.id || null,
    });
  };

  // ============ Save Handlers ============

  const handleSaveCategory = (formData, editId) => {
    if (editId) {
      updateCategory(editId, formData);
    } else {
      addCategory(formData);
    }
  };

  const handleSaveSkill = (formData, editId) => {
    if (editId) {
      updateSkill(editId, formData);
    } else {
      addSkill(formData);
    }
  };

  const handleSaveExercise = (formData, editId) => {
    if (editId) {
      updateExercise(editId, formData);
    } else {
      addExercise(formData);
    }
  };

  // ============ Preview Data ============

  const previewSkill = previewExercise ? getSkillById(previewExercise.skillId) : null;
  const previewCategory = previewSkill ? getCategoryById(previewSkill.categoryId) : null;

  return (
    <>
      {/* Landing Page Header */}
      <All4FootyFamilyBar />
      <div
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #0a0f1a 0%, #1a1f2e 50%, #0d1117 100%)',
          fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
          color: '#e4e4e7',
        }}
      >
        <HeaderLanding />

        {/* Library Stats Header */}
        <Header stats={stats} />

      {/* Main Content */}
      <main style={{ maxWidth: 1400, margin: '0 auto', padding: '32px 40px' }}>
        {/* Loading State */}
        {loading && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '80px 0',
              color: '#71717a',
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  border: '3px solid #27272a',
                  borderTopColor: '#E63946',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto 16px',
                }}
              />
              <p>Loading data from Supabase...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div
            style={{
              background: 'rgba(220, 38, 38, 0.1)',
              border: '1px solid rgba(220, 38, 38, 0.3)',
              borderRadius: 8,
              padding: 16,
              marginBottom: 24,
              color: '#fca5a5',
            }}
          >
            <strong>Error loading data:</strong> {error}
          </div>
        )}

        {/* Search & Action Bar */}
        {!loading && (
          <SearchBar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            filterAgeGroup={filterAgeGroup}
            onFilterChange={setFilterAgeGroup}
            onAddExercise={() => openExerciseModal()}
            onAddSkill={() => openSkillModal()}
            onAddCategory={() => openCategoryModal()}
          />
        )}

        {/* Tree View */}
        {!loading && (
          <TreeView
            categories={categories}
            getSkillsForCategory={getSkillsForCategory}
            getExercisesForSkill={getExercisesForSkill}
            searchTerm={searchTerm}
            filterAgeGroup={filterAgeGroup}
            // Category actions
            onEditCategory={openCategoryModal}
            onDeleteCategory={deleteCategory}
            // Skill actions
            onAddSkill={(category) => openSkillModal(null, category)}
            onEditSkill={openSkillModal}
            onDeleteSkill={deleteSkill}
            // Exercise actions
            onAddExercise={(skill) => openExerciseModal(null, skill)}
            onPreviewExercise={setPreviewExercise}
            onEditExercise={openExerciseModal}
            onDeleteExercise={deleteExercise}
          />
        )}
      </main>

      {/* Modals */}
      <CategoryModal
        isOpen={categoryModal.open}
        onClose={() => setCategoryModal({ open: false, item: null })}
        onSave={handleSaveCategory}
        editItem={categoryModal.item}
      />

      <SkillModal
        isOpen={skillModal.open}
        onClose={() => setSkillModal({ open: false, item: null, categoryId: null })}
        onSave={handleSaveSkill}
        editItem={skillModal.item}
        categories={categories}
        preselectedCategoryId={skillModal.categoryId}
      />

      <ExerciseModal
        isOpen={exerciseModal.open}
        onClose={() => setExerciseModal({ open: false, item: null, skillId: null })}
        onSave={handleSaveExercise}
        editItem={exerciseModal.item}
        categories={categories}
        skills={skills}
        preselectedSkillId={exerciseModal.skillId}
      />

      <PreviewModal
        exercise={previewExercise}
        skill={previewSkill}
        category={previewCategory}
        onClose={() => setPreviewExercise(null)}
        onEdit={openExerciseModal}
      />
      </div>

      {/* Landing Page Footer */}
      <FooterLanding />
    </>
  );
}

