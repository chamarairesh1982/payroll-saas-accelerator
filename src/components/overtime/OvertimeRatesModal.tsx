import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { OvertimeRate } from "@/types/payroll";
import { mockOvertimeRates, formatDayType } from "@/data/mockOvertime";
import { toast } from "sonner";
import { Edit2, Plus, Trash2 } from "lucide-react";

interface OvertimeRatesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OvertimeRatesModal({ open, onOpenChange }: OvertimeRatesModalProps) {
  const [rates, setRates] = useState<OvertimeRate[]>(mockOvertimeRates);
  const [editingRate, setEditingRate] = useState<OvertimeRate | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);

  const handleToggleActive = (rateId: string) => {
    setRates(prev => prev.map(r => 
      r.id === rateId ? { ...r, isActive: !r.isActive } : r
    ));
    toast.success("Rate status updated");
  };

  const handleEditRate = (rate: OvertimeRate) => {
    setEditingRate(rate);
    setShowEditForm(true);
  };

  const handleSaveRate = () => {
    if (editingRate) {
      setRates(prev => prev.map(r => r.id === editingRate.id ? editingRate : r));
      toast.success("Rate updated successfully");
      setShowEditForm(false);
      setEditingRate(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Overtime Rates Configuration</DialogTitle>
          <DialogDescription>
            Configure overtime multipliers for different day types
          </DialogDescription>
        </DialogHeader>

        {showEditForm && editingRate ? (
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
            <div className="flex items-center gap-2">
              <Switch
                checked={editingRate.isActive}
                onCheckedChange={(checked) => setEditingRate({ ...editingRate, isActive: checked })}
              />
              <Label>Active</Label>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setShowEditForm(false); setEditingRate(null); }}>
                Cancel
              </Button>
              <Button onClick={handleSaveRate}>Save Changes</Button>
            </DialogFooter>
          </div>
        ) : (
          <>
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
                  {rates.map((rate) => (
                    <TableRow key={rate.id}>
                      <TableCell className="font-medium">{rate.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{formatDayType(rate.dayType)}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-semibold text-primary">{rate.multiplier}x</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={rate.isActive}
                          onCheckedChange={() => handleToggleActive(rate.id)}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleEditRate(rate)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
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
