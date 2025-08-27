import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Button } from "../components/ui/button";

interface DraftOrDeleteOverlayProps {
  open: boolean;
  onDraft: () => void;
  onDelete: () => void;
  onCancel: () => void;
}

const DraftOrDeleteOverlay: React.FC<DraftOrDeleteOverlayProps> = ({ open, onDraft, onDelete, onCancel }) => {
  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent className="animate-in fade-in-0 zoom-in-95 duration-200 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=closed]:duration-200">
        <DialogHeader className="flex-row items-center justify-between space-y-0 pb-4">
          <DialogTitle>Save as draft or delete workout?</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-0 -mx-6 -mb-6">
          <Button 
            variant="outline" 
            onClick={onDraft}
            className="h-10 rounded-none rounded-bl-lg border-r"
          >
            Save as Draft
          </Button>
          <Button 
            variant="destructive" 
            onClick={onDelete}
            className="h-10 rounded-none rounded-br-lg"
          >
            Delete Workout
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DraftOrDeleteOverlay;