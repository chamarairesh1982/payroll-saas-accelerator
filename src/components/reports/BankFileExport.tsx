import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Download, FileText, Settings, Eye, Check, Building, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  bankFileTemplates,
  exportBankFile,
  previewBankFile,
  PayrollRecord,
  BankFileTemplate,
} from "@/lib/bank-file-export";
import { format } from "date-fns";
import { toast } from "sonner";

interface BankFileExportProps {
  payrollData: PayrollRecord[];
  month: Date;
}

export function BankFileExport({ payrollData, month }: BankFileExportProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState(bankFileTemplates[0].id);
  const [paymentRef, setPaymentRef] = useState(`SAL-${format(month, "yyyyMM")}`);
  const [showPreview, setShowPreview] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const selectedTemplate = useMemo(
    () => bankFileTemplates.find((t) => t.id === selectedTemplateId) || bankFileTemplates[0],
    [selectedTemplateId]
  );

  const preview = useMemo(
    () => previewBankFile(payrollData, selectedTemplate, 5),
    [payrollData, selectedTemplate]
  );

  const totals = useMemo(() => {
    const total = payrollData.reduce((sum, r) => sum + r.netSalary, 0);
    return {
      count: payrollData.length,
      total,
    };
  }, [payrollData]);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      exportBankFile(payrollData, selectedTemplate, month, paymentRef);
      toast.success("Bank file exported", {
        description: `${payrollData.length} records exported using ${selectedTemplate.name} format.`,
      });
    } catch (error) {
      toast.error("Export failed", { description: "Please try again." });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building className="h-5 w-5" />
          Bank File Export
        </CardTitle>
        <CardDescription>
          Generate salary transfer files for bank bulk payments
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg bg-muted/50 p-4">
            <p className="text-sm text-muted-foreground">Employees</p>
            <p className="text-2xl font-bold">{totals.count}</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-4">
            <p className="text-sm text-muted-foreground">Total Amount</p>
            <p className="text-2xl font-bold">LKR {totals.total.toLocaleString()}</p>
          </div>
        </div>

        {/* Template Selection */}
        <div className="space-y-2">
          <Label>Export Format</Label>
          <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {bankFileTemplates.map((template) => (
                <SelectItem key={template.id} value={template.id}>
                  <div className="flex items-center gap-2">
                    <span>{template.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {template.format.toUpperCase()}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">{selectedTemplate.description}</p>
        </div>

        {/* Template Details */}
        <div className="rounded-lg border p-4">
          <h4 className="mb-3 font-medium">Format Details</h4>
          <div className="grid gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">File Type</span>
              <span className="font-medium">.{selectedTemplate.fileExtension}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Format</span>
              <span className="font-medium capitalize">{selectedTemplate.format.replace("_", " ")}</span>
            </div>
            {selectedTemplate.delimiter && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delimiter</span>
                <span className="font-medium">
                  {selectedTemplate.delimiter === "," ? "Comma (,)" : 
                   selectedTemplate.delimiter === "|" ? "Pipe (|)" : 
                   selectedTemplate.delimiter === "\t" ? "Tab" : selectedTemplate.delimiter}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Include Header</span>
              <span className="font-medium">{selectedTemplate.includeHeader ? "Yes" : "No"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Columns</span>
              <span className="font-medium">{selectedTemplate.columns.length}</span>
            </div>
          </div>

          {/* Column Preview */}
          <div className="mt-4">
            <p className="mb-2 text-sm text-muted-foreground">Columns included:</p>
            <div className="flex flex-wrap gap-1">
              {selectedTemplate.columns.map((col) => (
                <Badge key={col.id} variant="outline" className="text-xs">
                  {col.label}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Payment Reference */}
        <div className="space-y-2">
          <Label htmlFor="paymentRef">Payment Reference</Label>
          <Input
            id="paymentRef"
            value={paymentRef}
            onChange={(e) => setPaymentRef(e.target.value)}
            placeholder="Enter payment reference"
          />
          <p className="text-xs text-muted-foreground">
            Used as reference in the export file (if applicable)
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => setShowPreview(true)}>
            <Eye className="h-4 w-4" />
            Preview
          </Button>
          <Button className="flex-1" onClick={handleExport} disabled={isExporting || payrollData.length === 0}>
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Export File
          </Button>
        </div>

        {payrollData.length === 0 && (
          <p className="text-center text-sm text-muted-foreground">
            No payroll data available for export
          </p>
        )}

        {/* Preview Dialog */}
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>File Preview</DialogTitle>
              <DialogDescription>
                Preview of the first 5 records using {selectedTemplate.name} format
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge>{selectedTemplate.format.toUpperCase()}</Badge>
                <span className="text-sm text-muted-foreground">
                  {selectedTemplate.columns.length} columns • .{selectedTemplate.fileExtension}
                </span>
              </div>
              <ScrollArea className="h-[300px] rounded-lg border bg-muted/30 p-4">
                <pre className="font-mono text-xs whitespace-pre-wrap">{preview}</pre>
              </ScrollArea>
              <p className="text-sm text-muted-foreground">
                Showing {Math.min(5, payrollData.length)} of {payrollData.length} records
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
