import { useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMultiCompany } from "@/hooks/useMultiCompany";

interface AddSubsidiaryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddSubsidiaryModal({ open, onOpenChange }: AddSubsidiaryModalProps) {
  const { addSubsidiary } = useMultiCompany();
  const [name, setName] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    await addSubsidiary.mutateAsync({ name: name.trim() });
    setName("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Subsidiary Company</DialogTitle>
          <DialogDescription>
            Create a new subsidiary company under your enterprise account. You'll be
            able to manage it from this dashboard.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="company-name">Company Name</Label>
            <Input
              id="company-name"
              placeholder="Enter subsidiary company name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={addSubsidiary.isPending || !name.trim()}>
              {addSubsidiary.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create Subsidiary
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
