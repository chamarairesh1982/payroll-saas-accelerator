import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type DocumentType = "contract" | "id_copy" | "certificate" | "resume" | "other";

export interface EmployeeDocument {
  id: string;
  employee_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  document_type: DocumentType;
  description: string | null;
  uploaded_by: string;
  created_at: string;
  updated_at: string;
}

export const documentTypes: { value: DocumentType; label: string }[] = [
  { value: "contract", label: "Employment Contract" },
  { value: "id_copy", label: "ID Copy / NIC" },
  { value: "certificate", label: "Certificate" },
  { value: "resume", label: "Resume / CV" },
  { value: "other", label: "Other" },
];

export function useEmployeeDocuments(employeeId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const documentsQuery = useQuery({
    queryKey: ["employee-documents", employeeId],
    queryFn: async () => {
      if (!employeeId) return [];
      
      const { data, error } = await supabase
        .from("employee_documents")
        .select("*")
        .eq("employee_id", employeeId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as EmployeeDocument[];
    },
    enabled: !!employeeId,
  });

  const uploadDocument = useMutation({
    mutationFn: async ({
      file,
      documentType,
      description,
    }: {
      file: File;
      documentType: DocumentType;
      description?: string;
    }) => {
      if (!employeeId || !user) throw new Error("Missing employee or user");

      // Create unique file path: employeeId/timestamp_filename
      const timestamp = Date.now();
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const filePath = `${employeeId}/${timestamp}_${sanitizedFileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("employee-documents")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Save metadata to database
      const { data, error: dbError } = await supabase
        .from("employee_documents")
        .insert({
          employee_id: employeeId,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          file_type: file.type,
          document_type: documentType,
          description: description || null,
          uploaded_by: user.id,
        })
        .select()
        .single();

      if (dbError) {
        // Clean up uploaded file if db insert fails
        await supabase.storage.from("employee-documents").remove([filePath]);
        throw dbError;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-documents", employeeId] });
      toast.success("Document uploaded successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to upload document: " + error.message);
    },
  });

  const deleteDocument = useMutation({
    mutationFn: async (document: EmployeeDocument) => {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from("employee-documents")
        .remove([document.file_path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from("employee_documents")
        .delete()
        .eq("id", document.id);

      if (dbError) throw dbError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-documents", employeeId] });
      toast.success("Document deleted successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to delete document: " + error.message);
    },
  });

  const getDocumentUrl = async (filePath: string) => {
    const { data, error } = await supabase.storage
      .from("employee-documents")
      .createSignedUrl(filePath, 3600); // 1 hour expiry

    if (error) throw error;
    return data.signedUrl;
  };

  return {
    documents: documentsQuery.data || [],
    isLoading: documentsQuery.isLoading,
    error: documentsQuery.error,
    uploadDocument,
    deleteDocument,
    getDocumentUrl,
    isUploading: uploadDocument.isPending,
    isDeleting: deleteDocument.isPending,
  };
}
