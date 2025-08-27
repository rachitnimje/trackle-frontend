"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, GripVertical } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import { getExercises } from "@/api/exercises";
import { createTemplate } from "@/api/templates";
import { Exercise, CreateTemplateRequest, TemplateExercise } from "@/api/types";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { MessageOverlay } from "@/components/MessageOverlay";
import { logger } from "@/utils/logger";

// Add styles to hide number input spinners and handle text overflow
const customStyles = `
  /* Hide number input spinners for Chrome, Safari, Edge, Opera */
  input::-webkit-outer-spin-button,
  input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  
  /* Hide number input spinners for Firefox */
  input[type=number] {
    -moz-appearance: textfield;
  }
  
  /* Ensure text truncation works properly */
  .truncate {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
    display: inline-block;
  }
  
  /* Force truncation for select values - exercise name field */
  [data-value] {
    display: block !important;
    max-width: 95% !important;
    white-space: nowrap !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
  }
  
  /* Specifically target the select field value text to ensure ellipsis appears */
  .select-wrapper [data-radix-select-trigger] [data-placeholder],
  .select-wrapper [data-radix-select-trigger] span {
    text-overflow: ellipsis !important;
    white-space: nowrap !important;
    overflow: hidden !important;
    max-width: 95% !important;
    display: block !important;
    padding-right: 15px !important; /* Add padding to ensure text doesn't run into the dropdown arrow */
  }
  
  /* Ensure select trigger properly contains content */
  .select-trigger-container {
    width: 100%;
    position: relative;
    overflow: hidden !important;
  }
  
  /* Additional class for exercise selection value */
  .exercise-select-value {
    max-width: 90% !important;
    padding-right: 12px !important;
    text-overflow: ellipsis !important;
  }
  
  /* Improve number input styling */
  input[type=number]:focus {
    outline: 2px solid rgb(var(--primary));
    outline-offset: -1px;
  }
`;

// Zod schema for form validation
const templateFormSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  description: z
    .string()
    .max(150, "Description character limit is 150 characters"),
  exercises: z
    .array(
      z.object({
        exercise_id: z.number().min(1, "Please select an exercise"),
        sets: z
          .number()
          .min(1, "Sets must be at least 1")
          .max(63, "Sets cannot exceed 63"),
      })
    )
    .min(1, "At least one exercise is required")
    .max(15, "A template cannot have more than 15 exercises"),
});

type TemplateFormValues = z.infer<typeof templateFormSchema>;

