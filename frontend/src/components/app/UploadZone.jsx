import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { motion } from "framer-motion";
import { Upload, Image, FileText, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const UploadZone = ({ 
  type, 
  onUpload, 
  uploaded, 
  accept, 
  maxSize = 50,
  disabled = false 
}) => {
  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    if (rejectedFiles.length > 0) {
      const error = rejectedFiles[0].errors[0];
      if (error.code === "file-too-large") {
        toast.error(`File too large. Maximum size is ${maxSize}MB`);
      } else {
        toast.error(error.message);
      }
      return;
    }
    
    if (acceptedFiles.length > 0) {
      onUpload(acceptedFiles[0]);
    }
  }, [onUpload, maxSize]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: type === "image" 
      ? { "image/*": [".png", ".jpg", ".jpeg", ".webp"] }
      : { "application/pdf": [".pdf"] },
    maxSize: maxSize * 1024 * 1024,
    multiple: false,
    disabled,
  });

  const isImage = type === "image";
  const Icon = isImage ? Image : FileText;

  if (uploaded) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`
          relative rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6
          ${isImage ? "flex-1" : "h-32"}
        `}
        data-testid={`upload-zone-${type}-complete`}
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
            <Check className="w-6 h-6 text-emerald-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-white truncate">{uploaded.name}</p>
            <p className="text-sm text-zinc-400">
              {isImage ? "Cityscape image uploaded" : "Style PDF uploaded"}
            </p>
          </div>
          {isImage && uploaded.preview && (
            <div className="w-24 h-16 rounded-lg overflow-hidden border border-white/10">
              <img 
                src={uploaded.preview} 
                alt="Preview" 
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      {...getRootProps()}
      whileHover={!disabled ? { scale: 1.01 } : {}}
      className={`
        upload-zone relative rounded-2xl border-2 border-dashed
        ${isDragActive ? "active border-violet-500 bg-violet-500/10" : "border-zinc-800"}
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        ${isImage ? "flex-1 min-h-[300px]" : "h-32"}
        flex flex-col items-center justify-center gap-4 p-8
        group overflow-hidden
      `}
      data-testid={`upload-zone-${type}`}
    >
      <input {...getInputProps()} data-testid={`upload-input-${type}`} />
      
      {/* Background gradient on hover */}
      <div className="absolute inset-0 bg-gradient-to-b from-violet-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      
      <motion.div
        animate={isDragActive ? { scale: 1.1, y: -5 } : { scale: 1, y: 0 }}
        className={`
          w-16 h-16 rounded-2xl flex items-center justify-center
          ${isDragActive ? "bg-violet-500/20" : "bg-zinc-900"}
          border border-white/10
        `}
      >
        {isDragActive ? (
          <Upload className="w-8 h-8 text-violet-400" />
        ) : (
          <Icon className="w-8 h-8 text-zinc-400 group-hover:text-violet-400 transition-colors" />
        )}
      </motion.div>

      <div className="text-center">
        <p className="text-lg font-semibold text-white">
          {isDragActive 
            ? "Drop to upload" 
            : isImage 
              ? "Upload Cityscape Photo" 
              : "Upload Style PDF (Optional)"}
        </p>
        <p className="text-sm text-zinc-500 mt-1">
          {isImage 
            ? "Drag & drop or click to browse • PNG, JPG up to 50MB"
            : "PDF with style rules • Max 50MB"}
        </p>
      </div>

      {!disabled && (
        <Button
          variant="ghost"
          className="text-violet-400 hover:text-violet-300 hover:bg-violet-500/10"
          onClick={(e) => e.stopPropagation()}
        >
          Browse Files
        </Button>
      )}
    </motion.div>
  );
};
