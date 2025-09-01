"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getWorkout, deleteWorkout, updateWorkout } from "@/api/workouts";
import { WorkoutResponse, WorkoutEntryResponse } from "@/api/types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { MessageOverlay } from "@/components/MessageOverlay";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import DraftOrDeleteOverlay from "@/components/DraftOrDeleteOverlay";
import { ArrowLeftIcon, DumbbellIcon, CalendarIcon } from "@/components/Icons";
import { format } from "date-fns";
import { logger } from "@/utils/logger";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import ExerciseEntryInput from "@/components/ExerciseEntryInput";

export default function WorkoutDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [workout, setWorkout] = useState<WorkoutResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [editName, setEditName] = useState<string>("");
  const [editNotes, setEditNotes] = useState<string>("");
  const [editEntries, setEditEntries] = useState<
    Record<number, { setNumber: number; reps: number; weight: number }[]>
  >({});
  const [saveDraftLoading, setSaveDraftLoading] = useState(false);
  const [logWorkoutLoading, setLogWorkoutLoading] = useState(false);
  const [showDraftOverlay, setShowDraftOverlay] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [originalData, setOriginalData] = useState<{
    name: string;
    notes: string;
    entries: Record<
      number,
      { setNumber: number; reps: number; weight: number }[]
    >;
  } | null>(null);

  useEffect(() => {
    const fetchWorkout = async () => {
      try {
        setLoading(true);
        const response = await getWorkout(id as string);
        if (response.success && response.data) {
          setWorkout(response.data);
        } else {
          setError("Failed to fetch workout details");
        }
      } catch (err) {
        setError("An error occurred while fetching workout details");
        logger.error("Error fetching workout details", {
          error: err instanceof Error ? err.message : String(err),
        });
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchWorkout();
    }
  }, [id]);

  useEffect(() => {
    if (workout && workout.status === "draft") {
      setEditName(workout.name);
      setEditNotes(workout.notes || "");
      // Convert entries to editable format
      const entries: Record<
        number,
        { setNumber: number; reps: number; weight: number }[]
      > = {};
      workout.entries.forEach((entry) => {
        if (!entries[entry.exercise_id]) entries[entry.exercise_id] = [];
        entries[entry.exercise_id].push({
          setNumber: entry.set_number,
          reps: entry.reps,
          weight: entry.weight,
        });
      });
      setEditEntries(entries);

      // Store original data for comparison
      setOriginalData({
        name: workout.name,
        notes: workout.notes || "",
        entries: entries,
      });
      setHasUnsavedChanges(false);
    }
  }, [workout]);

  // Check for unsaved changes
  useEffect(() => {
    if (!originalData || !workout || workout.status !== "draft") {
      setHasUnsavedChanges(false);
      return;
    }

    const hasNameChange = editName !== originalData.name;
    const hasNotesChange = editNotes !== originalData.notes;

    // Check for entries changes
    const hasEntriesChange =
      JSON.stringify(editEntries) !== JSON.stringify(originalData.entries);

    setHasUnsavedChanges(hasNameChange || hasNotesChange || hasEntriesChange);
  }, [editName, editNotes, editEntries, originalData, workout]);

  // Navigation guards for unsaved changes
  useEffect(() => {
    if (!hasUnsavedChanges || !workout || workout.status !== "draft") return;

    // Handle browser back button and refresh
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
      return "";
    };

    // Handle programmatic navigation (mobile back gestures, etc.)
    const handlePopState = (e: PopStateEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        setShowDraftOverlay(true);
        // Push the current state back to prevent navigation
        window.history.pushState(null, "", window.location.href);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("popstate", handlePopState);

    // Push an initial state to detect back navigation
    window.history.pushState(null, "", window.location.href);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [hasUnsavedChanges, workout]);

  const handleDelete = async () => {
    try {
      setDeleteLoading(true);
      const response = await deleteWorkout(id as string);
      if (response.success) {
        setDeleteDialogOpen(false);
        // Navigate first with success message in URL params
        router.push(
          "/workouts?success=true&message=Workout deleted successfully!"
        );
      } else {
        setError("Failed to delete workout");
        setDeleteDialogOpen(false);
      }
    } catch (err) {
      setError("An error occurred while deleting the workout");
      logger.error("Error deleting workout", {
        error: err instanceof Error ? err.message : String(err),
      });
      setDeleteDialogOpen(false);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Group entries by exercise for better display
  const groupedEntries: Record<number, WorkoutEntryResponse[]> = {};
  workout?.entries?.forEach((entry: WorkoutEntryResponse) => {
    if (!groupedEntries[entry.exercise_id]) {
      groupedEntries[entry.exercise_id] = [];
    }
    groupedEntries[entry.exercise_id].push(entry);
  });

  const handleEntryChange = (
    exerciseId: number,
    setIdx: number,
    field: "reps" | "weight",
    value: number
  ) => {
    setEditEntries((prev) => {
      const updated = { ...prev };
      updated[exerciseId][setIdx] = {
        ...updated[exerciseId][setIdx],
        [field]: value,
      };
      return updated;
    });
  };

  const handleUpdateDraft = async () => {
    if (!workout) return;
    setSaveDraftLoading(true);
    const entriesArray = Object.entries(editEntries).flatMap(
      ([exerciseId, sets]) =>
        sets.map((set) => ({
          exercise_id: Number(exerciseId),
          set_number: set.setNumber,
          reps: set.reps,
          weight: set.weight,
        }))
    );
    try {
      await updateWorkout(workout.id, {
        name: editName,
        template_id: workout.template_id,
        notes: editNotes,
        entries: entriesArray,
        status: "draft",
      });
      router.refresh();
    } catch {
      setError("Failed to update draft");
    } finally {
      setSaveDraftLoading(false);
    }
  };

  const handleLogWorkout = async () => {
    if (!workout) return;
    setLogWorkoutLoading(true);
    const entriesArray = Object.entries(editEntries).flatMap(
      ([exerciseId, sets]) =>
        sets.map((set) => ({
          exercise_id: Number(exerciseId),
          set_number: set.setNumber,
          reps: set.reps,
          weight: set.weight,
        }))
    );
    try {
      await updateWorkout(workout.id, {
        name: editName,
        template_id: workout.template_id,
        notes: editNotes,
        entries: entriesArray,
        status: "completed",
      });
      router.push(
        `/workouts?success=true&message=Workout logged successfully!`
      );
    } catch {
      setError("Failed to log workout");
    } finally {
      setLogWorkoutLoading(false);
    }
  };

  const handleBackNavigation = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
    }

    if (hasUnsavedChanges && workout?.status === "draft") {
      setShowDraftOverlay(true);
    } else {
      router.push("/workouts");
    }
  };

  const addSet = (exerciseId: number) => {
    setEditEntries((prev) => {
      const currentSets = prev[exerciseId] || [];
      const newSetNumber =
        currentSets.length > 0
          ? Math.max(...currentSets.map((set) => set.setNumber)) + 1
          : 1;
      return {
        ...prev,
        [exerciseId]: [
          ...currentSets,
          { setNumber: newSetNumber, reps: 0, weight: 0 },
        ],
      };
    });
  };

  const removeSet = (exerciseId: number, setIdx: number) => {
    setEditEntries((prev) => {
      const updatedSets = [...(prev[exerciseId] || [])];
      updatedSets.splice(setIdx, 1);
      // Renumber set numbers to be consecutive
      const renumberedSets = updatedSets.map((set, idx) => ({
        ...set,
        setNumber: idx + 1,
      }));
      return {
        ...prev,
        [exerciseId]: renumberedSets,
      };
    });
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Skeleton className="h-6 w-6" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-16 w-full" />
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  if (error || !workout) {
    return (
      <div className="pb-16">
        <MessageOverlay
          message={error || "Workout not found"}
          type="error"
          isVisible={true}
          onClose={() => router.push("/workouts")}
        />
        <div className="text-center py-8">
          <DumbbellIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-red-500 mb-4">{error || "Workout not found"}</p>
          <Link href="/workouts">
            <Button>Back to Workouts</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Build a mapping from exerciseId to exerciseName
  const exerciseNames: Record<number, string> = {};
  if (workout) {
    workout.entries.forEach((entry) => {
      exerciseNames[entry.exercise_id] =
        entry.exercise_name || `Exercise ${entry.exercise_id}`;
    });
  }

  return (
    <div className="pb-16 px-2">
      {/* Back button */}
      <button
        onClick={handleBackNavigation}
        className="inline-flex items-center mb-3 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeftIcon className="mr-2 h-4 w-4" />
        Back to Workouts
      </button>

      {/* Editable Draft Section */}
      {workout.status === "draft" ? (
        <div className="grid gap-2 mt-1">
          <h1 className="text-2xl font-bold mb-2">Workout Draft</h1>
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Workout Name</Label>
            <Input
              id="name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="mt-1"
            />
          </div>
          <div className="flex flex-col gap-2 mt-1">
            <Label>Template</Label>
            <div className="border rounded mt-1 px-2 py-1 bg-muted text-sm text-muted-foreground">
              {workout.template_name}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="notes" className="text-sm">
              Notes
            </Label>
            <Textarea
              id="notes"
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              placeholder="How did the workout go? Any PRs?"
              rows={2}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label className="text-xl">Exercises</Label>
            {Object.entries(editEntries).map(([exerciseId, sets]) => (
              <ExerciseEntryInput
                key={exerciseId}
                exerciseId={Number(exerciseId)}
                exerciseName={exerciseNames[Number(exerciseId)]}
                entries={sets}
                onUpdateSet={handleEntryChange}
                onAddSet={addSet}
                onRemoveSet={removeSet}
              />
            ))}
          </div>
          <div className="flex gap-4 mt-4">
            <Button
              onClick={handleUpdateDraft}
              disabled={saveDraftLoading || logWorkoutLoading}
              variant="outline"
              className="flex-1"
            >
              {saveDraftLoading ? "Saving..." : "Save Draft"}
            </Button>
            <Button
              variant="destructive"
              onClick={handleLogWorkout}
              disabled={saveDraftLoading || logWorkoutLoading}
              className="flex-1"
            >
              {logWorkoutLoading ? "Logging..." : "Log Workout"}
            </Button>
          </div>
        </div>
      ) : (
        <div>
          {/* Workout Header */}
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-2xl font-bold pb-1">{workout.name}</h1>
              <div className="flex items-center mt-1 text-muted-foreground text-m pb-1">
                <CalendarIcon className="h-4 w-4 mr-1" />
                <span>
                  {workout.created_at
                    ? (() => {
                        try {
                          const date = new Date(workout.created_at);
                          return `${format(date, "PPP")} at ${format(
                            date,
                            "h:mm a"
                          )}`;
                        } catch {
                          return "Date unavailable";
                        }
                      })()
                    : "Date unavailable"}
                </span>
              </div>
              {/* workout time */}
              {workout.status === "completed" && (
                <div className="flex items-center mt-2 text-m text-muted-foreground gap-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="inline-block"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  <span>
                    {(() => {
                      try {
                        const created = new Date(workout.created_at);
                        const updated = new Date(workout.updated_at);

                        const diffMs = updated.getTime() - created.getTime();
                        const diffMins = Math.floor(diffMs / 60000);

                        return `${diffMins} min${diffMins > 1 ? "s" : ""}`;
                      } catch {
                        return "N/A";
                      }
                    })()}
                  </span>
                </div>
              )}

              <div className="mt-3">
                <Badge variant="outline" className="text-m">
                  {workout.template_name}
                </Badge>
              </div>
            </div>
          </div>

          {/* Notes Section - More compact */}
          {workout.notes && (
            <div className="mb-4 p-3 bg-muted rounded-lg">
              <p className="text-m text-foreground font-medium mb-1">Notes:</p>
              <p className="text-m text-muted-foreground">{workout.notes}</p>
            </div>
          )}

          {/* Exercises Section */}
          <div className="space-y-3">
            {Object.keys(groupedEntries).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <DumbbellIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No exercises found in this workout</p>
              </div>
            ) : (
              Object.entries(groupedEntries).map(([exerciseId, entries]) => {
                const firstEntry = entries[0];
                const exerciseName =
                  firstEntry?.exercise_name || `Exercise ${exerciseId}`;

                return (
                  <div
                    key={exerciseId}
                    className="bg-card border rounded-lg p-3"
                  >
                    {/* Exercise Header */}
                    <div className="flex items-center mb-2">
                      <h3 className="font-medium text-sm text-foreground">
                        {exerciseName}
                      </h3>
                    </div>

                    {/* Sets Table - Compact */}
                    <div className="bg-muted rounded-md p-2">
                      <div className="grid grid-cols-3 gap-2 text-xs font-medium text-muted-foreground mb-1">
                        <div>Set</div>
                        <div>Weight</div>
                        <div>Reps</div>
                      </div>
                      {entries
                        .sort((a, b) => a.set_number - b.set_number)
                        .map((entry) => (
                          <div
                            key={`${entry.exercise_id}-${entry.set_number}`}
                            className="grid grid-cols-3 gap-2 text-sm py-1"
                          >
                            <div className="font-medium">
                              {entry.set_number}
                            </div>
                            <div>{entry.weight} lbs</div>
                            <div>{entry.reps}</div>
                          </div>
                        ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Message Overlay */}
      <MessageOverlay
        message={error || ""}
        type="error"
        isVisible={!!error}
        onClose={() => {
          setError(null);
        }}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDelete
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Workout"
        description="Are you sure you want to delete this workout? This action cannot be undone."
        itemName={workout?.name || "this workout"}
        loading={deleteLoading}
      />

      {/* Draft or Delete Overlay */}
      <DraftOrDeleteOverlay
        open={showDraftOverlay}
        onDraft={async () => {
          setShowDraftOverlay(false);
          await handleUpdateDraft();
          router.push("/workouts");
        }}
        onDelete={() => {
          setShowDraftOverlay(false);
          router.push("/workouts");
        }}
        onCancel={() => setShowDraftOverlay(false)}
      />
    </div>
  );
}
