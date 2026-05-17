"use client";

import { supabase } from "../../../../_lib/supabase";
import {
  deleteExerciseVideo,
  isUploadedStorageUrl,
  uploadExerciseVideo,
} from "../_lib/storage";
import type { Exercise } from "../_lib/types";

export type ExerciseInput = {
  name: string;
  skillIds: number[];
  videoUrl: string | null;
  difficulty: number | null;
  description: string | null;
  equipment: string[];
  minimumDuration: number | null;
};

function clampDifficulty(value: number | null): number | null {
  if (value == null) return null;
  if (Number.isNaN(value)) return null;
  return Math.max(0, Math.min(5, Math.round(value)));
}

export async function addExercise(
  input: ExerciseInput,
  videoFile: File | null,
  onProgress?: (percent: number) => void,
): Promise<void> {
  if (input.skillIds.length === 0) {
    throw new Error("At least one skill is required.");
  }
  let createdRowId: number | null = null;
  let uploadedUrl: string | null = null;
  try {
    const { data, error } = await supabase
      .from("exercises")
      .insert({
        skill_id: input.skillIds[0],
        name: input.name,
        video_url: input.videoUrl || null,
        difficulty: clampDifficulty(input.difficulty),
        description: input.description,
        equipment: input.equipment,
        minimum_duration: input.minimumDuration ?? null,
      })
      .select()
      .single();
    if (error) throw error;
    createdRowId = data.id as number;

    const { error: jErr } = await supabase
      .from("exercise_skills")
      .insert(input.skillIds.map((sid) => ({ exercise_id: createdRowId, skill_id: sid })));
    if (jErr) throw jErr;

    if (videoFile && createdRowId != null) {
      const { publicUrl } = await uploadExerciseVideo(videoFile, createdRowId, onProgress);
      uploadedUrl = publicUrl;
      const { error: uErr } = await supabase
        .from("exercises")
        .update({ video_url: publicUrl })
        .eq("id", createdRowId);
      if (uErr) throw uErr;
    }
  } catch (err) {
    // rollback: best-effort
    if (uploadedUrl) await deleteExerciseVideo(uploadedUrl).catch(() => undefined);
    if (createdRowId != null) {
      await supabase.from("exercise_skills").delete().eq("exercise_id", createdRowId).then(
        () => undefined,
        () => undefined,
      );
      await supabase.from("exercises").delete().eq("id", createdRowId).then(
        () => undefined,
        () => undefined,
      );
    }
    throw err;
  }
}

export async function updateExercise(
  id: number,
  input: ExerciseInput,
  previous: Exercise | null,
  videoFile: File | null,
  onProgress?: (percent: number) => void,
): Promise<void> {
  if (input.skillIds.length === 0) {
    throw new Error("At least one skill is required.");
  }
  const previousVideoUrl = previous?.videoUrl ?? null;
  let uploadedUrl: string | null = null;
  try {
    let videoUrl: string | null = input.videoUrl ?? previousVideoUrl;
    if (videoFile) {
      const { publicUrl } = await uploadExerciseVideo(videoFile, id, onProgress);
      uploadedUrl = publicUrl;
      videoUrl = publicUrl;
    }

    const { error } = await supabase
      .from("exercises")
      .update({
        skill_id: input.skillIds[0],
        name: input.name,
        video_url: videoUrl || null,
        difficulty: clampDifficulty(input.difficulty),
        description: input.description,
        equipment: input.equipment,
        minimum_duration: input.minimumDuration ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (error) throw error;

    const { error: delErr } = await supabase
      .from("exercise_skills")
      .delete()
      .eq("exercise_id", id);
    if (delErr) throw delErr;

    const { error: insErr } = await supabase
      .from("exercise_skills")
      .insert(input.skillIds.map((sid) => ({ exercise_id: id, skill_id: sid })));
    if (insErr) throw insErr;

    if (
      previousVideoUrl &&
      previousVideoUrl !== videoUrl &&
      isUploadedStorageUrl(previousVideoUrl)
    ) {
      await deleteExerciseVideo(previousVideoUrl).catch(() => undefined);
    }
  } catch (err) {
    if (uploadedUrl) await deleteExerciseVideo(uploadedUrl).catch(() => undefined);
    throw err;
  }
}

export async function deleteExercise(
  id: number,
  snapshot: { exercises: Exercise[] },
): Promise<void> {
  const exercise = snapshot.exercises.find((e) => e.id === id);
  const { error } = await supabase.from("exercises").delete().eq("id", id);
  if (error) throw error;
  if (exercise?.videoUrl && isUploadedStorageUrl(exercise.videoUrl)) {
    await deleteExerciseVideo(exercise.videoUrl).catch(() => undefined);
  }
}
