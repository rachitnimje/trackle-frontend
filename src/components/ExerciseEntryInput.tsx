import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ExerciseEntryInput({
  exerciseId,
  exerciseName,
  entries,
  onUpdateSet,
  onAddSet,
  onRemoveSet,
}: {
  exerciseId: number;
  exerciseName: string;
  entries: { setNumber: number; reps: number; weight: number }[];
  onUpdateSet: (
    exerciseId: number,
    setIndex: number,
    field: "reps" | "weight",
    value: number
  ) => void;
  onAddSet: (exerciseId: number) => void;
  onRemoveSet: (exerciseId: number, setIdx: number) => void;
}) {
  return (
    <div className="bg-card border rounded-lg p-3 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium flex items-center text-card-foreground">
          {exerciseName}
        </h3>
      </div>
      <div className="space-y-3">
        <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground px-1">
          <div className="col-span-2">Set</div>
          <div className="col-span-4">Reps</div>
          <div className="col-span-4">Weight (lbs)</div>
          <div className="col-span-2"></div>
        </div>
        {entries.map((entry, index) => (
          <div
            key={`${exerciseId}-set-${index}`}
            className="grid grid-cols-12 gap-2 items-center"
          >
            <div className="col-span-2">
              <div className="w-8 h-8 rounded-full bg-muted border flex items-center justify-center text-sm font-medium text-muted-foreground">
                {entry.setNumber}
              </div>
            </div>
            <div className="col-span-4">
              <Input
                type="number"
                min="1"
                value={entry.reps === 0 ? "" : entry.reps}
                onChange={(e) => {
                  const val = e.target.value;
                  onUpdateSet(
                    exerciseId,
                    index,
                    "reps",
                    val === "" ? 0 : parseInt(val)
                  );
                }}
                className="h-8 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
              />
            </div>
            <div className="col-span-4">
              <Input
                type="number"
                min="0"
                step="0.5"
                value={entry.weight === 0 ? "" : entry.weight}
                onChange={(e) => {
                  const val = e.target.value;
                  onUpdateSet(
                    exerciseId,
                    index,
                    "weight",
                    val === "" ? 0 : parseFloat(val)
                  );
                }}
                className="h-8 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
              />
            </div>
            <div className="col-span-2 flex justify-center">
              <button
                type="button"
                onClick={() => onRemoveSet(exerciseId, index)}
                className="text-muted-foreground hover:text-red-500 transition-colors h-8 w-8 flex items-center justify-center rounded-full hover:bg-red-50"
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
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onAddSet(exerciseId)}
          className="w-full mt-3"
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
            className="mr-1"
          >
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Add Set
        </Button>
      </div>
    </div>
  );
}
