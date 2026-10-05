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
    <div className="space-y-3">
      <div className="flex flex-col items-center gap-3">
        <div className="h-24 w-24 overflow-hidden rounded-2xl border-2 border-slate-200 bg-slate-50">
          {value ? (
            <img src={value} alt="Photo de profil" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-slate-300">
              <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => cameraRef.current?.click()} className="btn-secondary-light px-3 py-2 text-xs">
            📷 Prendre une photo
          </button>
          <button type="button" onClick={() => galleryRef.current?.click()} className="btn-secondary-light px-3 py-2 text-xs">
            🖼️ Galerie
          </button>
        </div>
      </div>
      {error && <p className="text-center text-xs text-red-600">{error}</p>}
      <input ref={cameraRef} type="file" accept="image/*" capture="user" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }} />
      <input ref={galleryRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }} />
    </div>
  );
}
