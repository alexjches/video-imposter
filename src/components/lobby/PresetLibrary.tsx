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
      <div className="osd-menu" style={{ textAlign: 'center' }}>
        LOADING SHELF…
      </div>
    );
  }

  if (presets.length === 0) {
    return (
      <div className="osd-menu" style={{ textAlign: 'center', fontSize: '0.85rem' }}>
        SHELF EMPTY — SAVE A PAIR BELOW
      </div>
    );
  }

  return (
    <div className="osd-menu" style={{ maxHeight: 180, overflowY: 'auto' }}>
      <div className="osd-menu-title">--- Saved Tape Pairs ---</div>
      {presets.map((preset) => (
        <div key={preset.id} className="osd-menu-row" style={{ gap: 8 }}>
          <button
            id={`load-preset-${preset.id}`}
            onClick={() => onSelect(preset)}
            className="osd-menu-btn"
            style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis' }}
          >
            {preset.name}
          </button>
          <button
            id={`delete-preset-${preset.id}`}
            onClick={() => deletePreset(preset.id)}
            className="osd-menu-btn"
            title="Delete preset"
          >
            🗑
          </button>
        </div>
      ))}
    </div>
  );
}
