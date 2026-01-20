import * as React from "react";
import type { HTMLAttributes } from "react";
import {
  Children,
  isValidElement,
  type ComponentType,
  type ReactElement,
  type ReactNode,
  useEffect,
} from "react";
import type { InputProps } from "ra-core";
import { FieldTitle, RecordContextProvider, shallowEqual, useInput, useTranslate } from "ra-core";
import type { FileRejection, DropEvent, DropzoneInputProps } from "react-dropzone";
import { useDropzone, type DropzoneOptions } from "react-dropzone";
import { XCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import { FormError, FormField, FormLabel } from "@/components/ra-wrappers/form";
import { InputHelperText } from "@/components/ra-wrappers/input-helper-text";
import { Button } from "@/components/ui/button";
import { sanitizeInputRestProps } from "@/lib/sanitizeInputRestProps";

/** Default max file size: 5MB - prevents DoS attacks */
const DEFAULT_MAX_FILE_SIZE = 5 * 1024 * 1024;

export const FileInput = (props: FileInputProps) => {
  const {
    alwaysOn,
    defaultValue,
    format,
    label,
    helperText,
    name: nameProp,
    onBlur: onBlurProp,
    onChange: onChangeProp,
    parse,
    resource,
    source,
    validate,
    readOnly,
    disabled,

    accept,
    maxSize,
    minSize,
    multiple = false,
    options = {},

    children,
    className,
    inputProps: inputPropsOptions,

    onRemove: onRemoveProp,
    validateFileRemoval,

    placeholder,
    labelMultiple = "ra.input.file.upload_several",
    labelSingle = "ra.input.file.upload_single",
    removeIcon,
    ...rest
  } = props;
  const { onDrop: onDropProp } = options;
  const translate = useTranslate();

  // turn a browser dropped file structure into expected structure
  const transformFile = (file: unknown) => {
    if (!(file instanceof File)) {
      return file;
    }

    const preview = URL.createObjectURL(file);
    const transformedFile: TransformedFile = {
      rawFile: file,
      src: preview,
      title: file.name,
    };

    return transformedFile;
  };

  const transformFiles = (files: unknown[]) => {
    if (!files) {
      return multiple ? [] : null;
    }

    if (Array.isArray(files)) {
      return files.map(transformFile);
    }

    return transformFile(files);
  };

  const {
    id,
    field: { onChange, onBlur, value, name },
    isRequired,
  } = useInput({
    alwaysOn,
    defaultValue,
    format: format || transformFiles,
    label,
    helperText,
    name: nameProp,
    onBlur: onBlurProp,
    onChange: onChangeProp,
    parse: parse || transformFiles,
    resource,
    source,
    validate,
    readOnly,
    disabled,
  });
  const files = value ? (Array.isArray(value) ? value : [value]) : [];

  const onDrop = (newFiles: File[], rejectedFiles: FileRejection[], event: DropEvent) => {
    const updatedFiles = multiple ? [...files, ...newFiles] : [...newFiles];

    if (multiple) {
      onChange(updatedFiles);
      onBlur();
    } else {
      onChange(updatedFiles[0]);
      onBlur();
    }

    if (onDropProp) {
      onDropProp(newFiles, rejectedFiles, event);
    }
  };

  const onRemove = (file: TransformedFile) => async () => {
    if (validateFileRemoval) {
      try {
        await validateFileRemoval(file);
      } catch {
        return;
      }
    }

    if (multiple) {
      const filteredFiles = files.filter((stateFile) => !shallowEqual(stateFile, file));
      onChange(filteredFiles);
      onBlur();
    } else {
      onChange(null);
      onBlur();
    }

    if (onRemoveProp) {
      onRemoveProp(file);
    }
  };

  const childrenElement =
    children && isValidElement(Children.only(children))
      ? (Children.only(children) as ReactElement)
      : undefined;

  const { getRootProps, getInputProps, fileRejections } = useDropzone({
    accept,
    maxSize: maxSize ?? DEFAULT_MAX_FILE_SIZE,
    minSize,
    multiple,
    disabled: disabled || readOnly,
    // Filename validation for security
    validator: (file) => {
      if (file.name.length > 255) {
        return { code: "name-too-long", message: "Filename exceeds 255 characters" };
      }
      if (/[<>:"/\\|?*]/.test(file.name)) {
        return { code: "invalid-chars", message: "Filename contains invalid characters" };
      }
      return null;
    },
    ...options,
    onDrop,
  });

  return (
    <FormField
      id={id}
      name={name}
      className={cn("w-full", className)}
      {...sanitizeInputRestProps(rest)}
    >
      <FormLabel
        htmlFor={id}
        className={disabled || readOnly ? "cursor-default" : "cursor-pointer"}
      >
        <FieldTitle label={label} source={source} resource={resource} isRequired={isRequired} />
      </FormLabel>

      <div
        {...getRootProps({
          className: cn(
            "border-2 border-dashed border-muted rounded-lg p-6 text-center transition-colors",
            "hover:border-sidebar-ring focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            disabled || readOnly
              ? "bg-muted cursor-not-allowed"
              : "bg-muted text-muted-foreground cursor-pointer"
          ),
          role: "button",
          "aria-label": multiple ? translate(labelMultiple) : translate(labelSingle),
          tabIndex: disabled || readOnly ? -1 : 0,
        })}
      >
        <input
          id={id}
          name={name}
          {...getInputProps({
            ...inputPropsOptions,
          })}
        />

        {placeholder ? (
          placeholder
        ) : multiple ? (
          <p className="text-sm">{translate(labelMultiple)}</p>
        ) : (
          <p className="text-sm">{translate(labelSingle)}</p>
        )}
      </div>

      {fileRejections.length > 0 && (
        <ul
          role="alert"
          aria-live="polite"
          className="text-sm text-destructive mt-2 list-disc pl-5"
        >
          {fileRejections.map(({ file, errors }) => (
            <li key={file.name}>
              {file.name}: {errors.map((e) => e.message).join(", ")}
            </li>
          ))}
        </ul>
      )}

      <InputHelperText helperText={helperText} />
      <FormError />

      {children && (
        <div className="previews flex flex-col gap-1">
          {files.map((file: TransformedFile, index: number) => (
            <FileInputPreview
              key={index}
              file={file}
              onRemove={onRemove(file)}
              removeIcon={removeIcon}
            >
              <RecordContextProvider value={file}>{childrenElement}</RecordContextProvider>
            </FileInputPreview>
          ))}
        </div>
      )}
    </FormField>
  );
};

export type FileInputProps = Omit<InputProps, "type"> & {
  accept?: DropzoneOptions["accept"];
  className?: string;
  children?: ReactNode;
  labelMultiple?: string;
  labelSingle?: string;
  maxSize?: DropzoneOptions["maxSize"];
  minSize?: DropzoneOptions["minSize"];
  multiple?: DropzoneOptions["multiple"];
  options?: DropzoneOptions;

  onRemove?: (file: TransformedFile) => void;
  placeholder?: ReactNode;
  removeIcon?: ComponentType<{ className?: string }>;
  inputProps?: DropzoneInputProps & React.ComponentProps<"input">;

  validateFileRemoval?(file: TransformedFile): boolean | Promise<boolean>;
};

export interface TransformedFile {
  rawFile: File;
  src: string;
  title: string;
}

export const FileInputPreview = (props: FileInputPreviewProps) => {
  const {
    className,
    children,

    file,
    onRemove,
    removeIcon: RemoveIcon = XCircle,

    ...rest
  } = props;

  const translate = useTranslate();

  useEffect(() => {
    return () => {
      const preview = file.rawFile ? file.rawFile.preview : file.preview;

      if (preview) {
        window.URL.revokeObjectURL(preview);
      }
    };
  }, [file]);

  return (
    <div className={cn("flex flex-row gap-1", className)} {...rest}>
      <Button
        variant="ghost"
        size="icon"
        className="h-11 w-11 rounded-full shadow-sm cursor-pointer"
        onClick={onRemove}
        aria-label={translate("ra.action.delete")}
        title={translate("ra.action.delete")}
      >
        <RemoveIcon className="h-4 w-4" />
      </Button>
      {children}
    </div>
  );
};

export interface FileInputPreviewProps extends HTMLAttributes<HTMLDivElement> {
  file: TransformedFile;
  onRemove: () => void;
  removeIcon?: React.ComponentType<{ className?: string }>;
}