export default function CreateTemplatePage() {
  const router = useRouter();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);
  const [exercisesLoading, setExercisesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  // Track exercise count to properly render and handle exercises
  const [exerciseCount, setExerciseCount] = useState(1);

  // Function to handle drag-and-drop reordering
  const handleDragEnd = (result: DropResult) => {
    // If dropped outside the list
    if (!result.destination) {
      return;
    }

    const currentExercises = form.getValues("exercises");

    // Reorder the list
    const reorderedExercises = Array.from(currentExercises);
    const [removed] = reorderedExercises.splice(result.source.index, 1);
    reorderedExercises.splice(result.destination.index, 0, removed);

    // Update the form values with the new order
    form.setValue("exercises", reorderedExercises);
  };

  const form = useForm<TemplateFormValues>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: {
      name: "",
      description: "",
      exercises: [{ exercise_id: 0, sets: 3 }],
    },
  });

  // Fetch exercises when component mounts
  useEffect(() => {
    const fetchExercises = async () => {
      try {
        setExercisesLoading(true);
        const response = await getExercises(1, 100); // Get a large batch of exercises
        if (response.success && Array.isArray(response.data)) {
          // Sort exercises alphabetically for easier selection
          const sortedExercises = [...response.data].sort((a, b) =>
            a.name.localeCompare(b.name)
          );
          setExercises(sortedExercises);
        } else {
          setError("Failed to fetch exercises");
        }
      } catch (err) {
        setError("An error occurred while fetching exercises");
        logger.error("Error fetching exercises", { error: err });
      } finally {
        setExercisesLoading(false);
      }
    };

    fetchExercises();
  }, []);

  // Watch the exercises field for changes
  const formExercises = form.watch("exercises");

  // Update exercise count when component mounts
  useEffect(() => {
    setExerciseCount(formExercises.length);
  }, [formExercises.length]);

  // Add a new exercise field
  const addExercise = () => {
    const currentExercises = form.getValues("exercises");
    if (currentExercises.length >= 15) {
      toast.error("A template cannot have more than 15 exercises");
      return;
    }
    form.setValue("exercises", [
      ...currentExercises,
      { exercise_id: 0, sets: 3 },
    ]);
  };

  // Remove an exercise field
  const removeExercise = (index: number) => {
    const currentExercises = form.getValues("exercises");
    if (currentExercises.length > 1) {
      form.setValue(
        "exercises",
        currentExercises.filter((_, i) => i !== index)
      );
    }
  };

  // Form submission handler
  const onSubmit = async (data: TemplateFormValues) => {
    try {
      setLoading(true);
      // Filter out any exercises that have exercise_id = 0 (not selected)
      // Also ensure all set values are valid numbers (not empty strings)
      const validExercises = data.exercises
        .filter((ex) => ex.exercise_id > 0)
        .map((ex) => ({
          ...ex,
          sets:
            typeof ex.sets !== "number" || ex.sets < 1
              ? 1
              : ex.sets > 63
              ? 63
              : ex.sets,
        }));

      if (validExercises.length === 0) {
        setError("At least one valid exercise is required");
        setLoading(false);
        return;
      }

      const templateData: CreateTemplateRequest = {
        name: data.name,
        description: data.description,
        exercises: validExercises,
      };

      const response = await createTemplate(templateData);
      if (response.success) {
        // Navigate directly with success message in URL
        router.push(
          "/templates?success=true&message=Template created successfully!"
        );
      } else {
        setError(response.message || "Failed to create template");
      }
    } catch (err) {
      setError("An error occurred while creating the template");
      logger.error("Error creating template", { error: err });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pb-24 max-w-3xl mx-auto">
      {/* Inject custom styles */}
      <style jsx global>
        {customStyles}
      </style>

      {/* Message Overlay - only for errors since success redirects */}
      <MessageOverlay
        message={error || ""}
        type="error"
        isVisible={!!error}
        onClose={() => setError(null)}
      />

      <div className="flex items-center bg-background mb-4">
        <Link
          href="/templates"
          className="inline-flex items-center text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold">Create Template</h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2 px-2">
          {/* Template Info Section*/}
          <div className="space-y-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base">Template Name*</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Push Day Workout"
                      required
                      {...field}
                      className="text-sm"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base">Description</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Monday Push Workout for October"
                      {...field}
                      className="text-sm"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between pb-4 mb-4">
              <h2 className="text-base">Exercises</h2>
            </div>

            {/* Column Headers - Only show once */}
            <div className="grid grid-cols-12 gap-3 px-14 mt-2 mb-1 ml-10">
              <div className="col-span-8 text-sm font-medium">Exercise</div>
              <div className="col-span-3 text-sm font-medium text-center">
                Sets
              </div>
            </div>

            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="exercises">
                {(provided) => (
                  <div
                    className=""
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                  >
                    {Array.from({ length: exerciseCount }).map((_, index) => (
                      <Draggable
                        key={index}
                        draggableId={`exercise-${index}`}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`py-4 relative flex items-center ${
                              snapshot.isDragging
                                ? "bg-accent/20"
                                : "hover:bg-accent/10"
                            } transition-colors`}
                          >
                            {/* Handle for dragging */}
                            <div
                              {...provided.dragHandleProps}
                              className="flex items-center mr-2 cursor-grab"
                            >
                              <GripVertical className="h-4 w-4 text-muted-foreground" />
                            </div>

                            {/* Exercise number */}
                            <div className="mr-3">
                              <div className="h-8 w-8 flex items-center justify-center rounded-full bg-primary/10 font-medium text-primary">
                                {index + 1}
                              </div>
                            </div>

                            {/* Main content */}
                            <div className="flex-1 relative">
                              <div className="grid grid-cols-12 gap-3 items-center">
                                {/* Exercise selector - takes 8 columns */}
                                <div className="col-span-8 overflow-hidden w-full pr-1">
                                  <FormField
                                    control={form.control}
                                    name={`exercises.${index}.exercise_id`}
                                    render={({ field }) => (
                                      <FormItem className="mb-0 select-wrapper">
                                        <Select
                                          disabled={exercisesLoading}
                                          onValueChange={(value) =>
                                            field.onChange(parseInt(value))
                                          }
                                          value={field.value.toString()}
                                          defaultValue="0"
                                        >
                                          <SelectTrigger className="h-8 w-full select-trigger-container">
                                            <SelectValue
                                              placeholder="Select an exercise..."
                                              className="truncate pr-4 block w-full exercise-select-value"
                                            />
                                          </SelectTrigger>

                                          <SelectContent className="max-h-[250px] w-[200px] md:w-[280px]">
                                            {exercises.map((exercise) => (
                                              <SelectItem
                                                key={exercise.id}
                                                value={exercise.id.toString()}
                                                className="break-normal"
                                              >
                                                {exercise.name}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                        <FormMessage className="text-xs" />
                                      </FormItem>
                                    )}
                                  />
                                </div>

                                {/* Sets input - takes 3 columns */}
                                <div className="col-span-3">
                                  <FormField
                                    control={form.control}
                                    name={`exercises.${index}.sets`}
                                    render={({ field }) => (
                                      <FormItem className="mb-0">
                                        <FormControl>
                                          <Input
                                            type="text"
                                            inputMode="numeric"
                                            pattern="[0-9]*"
                                            className="h-9 text-center no-spinners"
                                            onChange={(e) => {
                                              const val = e.target.value;

                                              // Allow empty input for backspacing
                                              if (val === "") {
                                                field.onChange(val as unknown);
                                                return;
                                              }

                                              // Only allow numbers
                                              if (/^\d+$/.test(val)) {
                                                const numVal = parseInt(val);
                                                // Only constrain when submitting, not during typing
                                                field.onChange(
                                                  numVal > 63 ? 63 : numVal
                                                );
                                              }
                                            }}
                                            onBlur={(e) => {
                                              // On blur, ensure valid value (1-63)
                                              const val = e.target.value;

                                              if (
                                                val === "" ||
                                                isNaN(Number(val)) ||
                                                Number(val) < 1
                                              ) {
                                                field.onChange(1);
                                              } else if (Number(val) > 63) {
                                                field.onChange(63);
                                              }
                                            }}
                                            value={String(field.value || "")}
                                          />
                                        </FormControl>
                                        <FormMessage className="text-xs" />
                                      </FormItem>
                                    )}
                                  />
                                </div>

                                {/* Delete button - takes 1 column */}
                                <div className="col-span-1 flex items-center justify-center">
                                  {exerciseCount > 1 && (
                                    <Button
                                      type="button"
                                      onClick={() => removeExercise(index)}
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-destructive hover:bg-none"
                                    >
                                      <Trash2 className="h-5 w-5" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>

            {/* Add Exercise Button centered */}
            <div className="flex justify-center mt-4">
              {exerciseCount < 15 && (
                <Button
                  type="button"
                  onClick={addExercise}
                  variant="outline"
                  size="sm"
                  className="h-10 px-4 hover:bg-primary/10"
                >
                  <Plus className="mr-1.5 h-4 w-4" />
                  Add Exercise
                </Button>
              )}
            </div>
          </div>

          <div className="fixed bottom-14 left-0 right-0 bg-background border-t p-2 flex justify-center sm:justify-end">
            <Button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto sm:min-w-[150px] h-10"
              variant="destructive"
            >
              {loading ? "Creating..." : "Create Template"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
