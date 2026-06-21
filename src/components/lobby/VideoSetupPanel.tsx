'use client';
// src/components/lobby/VideoSetupPanel.tsx

import { useState, useEffect } from 'react';
import { RoomPublic, Preset } from '@/types';
import { isValidVideoUrl, parseVideoUrl } from '@/lib/videoParser';
import { PresetLibrary } from './PresetLibrary';

interface Props {
  room: RoomPublic;
  isHost: boolean;
  actions: any;
  code: string;
}

export function VideoSetupPanel({ room, isHost, actions, code }: Props) {
  const [normalUrl, setNormalUrl] = useState('');
  const [imposterUrl, setImposterUrl] = useState('');
  const [showPresets, setShowPresets] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saving, setSaving] = useState(false);

  const normalValid = !normalUrl || isValidVideoUrl(normalUrl);
  const imposterValid = !imposterUrl || isValidVideoUrl(imposterUrl);

  // Debounce updates to server
  useEffect(() => {
    if (!isHost) return;
    const t = setTimeout(() => {
      if (normalUrl !== '' && isValidVideoUrl(normalUrl)) {
        actions.updateSettings(code, { normalVideoUrl: normalUrl });
      }
    }, 800);
    return () => clearTimeout(t);
  }, [normalUrl, isHost, code, actions]);

  useEffect(() => {
    if (!isHost) return;
    const t = setTimeout(() => {
      if (imposterUrl !== '' && isValidVideoUrl(imposterUrl)) {
        actions.updateSettings(code, { imposterVideoUrl: imposterUrl });
      }
    }, 800);
    return () => clearTimeout(t);
  }, [imposterUrl, isHost, code, actions]);

  function handlePresetLoad(preset: Preset) {
    setNormalUrl(preset.normalVideoUrl);
    setImposterUrl(preset.imposterVideoUrl);
    setShowPresets(false);
  }

  async function handleSavePreset() {
    if (!saveName.trim() || !normalUrl || !imposterUrl) return;
    setSaving(true);
    await fetch('/api/presets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: saveName, normalVideoUrl: normalUrl, imposterVideoUrl: imposterUrl }),
    });
    setSaving(false);
    setSaveName('');
  }

  const hasRandomVideoCategory = room.settings.videoCategory && room.settings.videoCategory !== 'custom';

  if (hasRandomVideoCategory) {
    return (
      <div className="glass rounded-2xl p-6">
        <h3 className="font-bold text-white mb-4">📺 Video Setup</h3>
        <div className="bg-bg-800 rounded-xl p-4 text-center">
           <p className="text-zinc-400">
             Videos will be chosen randomly from the <span className="font-bold capitalize text-white">{room.settings.videoCategory}</span> category when the game starts!
           </p>
        </div>
      </div>
    );
  }

  if (!isHost) {
    return (
      <div className="glass rounded-2xl p-6">
        <h3 className="font-bold text-white mb-4">📺 Video Setup</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-bg-800 rounded-xl p-4 text-center">
            <p className="text-xs text-zinc-500 mb-1">Normal Video</p>
            <span className={`text-2xl ${room.settings.hasNormalVideo ? 'text-emerald-400' : 'text-zinc-600'}`}>
              {room.settings.hasNormalVideo ? '✓' : '–'}
            </span>
          </div>
          <div className="bg-bg-800 rounded-xl p-4 text-center">
            <p className="text-xs text-zinc-500 mb-1">Imposter Video</p>
            <span className={`text-2xl ${room.settings.hasImposterVideo ? 'text-emerald-400' : 'text-zinc-600'}`}>
              {room.settings.hasImposterVideo ? '✓' : '–'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-white">📺 Video Setup</h3>
        <button
          id="toggle-presets-btn"
          onClick={() => setShowPresets(!showPresets)}
          className="btn-ghost btn-sm text-sm"
        >
          📚 Presets
        </button>
      </div>

      {showPresets && <PresetLibrary onSelect={handlePresetLoad} />}

      <div className="space-y-4">
        {/* Normal Video */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2" htmlFor="panel-normal-url">
            🎬 Normal Video
            <span className="text-zinc-500 font-normal ml-2">— Crewmates watch this</span>
          </label>
          <input
            id="panel-normal-url"
            type="url"
            value={normalUrl}
            onChange={(e) => setNormalUrl(e.target.value)}
            className={`input-field ${normalUrl && !normalValid ? 'border-rose-500' : normalUrl && normalValid ? 'border-emerald-500' : ''}`}
            placeholder="https://youtube.com/watch?v=..."
          />
          {normalUrl && normalValid && (
            <p className="text-emerald-400 text-xs mt-1">
              ✓ {parseVideoUrl(normalUrl).type.toUpperCase()} detected
            </p>
          )}
          {normalUrl && !normalValid && (
            <p className="text-rose-400 text-xs mt-1">⚠ Unrecognized URL format</p>
          )}
        </div>

        {/* Imposter Video */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2" htmlFor="panel-imposter-url">
            👁️ Imposter Video
            <span className="text-zinc-500 font-normal ml-2">— Only the imposter sees this</span>
          </label>
          <input
            id="panel-imposter-url"
            type="url"
            value={imposterUrl}
            onChange={(e) => setImposterUrl(e.target.value)}
            className={`input-field ${imposterUrl && !imposterValid ? 'border-rose-500' : imposterUrl && imposterValid ? 'border-emerald-500' : ''}`}
            placeholder="https://youtube.com/watch?v=..."
          />
          {imposterUrl && imposterValid && (
            <p className="text-emerald-400 text-xs mt-1">
              ✓ {parseVideoUrl(imposterUrl).type.toUpperCase()} detected
            </p>
          )}
        </div>

        {/* Save as Preset */}
        {normalUrl && imposterUrl && normalValid && imposterValid && (
          <div className="flex gap-2 mt-2">
            <input
              id="preset-name-input"
              type="text"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              className="input-field flex-1 text-sm py-2"
              placeholder="Preset name (optional save)"
            />
            <button
              id="save-preset-btn"
              onClick={handleSavePreset}
              disabled={saving || !saveName.trim()}
              className="btn-ghost btn-sm"
            >
              {saving ? '...' : '💾 Save'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
