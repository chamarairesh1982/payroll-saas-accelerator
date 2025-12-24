import { useEffect } from "react";
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
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { componentCategories, calculationTypes } from "@/data/mockSalaryComponents";
import { useSalaryComponents, type SalaryComponentRow, type SalaryComponentCreateInput } from "@/hooks/useSalaryComponents";

const componentSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(50),
  type: z.enum(["allowance", "deduction"]),
  category: z.enum(["fixed", "percentage", "variable"]),
  calculation_type: z.enum(["basic", "gross", "fixed"]),
  value: z.number().min(0, "Value must be positive"),
  is_taxable: z.boolean(),
  is_epf_applicable: z.boolean(),
  is_active: z.boolean(),
});

type ComponentFormData = z.infer<typeof componentSchema>;

interface SalaryComponentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  component?: SalaryComponentRow | null;
}

export function SalaryComponentModal({ open, onOpenChange, component }: SalaryComponentModalProps) {
  const isEditing = !!component;
  const { createSalaryComponent, updateSalaryComponent, isCreating, isUpdating } = useSalaryComponents();

  const form = useForm<ComponentFormData>({
    resolver: zodResolver(componentSchema),
    defaultValues: {
      name: "",
      type: "allowance",
      category: "fixed",
      calculation_type: "fixed",
      value: 0,
      is_taxable: true,
      is_epf_applicable: false,
      is_active: true,
    },
  });

  useEffect(() => {
    if (!open) return;

    if (component) {
      form.reset({
        name: component.name,
        type: component.type,
        category: component.category,
        calculation_type: component.calculation_type,
        value: Number(component.value),
        is_taxable: component.is_taxable,
        is_epf_applicable: component.is_epf_applicable,
        is_active: component.is_active,
      });
    } else {
      form.reset({
        name: "",
        type: "allowance",
        category: "fixed",
        calculation_type: "fixed",
        value: 0,
        is_taxable: true,
        is_epf_applicable: false,
        is_active: true,
      });
    }
  }, [open, component, form]);

  const watchedCategory = form.watch("category");

  const onSubmit = (data: ComponentFormData) => {
    if (isEditing && component) {
      updateSalaryComponent(
        {
          id: component.id,
          updates: data,
        },
        {
          onSuccess: () => {
            onOpenChange(false);
          },
        }
      );
      return;
    }

    createSalaryComponent(data as SalaryComponentCreateInput, {
      onSuccess: () => {
        onOpenChange(false);
      },
    });
  };

  const isPending = isCreating || isUpdating;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit" : "Add"} Salary Component</DialogTitle>
          <DialogDescription>Configure allowance or deduction settings</DialogDescription>
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
                      {componentCategories.find((c) => c.value === field.value)?.description}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="calculation_type"
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
                        value={field.value}
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
                name="is_taxable"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <div>
                      <FormLabel className="text-sm">Taxable</FormLabel>
                      <FormDescription className="text-xs">Include in PAYE tax calculation</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_epf_applicable"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <div>
                      <FormLabel className="text-sm">EPF Applicable</FormLabel>
                      <FormDescription className="text-xs">Include in EPF contribution calculation</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <div>
                      <FormLabel className="text-sm">Active</FormLabel>
                      <FormDescription className="text-xs">Component is currently in use</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isEditing ? "Save Changes" : "Create Component"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
