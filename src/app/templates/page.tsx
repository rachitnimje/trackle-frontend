"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getTemplates, deleteTemplate } from "@/api/templates";
import { TemplateListItem } from "@/api/types";
import { SearchIcon, PlusCircleIcon, CalendarIcon } from "@/components/Icons";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { MessageOverlay } from "@/components/MessageOverlay";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { logger } from "@/utils/logger";

export default function TemplatesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [templates, setTemplates] = useState<TemplateListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalTemplates, setTotalTemplates] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Sorting
  const [sortBy, setSortBy] = useState("name");

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Check for success message in URL parameters
  useEffect(() => {
    const success = searchParams?.get("success") as string;
    const message = searchParams?.get("message") as string;

    if (success === "true" && message) {
      setSuccessMessage(decodeURIComponent(message));
      // Clear URL parameters after showing message
      const url = new URL(window.location.href);
      url.searchParams.delete("success");
      url.searchParams.delete("message");
      window.history.replaceState({}, "", url.toString());
    }
  }, [searchParams]);

  // Fetch templates based on current filters and sorting
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setLoading(true);
        const response = await getTemplates(page, 10, debouncedSearchQuery);

        if (response.success && Array.isArray(response.data)) {
          // Apply client-side sorting since the API doesn't support sorting
          let sortedTemplates = [...response.data];

          if (sortBy === "name") {
            sortedTemplates.sort((a, b) => a.name.localeCompare(b.name));
          } else if (sortBy === "name_desc") {
            sortedTemplates.sort((a, b) => b.name.localeCompare(a.name));
          } else if (sortBy === "date") {
            sortedTemplates.sort(
              (a, b) =>
                new Date(b.created_at).getTime() -
                new Date(a.created_at).getTime()
            );
          } else if (sortBy === "date_asc") {
            sortedTemplates.sort(
              (a, b) =>
                new Date(a.created_at).getTime() -
                new Date(b.created_at).getTime()
            );
          }

          setTemplates(sortedTemplates);
          setHasMore(response.has_next || false);
          setTotalTemplates(response.total || sortedTemplates.length);
        } else {
          setError("Failed to fetch templates");
        }
      } catch (err) {
        setError("An error occurred while fetching templates");
        logger.error("Error fetching templates", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, [page, debouncedSearchQuery, sortBy]);

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setPage(1); // Reset to first page when searching
  };

  // Handle sorting
  const handleSort = (sort: string) => {
    setSortBy(sort);
  };

  // Prepare sort options
  const sortOptions = [
    { label: "Name (A-Z)", value: "name" },
    { label: "Name (Z-A)", value: "name_desc" },
    { label: "Newest First", value: "date" },
    { label: "Oldest First", value: "date_asc" },
  ];

  // Open delete dialog
  const openDeleteDialog = (id: string) => {
    setTemplateToDelete(id);
    setDeleteDialogOpen(true);
  };

  // Handle template deletion
  const handleDeleteTemplate = async () => {
    if (!templateToDelete) return;

    try {
      setDeleteLoading(true);
      const response = await deleteTemplate(templateToDelete);
      if (response.success) {
        // Navigate with success message to refresh the page and show the message
        router.push(
          "/templates?success=true&message=Template deleted successfully!"
        );
      } else {
        setError("Failed to delete template");
        setDeleteDialogOpen(false);
      }
    } catch (err) {
      setError("An error occurred while deleting the template");
      logger.error("Error deleting template", err);
      setDeleteDialogOpen(false);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="pb-20 sm:pb-16 px-3 sm:px-1 max-w-full overflow-hidden">
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

      {/* Confirm Delete Dialog */}
      <ConfirmDelete
        isOpen={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setTemplateToDelete(null);
        }}
        onConfirm={handleDeleteTemplate}
        title="Delete Template"
        description="Are you sure you want to delete this template"
        itemName={templates.find((t) => t.id === templateToDelete)?.name}
        loading={deleteLoading}
      />

      <div className="flex justify-between items-start mb-4 mt-2">
        <h1 className="text-2xl font-bold truncate mr-2">Templates</h1>

        <Link href="/templates/create">
          <Button
            variant="destructive"
            size="icon"
            className="rounded-md w-11 p-1 flex-shrink-0"
          >
            <PlusCircleIcon className="size-5" />
          </Button>
        </Link>
      </div>

      <div className="flex gap-2 items-center mb-2">
        {/* Search bar */}
        <div className="relative flex-1 min-w-0">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search templates..."
            className="pl-10 border rounded-md h-8 w-full"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>

        {/* Sort dialog button */}
        <Dialog>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="rounded-md h-9 border flex-shrink-0"
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
          <DialogContent className="max-w-[95vw] sm:max-w-[400px] p-4 mx-2">
            <DialogHeader>
              <DialogTitle>Sort Templates</DialogTitle>
              <DialogDescription>
                Choose how to order your templates
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-2">
              {sortOptions.map((option) => (
                <Button
                  key={option.value}
                  variant="ghost"
                  className={`justify-start text-left ${
                    sortBy === option.value ? "bg-primary/10" : ""
                  }`}
                  onClick={() => handleSort(option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Active Filters Display */}
      {(searchQuery || sortBy !== "name") && (
        <div className="flex flex-wrap gap-2 mt-3 mb-2">
          {searchQuery && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <span className="truncate">Search: "{searchQuery}"</span>
              <button
                onClick={() => handleSearch("")}
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
          {sortBy !== "name" && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <span className="truncate">Sort: {sortOptions.find((opt) => opt.value === sortBy)?.label}</span>
              <button
                onClick={() => handleSort("name")}
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

      {error && (
        <div className="p-4 mb-4 text-sm rounded-lg bg-destructive/10 text-destructive">
          {error}
        </div>
      )}

      {/* Templates list */}
      <div className="flex flex-col mt-4">
        {loading ? (
          // Show skeletons while loading
          Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="border rounded-lg p-4 mb-3">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <Skeleton className="h-5 w-32 mb-2" />
                  <Skeleton className="h-4 w-48 mb-2" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-5 w-5 ml-4" />
              </div>
            </div>
          ))
        ) : templates.length > 0 ? (
          // Show templates
          templates.map((template) => (
            <div key={template.id} className="relative group">
              <Link
                href={`/templates/${template.id}`}
                className="block no-underline"
              >
                <Card className="hover:shadow-lg transition-shadow duration-200 cursor-pointer mb-3 p-0">
                  <CardHeader className="px-4 py-2">
                    <div className="flex items-center justify-between">
                      {/* Template info */}
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg font-semibold mb-1 truncate">
                          {template.name}
                        </CardTitle>

                        {template.description && (
                          <p className="text-sm text-muted-foreground mb-2 line-clamp-2 break-words">
                            {template.description}
                          </p>
                        )}

                        <div className="flex items-center text-xs text-muted-foreground">
                          <CalendarIcon className="h-3.5 w-3.5 mr-1" />
                          <span className="truncate">
                            Created{" "}
                            {new Date(template.created_at).toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              }
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Chevron indicator */}
                      <div className="ml-4 text-primary">
                        <svg
                          className="h-5 w-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            </div>
          ))
        ) : (
          // Show message when no templates found
          <div className="text-center py-10 text-muted-foreground">
            No templates found. Create a new template to get started.
          </div>
        )}
      </div>

      {hasMore && !loading && (
        <div className="flex justify-center mt-4">
          <Button variant="outline" onClick={() => setPage(page + 1)}>
            Load More
          </Button>
        </div>
      )}

      {/* Total count */}
      {templates.length > 0 && (
        <div className="text-center">
          <p className="text-sm text-muted-foreground break-words">
            Showing {templates.length} of {totalTemplates} templates
            {searchQuery ? ` matching "${searchQuery}"` : ""}
          </p>
        </div>
      )}
    </div>
  );
}