import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Play, CheckCircle, Trash2, Upload, Plus, RefreshCw, AlertTriangle } from 'lucide-react';
import { listExerciseVideos } from '../../lib/storage';
import ConfirmModal from './ConfirmModal';

// Pull the folder id out of an exercise-videos URL, e.g.
//   .../exercise-videos/exercises/42/abc.mov  →  '42'
const folderIdFromUrl = (url) => {
  if (!url) return null;
  const m = /\/exercise-videos\/exercises\/([^/]+)\//.exec(url);
  return m ? m[1] : null;
};

const formatBytes = (n) => {
  if (!n && n !== 0) return '—';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
};

const ext = (name) => (name.split('.').pop() || '').toLowerCase();

/**
 * Multi-video management pane for an exercise.
 * Lists every file stored under `exercises/{id}/` as candidates — the `activeUrl`
 * is the one users see. Admins can preview, set active, delete individual files,
 * or add additional candidates without replacing the active one.
 */
const ExerciseVideosPane = ({
  exerciseId,
  activeUrl,
  onSetActive,
  onDeleteCandidate,
  onAddCandidate,
  onActiveUrlChange,
  isMobile,
}) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [busyPath, setBusyPath] = useState(null);
  const [previewPath, setPreviewPath] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null); // { path, publicUrl, name }
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // If the active URL points to a different folder than this exercise's own id,
  // list that folder too so the admin can actually see and manage the file
  // that's currently being served to users.
  const extraFolderId = useMemo(() => {
    const urlFolder = folderIdFromUrl(activeUrl);
    return urlFolder && String(urlFolder) !== String(exerciseId) ? urlFolder : null;
  }, [activeUrl, exerciseId]);

  const refresh = useCallback(async () => {
    if (exerciseId == null) return;
    setLoading(true);
    setError(null);
    try {
      const tasks = [listExerciseVideos(exerciseId)];
      if (extraFolderId) tasks.push(listExerciseVideos(extraFolderId));
      const [ownFolder, otherFolder = []] = await Promise.all(tasks);
      // Tag each item with its folder so the UI can show where it lives.
      const own = ownFolder.map((i) => ({ ...i, folderId: String(exerciseId), inOwnFolder: true }));
      const other = otherFolder.map((i) => ({ ...i, folderId: String(extraFolderId), inOwnFolder: false }));
      setItems([...own, ...other]);
    } catch (err) {
      setError(err.message || 'Failed to load videos');
    } finally {
      setLoading(false);
    }
  }, [exerciseId, extraFolderId]);

  useEffect(() => { refresh(); }, [refresh]);

  const handleSetActive = async (publicUrl) => {
    setBusyPath(publicUrl);
    setError(null);
    try {
      await onSetActive(publicUrl);
      onActiveUrlChange?.(publicUrl);
    } catch (err) {
      setError(err.message || 'Failed to set active video');
    } finally {
      setBusyPath(null);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    const { path, publicUrl } = confirmDelete;
    setConfirmDelete(null);
    setBusyPath(path);
    setError(null);
    try {
      await onDeleteCandidate(path, publicUrl);
      if (activeUrl === publicUrl) onActiveUrlChange?.(null);
      await refresh();
    } catch (err) {
      setError(err.message || 'Failed to delete video');
    } finally {
      setBusyPath(null);
    }
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      setError('Only video files are allowed.');
      return;
    }
    if (file.size > 200 * 1024 * 1024) {
      setError(`Video must be under 200 MB. This one is ${(file.size / (1024 * 1024)).toFixed(0)} MB.`);
      return;
    }
    setUploading(true);
    setUploadProgress(0);
    setError(null);
    try {
      await onAddCandidate(file, (p) => setUploadProgress(p));
      await refresh();
    } catch (err) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const activeCount = items.filter((i) => i.publicUrl === activeUrl).length;

  return (
    <div style={paneStyle}>
      <div style={headerStyle}>
        <div>
          <div style={titleStyle}>Videos for this exercise</div>
          <div style={subtitleStyle}>
            {items.length === 0 && !loading && 'No videos uploaded yet.'}
            {items.length > 0 && (
              <>
                {items.length} file{items.length === 1 ? '' : 's'}
                {activeCount === 0 && activeUrl ? ' · active video points outside this folder' : ''}
                {activeCount === 0 && !activeUrl ? ' · none active' : ''}
              </>
            )}
          </div>
        </div>
        <button type="button" onClick={refresh} disabled={loading} style={iconBtnStyle} title="Refresh">
          <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : undefined }} />
        </button>
      </div>

      {error && <div style={errorStyle}>{error}</div>}

      {extraFolderId && (
        <div style={mismatchStyle}>
          <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            The active video is stored under <code style={inlineCodeStyle}>exercises/{extraFolderId}/</code>,
            not this exercise's own folder (<code style={inlineCodeStyle}>exercises/{exerciseId}/</code>).
            Files from both folders are listed below. To tidy up, use "Add another video" to upload a copy
            into the correct folder, set that one as active, then delete the outside file.
          </div>
        </div>
      )}

      {items.length > 0 && (
        <ul style={listStyle}>
          {items.map((item) => {
            const isActive = item.publicUrl === activeUrl;
            const isBusy = busyPath === item.publicUrl || busyPath === item.path;
            const isPreviewing = previewPath === item.path;
            return (
              <li key={item.path} style={rowStyle(isActive, isMobile)}>
                <div style={rowTopStyle(isMobile)}>
                  <button
                    type="button"
                    onClick={() => setPreviewPath(isPreviewing ? null : item.path)}
                    style={previewBtnStyle(isPreviewing)}
                    title={isPreviewing ? 'Hide preview' : 'Preview'}
                  >
                    <Play size={14} />
                  </button>

                  <div style={metaColStyle}>
                    <div style={nameStyle}>
                      {item.name}
                      {ext(item.name) === 'mov' && <span style={movBadgeStyle}>.mov</span>}
                      {!item.inOwnFolder && (
                        <span style={otherFolderBadgeStyle}>
                          <AlertTriangle size={10} />
                          in folder {item.folderId}
                        </span>
                      )}
                      {isActive && (
                        <span style={activeBadgeStyle}>
                          <CheckCircle size={11} />
                          active
                        </span>
                      )}
                    </div>
                    <div style={metaStyle}>{formatBytes(item.sizeBytes)}</div>
                  </div>

                  <div style={actionsStyle(isMobile)}>
                    {!isActive && (
                      <button
                        type="button"
                        onClick={() => handleSetActive(item.publicUrl)}
                        disabled={isBusy}
                        style={setActiveBtnStyle}
                      >
                        Set active
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setConfirmDelete({ path: item.path, publicUrl: item.publicUrl, name: item.name })}
                      disabled={isBusy}
                      style={deleteBtnStyle}
                      title="Delete this video"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {isPreviewing && (
                  <div style={previewWrapStyle}>
                    {/* Keep the video element mounted only while previewing so we don't
                        preload N files at once for exercises with many candidates. */}
                    <video
                      src={item.publicUrl}
                      controls
                      playsInline
                      style={{ width: '100%', maxHeight: 320, borderRadius: 6, background: '#000' }}
                    />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <label htmlFor="exercise-video-candidate-file" style={addBtnStyle(isMobile)}>
        {uploading
          ? <Upload size={16} />
          : <Plus size={16} />}
        {uploading
          ? `Uploading… ${uploadProgress}%`
          : items.length === 0
            ? 'Upload first video'
            : 'Add another video'}
      </label>
      <input
        id="exercise-video-candidate-file"
        type="file"
        accept="video/*"
        onChange={handleFileChange}
        disabled={uploading}
        style={{ display: 'none' }}
      />

      {uploading && (
        <div style={progressWrapStyle}>
          <div style={{
            width: `${uploadProgress}%`, height: '100%',
            background: 'linear-gradient(90deg, #3b82f6, #60a5fa)',
            borderRadius: 3, transition: 'width 0.2s ease',
          }} />
        </div>
      )}

      <ConfirmModal
        isOpen={!!confirmDelete}
        title="Delete this video?"
        message={
          confirmDelete && activeUrl === confirmDelete.publicUrl
            ? `This is the active video. Deleting it will leave the exercise without a video until you set another one as active.`
            : `"${confirmDelete?.name}" will be permanently removed from storage.`
        }
        confirmLabel="Delete"
        confirmDanger
        onConfirm={handleDelete}
        onClose={() => setConfirmDelete(null)}
      />
    </div>
  );
};

/* ---- styles ---- */

const paneStyle = {
  marginTop: 12,
  padding: 12,
  borderRadius: 10,
  background: 'rgba(255,255,255,0.02)',
  border: '1px solid rgba(255,255,255,0.08)',
};

const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: 8,
  marginBottom: 10,
};

const titleStyle = {
  fontSize: 13,
  fontWeight: 600,
  color: '#e4e4e7',
};

const subtitleStyle = {
  fontSize: 11,
  color: '#9ca3af',
  marginTop: 2,
};

const iconBtnStyle = {
  background: 'transparent',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 6,
  padding: 6,
  color: '#9ca3af',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const errorStyle = {
  padding: '6px 10px',
  marginBottom: 8,
  borderRadius: 6,
  fontSize: 12,
  background: 'rgba(239,68,68,0.1)',
  border: '1px solid rgba(239,68,68,0.3)',
  color: '#fecaca',
};

const listStyle = { listStyle: 'none', margin: 0, padding: 0, marginBottom: 10 };

const rowStyle = (isActive, isMobile) => ({
  padding: isMobile ? '10px 10px' : '8px 10px',
  borderRadius: 8,
  marginBottom: 6,
  background: isActive ? 'rgba(74,222,128,0.06)' : 'rgba(255,255,255,0.025)',
  border: `1px solid ${isActive ? 'rgba(74,222,128,0.25)' : 'rgba(255,255,255,0.06)'}`,
});

const rowTopStyle = (isMobile) => ({
  display: 'flex',
  alignItems: 'center',
  gap: isMobile ? 8 : 10,
  flexWrap: isMobile ? 'wrap' : 'nowrap',
});

const previewBtnStyle = (on) => ({
  flexShrink: 0,
  width: 32,
  height: 32,
  borderRadius: 6,
  background: on ? 'rgba(96,165,250,0.25)' : 'rgba(96,165,250,0.1)',
  border: `1px solid ${on ? 'rgba(96,165,250,0.5)' : 'rgba(96,165,250,0.25)'}`,
  color: on ? '#bfdbfe' : '#93c5fd',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
});

const metaColStyle = { flex: '1 1 auto', minWidth: 0 };

const nameStyle = {
  fontSize: 13,
  color: '#e4e4e7',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  flexWrap: 'wrap',
};

const metaStyle = { fontSize: 11, color: '#71717a', marginTop: 2 };

const movBadgeStyle = {
  fontSize: 10,
  padding: '1px 6px',
  borderRadius: 4,
  background: 'rgba(250,204,21,0.15)',
  border: '1px solid rgba(250,204,21,0.35)',
  color: '#fde68a',
  fontWeight: 600,
};

const otherFolderBadgeStyle = {
  fontSize: 10,
  padding: '1px 6px',
  borderRadius: 4,
  background: 'rgba(251, 146, 60, 0.15)',
  border: '1px solid rgba(251, 146, 60, 0.35)',
  color: '#fed7aa',
  fontWeight: 600,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 3,
};

const mismatchStyle = {
  display: 'flex',
  gap: 8,
  padding: '10px 12px',
  marginBottom: 10,
  borderRadius: 8,
  background: 'rgba(251, 146, 60, 0.08)',
  border: '1px solid rgba(251, 146, 60, 0.3)',
  color: '#fed7aa',
  fontSize: 12,
  lineHeight: 1.4,
};

const inlineCodeStyle = {
  fontFamily: 'ui-monospace, Menlo, monospace',
  background: 'rgba(0,0,0,0.3)',
  padding: '1px 5px',
  borderRadius: 3,
  fontSize: 11,
  color: '#fde68a',
};

const activeBadgeStyle = {
  fontSize: 10,
  padding: '1px 6px',
  borderRadius: 4,
  background: 'rgba(74,222,128,0.15)',
  border: '1px solid rgba(74,222,128,0.35)',
  color: '#bbf7d0',
  fontWeight: 600,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
};

const actionsStyle = (isMobile) => ({
  display: 'flex',
  gap: 6,
  flexShrink: 0,
  marginInlineStart: isMobile ? 0 : 'auto',
  marginTop: isMobile ? 8 : 0,
  width: isMobile ? '100%' : 'auto',
});

const setActiveBtnStyle = {
  padding: '6px 10px',
  fontSize: 12,
  fontWeight: 600,
  borderRadius: 6,
  background: 'rgba(96,165,250,0.12)',
  border: '1px solid rgba(96,165,250,0.3)',
  color: '#bfdbfe',
  cursor: 'pointer',
  minHeight: 32,
};

const deleteBtnStyle = {
  padding: '6px 8px',
  borderRadius: 6,
  background: 'rgba(239,68,68,0.1)',
  border: '1px solid rgba(239,68,68,0.3)',
  color: '#fecaca',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 32,
  minWidth: 32,
};

const previewWrapStyle = { marginTop: 10 };

const addBtnStyle = (isMobile) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  padding: isMobile ? '12px 16px' : '10px 14px',
  background: 'rgba(96,165,250,0.08)',
  border: '1px dashed rgba(96,165,250,0.3)',
  borderRadius: 8,
  color: '#93c5fd',
  fontSize: isMobile ? 14 : 13,
  fontWeight: 500,
  cursor: 'pointer',
  minHeight: isMobile ? 48 : 'auto',
});

const progressWrapStyle = {
  marginTop: 8,
  height: 4,
  width: '100%',
  background: 'rgba(255,255,255,0.08)',
  borderRadius: 3,
  overflow: 'hidden',
};

export default ExerciseVideosPane;
