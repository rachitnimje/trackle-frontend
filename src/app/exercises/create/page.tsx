"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  getExerciseCategories,
  getPrimaryMuscles,
  getEquipmentTypes,
  createExercise,
} from "@/api/exercises";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { logger } from "@/utils/logger";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircleIcon, ArrowLeftIcon } from "@/components/Icons";

export default function CreateExercisePage() {
  const router = useRouter();
  const { isAdmin, loading: authLoading } = useAuth();

  const [categories, setCategories] = useState<string[]>([]);
  const [muscles, setMuscles] = useState<string[]>([]);
  const [equipment, setEquipment] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    primary_muscle: "",
    equipment: "",
  });

  // Fetch dropdown options
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [categoriesRes, musclesRes, equipmentRes] = await Promise.all([
          getExerciseCategories(),
          getPrimaryMuscles(),
          getEquipmentTypes(),
        ]);

        if (categoriesRes.success && Array.isArray(categoriesRes.data)) {
          setCategories(categoriesRes.data);
        }

        if (musclesRes.success && Array.isArray(musclesRes.data)) {
          setMuscles(musclesRes.data);
        }

        if (equipmentRes.success && Array.isArray(equipmentRes.data)) {
          setEquipment(equipmentRes.data);
        }
      } catch (err) {
        logger.error("Error fetching options", { error: err });
        setError("Failed to load form options");
      }
    };

    fetchOptions();
  }, []);

  // Check if user is admin, redirect if not
  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push("/exercises");
    }
  }, [isAdmin, authLoading, router]);

  // Handle form input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error message when user makes any change
    if (error) setError(null);
  };

  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error message when user makes any change
    if (error) setError(null);
  };

  // Generate preview avatar color based on category - using primarily red to match reference design
  const getAvatarColor = (category: string): string => {
    // For this design we'll primarily use red-based colors to match the reference design
    const colors = [
      "bg-red-500",
      "bg-rose-500",
      "bg-red-600",
      "bg-rose-600",
      "bg-red-400",
    ];

    if (!category) return colors[0];

    // Simple hash function to get consistent color
    let hash = 0;
    for (let i = 0; i < category.length; i++) {
      hash = category.charCodeAt(i) + ((hash << 5) - hash);
    }

    // Use the hash to pick a color
    const colorIndex = Math.abs(hash) % colors.length;
    return colors[colorIndex];
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation - only name and category are required
    if (!formData.name || !formData.category) {
      setError("Please fill all required fields");
      return;
    }

    // Check character limit for description
    if (formData.description) {
      if (formData.description.length > 150) {
        setError("Description exceeds the maximum limit of 150 characters");
        return;
      }
    }

    try {
      setLoading(true);
      setError(null);

      const response = await createExercise(formData);

      if (response.success) {
        // Redirect immediately without showing success message on this page
        // Make sure we have a valid ID before redirecting
        if (response.data && response.data.id) {
          // Convert ID to string to ensure it's a valid URL parameter
          const exerciseId = String(response.data.id);
          router.push(
            `/exercises?success=true&message=Exercise created successfully&id=${exerciseId}`
          );
        } else {
          // If no valid ID, redirect to the exercises list
          router.push(
            "/exercises?success=true&message=Exercise created successfully"
          );
        }
      } else {
        setError(response.message || "Failed to create exercise");
      }
    } catch (err) {
      logger.error("Error creating exercise", { error: err });
      setError("An error occurred while creating the exercise");
    } finally {
      setLoading(false);
    }
  };

  // Show loading or unauthorized message
  if (authLoading) {
    return (
      <div className="p-4 flex justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="p-4">
        <Alert variant="destructive">
          <AlertCircleIcon className="h-4 w-4" />
          <AlertTitle>Unauthorized</AlertTitle>
          <AlertDescription>
            You do not have permission to access this page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-0 flex flex-col min-h-[calc(100vh-4rem)]">
      <div className="flex items-center bg-background mb-4">
        <Link
          href="/exercises"
          className="inline-flex items-center text-muted-foreground hover:text-foreground"
        >
          <ArrowLeftIcon className="mr-2 h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold">Create Exercise</h1>
      </div>

      <div className="px-5 flex-grow flex flex-col">
        {error && (
          <Alert
            variant="destructive"
            className="mb-4 p-2 flex items-center justify-center text-center"
          >
            <div className="flex items-center gap-2">
              <AlertCircleIcon className="h-5 w-5 flex-shrink-0" />
              <AlertDescription className="text-base font-medium">
                {error}
              </AlertDescription>
            </div>
          </Alert>
        )}

        {success && (
          <Alert className="mb-4 bg-green-50 border-green-200">
            <AlertTitle>Success!</AlertTitle>
            <AlertDescription>
              Exercise created successfully. Redirecting...
            </AlertDescription>
          </Alert>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-4 flex flex-col flex-grow"
        >
          {/* Exercise Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-base">
              Exercise Name*
            </Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="e.g., Bench Press (Barbell)"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="description" className="text-base">
                Description*
              </Label>
              <span className="text-xs text-muted-foreground">
                {formData.description.length}/150 characters
              </span>
            </div>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={(e) => {
                if (e.target.value.length <= 150) {
                  handleInputChange(e);
                }
              }}
              placeholder="Describe the exercise"
              rows={2}
              className="resize-none"
              maxLength={150}
            />
          </div>

          {/* Category dropdown */}
          <div className="space-y-2 mb-4 w-full">
            <Label htmlFor="category" className="text-base">
              Category*
            </Label>
            <Select
              value={formData.category}
              onValueChange={(value) => handleSelectChange("category", value)}
              required
            >
              <SelectTrigger className="bg-white h-12 text-base w-full">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent
                className="max-h-[250px] overflow-y-auto"
                style={{
                  overscrollBehavior: "contain",
                  WebkitOverflowScrolling: "touch",
                }}
              >
                {categories.map((category) => (
                  <SelectItem
                    key={category}
                    value={category}
                    className="text-base py-1.5"
                  >
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Row layout for muscle and equipment */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            {/* Primary Muscle */}
            <div className="space-y-2">
              <Label htmlFor="primary_muscle" className="text-base">
                Muscle
              </Label>
              <Select
                value={formData.primary_muscle}
                onValueChange={(value) =>
                  handleSelectChange("primary_muscle", value)
                }
              >
                <SelectTrigger className="bg-white h-12 text-base w-full">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent
                  className="max-h-[250px] overflow-y-auto"
                  style={{
                    overscrollBehavior: "contain",
                    WebkitOverflowScrolling: "touch",
                  }}
                >
                  <SelectItem
                    key="none-muscle"
                    value="none"
                    className="text-base py-1.5 text-muted-foreground"
                  >
                    None
                  </SelectItem>
                  {muscles.map((muscle) => (
                    <SelectItem
                      key={muscle}
                      value={muscle}
                      className="text-base py-1.5"
                    >
                      {muscle}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Equipment */}
            <div className="space-y-2">
              <Label htmlFor="equipment" className="text-base">
                Equipment
              </Label>
              <Select
                value={formData.equipment}
                onValueChange={(value) =>
                  handleSelectChange("equipment", value)
                }
              >
                <SelectTrigger className="bg-white h-12 text-base w-full">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent
                  className="max-h-[250px] overflow-y-auto"
                  style={{
                    overscrollBehavior: "contain",
                    WebkitOverflowScrolling: "touch",
                  }}
                >
                  <SelectItem
                    key="none-equipment"
                    value="none"
                    className="text-base py-1.5 text-muted-foreground"
                  >
                    None
                  </SelectItem>
                  {equipment.map((item) => (
                    <SelectItem
                      key={item}
                      value={item}
                      className="text-base py-1.5"
                    >
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Flex spacer to push buttons to bottom */}
          <div className="flex-grow"></div>

          {/* Fixed Button Row at Bottom - positioned above bottom navbar */}
          <div className="fixed bottom-[3rem] left-0 right-0 bg-white py-4 px-4 shadow-sm mt-auto">
            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
              <Button
                type="button"
                onClick={() => router.back()}
                disabled={loading}
                className="w-full h-9 text-lg font-medium"
                variant="outline"
              >
                Cancel
              </Button>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-9 text-lg font-medium"
                variant="destructive"
              >
                {loading ? "Creating..." : "Create"}
              </Button>
            </div>
          </div>

          {/* Extra space at bottom to prevent content being hidden behind fixed buttons */}
          <div className="h-28"></div>
        </form>
      </div>
    </div>
  );
}
