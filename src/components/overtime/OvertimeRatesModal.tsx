import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Edit2, Plus, Loader2 } from "lucide-react";
import { formatDayType, useOvertimeRates, type OvertimeRate } from "@/hooks/useOvertime";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface OvertimeRatesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type EditMode = "create" | "edit";

type EditableRate = {
  id?: string;
  name: string;
  day_type: "weekday" | "saturday" | "sunday" | "holiday";
  multiplier: number;
  is_active: boolean;
};

export function OvertimeRatesModal({ open, onOpenChange }: OvertimeRatesModalProps) {
  const { overtimeRates, isLoading, createOvertimeRate, updateOvertimeRate, isCreating, isUpdating } = useOvertimeRates();

  const [editingRate, setEditingRate] = useState<EditableRate | null>(null);
  const [mode, setMode] = useState<EditMode>("edit");

  const handleToggleActive = (rate: OvertimeRate, checked: boolean) => {
    updateOvertimeRate({ id: rate.id, updates: { is_active: checked } });
  };

  const handleEditRate = (rate: OvertimeRate) => {
    setMode("edit");
    setEditingRate({
      id: rate.id,
      name: rate.name,
      day_type: rate.day_type,
      multiplier: Number(rate.multiplier),
      is_active: rate.is_active,
    });
  };

  const handleAddRate = () => {
    setMode("create");
    setEditingRate({
      name: "",
      day_type: "weekday",
      multiplier: 1.5,
      is_active: true,
    });
  };

  const handleSaveRate = () => {
    if (!editingRate) return;

    if (editingRate.name.trim().length < 2) {
      toast.error("Rate name must be at least 2 characters");
      return;
    }

    if (mode === "create") {
      createOvertimeRate(
        {
          name: editingRate.name.trim(),
          day_type: editingRate.day_type,
          multiplier: editingRate.multiplier,
          is_active: editingRate.is_active,
        },
        {
          onSuccess: () => {
            setEditingRate(null);
          },
        }
      );
      return;
    }

    if (!editingRate.id) return;

    updateOvertimeRate(
      {
        id: editingRate.id,
        updates: {
          name: editingRate.name.trim(),
          day_type: editingRate.day_type,
          multiplier: editingRate.multiplier,
          is_active: editingRate.is_active,
        },
      },
      {
        onSuccess: () => {
          setEditingRate(null);
        },
      }
    );
  };

  const isPending = isCreating || isUpdating;

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setEditingRate(null); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Overtime Rates Configuration</DialogTitle>
          <DialogDescription>Configure overtime multipliers for different day types</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : editingRate ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Rate Name</Label>
                <Input
                  value={editingRate.name}
                  onChange={(e) => setEditingRate({ ...editingRate, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Multiplier</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="1"
                  max="5"
                  value={editingRate.multiplier}
                  onChange={(e) => setEditingRate({ ...editingRate, multiplier: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Day Type</Label>
              <Select
                value={editingRate.day_type}
                onValueChange={(v) => setEditingRate({ ...editingRate, day_type: v as EditableRate["day_type"] })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select day type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekday">Weekday</SelectItem>
                  <SelectItem value="saturday">Saturday</SelectItem>
                  <SelectItem value="sunday">Sunday</SelectItem>
                  <SelectItem value="holiday">Holiday</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={editingRate.is_active}
                onCheckedChange={(checked) => setEditingRate({ ...editingRate, is_active: checked })}
              />
              <Label>Active</Label>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingRate(null)} disabled={isPending}>
                Cancel
              </Button>
              <Button onClick={handleSaveRate} disabled={isPending}>
                Save Changes
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-end">
              <Button variant="outline" size="sm" onClick={handleAddRate}>
                <Plus className="h-4 w-4" />
                Add Rate
              </Button>
            </div>

            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Rate Name</TableHead>
                    <TableHead>Day Type</TableHead>
                    <TableHead className="text-center">Multiplier</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overtimeRates.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                        No overtime rates yet. Add one to allow overtime submissions.
                      </TableCell>
                    </TableRow>
                  ) : (
                    overtimeRates.map((rate) => (
                      <TableRow key={rate.id}>
                        <TableCell className="font-medium">{rate.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{formatDayType(rate.day_type)}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="font-semibold text-primary">{rate.multiplier}x</span>
                        </TableCell>
                        <TableCell className="text-center">
                          <Switch
                            checked={rate.is_active}
                            onCheckedChange={(checked) => handleToggleActive(rate, checked)}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => handleEditRate(rate)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
