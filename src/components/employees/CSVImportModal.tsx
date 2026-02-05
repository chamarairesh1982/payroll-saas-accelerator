import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Download,
  Upload,
  FileSpreadsheet,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  X,
} from "lucide-react";
import {
  downloadCSVTemplate,
  validateAndParseCSV,
  CSVEmployee,
  ValidationError,
} from "@/lib/csv-utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface CSVImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ImportStep = "upload" | "preview" | "importing" | "complete";

export const CSVImportModal = ({ open, onOpenChange }: CSVImportModalProps) => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<ImportStep>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<CSVEmployee[]>([]);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [warnings, setWarnings] = useState<ValidationError[]>([]);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  const [importResults, setImportResults] = useState<{
    success: number;
    failed: number;
    failedEmails: string[];
  }>({ success: 0, failed: 0, failedEmails: [] });

  const resetState = () => {
    setStep("upload");
    setFile(null);
    setParsedData([]);
    setErrors([]);
    setWarnings([]);
    setImportProgress({ current: 0, total: 0 });
    setImportResults({ success: 0, failed: 0, failedEmails: [] });
  };

  const handleClose = () => {
    resetState();
    onOpenChange(false);
  };

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (!selectedFile) return;

      if (!selectedFile.name.endsWith(".csv")) {
        toast.error("Please upload a CSV file");
        return;
      }

      setFile(selectedFile);

      const content = await selectedFile.text();
      const result = validateAndParseCSV(content);

      setParsedData(result.data);
      setErrors(result.errors);
      setWarnings(result.warnings);

      if (result.errors.length === 0 && result.data.length > 0) {
        setStep("preview");
      }
    },
    []
  );

  const handleDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const droppedFile = e.dataTransfer.files[0];
      if (!droppedFile) return;

      if (!droppedFile.name.endsWith(".csv")) {
        toast.error("Please upload a CSV file");
        return;
      }

      setFile(droppedFile);

      const content = await droppedFile.text();
      const result = validateAndParseCSV(content);

      setParsedData(result.data);
      setErrors(result.errors);
      setWarnings(result.warnings);

      if (result.errors.length === 0 && result.data.length > 0) {
        setStep("preview");
      }
    },
    []
  );

  const handleImport = async () => {
    if (!profile?.company_id) {
      toast.error("Company not found");
      return;
    }

    setStep("importing");
    setImportProgress({ current: 0, total: parsedData.length });

    let successCount = 0;
    let failedCount = 0;
    const failedEmails: string[] = [];

    for (let i = 0; i < parsedData.length; i++) {
      const employee = parsedData[i];
      setImportProgress({ current: i + 1, total: parsedData.length });

      try {
        // Create employee via edge function
        const { error } = await supabase.functions.invoke("create-employee", {
          body: {
            company_id: profile.company_id,
            first_name: employee.first_name,
            last_name: employee.last_name,
            email: employee.email,
            phone: employee.phone,
            nic: employee.nic,
            department: employee.department,
            designation: employee.designation,
            employment_type: employee.employment_type || "permanent",
            basic_salary: employee.basic_salary || 0,
            date_of_birth: employee.date_of_birth,
            date_of_joining: employee.date_of_joining,
            epf_number: employee.epf_number,
            bank_name: employee.bank_name,
            bank_branch: employee.bank_branch,
            bank_account_number: employee.bank_account_number,
          },
        });

        if (error) {
          failedCount++;
          failedEmails.push(employee.email);
        } else {
          successCount++;
        }
      } catch {
        failedCount++;
        failedEmails.push(employee.email);
      }
    }

    setImportResults({ success: successCount, failed: failedCount, failedEmails });
    setStep("complete");
    queryClient.invalidateQueries({ queryKey: ["employees"] });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Import Employees from CSV
          </DialogTitle>
          <DialogDescription>
            Upload a CSV file to bulk import employee data.
          </DialogDescription>
        </DialogHeader>

        {step === "upload" && (
          <div className="space-y-6">
            {/* Download Template */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border">
              <div>
                <p className="font-medium">Download Template</p>
                <p className="text-sm text-muted-foreground">
                  Get the CSV template with required columns and example data
                </p>
              </div>
              <Button variant="outline" onClick={downloadCSVTemplate}>
                <Download className="mr-2 h-4 w-4" />
                Download Template
              </Button>
            </div>

            {/* Upload Area */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => document.getElementById("csv-file-input")?.click()}
            >
              <Upload className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="font-medium">Drop your CSV file here</p>
              <p className="text-sm text-muted-foreground">
                or click to browse
              </p>
              <input
                id="csv-file-input"
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {/* Errors */}
            {errors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-medium mb-2">
                    Found {errors.length} error(s) in {file?.name}:
                  </p>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    {errors.slice(0, 5).map((err, i) => (
                      <li key={i}>
                        Row {err.row}: {err.column} - {err.message}
                      </li>
                    ))}
                    {errors.length > 5 && (
                      <li>...and {errors.length - 5} more errors</li>
                    )}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {step === "preview" && (
          <div className="flex-1 flex flex-col space-y-4 overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Badge variant="secondary" className="text-sm">
                  {parsedData.length} employees to import
                </Badge>
                {warnings.length > 0 && (
                  <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-600">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    {warnings.length} warning(s)
                  </Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFile(null);
                  setParsedData([]);
                  setWarnings([]);
                  setStep("upload");
                }}
              >
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            </div>

            {warnings.length > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <p className="text-sm">
                    {warnings.slice(0, 3).map((w, i) => (
                      <span key={i} className="block">
                        Row {w.row}: {w.column} - {w.message}
                      </span>
                    ))}
                    {warnings.length > 3 && (
                      <span className="text-muted-foreground">
                        ...and {warnings.length - 3} more warnings
                      </span>
                    )}
                  </p>
                </AlertDescription>
              </Alert>
            )}

            <ScrollArea className="flex-1 border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[50px]">#</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Designation</TableHead>
                    <TableHead>Salary</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedData.slice(0, 50).map((emp, index) => (
                    <TableRow key={index}>
                      <TableCell className="text-muted-foreground">
                        {index + 1}
                      </TableCell>
                      <TableCell className="font-medium">
                        {emp.first_name} {emp.last_name}
                      </TableCell>
                      <TableCell className="text-sm">{emp.email}</TableCell>
                      <TableCell>{emp.department || "-"}</TableCell>
                      <TableCell>{emp.designation || "-"}</TableCell>
                      <TableCell>
                        {emp.basic_salary
                          ? `Rs. ${emp.basic_salary.toLocaleString()}`
                          : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {parsedData.length > 50 && (
                <p className="p-4 text-center text-sm text-muted-foreground">
                  Showing first 50 of {parsedData.length} employees
                </p>
              )}
            </ScrollArea>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleImport}>
                <Upload className="mr-2 h-4 w-4" />
                Import {parsedData.length} Employees
              </Button>
            </div>
          </div>
        )}

        {step === "importing" && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="font-medium">Importing employees...</p>
            <p className="text-sm text-muted-foreground">
              {importProgress.current} of {importProgress.total} completed
            </p>
            <div className="w-64 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{
                  width: `${(importProgress.current / importProgress.total) * 100}%`,
                }}
              />
            </div>
          </div>
        )}

        {step === "complete" && (
          <div className="flex flex-col items-center justify-center py-12 space-y-6">
            <CheckCircle2 className="h-16 w-16 text-success" />
            <div className="text-center">
              <p className="text-xl font-semibold">Import Complete</p>
              <p className="text-muted-foreground mt-1">
                Successfully imported {importResults.success} employee
                {importResults.success !== 1 ? "s" : ""}
              </p>
            </div>

            {importResults.failed > 0 && (
              <Alert variant="destructive" className="max-w-md">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-medium">
                    Failed to import {importResults.failed} employee(s):
                  </p>
                  <ul className="list-disc list-inside text-sm mt-2">
                    {importResults.failedEmails.slice(0, 5).map((email, i) => (
                      <li key={i}>{email}</li>
                    ))}
                    {importResults.failedEmails.length > 5 && (
                      <li>...and {importResults.failedEmails.length - 5} more</li>
                    )}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <Button onClick={handleClose}>Close</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
