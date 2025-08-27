"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getExercise } from "@/api/exercises";
import { Exercise } from "@/api/types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeftIcon } from "@/components/Icons";
import { useAuth } from "@/contexts/AuthContext";
import { logger } from "@/utils/logger";

export default function ExerciseDetailPage() {
  const { id } = useParams() as { id: string };
  const { isAdmin } = useAuth();
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchExercise = async () => {
      try {
        setLoading(true);
        const response = await getExercise(Number(id));
        if (response.success && response.data) {
          setExercise(response.data);
        } else {
          setError("Failed to fetch exercise details");
        }
      } catch (err) {
        setError("An error occurred while fetching exercise details");
  logger.error("Error fetching exercise details", err as Record<string, unknown>);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchExercise();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6 pb-20 sm:pb-16 max-w-3xl mx-auto px-3 sm:px-4 pt-4 sm:pt-6">
        <div className="flex items-center space-x-3">
          <Skeleton className="h-6 w-6 sm:h-8 sm:w-8" />
          <Skeleton className="h-5 w-32 sm:h-6 sm:w-40" />
        </div>
        <div className="space-y-3 sm:space-y-4">
          <Skeleton className="h-6 w-48 sm:h-8 sm:w-64" />
          <Skeleton className="h-4 w-40 sm:w-48" />
          <Skeleton className="h-24 w-full sm:h-32" />
        </div>
      </div>
    );
  }

  if (error || !exercise) {
    return (
      <div className="text-center py-10 px-4">
        <p className="text-destructive mb-4 text-sm sm:text-base">{error || "Exercise not found"}</p>
        <Link href="/exercises">
          <Button className="text-sm sm:text-base">Back to Exercises</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="pb-20 sm:pb-16 px-3 sm:px-2 pt-3 sm:pt-2">
        {/* Back button */}
        <Link
          href="/exercises"
          className="inline-flex items-center text-muted-foreground hover:text-foreground mb-2 group"
        >
          <ArrowLeftIcon className="mr-2 h-4 w-4" />
          <span className="text-sm sm:text-base">Back to Exercises</span>
        </Link>

        {/* Header */}
        <div className="mb-4">
          <div className="flex items-start gap-2 mb-2">
            {/* Avatar */}
            <div className="flex-shrink-0 w-full h-20 sm:h-28 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-semibold text-base sm:text-lg">
              {exercise.name.substring(0, 2).toUpperCase()}
            </div>
          </div>

          <div className="flex-1">
            <h1 className="text-xl sm:text-3xl font-semibold text-foreground break-words">
              {exercise.name}
            </h1>
          </div>

          {exercise.description && (
            <p className="text-m sm:text-base text-muted-foreground leading-relaxed break-words">
              {exercise.description}
            </p>
          )}
        </div>

        {/* Content */}
        <div className="space-y-4">
          {/* Exercise Details */}
          <div>
            <div className="space-y-1">
              <div className="flex justify-between py-1 border-b border-border">
                <span className="text-m sm:text-base text-muted-foreground">Category</span>
                <span className="text-m sm:text-base break-words ml-2">{exercise.category || "Not specified"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border">
                <span className="text-m sm:text-base text-muted-foreground">Primary Muscle</span>
                <span className="text-m sm:text-base break-words ml-2">{exercise.primary_muscle || "Not specified"}</span>
              </div>
              {exercise.equipment && (
                <div className="flex justify-between py-1 border-b border-border">
                  <span className="text-m sm:text-base text-muted-foreground">Equipment</span>
                  <span className="text-m sm:text-base break-words ml-2">{exercise.equipment}</span>
                </div>
              )}
            </div>
          </div>

          {/* Admin Section */}
          {isAdmin && (
            <div>
              <h2 className="text-base sm:text-lg font-medium ">Admin</h2>
              <div className="space-y-1 text-xs sm:text-sm text-muted-foreground">
                <div className="flex justify-between py-2 border-b border-border">
                  <span>Exercise ID</span>
                  <span className="break-all ml-2">{exercise.id}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border">
                  <span>Created</span>
                  <span className="ml-2 text-right">
                    {new Date(exercise.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}{" "}
                    at{" "}
                    {new Date(exercise.created_at).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}