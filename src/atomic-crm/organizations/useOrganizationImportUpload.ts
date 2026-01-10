import { useState, useRef, useCallback } from "react";
import { validateCsvFile, type CsvValidationError } from "../utils/csvUploadValidator";

interface UploadState {
  file: File | null;
  validationErrors: CsvValidationError[];
  validationWarnings: string[];
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  resetUpload: () => void;
}

export function useOrganizationImportUpload(): UploadState {
  const [file, setFile] = useState<File | null>(null);
  const [validationErrors, setValidationErrors] = useState<CsvValidationError[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] || null;

    setValidationErrors([]);
    setValidationWarnings([]);

    if (!selectedFile) {
      setFile(null);
      return;
    }

    const validation = await validateCsvFile(selectedFile);

    if (!validation.valid && validation.errors) {
      setValidationErrors(validation.errors);
      setFile(null);
      return;
    }

    if (validation.warnings && validation.warnings.length > 0) {
      setValidationWarnings(validation.warnings);
    }

    setFile(selectedFile);
  }, []);

  const resetUpload = useCallback(() => {
    setFile(null);
    setValidationErrors([]);
    setValidationWarnings([]);
  }, []);

  return {
    file,
    validationErrors,
    validationWarnings,
    fileInputRef,
    handleFileChange,
    resetUpload,
  };
}
