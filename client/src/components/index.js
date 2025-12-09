/**
 * Components - Central Export
 */

// Layout components
export { default as Header } from './Header';
export { default as SearchBar } from './SearchBar';
export { default as ProfileDropdown } from './ProfileDropdown';

// Auth/Route protection components
export { default as ProtectedRoute } from './ProtectedRoute';
export { default as AdminProtectedRoute } from './AdminProtectedRoute';

// Tree view components
export { TreeView, CategoryItem, SkillItem, ExerciseItem } from './TreeView';

// Modal components
export {
  Modal,
  CategoryModal,
  SkillModal,
  ExerciseModal,
  PreviewModal,
  ProfileEditModal,
} from './modals';

// UI components
export * from './ui';
