'use client';

import { useRef, useState } from 'react';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

interface PhotoUploadProps {
  currentPhotoUrl?: string;
  name?: string;
}

export function PhotoUpload({ currentPhotoUrl, name = 'photo' }: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentPhotoUrl || null);
  const [error, setError] = useState('');
  const [removed, setRemoved] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setError('');
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Only JPEG, PNG, and WebP files are allowed.');
      e.target.value = '';
      return;
    }
    if (file.size > MAX_SIZE) {
      setError('File must be under 5MB.');
      e.target.value = '';
      return;
    }

    setRemoved(false);
    const url = URL.createObjectURL(file);
    setPreview(url);
  }

  function handleRemove() {
    setPreview(null);
    setRemoved(true);
    setError('');
    if (inputRef.current) inputRef.current.value = '';
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="relative h-24 w-24 rounded-full bg-surface-secondary flex items-center justify-center overflow-hidden cursor-pointer border-2 border-dashed border-border hover:border-primary transition-colors"
        onClick={() => inputRef.current?.click()}
      >
        {preview ? (
          <img src={preview} alt="Preview" className="h-full w-full object-cover" />
        ) : (
          <div className="text-center text-text-secondary text-xs px-2">
            <svg className="mx-auto h-6 w-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
            </svg>
            Photo
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          className="text-xs text-primary hover:text-primary/80 font-medium"
          onClick={() => inputRef.current?.click()}
        >
          {preview ? 'Change photo' : 'Upload photo'}
        </button>
        {preview && (
          <button
            type="button"
            className="text-xs text-danger hover:text-danger/80 font-medium"
            onClick={handleRemove}
          >
            Remove
          </button>
        )}
      </div>

      {error && <p className="text-xs text-danger">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        name={name}
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleChange}
      />
      {removed && <input type="hidden" name="photoRemoved" value="true" />}
    </div>
  );
}
