import { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Calculator, Plus, Search, Edit2, Trash2, TrendingUp, TrendingDown, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { motion } from "framer-motion";
import { mockSalaryComponents, getComponentStats, componentCategories } from "@/data/mockSalaryComponents";
import { SalaryComponent } from "@/types/payroll";
import { SalaryComponentModal } from "@/components/salary/SalaryComponentModal";
import { toast } from "sonner";

const categoryBadgeVariants: Record<string, "default" | "secondary" | "outline"> = {
  fixed: "default",
  percentage: "secondary",
  variable: "outline",
};

const SalaryComponents = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [showModal, setShowModal] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState<SalaryComponent | null>(null);
  const [components, setComponents] = useState(mockSalaryComponents);

  const stats = useMemo(() => getComponentStats(), []);

  const filteredComponents = useMemo(() => {
    return components.filter(comp => {
      const matchesSearch = comp.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = typeFilter === "all" || comp.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [components, searchQuery, typeFilter]);

  const allowances = useMemo(() => filteredComponents.filter(c => c.type === 'allowance'), [filteredComponents]);
  const deductions = useMemo(() => filteredComponents.filter(c => c.type === 'deduction'), [filteredComponents]);

  const handleEdit = (component: SalaryComponent) => {
    setSelectedComponent(component);
    setShowModal(true);
  };

  const handleAdd = () => {
    setSelectedComponent(null);
    setShowModal(true);
  };

  const handleToggleActive = (componentId: string) => {
    setComponents(prev => prev.map(c => 
      c.id === componentId ? { ...c, isActive: !c.isActive } : c
    ));
    toast.success("Status updated");
  };

  const handleDelete = (componentId: string) => {
    setComponents(prev => prev.filter(c => c.id !== componentId));
    toast.success("Component deleted");
  };

  const formatValue = (component: SalaryComponent) => {
    if (component.category === "percentage") {
      return `${component.value}%`;
    }
    if (component.category === "variable") {
      return component.value > 0 ? `LKR ${component.value.toLocaleString()} (default)` : "Variable";
    }
    return `LKR ${component.value.toLocaleString()}`;
  };

  const renderComponentTable = (items: SalaryComponent[], type: 'allowance' | 'deduction') => (
    <div className="rounded-lg border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead>Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead className="text-right">Value</TableHead>
            <TableHead className="text-center">Taxable</TableHead>
            <TableHead className="text-center">EPF</TableHead>
            <TableHead className="text-center">Active</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center">
                <div className="flex flex-col items-center gap-2">
                  {type === 'allowance' ? (
                    <TrendingUp className="h-8 w-8 text-muted-foreground/50" />
                  ) : (
                    <TrendingDown className="h-8 w-8 text-muted-foreground/50" />
                  )}
                  <p className="text-muted-foreground">No {type}s found</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            items.map((component) => (
              <TableRow key={component.id} className={!component.isActive ? "opacity-50" : ""}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {type === 'allowance' ? (
                      <TrendingUp className="h-4 w-4 text-success" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-destructive" />
                    )}
                    <span className="font-medium">{component.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={categoryBadgeVariants[component.category]}>
                    {componentCategories.find(c => c.value === component.category)?.label}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatValue(component)}
                </TableCell>
                <TableCell className="text-center">
                  {component.isTaxable ? (
                    <CheckCircle2 className="h-4 w-4 text-success mx-auto" />
                  ) : (
                    <XCircle className="h-4 w-4 text-muted-foreground mx-auto" />
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {component.isEpfApplicable ? (
                    <CheckCircle2 className="h-4 w-4 text-success mx-auto" />
                  ) : (
                    <XCircle className="h-4 w-4 text-muted-foreground mx-auto" />
                  )}
                </TableCell>
                <TableCell className="text-center">
                  <Switch
                    checked={component.isActive}
                    onCheckedChange={() => handleToggleActive(component.id)}
                  />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(component)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Component</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{component.name}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(component.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <MainLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Allowances & Deductions</h1>
          <p className="page-description">Configure salary components for payroll calculation.</p>
        </div>
        <Button size="lg" onClick={handleAdd}>
          <Plus className="h-5 w-5" />
          Add Component
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Allowances</CardTitle>
              <TrendingUp className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeAllowances}</div>
              <p className="text-xs text-muted-foreground">{stats.totalAllowances} total configured</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Fixed Allowances</CardTitle>
              <Calculator className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">LKR {stats.fixedAllowancesTotal.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Per employee/month</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Deductions</CardTitle>
              <TrendingDown className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeDeductions}</div>
              <p className="text-xs text-muted-foreground">{stats.totalDeductions} total configured</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Fixed Deductions</CardTitle>
              <Calculator className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">LKR {stats.fixedDeductionsTotal.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Per employee/month</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search components..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="allowance">Allowances</SelectItem>
            <SelectItem value="deduction">Deductions</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="allowances" className="space-y-4">
        <TabsList>
          <TabsTrigger value="allowances" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Allowances ({allowances.length})
          </TabsTrigger>
          <TabsTrigger value="deductions" className="gap-2">
            <TrendingDown className="h-4 w-4" />
            Deductions ({deductions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="allowances">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {renderComponentTable(allowances, 'allowance')}
          </motion.div>
        </TabsContent>

        <TabsContent value="deductions">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {renderComponentTable(deductions, 'deduction')}
          </motion.div>
        </TabsContent>
      </Tabs>

      <SalaryComponentModal
        open={showModal}
        onOpenChange={setShowModal}
        component={selectedComponent}
      />
    </MainLayout>
  );
};

export default SalaryComponents;
