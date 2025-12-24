import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { SalaryComponent } from "@/types/payroll";
import { componentCategories, calculationTypes } from "@/data/mockSalaryComponents";
import { toast } from "sonner";

const componentSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50),
  type: z.enum(["allowance", "deduction"]),
  category: z.enum(["fixed", "percentage", "variable"]),
  calculationType: z.enum(["basic", "gross", "fixed"]),
  value: z.number().min(0, "Value must be positive"),
  isTaxable: z.boolean(),
  isEpfApplicable: z.boolean(),
  isActive: z.boolean(),
});

type ComponentFormData = z.infer<typeof componentSchema>;

interface SalaryComponentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  component?: SalaryComponent | null;
  onSave?: (data: ComponentFormData) => void;
}

export function SalaryComponentModal({ open, onOpenChange, component, onSave }: SalaryComponentModalProps) {
  const isEditing = !!component;

  const form = useForm<ComponentFormData>({
    resolver: zodResolver(componentSchema),
    defaultValues: component ? {
      name: component.name,
      type: component.type,
      category: component.category,
      calculationType: component.calculationType,
      value: component.value,
      isTaxable: component.isTaxable,
      isEpfApplicable: component.isEpfApplicable,
      isActive: component.isActive,
    } : {
      name: "",
      type: "allowance",
      category: "fixed",
      calculationType: "fixed",
      value: 0,
      isTaxable: true,
      isEpfApplicable: false,
      isActive: true,
    },
  });

  const watchedCategory = form.watch("category");

  const onSubmit = (data: ComponentFormData) => {
    onSave?.(data);
    toast.success(isEditing ? "Component Updated" : "Component Created", {
      description: `${data.name} has been ${isEditing ? 'updated' : 'created'} successfully.`,
    });
    onOpenChange(false);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit" : "Add"} Salary Component</DialogTitle>
          <DialogDescription>
            Configure allowance or deduction settings
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Component Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Transport Allowance" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="allowance">Allowance (+)</SelectItem>
                        <SelectItem value="deduction">Deduction (-)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {componentCategories.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {componentCategories.find(c => c.value === field.value)?.description}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="calculationType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Calculation Base</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                      disabled={watchedCategory === "fixed"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {calculationTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {watchedCategory === "percentage" ? "Percentage (%)" : "Amount (LKR)"}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step={watchedCategory === "percentage" ? "0.5" : "100"}
                        min="0"
                        placeholder={watchedCategory === "percentage" ? "10" : "5000"}
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    {watchedCategory === "variable" && (
                      <FormDescription>Default value (can vary per pay period)</FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4 rounded-lg border p-4">
              <h4 className="font-medium text-sm">Tax & Contribution Settings</h4>
              
              <FormField
                control={form.control}
                name="isTaxable"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <div>
                      <FormLabel className="text-sm">Taxable</FormLabel>
                      <FormDescription className="text-xs">
                        Include in PAYE tax calculation
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isEpfApplicable"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <div>
                      <FormLabel className="text-sm">EPF Applicable</FormLabel>
                      <FormDescription className="text-xs">
                        Include in EPF contribution calculation
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <div>
                      <FormLabel className="text-sm">Active</FormLabel>
                      <FormDescription className="text-xs">
                        Component is currently in use
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">{isEditing ? "Save Changes" : "Create Component"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
