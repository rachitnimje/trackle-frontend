"use client";

import { useState, useEffect } from "react";
import { Exercise } from "@/api/types";
import {
  getExercises,
  getExerciseCategories,
  getPrimaryMuscles,
} from "@/api/exercises";
import { SearchIcon, PlusCircleIcon } from "@/components/Icons";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { MessageOverlay } from "@/components/MessageOverlay";
import { logger } from "@/utils/logger";

// Function to generate consistent colors based on category name
const getColorForCategory = (category: string): string => {
  const colors = [
    "bg-blue-500",
    "bg-green-500",
    "bg-purple-500",
    "bg-amber-500",
    "bg-teal-500",
    "bg-indigo-500",
    "bg-rose-500",
    "bg-cyan-500",
  ];

  let hash = 0;
  for (let i = 0; i < category.length; i++) {
    hash = category.charCodeAt(i) + ((hash << 5) - hash);
  }

  const colorIndex = Math.abs(hash) % colors.length;
  return colors[colorIndex];
};

export default function ExercisesPage() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [categories, setCategories] = useState<
    { label: string; value: string }[]
  >([]);
  const [muscles, setMuscles] = useState<{ label: string; value: string }[]>(
    []
  );

  // Auth hook
  const { isAdmin } = useAuth();

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("");
  const [activeMuscle, setActiveMuscle] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [activeView, setActiveView] = useState<"sort" | "filter">("sort");
  const [activeFilterType, setActiveFilterType] = useState<
    "Category" | "Muscle" | ""
  >("");

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Check URL parameters for success message on component mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const success = params.get("success");
      const message = params.get("message");

      if (success === "true" && message) {
        setSuccessMessage(message);

        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete("success");
        newUrl.searchParams.delete("message");
        window.history.replaceState({}, "", newUrl.toString());

        const timer = setTimeout(() => {
          setSuccessMessage(null);
        }, 5000);

        return () => clearTimeout(timer);
      }
    }
  }, []);

  // Fetch categories and muscles on component mount
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const [categoriesRes, musclesRes] = await Promise.all([
          getExerciseCategories(),
          getPrimaryMuscles(),
        ]);

        if (categoriesRes.success && Array.isArray(categoriesRes.data)) {
          setCategories(
            categoriesRes.data.map((cat) => ({ label: cat, value: cat }))
          );
        }

        if (musclesRes.success && Array.isArray(musclesRes.data)) {
          setMuscles(
            musclesRes.data.map((muscle) => ({ label: muscle, value: muscle }))
          );
        }
      } catch (err) {
        logger.error("Error fetching filter options", { err });
      }
    };

    fetchFilterOptions();
  }, []);

  // Fetch exercises based on current filters
  useEffect(() => {
    const fetchExercises = async () => {
      try {
        setLoading(true);
        setError(null); // Clear any previous errors
        const response = await getExercises(
          1,
          100,
          activeCategory,
          debouncedSearchQuery,
          activeMuscle,
          sortBy
        );

        if (response.success && Array.isArray(response.data)) {
          setExercises(response.data);
        } else if (response.success && response.data === null) {
          // Empty result, not an error - just set empty array
          setExercises([]);
        } else {
          // Only set error for actual API failures, not empty results
          if (!response.success && response.message) {
            setError(response.message);
          } else {
            setError("Failed to fetch exercises");
          }
        }
      } catch (err) {
        setError("An error occurred while fetching exercises");
        logger.error("Error fetching exercises", { err });
      } finally {
        setLoading(false);
      }
    };

    fetchExercises();
  }, [debouncedSearchQuery, activeCategory, activeMuscle, sortBy]);

  // Handle filtering
  const handleFilterChange = (category: string, value: string) => {
    if (category === "Category") {
      setActiveCategory(value);
    }
    if (category === "Muscle") {
      setActiveMuscle(value);
    }
  };

  // Track active filters for UI state
  const activeFilters = {
    Category: activeCategory,
    Muscle: activeMuscle,
  };

  // Handle sorting
  const handleSort = (sort: string) => {
    setSortBy(sort);
  };

  // Prepare sort and filter options
  const sortOptions = [
    { label: "Name (A-Z)", value: "name" },
    { label: "Name (Z-A)", value: "name_desc" },
    { label: "Category", value: "category" },
    { label: "Muscle Group", value: "muscle" },
  ];

  return (
    <div className="px-3 sm:px-4 max-w-full overflow-hidden">
      {/* Message Overlay */}
      <MessageOverlay
        message={successMessage || error || ""}
        type={successMessage ? "success" : "error"}
        isVisible={!!(successMessage || error)}
        onClose={() => {
          setSuccessMessage(null);
          setError(null);
        }}
      />

      {/* Header styled to match reference design */}
      <div className="bg-background">
        <div className="flex justify-between items-center mb-4 mt-2">
          <h1 className="text-2xl font-bold truncate mr-2">Exercises</h1>

          {/* Create button for admin only*/}
          {isAdmin && (
            <Link href="/exercises/create">
              <Button
                variant="destructive"
                size="icon"
                className="rounded-md w-11 p-1 flex-shrink-0"
              >
                <PlusCircleIcon className="size-5" />
              </Button>
            </Link>
            
          )}
        </div>

        {/* Search and filter section with combined filter/sort button */}
        <div className="flex gap-2 items-center mb-2">
          {/* Search input with full border */}
          <div className="relative flex-1 min-w-0">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground flex-shrink-0" />
            <Input
              type="search"
              placeholder="Search exercises..."
              className="pl-10 pr-4 border rounded-md w-full text-sm sm:text-base"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Combined filter and sort dialog button */}
          <Dialog
            onOpenChange={(open) => {
              // Reset active filter type when dialog is closed
              if (!open) setActiveFilterType("");
            }}
          >
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="rounded-md h-9 w-9 sm:w-auto border flex-shrink-0 p-2 sm:px-3"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="flex-shrink-0"
                >
                  <line x1="4" y1="21" x2="4" y2="14"></line>
                  <line x1="4" y1="10" x2="4" y2="3"></line>
                  <line x1="12" y1="21" x2="12" y2="12"></line>
                  <line x1="12" y1="8" x2="12" y2="3"></line>
                  <line x1="20" y1="21" x2="20" y2="16"></line>
                  <line x1="20" y1="12" x2="20" y2="3"></line>
                  <line x1="1" y1="14" x2="7" y2="14"></line>
                  <line x1="9" y1="8" x2="15" y2="8"></line>
                  <line x1="17" y1="16" x2="23" y2="16"></line>
                </svg>
              </Button>
            </DialogTrigger>

            <DialogContent className="max-w-[95vw] w-full sm:max-w-[400px] p-0 overflow-hidden mx-2">
              <DialogHeader className="px-4 pt-4 pb-2">
                <DialogTitle className="text-lg">Filter & Sort</DialogTitle>
              </DialogHeader>

              <div className="flex h-[350px] sm:h-[300px]">
                {/* Left pane with options */}
                <div className="w-1/3 border-r min-w-0">
                  <div
                    className={`py-3 px-2 sm:px-4 cursor-pointer hover:bg-accent/50 text-sm sm:text-base ${
                      sortBy !== "" ? "font-medium" : ""
                    } ${activeView === "sort" ? "bg-accent" : ""}`}
                    onClick={() => setActiveView("sort")}
                  >
                    Sort
                  </div>
                  <div
                    className={`py-3 px-2 sm:px-4 cursor-pointer hover:bg-accent/50 text-sm sm:text-base ${
                      activeCategory !== "" || activeMuscle !== ""
                        ? "font-medium"
                        : ""
                    } ${activeView === "filter" ? "bg-accent" : ""}`}
                    onClick={() => setActiveView("filter")}
                  >
                    Filter
                  </div>
                </div>

                {/* Right pane with content */}
                <div className="w-2/3 px-2 sm:px-4 pt-2 overflow-y-auto min-w-0">
                  {activeView === "sort" ? (
                    <div className="grid gap-2">
                      {sortOptions.map((option) => (
                        <Button
                          key={option.value}
                          variant="ghost"
                          className={`justify-start text-left text-xs sm:text-sm px-2 sm:px-3 py-2 h-auto whitespace-normal ${
                            sortBy === option.value ? "bg-primary/10" : ""
                          }`}
                          onClick={() => handleSort(option.value)}
                        >
                          <span className="truncate">{option.label}</span>
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Show filter type options if no subfilter selected */}
                      {!activeFilterType ? (
                        <>
                          <Button
                            variant="ghost"
                            className="justify-start text-left w-full text-xs sm:text-sm px-2 sm:px-3 py-2 h-auto"
                            onClick={() => setActiveFilterType("Category")}
                          >
                            <span className="truncate">Category</span>
                            {activeCategory && (
                              <span className="ml-1 text-xs bg-primary/20 px-1.5 py-0.5 rounded flex-shrink-0">
                                Active
                              </span>
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            className="justify-start text-left w-full text-xs sm:text-sm px-2 sm:px-3 py-2 h-auto"
                            onClick={() => setActiveFilterType("Muscle")}
                          >
                            <span className="truncate">Muscle</span>
                            {activeMuscle && (
                              <span className="ml-1 text-xs bg-primary/20 px-1.5 py-0.5 rounded flex-shrink-0">
                                Active
                              </span>
                            )}
                          </Button>
                        </>
                      ) : activeFilterType === "Category" ? (
                        <>
                          {/* Back button */}
                          <div className="flex items-center mb-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="p-0 h-8 mr-2 flex-shrink-0"
                              onClick={() => setActiveFilterType("")}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="m15 18-6-6 6-6" />
                              </svg>
                            </Button>
                            <h3 className="font-medium text-sm sm:text-base truncate">
                              Category
                            </h3>
                          </div>
                          <div className="grid gap-2">
                            <Button
                              variant="ghost"
                              className={`justify-start text-left font-normal text-xs sm:text-sm px-2 sm:px-3 py-2 h-auto ${
                                activeCategory === "" ? "bg-primary/10" : ""
                              }`}
                              onClick={() => handleFilterChange("Category", "")}
                            >
                              <span className="truncate">All Categories</span>
                            </Button>
                            {categories.map((option) => (
                              <Button
                                key={option.value}
                                variant="ghost"
                                className={`justify-start text-left font-normal text-xs sm:text-sm px-2 sm:px-3 py-2 h-auto ${
                                  activeFilters["Category"] === option.value
                                    ? "bg-primary/10"
                                    : ""
                                }`}
                                onClick={() =>
                                  handleFilterChange("Category", option.value)
                                }
                              >
                                <span className="truncate">{option.label}</span>
                              </Button>
                            ))}
                          </div>
                        </>
                      ) : (
                        <>
                          {/* Back button */}
                          <div className="flex items-center mb-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="p-0 h-8 mr-2 flex-shrink-0"
                              onClick={() => setActiveFilterType("")}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="m15 18-6-6 6-6" />
                              </svg>
                            </Button>
                            <h3 className="font-medium text-sm sm:text-base truncate">
                              Muscle
                            </h3>
                          </div>
                          <div className="grid gap-2">
                            <Button
                              variant="ghost"
                              className={`justify-start text-left font-normal text-xs sm:text-sm px-2 sm:px-3 py-2 h-auto ${
                                activeMuscle === "" ? "bg-primary/10" : ""
                              }`}
                              onClick={() => handleFilterChange("Muscle", "")}
                            >
                              <span className="truncate">All Muscles</span>
                            </Button>
                            {muscles.map((option) => (
                              <Button
                                key={option.value}
                                variant="ghost"
                                className={`justify-start text-left font-normal text-xs sm:text-sm px-2 sm:px-3 py-2 h-auto ${
                                  activeFilters["Muscle"] === option.value
                                    ? "bg-primary/10"
                                    : ""
                                }`}
                                onClick={() =>
                                  handleFilterChange("Muscle", option.value)
                                }
                              >
                                <span className="truncate">{option.label}</span>
                              </Button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Active filters display */}
        {(searchQuery ||
          activeCategory ||
          activeMuscle ||
          sortBy !== "name") && (
          <div className="flex flex-wrap gap-1 sm:gap-2 mt-3 mb-2">
            {searchQuery && (
              <Badge
                variant="secondary"
                className="flex items-center gap-1 text-xs max-w-full"
              >
                <span className="truncate">
                  Search: &quot;{searchQuery}&quot;
                </span>
                <button
                  onClick={() => setSearchQuery("")}
                  className="ml-1 hover:text-foreground flex-shrink-0"
                  aria-label="Clear search"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M18 6L6 18" />
                    <path d="M6 6l12 12" />
                  </svg>
                </button>
              </Badge>
            )}
            {sortBy !== "name" && (
              <Badge
                variant="secondary"
                className="flex items-center gap-1 text-xs"
              >
                <span className="truncate">
                  Sort: {sortOptions.find((opt) => opt.value === sortBy)?.label}
                </span>
                <button
                  onClick={() => handleSort("name")}
                  className="ml-1 hover:text-foreground flex-shrink-0"
                  aria-label="Clear sort"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M18 6L6 18" />
                    <path d="M6 6l12 12" />
                  </svg>
                </button>
              </Badge>
            )}
            {activeCategory && (
              <Badge
                variant="secondary"
                className="flex items-center gap-1 text-xs"
              >
                <span className="truncate">Category: {activeCategory}</span>
                <button
                  onClick={() => handleFilterChange("Category", "")}
                  className="ml-1 hover:text-foreground flex-shrink-0"
                  aria-label="Clear category filter"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M18 6L6 18" />
                    <path d="M6 6l12 12" />
                  </svg>
                </button>
              </Badge>
            )}
            {activeMuscle && (
              <Badge
                variant="secondary"
                className="flex items-center gap-1 text-xs"
              >
                <span className="truncate">Muscle: {activeMuscle}</span>
                <button
                  onClick={() => handleFilterChange("Muscle", "")}
                  className="ml-1 hover:text-foreground flex-shrink-0"
                  aria-label="Clear muscle filter"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M18 6L6 18" />
                    <path d="M6 6l12 12" />
                  </svg>
                </button>
              </Badge>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 mb-4 mt-4 text-sm rounded-lg bg-destructive/10 text-destructive">
          {error}
        </div>
      )}

      {/* Exercise list showing one exercise per row with avatar matching the reference design */}
      <div className="flex flex-col mb-4 mt-4">
        {loading ? (
          // Show skeletons while loading - matching the new design without borders
          Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="py-2">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Skeleton className="h-16 w-16 sm:h-16 sm:w-16 rounded-full" />
                </div>
                <div className="flex-1 pl-3 sm:pl-4 min-w-0">
                  <Skeleton className="h-4 sm:h-5 w-2/3 mb-2" />
                  <Skeleton className="h-3 sm:h-4 w-1/2" />
                </div>
              </div>
            </div>
          ))
        ) : exercises.length > 0 ? (
          // Show exercises when loaded with badge, circular image and check icon
          exercises.map((exercise) => (
            <Link
              href={`/exercises/${exercise.id}`}
              key={exercise.id}
              className="block no-underline"
            >
              <div className="hover:bg-accent/30 transition-all duration-200 py-2 border-b">
                <div className="flex items-center">
                  {/* Exercise image */}
                  <div className="flex-shrink-0">
                    <div className="h-16 w-16 sm:h-16 sm:w-16 rounded-full flex items-center justify-center overflow-hidden bg-muted dark:bg-muted">
                      <div
                        className={`h-14 w-14 sm:h-14 sm:w-14 rounded-full flex items-center justify-center text-white text-lg sm:text-lg font-bold
                          ${getColorForCategory(exercise.category)}`}
                      >
                        {exercise.name.substring(0, 2).toUpperCase()}
                      </div>
                    </div>
                  </div>

                  {/* Exercise info */}
                  <div className="flex-1 pl-3 sm:pl-4 min-w-0">
                    <h3 className="text-m sm:text-base font-medium text-foreground truncate">
                      {exercise.name}
                    </h3>
                    <div className="flex items-center text-xs sm:text-sm text-muted-foreground">
                      <span className="truncate">{exercise.category}</span>
                      {exercise.primary_muscle && (
                        <>
                          <span className="mx-1 flex-shrink-0">•</span>
                          <span className="truncate">
                            {exercise.primary_muscle}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))
        ) : (
          // Show message when no exercises found
          <div className="text-center py-10 text-muted-foreground text-sm sm:text-base px-4">
            No exercises found. Try adjusting your search or filters.
          </div>
        )}
      </div>
    </div>
  );
}
