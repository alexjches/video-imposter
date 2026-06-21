'use client';
// src/components/dashboard/CreateRoomModal.tsx

import { useState } from 'react';
import { isValidVideoUrl } from '@/lib/videoParser';
import { PresetLibrary } from '@/components/lobby/PresetLibrary';
import { Preset } from '@/types';
import { VIDEO_CATEGORIES } from '@/lib/videoCategories';

interface Props {
  onClose: () => void;
  onCreate: (opts: {
    isPublic: boolean;
    normalVideoUrl: string;
    imposterVideoUrl: string;
    chatType: 'text' | 'voice' | 'video';
    videoCategory: string | null;
  }) => Promise<void>;
  userId: string | null;
}

export function CreateRoomModal({ onClose, onCreate, userId }: Props) {
  const [isPublic, setIsPublic] = useState(true);
  const [normalVideoUrl, setNormalVideoUrl] = useState('');
  const [imposterVideoUrl, setImposterVideoUrl] = useState('');
  const [videoCategory, setVideoCategory] = useState<string>('memes');
  const [chatType, setChatType] = useState<'text' | 'voice' | 'video'>('text');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPresets, setShowPresets] = useState(false);

  const normalValid = !normalVideoUrl || isValidVideoUrl(normalVideoUrl);
  const imposterValid = !imposterVideoUrl || isValidVideoUrl(imposterVideoUrl);

  async function handleCreate() {
    setLoading(true);
    setError('');
    try {
      const selectedCategory = videoCategory === 'custom' ? null : videoCategory;
      await onCreate({ isPublic, normalVideoUrl, imposterVideoUrl, chatType, videoCategory: selectedCategory });
    } catch (err: any) {
      setError(err.message || 'Failed to create room');
      setLoading(false);
    }
  }

  function handlePresetLoad(preset: Preset) {
    setNormalVideoUrl(preset.normalVideoUrl);
    setImposterVideoUrl(preset.imposterVideoUrl);
    setShowPresets(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="glass rounded-2xl p-8 w-full max-w-lg animate-scale-in max-h-[90dvh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Create Room</h2>
          <button id="create-modal-close" onClick={onClose} className="text-zinc-500 hover:text-white text-2xl">✕</button>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 mb-4 text-rose-300 text-sm">
            {error}
          </div>
        )}

        {/* Privacy Toggle */}
        <div className="flex gap-3 mb-6">
          <button
            id="room-public-btn"
            onClick={() => setIsPublic(true)}
            className={`flex-1 btn text-sm ${isPublic ? 'btn-primary' : 'btn-ghost'}`}
          >
            🌐 Public
          </button>
          <button
            id="room-private-btn"
            onClick={() => setIsPublic(false)}
            className={`flex-1 btn text-sm ${!isPublic ? 'btn-primary' : 'btn-ghost'}`}
          >
            🔒 Private
          </button>
        </div>

        {/* Chat Type Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            💬 Chat Type
            <span className="text-zinc-500 font-normal ml-2">(during discussion)</span>
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => setChatType('text')}
              className={`flex-1 flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                chatType === 'text' 
                  ? 'border-violet-500 bg-violet-500/10 shadow-[0_0_15px_rgba(139,92,246,0.2)]' 
                  : 'border-bg-700 bg-bg-800/50 hover:bg-bg-700 hover:border-bg-600'
              }`}
            >
              <span className="text-2xl mb-1">⌨️</span>
              <span className="text-xs font-bold text-zinc-200">Text</span>
            </button>
            <button
              onClick={() => setChatType('voice')}
              className={`flex-1 flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                chatType === 'voice' 
                  ? 'border-emerald-500 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.2)]' 
                  : 'border-bg-700 bg-bg-800/50 hover:bg-bg-700 hover:border-bg-600'
              }`}
            >
              <span className="text-2xl mb-1">🎤</span>
              <span className="text-xs font-bold text-zinc-200">Voice</span>
            </button>
            <button
              onClick={() => setChatType('video')}
              className={`flex-1 flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                chatType === 'video' 
                  ? 'border-sky-500 bg-sky-500/10 shadow-[0_0_15px_rgba(14,165,233,0.2)]' 
                  : 'border-bg-700 bg-bg-800/50 hover:bg-bg-700 hover:border-bg-600'
              }`}
            >
              <span className="text-2xl mb-1">📷</span>
              <span className="text-xs font-bold text-zinc-200">Video</span>
            </button>
          </div>
        </div>

        {/* Video Category Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            🎬 Video Style
            <span className="text-zinc-500 font-normal ml-2">(videos are picked randomly each round)</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {Object.values(VIDEO_CATEGORIES).map((cat) => (
              <button
                key={cat.id}
                onClick={() => setVideoCategory(cat.id)}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                  videoCategory === cat.id 
                    ? 'border-violet-500 bg-violet-500/10 shadow-[0_0_15px_rgba(139,92,246,0.2)]' 
                    : 'border-bg-700 bg-bg-800/50 hover:bg-bg-700 hover:border-bg-600'
                }`}
              >
                <span className="text-2xl mb-1">{cat.icon}</span>
                <span className="text-xs font-bold text-zinc-200">{cat.name}</span>
              </button>
            ))}
            <button
              onClick={() => setVideoCategory('custom')}
              className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                videoCategory === 'custom' 
                  ? 'border-amber-500 bg-amber-500/10 shadow-[0_0_15px_rgba(245,158,11,0.2)]' 
                  : 'border-bg-700 bg-bg-800/50 hover:bg-bg-700 hover:border-bg-600'
              }`}
            >
              <span className="text-2xl mb-1">⚙️</span>
              <span className="text-xs font-bold text-zinc-200">Custom URLs</span>
            </button>
          </div>
        </div>

        {/* Video URLs (only visible if Custom is selected) */}
        {videoCategory === 'custom' && (
          <div className="space-y-4 mb-6 animate-scale-in">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2" htmlFor="normal-video-url">
                🎬 Normal Video URL
                <span className="text-zinc-500 font-normal ml-2">(what crewmates watch)</span>
              </label>
              <input
                id="normal-video-url"
                type="url"
                value={normalVideoUrl}
                onChange={(e) => setNormalVideoUrl(e.target.value)}
                className={`input-field ${normalVideoUrl && !normalValid ? 'border-rose-500' : ''}`}
                placeholder="https://youtube.com/watch?v=..."
              />
              {normalVideoUrl && !normalValid && (
                <p className="text-rose-400 text-xs mt-1">Unrecognized URL. Try YouTube, Vimeo, or a direct .mp4 link.</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2" htmlFor="imposter-video-url">
                👁️ Imposter Video URL
                <span className="text-zinc-500 font-normal ml-2">(what the imposter secretly watches)</span>
              </label>
              <input
                id="imposter-video-url"
                type="url"
                value={imposterVideoUrl}
                onChange={(e) => setImposterVideoUrl(e.target.value)}
                className={`input-field ${imposterVideoUrl && !imposterValid ? 'border-rose-500' : ''}`}
                placeholder="https://youtube.com/watch?v=..."
              />
              {imposterVideoUrl && !imposterValid && (
                <p className="text-rose-400 text-xs mt-1">Unrecognized URL. Try YouTube, Vimeo, or a direct .mp4 link.</p>
              )}
            </div>
            
            {/* Preset Library */}
            {userId && (
              <div className="mt-4">
                <button
                  id="load-preset-btn"
                  onClick={() => setShowPresets(!showPresets)}
                  className="btn-ghost btn-sm text-sm w-full"
                >
                  📚 {showPresets ? 'Hide' : 'Load from'} Preset Library
                </button>
                {showPresets && (
                  <PresetLibrary onSelect={handlePresetLoad} />
                )}
              </div>
            )}
          </div>
        )}

        {/* No Preset Library needed outside of Custom mode, handled inside Custom block */}

        <div className="flex gap-3 mt-8">
          <button id="create-room-cancel-btn" onClick={onClose} className="btn-ghost flex-1">
            Cancel
          </button>
          <button
            id="create-room-confirm-btn"
            onClick={handleCreate}
            className="btn-primary flex-1"
            disabled={loading || (videoCategory === 'custom' && (!!(normalVideoUrl && !normalValid) || !!(imposterVideoUrl && !imposterValid) || !normalVideoUrl || !imposterVideoUrl))}
          >
            {loading ? 'Creating...' : 'Create Room →'}
          </button>
        </div>
      </div>
    </div>
  );
}
