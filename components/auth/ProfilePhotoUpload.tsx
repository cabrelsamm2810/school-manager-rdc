'use client';

import { useRef, useState } from 'react';

type Props = {
  value: string;
  onChange: (dataUrl: string) => void;
};

export function ProfilePhotoUpload({ value, onChange }: Props) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');

  function handleFile(file: File) {
    if (!file.type.startsWith('image/')) {
      setError('Veuillez sélectionner une image.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('L\u2019image ne doit pas dépasser 10 Mo.');
      return;
    }
    setError('');
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const targetWidth = 200;
        const targetHeight = 267;
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const sourceAspect = img.width / img.height;
        const targetAspect = targetWidth / targetHeight;
        let sx = 0, sy = 0, sw = img.width, sh = img.height;
        if (sourceAspect > targetAspect) {
          sw = img.height * targetAspect;
          sx = (img.width - sw) / 2;
        } else {
          sh = img.width / targetAspect;
          sy = (img.height - sh) / 2;
        }
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetWidth, targetHeight);
        onChange(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative h-28 w-28 overflow-hidden rounded-full border-2 border-slate-200 bg-slate-50 ring-4 ring-slate-50 transition-all">
        {value ? (
          <img src={value} alt="Photo de profil" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-300">
            <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        )}
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute right-0 top-0 flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-white shadow-md transition hover:bg-red-600"
            aria-label="Supprimer la photo"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={() => cameraRef.current?.click()}
          className="btn-secondary-light px-4 py-2.5 text-xs"
          style={{ borderRadius: '9999px' }}
        >
          📷 Prendre une photo
        </button>
        <button
          type="button"
          onClick={() => galleryRef.current?.click()}
          className="btn-secondary-light px-4 py-2.5 text-xs"
          style={{ borderRadius: '9999px' }}
        >
          🖼️ Choisir dans la galerie
        </button>
      </div>
      {error && <p className="text-center text-xs text-red-600">{error}</p>}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="user"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }}
      />
    </div>
  );
}
