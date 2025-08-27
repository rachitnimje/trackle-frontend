"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Trash2, Play } from "lucide-react";
import { getTemplate, deleteTemplate } from "@/api/templates";
import { Template } from "@/api/types";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon, CalendarIcon, ClockIcon } from "@/components/Icons";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageOverlay } from "@/components/MessageOverlay";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { logger } from "@/utils/logger";

export default function TemplateDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        setLoading(true);
        const response = await getTemplate(id as string);
        if (response.success && response.data) {
          setTemplate(response.data);
        } else {
          setError("Failed to fetch template details");
        }
      } catch (err) {
        setError("An error occurred while fetching template details");
        logger.error("Error fetching template details", err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchTemplate();
    }
  }, [id]);

  const handleDeleteClick = () => {
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!template) return;

    try {
      setIsDeleting(true);
      const response = await deleteTemplate(template.id);

      if (response.success) {
        // Navigate directly with success message in URL
        router.push(
          "/templates?success=true&message=Template deleted successfully!"
        );
      } else {
        setError("Failed to delete template");
        setIsDeleteDialogOpen(false);
      }
    } catch (err) {
      setError("An error occurred while deleting the template");
      logger.error("Error deleting template", err);
      setIsDeleteDialogOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStartWorkout = () => {
    if (!template) return;

    // Navigate to create workout page with template ID
    router.push(`/workouts/create?template=${template.id}`);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-6 w-40" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !template) {
    return (
      <div className="text-center py-10">
        <p className="text-destructive mb-4">{error || "Template not found"}</p>
        <Link href="/templates">
          <Button>Back to Templates</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="pb-12 px-1">
      {/* Message Overlay - only for errors since success redirects */}
      <MessageOverlay
        message={error || ""}
        type="error"
        isVisible={!!error}
        onClose={() => setError(null)}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDelete
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Template"
        description="Are you sure you want to delete this template"
        itemName={template?.name}
        loading={isDeleting}
      />

      <div className="mb-2 py-1">
        <Link
          href="/templates"
          className="inline-flex items-center text-muted-foreground hover:text-foreground text-sm mb-1"
        >
          <ArrowLeftIcon className="mr-1.5 h-3.5 w-3.5" />
          Back to Templates
        </Link>
      </div>
      <div className="space-y-3">
        {/* title with start workout button */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold break-words pr-2 flex-1 min-w-0">{template.name}</h1>
          <Button
            onClick={handleStartWorkout}
            className="bg-primary hover:bg-primary/90 text-primary-foreground flex-shrink-0"
            size="sm"
          >
            <Play className="h-4 w-4" />
            Start
          </Button>
        </div>

        {/* creation and update time */}
        <div className="flex flex-row gap-4 text-xs overflow-x-auto">
          <div className="flex items-center flex-shrink-0">
            <CalendarIcon className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
            <span>
              {new Date(template.created_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}{" "}
              at{" "}
              {new Date(template.created_at).toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              })}
            </span>
          </div>

          {template.updated_at !== template.created_at && (
            <div className="flex items-center ml-2 flex-shrink-0">
              <ClockIcon className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
              <span>
                <span className="text-muted-foreground">Updated: </span>
                {new Date(template.updated_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}{" "}
                at{" "}
                {new Date(template.updated_at).toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                })}
              </span>
            </div>
          )}
        </div>

        <div>
          {template.description && (
            <div className="pb-1">
              <span className="block text-s text-muted-foreground mb-1">
                Description
              </span>
              <span className="block text-sm break-words">{template.description}</span>
            </div>
          )}
        </div>

        <div>
          <CardHeader className="px-0">
            <CardTitle className="text-lg">Exercises</CardTitle>
          </CardHeader>

          {template.exercises && template.exercises.length > 0 ? (
            <div className="grid">
              {template.exercises.map((exercise) => (
                <div
                  key={exercise.exercise_id}
                  className="flex items-center justify-between py-2 px-1 hover:bg-muted/30 rounded transition-colors border-b"
                >
                  <div className="flex flex-col min-w-0 flex-1 pr-2">
                    <span className="font-medium break-words">{exercise.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {exercise.category}
                    </span>
                  </div>
                  <div className="bg-primary/10 rounded-full px-2.5 py-0.5 text-primary text-xs font-medium flex-shrink-0">
                    {exercise.sets} {exercise.sets === 1 ? "set" : "sets"}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-3 text-muted-foreground text-sm">
              No exercises in this template.
            </div>
          )}
        </div>

        <div className="flex justify-end mt-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDeleteClick}
            className="bg-destructive/15 text-destructive hover:bg-destructive/10 text-s"
          >
            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}