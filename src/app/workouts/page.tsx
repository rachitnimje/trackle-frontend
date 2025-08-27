"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getWorkouts, deleteWorkout } from "@/api/workouts";
import { getTemplates } from "@/api/templates";
import { Workout, TemplateListItem } from "@/api/types";
import { SearchIcon, PlusCircleIcon, CalendarIcon } from "@/components/Icons";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { format, isAfter, isBefore } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ChevronDown, ChevronUp } from "lucide-react";
import { MessageOverlay } from "@/components/MessageOverlay";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { logger } from "@/utils/logger";

export default function WorkoutsPage() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [workoutToDelete, setWorkoutToDelete] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Sorting and filtering
  const [sortBy, setSortBy] = useState("date");
  const [activeView, setActiveView] = useState<"sort" | "filter">("sort");
  const [selectedTemplateId] = useState<string>("");
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({ from: undefined, to: undefined });
  const [templates, setTemplates] = useState<TemplateListItem[]>([]); // To store template options for filtering

  // Collapsible states
  const [templateSectionOpen, setTemplateSectionOpen] = useState(false);
  const [dateSectionOpen, setDateSectionOpen] = useState(false);

  // Load templates for filtering
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const response = await getTemplates();
        if (response.success && Array.isArray(response.data)) {
          setTemplates(response.data);
        }
      } catch (err) {
        logger.error("Failed to load templates", {
          error: err instanceof Error ? err.message : String(err),
        });
      }
    };

    loadTemplates();
  }, []);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Check URL parameters for success message on component mount
  useEffect(() => {
    // Only run on client side
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const success = params.get("success");
      const message = params.get("message");

      if (success === "true" && message) {
        setSuccessMessage(message);

        // Clear success message parameter from URL without refreshing the page
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete("success");
        newUrl.searchParams.delete("message");
        window.history.replaceState({}, "", newUrl.toString());

        // Auto-dismiss success message after 5 seconds
        const timer = setTimeout(() => {
          setSuccessMessage(null);
        }, 5000);

        return () => clearTimeout(timer);
      }
    }
  }, []);

  // Fetch workouts based on current filters and sorting
  useEffect(() => {
    const fetchWorkouts = async () => {
      try {
        setLoading(true);
        const response = await getWorkouts(page, 10, debouncedSearchQuery);

        if (response.success && Array.isArray(response.data)) {
          // Filter by template if selected
          let filteredWorkouts = [...response.data];

          if (selectedTemplateIds.length > 0) {
            filteredWorkouts = filteredWorkouts.filter((workout) =>
              selectedTemplateIds.includes(
                workout.template_id?.toString() || ""
              )
            );
          } else if (selectedTemplateId) {
            // For backward compatibility
            filteredWorkouts = filteredWorkouts.filter(
              (workout) =>
                workout.template_id?.toString() === selectedTemplateId
            );
          }

          // Filter by date range if set
          if (dateRange.from || dateRange.to) {
            filteredWorkouts = filteredWorkouts.filter((workout) => {
              try {
                const workoutDate = new Date(workout.created_at);

                if (dateRange.from && dateRange.to) {
                  return (
                    isAfter(workoutDate, dateRange.from) &&
                    isBefore(workoutDate, dateRange.to)
                  );
                } else if (dateRange.from) {
                  return isAfter(workoutDate, dateRange.from);
                } else if (dateRange.to) {
                  return isBefore(workoutDate, dateRange.to);
                }
                return true;
              } catch {
                return true; // Include if date parsing fails
              }
            });
          }

          // Apply client-side sorting since the API doesn't support sorting
          const sortedWorkouts = [...filteredWorkouts];

          if (sortBy === "name") {
            sortedWorkouts.sort((a, b) =>
              (a.name || "").localeCompare(b.name || "")
            );
          } else if (sortBy === "name_desc") {
            sortedWorkouts.sort((a, b) =>
              (b.name || "").localeCompare(a.name || "")
            );
          } else if (sortBy === "date") {
            sortedWorkouts.sort((a, b) => {
              try {
                const dateA = a.created_at
                  ? new Date(a.created_at).getTime()
                  : 0;
                const dateB = b.created_at
                  ? new Date(b.created_at).getTime()
                  : 0;
                return dateB - dateA;
              } catch {
                return 0;
              }
            });
          } else if (sortBy === "date_asc") {
            sortedWorkouts.sort((a, b) => {
              try {
                const dateA = a.created_at
                  ? new Date(a.created_at).getTime()
                  : 0;
                const dateB = b.created_at
                  ? new Date(b.created_at).getTime()
                  : 0;
                return dateA - dateB;
              } catch {
                return 0;
              }
            });
          }

          if (page === 1) {
            setWorkouts(sortedWorkouts);
          } else {
            setWorkouts((prev) => [...prev, ...sortedWorkouts]);
          }

          setHasMore(response.has_next || false);
          setTotalCount(response.total || 0);
        } else {
          setError("Failed to fetch workouts");
        }
      } catch (err) {
        setError("An error occurred while fetching workouts");
        logger.error("Error fetching workouts", {
          error: err instanceof Error ? err.message : String(err),
        });
      } finally {
        setLoading(false);
      }
    };

    fetchWorkouts();
  }, [
    page,
    debouncedSearchQuery,
    sortBy,
    selectedTemplateId,
    selectedTemplateIds,
    dateRange.from,
    dateRange.to,
  ]);

  // Function to handle workout deletion
  const handleDeleteClick = (id: string) => {
    setWorkoutToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!workoutToDelete) return;

    try {
      setDeleteLoading(true);
      const response = await deleteWorkout(workoutToDelete);
      if (response.success) {
        setWorkouts((prev) =>
          prev.filter((w) => w.id.toString() !== workoutToDelete)
        );
        setSuccessMessage("Workout deleted successfully!");
        setDeleteDialogOpen(false);
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
      setWorkoutToDelete(null);
    }
  };

  // Handle search input
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setPage(1); // Reset to first page when searching
  };

  // Handle multiple template selection
  const handleTemplateCheckboxChange = (
    templateId: string,
    isChecked: boolean
  ) => {
    setSelectedTemplateIds((prev) => {
      if (isChecked) {
        return [...prev, templateId];
      } else {
        return prev.filter((id) => id !== templateId);
      }
    });
    setPage(1); // Reset to first page when filtering
  };

  // Handle date range filter change
  const handleDateRangeChange = (range: {
    from: Date | undefined;
    to: Date | undefined;
  }) => {
    setDateRange(range);
    setPage(1); // Reset to first page when filtering
  };

  // Handle sort change
  const handleSortChange = (value: string) => {
    setSortBy(value);
    setPage(1); // Reset to first page when changing sort order

    // Sort the workouts based on selected sort option
    const sortedWorkouts = [...workouts];
    if (value === "date") {
      sortedWorkouts.sort((a, b) => {
        try {
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return dateB - dateA;
        } catch {
          return 0;
        }
      });
    } else if (value === "date_asc") {
      sortedWorkouts.sort((a, b) => {
        try {
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return dateA - dateB;
        } catch {
          return 0;
        }
      });
    } else if (value === "name") {
      sortedWorkouts.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    } else if (value === "name_desc") {
      sortedWorkouts.sort((a, b) => (b.name || "").localeCompare(a.name || ""));
    }
    setWorkouts(sortedWorkouts);
  };

  // Handle load more
  const loadMore = () => {
    if (hasMore) {
      setPage((prev) => prev + 1);
    }
  };

  return (
    <div className="pb-16 px-1">
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

      {/* Header with search and filter/sort */}
      <div className="flex justify-between items-start mb-4 mt-2">
        <h1 className="text-2xl font-bold">Workout Logs</h1>

        <Link href="/workouts/create">
          <Button variant="destructive" size="icon" className="rounded-md w-11">
            <PlusCircleIcon className="size-5" />
          </Button>
        </Link>
      </div>

      <div className="flex gap-2 items-center mb-2">
        {/* Search bar */}
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search workouts..."
            className="pl-10 border rounded-md"
            value={searchQuery}
            onChange={(e) => handleSearch(e)}
          />
        </div>

        {/* Filter & Sort dialog button */}
        <Dialog>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="rounded-md h-9 border"
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
                className="mx-1"
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

          <DialogContent className="max-w-[80vw] max-h-[90vw] sm:max-w-[340px] p-0 overflow-hidden">
            <DialogHeader className="px-4 pt-4 pb-2">
              <DialogTitle>Filter & Sort</DialogTitle>
            </DialogHeader>

            <div className="flex h-[400px] min-h-[300px]">
              {/* Left pane with options */}
              <div className="w-1/3 border-r">
                <div
                  className={`py-3 px-4 cursor-pointer hover:bg-accent/50 ${
                    sortBy !== "" ? "font-medium" : ""
                  } ${activeView === "sort" ? "bg-accent" : ""}`}
                  onClick={() => setActiveView("sort")}
                >
                  Sort
                </div>
                <div
                  className={`py-3 px-4 cursor-pointer hover:bg-accent/50 ${
                    selectedTemplateId !== "" ||
                    (dateRange.from !== undefined && dateRange.to !== undefined)
                      ? "font-medium"
                      : ""
                  } ${activeView === "filter" ? "bg-accent" : ""}`}
                  onClick={() => setActiveView("filter")}
                >
                  Filter
                </div>
              </div>

              {/* Right pane with content */}
              <div className="w-2/3 p-2 overflow-y-auto">
                {activeView === "sort" ? (
                  <div className="grid gap-2">
                    <Button
                      variant="ghost"
                      className={`justify-start text-left ${
                        sortBy === "date" ? "bg-primary/10" : ""
                      }`}
                      onClick={() => handleSortChange("date")}
                    >
                      Newest First
                    </Button>
                    <Button
                      variant="ghost"
                      className={`justify-start text-left ${
                        sortBy === "date_asc" ? "bg-primary/10" : ""
                      }`}
                      onClick={() => handleSortChange("date_asc")}
                    >
                      Oldest First
                    </Button>
                    <Button
                      variant="ghost"
                      className={`justify-start text-left ${
                        sortBy === "name" ? "bg-primary/10" : ""
                      }`}
                      onClick={() => handleSortChange("name")}
                    >
                      Name (A-Z)
                    </Button>
                    <Button
                      variant="ghost"
                      className={`justify-start text-left ${
                        sortBy === "name_desc" ? "bg-primary/10" : ""
                      }`}
                      onClick={() => handleSortChange("name_desc")}
                    >
                      Name (Z-A)
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {/* Template filter - Collapsible */}
                    <div>
                      <div
                        className="flex justify-between items-center py-2 cursor-pointer hover:bg-muted rounded-md px-2"
                        onClick={() =>
                          setTemplateSectionOpen(!templateSectionOpen)
                        }
                      >
                        <h3 className="font-medium text-sm">Templates</h3>
                        {templateSectionOpen ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </div>

                      {templateSectionOpen && (
                        <div className="pt-2 pl-2">
                          <div className="max-h-[120px] overflow-y-auto space-y-2">
                            {templates.map((template) => (
                              <div
                                key={`template-checkbox-${template.id}`}
                                className="flex items-center space-x-2"
                              >
                                <input
                                  type="checkbox"
                                  id={`template-${template.id}`}
                                  checked={selectedTemplateIds.includes(
                                    template.id.toString()
                                  )}
                                  onChange={(e) =>
                                    handleTemplateCheckboxChange(
                                      template.id.toString(),
                                      e.target.checked
                                    )
                                  }
                                  className="h-3 w-3 rounded border text-primary focus:ring-primary"
                                />
                                <label
                                  htmlFor={`template-${template.id}`}
                                  className="text-xs cursor-pointer"
                                >
                                  {template.name}
                                </label>
                              </div>
                            ))}
                          </div>

                          {selectedTemplateIds.length > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="mt-2 text-xs h-6 px-2"
                              onClick={() => setSelectedTemplateIds([])}
                            >
                              Clear ({selectedTemplateIds.length})
                            </Button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Date range filter - Collapsible */}
                    <div>
                      <div
                        className="flex justify-between items-center py-2 cursor-pointer hover:bg-muted rounded-md px-2"
                        onClick={() => setDateSectionOpen(!dateSectionOpen)}
                      >
                        <h3 className="font-medium text-sm">Date</h3>
                        {dateSectionOpen ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </div>

                      {dateSectionOpen && (
                        <div className="pt-2 pl-2">
                          <div className="space-y-3">
                            <div className="space-y-2">
                              <div>
                                <Label className="text-xs text-muted-foreground mb-1">
                                  From
                                </Label>
                                <Input
                                  type="date"
                                  value={
                                    dateRange.from
                                      ? format(dateRange.from, "yyyy-MM-dd")
                                      : ""
                                  }
                                  onChange={(e) => {
                                    const from = e.target.value
                                      ? new Date(e.target.value)
                                      : undefined;
                                    handleDateRangeChange({
                                      from,
                                      to: dateRange.to,
                                    });
                                  }}
                                  className="h-8 text-xs"
                                />
                              </div>
                              <div>
                                <Label className="text-xs text-muted-foreground mb-1">
                                  To
                                </Label>
                                <Input
                                  type="date"
                                  value={
                                    dateRange.to
                                      ? format(dateRange.to, "yyyy-MM-dd")
                                      : ""
                                  }
                                  onChange={(e) => {
                                    const to = e.target.value
                                      ? new Date(e.target.value)
                                      : undefined;
                                    handleDateRangeChange({
                                      from: dateRange.from,
                                      to,
                                    });
                                  }}
                                  className="h-8 text-xs"
                                />
                              </div>
                            </div>

                            {(dateRange.from || dateRange.to) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs h-6 px-2"
                                onClick={() =>
                                  handleDateRangeChange({
                                    from: undefined,
                                    to: undefined,
                                  })
                                }
                              >
                                Clear Date
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Active filters display */}
      {(searchQuery ||
        selectedTemplateIds.length > 0 ||
        dateRange.from ||
        dateRange.to ||
        sortBy !== "date") && (
        <div className="flex flex-wrap gap-2 mt-3 mb-2">
          {searchQuery && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Search: &quot;{searchQuery}&quot;
              <button
                onClick={() => setSearchQuery("")}
                className="ml-1 hover:text-foreground"
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
          {sortBy !== "date" && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Sort:{" "}
              {sortBy === "date_asc"
                ? "Oldest First"
                : sortBy === "name"
                ? "Name (A-Z)"
                : sortBy === "name_desc"
                ? "Name (Z-A)"
                : "Custom"}
              <button
                onClick={() => handleSortChange("date")}
                className="ml-1 hover:text-foreground"
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
          {selectedTemplateIds.map((templateId) => {
            const template = templates.find(
              (t) => t.id.toString() === templateId
            );
            return (
              <Badge
                key={`active-template-${templateId}`}
                variant="secondary"
                className="flex items-center gap-1"
              >
                Template: {template?.name || `#${templateId}`}
                <button
                  onClick={() =>
                    handleTemplateCheckboxChange(templateId, false)
                  }
                  className="ml-1 hover:text-foreground"
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
            );
          })}
          {(dateRange.from || dateRange.to) && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Date: {dateRange.from ? format(dateRange.from, "MMM dd") : "Any"}{" "}
              - {dateRange.to ? format(dateRange.to, "MMM dd") : "Any"}
              <button
                onClick={() =>
                  handleDateRangeChange({ from: undefined, to: undefined })
                }
                className="ml-1 hover:text-foreground"
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

      {/* Workout List */}
      <div className="flex flex-col mt-4">
        {loading && !workouts.length ? (
          // Loading skeletons
          Array.from({ length: 3 }).map((_, index) => (
            <div
              key={`skeleton-${index}`}
              className="border rounded-lg p-4 mb-3"
            >
              <Skeleton className="h-28 w-full rounded-lg" />
            </div>
          ))
        ) : workouts.length === 0 ? (
          // No workouts message
          <div className="text-center py-10">
            <div className="mb-4">
              <CalendarIcon className="mx-auto h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium">No workouts found</h3>
            <p className="text-muted-foreground mt-2 max-w-md mx-auto">
              {searchQuery ||
              selectedTemplateIds.length > 0 ||
              dateRange.from ||
              dateRange.to ||
              sortBy !== "date"
                ? "No workouts match your current filters or search criteria. Try adjusting your filters or search term."
                : "Start tracking your fitness journey by logging your workouts."}
            </p>
          </div>
        ) : (
          // Workout cards
          workouts.map((workout) => (
            <div key={workout.id.toString()} className="group">
              <Link
                href={`/workouts/${workout.id}`}
                className="block no-underline"
              >
                <Card
                  className={`hover:shadow-lg transition-shadow duration-200 cursor-pointer mb-3 p-0 relative ${
                    workout.status === "draft"
                      ? "border-2 border-primary pt-2 mt-2"
                      : ""
                  }`}
                >
                  {workout.status === "draft" && (
                    <span className="absolute -top-3 left-3 bg-primary text-white text-xs rounded-xl px-2 p-1 font-bold">
                      Active
                    </span>
                  )}
                  <CardHeader className="px-4 py-2">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex-1">
                        <CardTitle className="text-lg font-semibold mb-1">
                          {workout.name}
                        </CardTitle>
                        <div className="flex items-center text-s text-muted-foreground">
                          <CalendarIcon className="h-3 w-3 mr-1" />
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
                        </div>
                        <div className="mt-2">
                          <Badge variant="outline" className="text-m py-0">
                            {workout.template_name}
                          </Badge>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDeleteClick(workout.id.toString());
                        }}
                        className="p-2.5 text-primary ml-2"
                        title="Delete workout"
                      >
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
                        >
                          <polyline points="3,6 5,6 21,6"></polyline>
                          <path d="m19,6v14a2,2 0 0,1-2,2H7a2,2 0 0,1-2-2V6m3,0V4a2,2 0 0,1,2-2h4a2,2 0 0,1,2,2v2"></path>
                          <line x1="10" y1="11" x2="10" y2="17"></line>
                          <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                      </button>
                    </div>
                  </CardHeader>
                </Card>
              </Link>
              {/* Delete button positioned absolutely */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleDeleteClick(workout.id.toString());
                }}
                className="absolute top-3 right-3 p-1.5 text-primary"
              >
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
                >
                  <polyline points="3,6 5,6 21,6"></polyline>
                  <path d="m19,6v14a2,2 0 0,1-2,2H7a2,2 0 0,1-2-2V6m3,0V4a2,2 0 0,1,2-2h4a2,2 0 0,1,2,2v2"></path>
                  <line x1="10" y1="11" x2="10" y2="17"></line>
                  <line x1="14" y1="11" x2="14" y2="17"></line>
                </svg>
              </button>
            </div>
          ))
        )}

        {/* Load more button */}
        {hasMore && !loading && workouts.length > 0 && (
          <div className="mt-4 text-center">
            <Button variant="outline" onClick={loadMore} disabled={loading}>
              Load More
            </Button>
          </div>
        )}

        {/* Total count */}
        {workouts.length > 0 && (
          <div className="text-center mt-2">
            <p className="text-sm text-muted-foreground">
              Showing {workouts.length} of {totalCount} workouts
              {searchQuery ? ` matching "${searchQuery}"` : ""}
            </p>
          </div>
        )}
      </div>

      {/* Confirm Delete Dialog */}
      <ConfirmDelete
        isOpen={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setWorkoutToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Workout"
        description="Are you sure you want to delete"
        itemName={
          workouts.find((w) => w.id.toString() === workoutToDelete)?.name
        }
        loading={deleteLoading}
      />
    </div>
  );
}
