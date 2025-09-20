import { useCallback, useState } from 'react';
import { Image, Upload } from 'lucide-react';
import type { ChangeEvent, DragEvent } from 'react';
import { cn } from '../../lib/format';

interface UploadZoneProps {
  onUpload: (files: File[]) => void;
  disabled?: boolean;
}

export function UploadZone({ onUpload, disabled }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      if (disabled) return;

      const files = Array.from(e.dataTransfer.files).filter((file) =>
        ['image/png', 'image/jpeg', 'image/webp'].includes(file.type)
      );

      if (files.length > 0) {
        onUpload(files);
      }
    },
    [onUpload, disabled]
  );

  const handleDragOver = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (!disabled) setIsDragging(true);
    },
    [disabled]
  );

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileSelect = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []).filter((file) =>
        ['image/png', 'image/jpeg', 'image/webp'].includes(file.type)
      );

      if (files.length > 0) {
        onUpload(files);
      }

      e.target.value = '';
    },
    [onUpload]
  );

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={cn(
        'relative rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition-all',
        isDragging && 'border-[#3E8BFF] bg-[#3E8BFF1a]',
        disabled && 'cursor-not-allowed opacity-60'
      )}
    >
      <input
        type="file"
        id="file-upload"
        className="sr-only"
        accept=".png,.jpg,.jpeg,.webp"
        multiple
        onChange={handleFileSelect}
        disabled={disabled}
      />

      <label
        htmlFor="file-upload"
        className={cn(
          'flex cursor-pointer items-center justify-center gap-3 rounded-xl border border-dashed border-white/15 bg-white/5 px-4 py-6 text-center transition-colors',
          disabled && 'cursor-not-allowed'
        )}
      >
        <div
          className={cn(
            'rounded-full p-3 transition-colors',
            isDragging ? 'bg-[#3E8BFF26] text-[#3E8BFF]' : 'bg-white/10 text-white/60'
          )}
        >
          {isDragging ? <Image className="h-6 w-6" /> : <Upload className="h-6 w-6" />}
        </div>
        <div className="text-left">
          <p className="text-sm font-medium text-[rgba(231,236,243,0.90)]">
            {isDragging ? 'Drop images here' : 'Drop images or click to upload'}
          </p>
          <p className="text-xs text-white/50">PNG · JPG · WEBP · max 5</p>
        </div>
      </label>
    </div>
  );
}
