"use client";

import React from "react";
import { useState, useEffect, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

import { createWorkout, getWorkouts } from "@/api/workouts";
import { getTemplates, getTemplate } from "@/api/templates";
import { getExercises } from "@/api/exercises";
import {
  Template,
  TemplateListItem,
  Exercise,
  CreateWorkoutRequest,
  TemplateExercise,
} from "@/api/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import DraftOrDeleteOverlay from "@/components/DraftOrDeleteOverlay";
import ExerciseEntryInput from "@/components/ExerciseEntryInput";

import { ArrowLeftIcon } from "@/components/Icons";
import { MessageOverlay } from "@/components/MessageOverlay";
import { logger } from "@/utils/logger";

export default function CreateWorkoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [templates, setTemplates] = useState<TemplateListItem[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(
    null
  );
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [showDraftOverlay, setShowDraftOverlay] = useState(false);

  // Form state
  const [formData, setFormData] = useState<{
    name: string;
    templateId: string;
    notes: string;
    entries: Record<
      number,
      { setNumber: number; reps: number; weight: number }[]
    >;
  }>({
    name: "",
    templateId: "",
    notes: "",
    entries: {},
  });

  // Load templates
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await getTemplates();
        if (response.success && Array.isArray(response.data)) {
          setTemplates(response.data);
        }
      } catch (err) {
        setError("Failed to load templates");
        logger.error("Error loading templates", {
          error: err instanceof Error ? err.message : String(err),
        });
      }
    };

    fetchTemplates();
  }, []);

  // Load exercises
  useEffect(() => {
    const fetchExercises = async () => {
      try {
        setLoading(true);
        const response = await getExercises(1, 100); // Add pagination parameters
        if (response.success && Array.isArray(response.data)) {
          setExercises(response.data);
        } else {
          logger.error("Failed to load exercises", { response });
          setError("Failed to load exercises");
        }
      } catch (err) {
        setError("Failed to load exercises");
        logger.error("Exercise loading error", {
          error: err instanceof Error ? err.message : String(err),
        });
      } finally {
        setLoading(false);
      }
    };

    fetchExercises();
  }, []);

  // Set default workout name based on user's workout count
  useEffect(() => {
    const setDefaultWorkoutName = async () => {
      try {
        const response = await getWorkouts(1, 1); // Just get first page to get total count
        if (response.success && typeof response.total === "number") {
          const nextWorkoutNumber = response.total + 1;
          setFormData((prev) => ({
            ...prev,
            name: `Workout #${nextWorkoutNumber}`,
          }));
        } else {
          // Fallback if we can't get the count
          setFormData((prev) => ({
            ...prev,
            name: "Workout #1",
          }));
        }
      } catch (err) {
        logger.error("Failed to get workout count", {
          error: err instanceof Error ? err.message : String(err),
        });
        // Fallback if we can't get the count
        setFormData((prev) => ({
          ...prev,
          name: "Workout #1",
        }));
      }
    };

    setDefaultWorkoutName();
  }, []);

  // Handle template change
  const handleTemplateChange = React.useCallback(
    async (value: string) => {
      const templateId = value;

      // Set loading state
      setLoading(true);
      setError(null);

      setFormData((prev) => ({
        ...prev,
        templateId,
        entries: {},
      }));

      if (!templateId) {
        setSelectedTemplate(null);
        setLoading(false);
        return;
      }

      try {
        const response = await getTemplate(templateId);

        if (response.success && response.data) {
          setSelectedTemplate(response.data);

          // Initialize entries with template exercises
          const newEntries: Record<
            number,
            { setNumber: number; reps: number; weight: number }[]
          > = {};

          // Check if exercises array exists and has items
          if (
            Array.isArray(response.data.exercises) &&
            response.data.exercises.length > 0
          ) {
            (response.data.exercises as TemplateExercise[]).forEach(
              (exercise) => {
                // Make sure exercise_id is a number
                const exerciseId =
                  typeof exercise.exercise_id === "string"
                    ? parseInt(exercise.exercise_id, 10)
                    : exercise.exercise_id;

                if (!isNaN(exerciseId)) {
                  newEntries[exerciseId] = Array.from(
                    { length: exercise.sets || 3 }, // Default to 3 sets if not specified
                    (_, i) => ({
                      setNumber: i + 1,
                      reps: 0,
                      weight: 0,
                    })
                  );
                }
              }
            );
          } else {
            logger.warn(
              "No exercises found in template or exercises is not an array"
            );
          }

          setFormData((prev) => ({
            ...prev,
            entries: newEntries,
          }));
        } else {
          logger.error("API returned success=false or no data");
          setError(
            "Failed to load template: " + (response.message || "Unknown error")
          );
        }
      } catch (err) {
        logger.error("Failed to load template details", {
          error: err instanceof Error ? err.message : String(err),
        });
        setError(
          "Failed to load template details: " +
            (err instanceof Error ? err.message : String(err))
        );
      } finally {
        // Always reset loading state
        setLoading(false);
      }
    },
    [
      setFormData,
      setSelectedTemplate,
      setLoading,
      setError,
      getTemplate,
      logger,
    ]
  );

  // Check for template parameter in URL and auto-select it
  useEffect(() => {
    const templateParam = searchParams?.get("template");
    if (templateParam && templates.length > 0) {
      // Find the template and auto-select it
      const template = templates.find((t) => t.id.toString() === templateParam);
      if (template) {
        handleTemplateChange(templateParam);
      }
    }
  }, [searchParams, templates, handleTemplateChange]);

  // Add a set for an exercise
  const addSet = (exerciseId: number) => {
    setFormData((prev) => {
      const currentSets = prev.entries[exerciseId] || [];
      const newSetNumber =
        currentSets.length > 0
          ? Math.max(...currentSets.map((set) => set.setNumber)) + 1
          : 1;

      return {
        ...prev,
        entries: {
          ...prev.entries,
          [exerciseId]: [
            ...currentSets,
            { setNumber: newSetNumber, reps: 0, weight: 0 },
          ],
        },
      };
    });
  };

  // Update a set
  const updateSet = (
    exerciseId: number,
    setIndex: number,
    field: "reps" | "weight",
    value: number
  ) => {
    setFormData((prev) => {
      const updatedSets = [...(prev.entries[exerciseId] || [])];
      updatedSets[setIndex] = {
        ...updatedSets[setIndex],
        [field]: value,
      };

      return {
        ...prev,
        entries: {
          ...prev.entries,
          [exerciseId]: updatedSets,
        },
      };
    });
  };

  // Remove a set
  const removeSet = (exerciseId: number, setIndex: number) => {
    setFormData((prev) => {
      const updatedSets = [...(prev.entries[exerciseId] || [])];
      updatedSets.splice(setIndex, 1);

      // Renumber set numbers to be consecutive
      const renumberedSets = updatedSets.map((set, idx) => ({
        ...set,
        setNumber: idx + 1,
      }));

      return {
        ...prev,
        entries: {
          ...prev.entries,
          [exerciseId]: renumberedSets,
        },
      };
    });
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!formData.name.trim()) {
      setError("Please enter a workout name");
      return;
    }

    if (!formData.templateId) {
      setError("Please select a template");
      return;
    }

    // Create flat entries array for API request
    const entriesArray: CreateWorkoutRequest["entries"] = [];
    Object.entries(formData.entries).forEach(([exerciseId, sets]) => {
      sets.forEach((set) => {
        entriesArray.push({
          exercise_id: parseInt(exerciseId),
          set_number: set.setNumber,
          reps: set.reps,
          weight: set.weight,
        });
      });
    });

    if (entriesArray.length === 0) {
      setError("Please add at least one exercise set");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await createWorkout({
        name: formData.name,
        template_id: parseInt(formData.templateId),
        notes: formData.notes,
        status: "completed",
        entries: entriesArray,
      });

      if (response.success) {
        // Navigate first with success message in URL params
        router.push(
          "/workouts?success=true&message=Workout logged successfully!"
        );
      } else {
        setError("Failed to create workout");
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "An error occurred while creating the workout"
      );
      logger.error("Error creating workout", {
        error: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBack = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    const hasEntries = Object.values(formData.entries).some((sets) =>
      sets.some((set) => set.reps > 0 || set.weight > 0)
    );
    if (hasEntries) {
      setShowDraftOverlay(true);
    } else {
      router.push("/workouts");
    }
  };

  const submitWorkout = async (status: "completed" | "draft") => {
    if (!formData.name.trim()) {
      setError("Please enter a workout name");
      return;
    }
    if (!formData.templateId) {
      setError("Please select a template");
      return;
    }
    const entriesArray: CreateWorkoutRequest["entries"] = [];
    Object.entries(formData.entries).forEach(([exerciseId, sets]) => {
      sets.forEach((set) => {
        entriesArray.push({
          exercise_id: parseInt(exerciseId),
          set_number: set.setNumber,
          reps: set.reps,
          weight: set.weight,
        });
      });
    });
    if (entriesArray.length === 0) {
      setError("Please add at least one exercise set");
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const response = await createWorkout({
        name: formData.name,
        template_id: parseInt(formData.templateId),
        notes: formData.notes,
        entries: entriesArray,
        status,
      });
      if (response.success) {
        router.push(
          `/workouts?success=true&message=Workout ${
            status === "draft" ? "saved as draft" : "logged successfully"
          }!`
        );
      } else {
        setError(
          `Failed to ${status === "draft" ? "save draft" : "create workout"}`
        );
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : `An error occurred while ${
              status === "draft" ? "saving draft" : "creating the workout"
            }`
      );
      logger.error(
        `Error ${status === "draft" ? "saving draft" : "creating workout"}`,
        { error: err instanceof Error ? err.message : String(err) }
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pb-16 px-2">
      {/* Message Overlay */}
      <MessageOverlay
        message={error || ""}
        type="error"
        isVisible={!!error}
        onClose={() => {
          setError(null);
        }}
      />

      <Link
        href="/workouts"
        className="inline-flex items-center mb-4 text-muted-foreground hover:text-foreground"
        onClick={handleBack}
      >
        <ArrowLeftIcon className="mr-2 h-4 w-4" />
        Back to Workouts
      </Link>

      <h1 className="text-2xl font-bold mb-6">Log Workout</h1>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-2">
          <div className="space-y-4">
            <div className="grid gap-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="name">Workout Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="E.g., Morning Leg Day"
                  className="mt-1"
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="template">Template</Label>
                <Select
                  value={formData.templateId}
                  onValueChange={handleTemplateChange}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem
                        key={template.id.toString()}
                        value={template.id.toString()}
                      >
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="How did the workout go? Any PRs?"
                  rows={3}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div>
              <h2 className="text-xl mb-2">Exercises</h2>

              {!selectedTemplate ? (
                <div className="flex flex-col items-center justify-center py-3 text-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="48"
                    height="48"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-muted-foreground"
                  >
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M12 8v4"></path>
                    <path d="M12 16h.01"></path>
                  </svg>
                  <p className="text-muted-foreground text-lg">
                    Select a template first
                  </p>
                  <p className="text-muted-foreground text-sm">
                    Template exercises will appear here
                  </p>
                </div>
              ) : formData.templateId &&
                Object.entries(formData.entries).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  {loading ? (
                    <>
                      <div className="mb-4">
                        <svg
                          className="animate-spin h-8 w-8 text-muted-foreground"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                      </div>
                      <p className="text-muted-foreground text-lg mb-1">
                        Loading exercises...
                      </p>
                    </>
                  ) : (
                    <>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="48"
                        height="48"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-muted-foreground mb-3"
                      >
                        <path d="M13 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-6"></path>
                        <path d="M9.5 11.5 11 13l5-5"></path>
                        <path d="M21 7V3h-4"></path>
                        <path d="m17 7 4-4"></path>
                      </svg>
                      <p className="text-muted-foreground text-lg mb-1">
                        No exercises found
                      </p>
                      <p className="text-muted-foreground text-sm">
                        This template doesn&apos;t have any exercises
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          // Re-fetch the template as a workaround
                          if (formData.templateId) {
                            handleTemplateChange(formData.templateId);
                          }
                        }}
                        className="mt-4 text-sm text-blue-500 hover:text-blue-700 underline"
                      >
                        Try again
                      </button>
                    </>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(formData.entries).map(
                    ([exerciseId, sets]) => {
                      const exerciseIdNum = parseInt(exerciseId);

                      // First try to find exercise info from the selected template
                      let exerciseName = "Unknown Exercise";
                      if (selectedTemplate && selectedTemplate.exercises) {
                        const templateExercise =
                          selectedTemplate.exercises.find(
                            (ex: TemplateExercise) =>
                              Number(ex.exercise_id) === exerciseIdNum
                          );
                        if (templateExercise) {
                          exerciseName = templateExercise.name;
                        }
                      }

                      // Fallback to loaded exercises if template doesn't have the name
                      if (exerciseName === "Unknown Exercise") {
                        const exercise = exercises.find(
                          (ex) => ex.id === exerciseIdNum
                        );
                        if (exercise) {
                          exerciseName = exercise.name;
                        }
                      }

                      return (
                        <ExerciseEntryInput
                          key={`exercise-${exerciseId}`}
                          exerciseId={exerciseIdNum}
                          exerciseName={exerciseName}
                          entries={sets}
                          onAddSet={addSet}
                          onUpdateSet={updateSet}
                          onRemoveSet={removeSet}
                        />
                      );
                    }
                  )}
                </div>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-red-600 hover:bg-red-700"
              disabled={
                loading ||
                !selectedTemplate ||
                Object.entries(formData.entries).length === 0
              }
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Saving...
                </>
              ) : (
                "Log Workout"
              )}
            </Button>
          </div>
        </div>
      </form>

      <DraftOrDeleteOverlay
        open={showDraftOverlay}
        onDraft={async () => {
          setShowDraftOverlay(false);
          await submitWorkout("draft");
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
