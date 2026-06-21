'use client';
// src/components/lobby/PresetLibrary.tsx

import { useEffect, useState } from 'react';
import { Preset } from '@/types';

interface Props {
  onSelect: (preset: Preset) => void;
}

export function PresetLibrary({ onSelect }: Props) {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/presets')
      .then((r) => r.json())
      .then((data) => {
        setPresets(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function deletePreset(id: string) {
    await fetch(`/api/presets?id=${id}`, { method: 'DELETE' });
    setPresets((prev) => prev.filter((p) => p.id !== id));
  }

  if (loading) {
    return (
      <div className="bg-bg-800 rounded-xl p-4 mb-4 text-zinc-500 text-sm text-center animate-pulse">
        Loading presets…
      </div>
    );
  }

  if (presets.length === 0) {
    return (
      <div className="bg-bg-800 rounded-xl p-4 mb-4 text-zinc-500 text-sm text-center">
        No saved presets yet. Fill in video URLs and save them!
      </div>
    );
  }

  return (
    <div className="bg-bg-800 rounded-xl p-3 mb-4 space-y-2 max-h-48 overflow-y-auto">
      {presets.map((preset) => (
        <div
          key={preset.id}
          className="flex items-center justify-between bg-bg-700 rounded-lg px-3 py-2 hover:bg-bg-600 transition-colors group"
        >
          <button
            id={`load-preset-${preset.id}`}
            onClick={() => onSelect(preset)}
            className="text-left flex-1"
          >
            <p className="text-sm font-medium text-zinc-200">{preset.name}</p>
            <p className="text-xs text-zinc-500 truncate">{preset.normalVideoUrl.slice(0, 40)}…</p>
          </button>
          <button
            id={`delete-preset-${preset.id}`}
            onClick={() => deletePreset(preset.id)}
            className="text-zinc-600 hover:text-rose-400 ml-3 opacity-0 group-hover:opacity-100 transition-all text-xs"
          >
            🗑
          </button>
        </div>
      ))}
    </div>
  );
}
