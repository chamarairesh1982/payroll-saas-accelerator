import { useState } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { FileText, Download, Trash2, Eye, Loader2, File, Image, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { EmployeeDocument, documentTypes } from "@/hooks/useEmployeeDocuments";
import { toast } from "sonner";

interface DocumentListProps {
  documents: EmployeeDocument[];
  onDelete: (document: EmployeeDocument) => void;
  onGetUrl: (filePath: string) => Promise<string>;
  isDeleting: boolean;
  canManage: boolean;
}

export function DocumentList({
  documents,
  onDelete,
  onGetUrl,
  isDeleting,
  canManage,
}: DocumentListProps) {
  const [deleteTarget, setDeleteTarget] = useState<EmployeeDocument | null>(null);
  const [loadingUrls, setLoadingUrls] = useState<Set<string>>(new Set());

  const getFileIcon = (fileType: string) => {
    if (fileType.includes("image")) return Image;
    if (fileType.includes("pdf")) return FileText;
    if (fileType.includes("spreadsheet") || fileType.includes("excel")) return FileSpreadsheet;
    return File;
  };

  const getDocumentTypeLabel = (type: string) => {
    return documentTypes.find((t) => t.value === type)?.label || type;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleView = async (doc: EmployeeDocument) => {
    setLoadingUrls((prev) => new Set(prev).add(doc.id));
    try {
      const url = await onGetUrl(doc.file_path);
      window.open(url, "_blank");
    } catch (error) {
      toast.error("Failed to open document");
    } finally {
      setLoadingUrls((prev) => {
        const next = new Set(prev);
        next.delete(doc.id);
        return next;
      });
    }
  };

  const handleDownload = async (doc: EmployeeDocument) => {
    setLoadingUrls((prev) => new Set(prev).add(doc.id));
    try {
      const url = await onGetUrl(doc.file_path);
      const link = document.createElement("a");
      link.href = url;
      link.download = doc.file_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      toast.error("Failed to download document");
    } finally {
      setLoadingUrls((prev) => {
        const next = new Set(prev);
        next.delete(doc.id);
        return next;
      });
    }
  };

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      onDelete(deleteTarget);
      setDeleteTarget(null);
    }
  };

  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl bg-muted/30 py-12">
        <FileText className="h-12 w-12 text-muted-foreground/50" />
        <h3 className="mt-3 text-sm font-medium">No documents</h3>
        <p className="text-sm text-muted-foreground">
          Upload documents to get started.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {documents.map((doc, index) => {
          const Icon = getFileIcon(doc.file_type);
          const isLoading = loadingUrls.has(doc.id);

          return (
            <motion.div
              key={doc.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center gap-4 rounded-lg border bg-card p-4 transition-colors hover:bg-muted/30"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Icon className="h-6 w-6 text-primary" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate font-medium">{doc.file_name}</p>
                  <Badge variant="secondary" className="shrink-0">
                    {getDocumentTypeLabel(doc.document_type)}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span>{formatFileSize(doc.file_size)}</span>
                  <span>•</span>
                  <span>{format(new Date(doc.created_at), "MMM d, yyyy")}</span>
                </div>
                {doc.description && (
                  <p className="mt-1 truncate text-sm text-muted-foreground">
                    {doc.description}
                  </p>
                )}
              </div>

              <div className="flex shrink-0 gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleView(doc)}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDownload(doc)}
                  disabled={isLoading}
                >
                  <Download className="h-4 w-4" />
                </Button>
                {canManage && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleteTarget(doc)}
                    disabled={isDeleting}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteTarget?.file_name}"? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
