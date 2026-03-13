'use client';

import { useState, useRef, useEffect } from 'react';

type Provider = 'minimax' | 'elevenlabs';

interface MinimaxVoice {
  voice_id: string;
  name: string;
}

interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  preview_url?: string;
}

const MINIMAX_VOICES: MinimaxVoice[] = [
  { voice_id: 'female-shaonv', name: '活泼少女' },
  { voice_id: 'female-yujie', name: '温柔御姐' },
  { voice_id: 'female-chengshu', name: '成熟女性' },
  { voice_id: 'female-badao', name: '强势女总' },
  { voice_id: 'female-shaibo', name: '播音少女' },
  { voice_id: 'male-qn-qingse', name: '青涩青年' },
  { voice_id: 'male-qn-jingying', name: '精英青年' },
  { voice_id: 'male-qn-badao', name: '霸道总裁' },
  { voice_id: 'male-qn-zhiliao', name: '温柔正太' },
  { voice_id: 'male-qn-xiaoyuan', name: '阳光少年' },
];

const ELEVENLABS_DEFAULT_VOICES: ElevenLabsVoice[] = [
  { voice_id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel', preview_url: 'https://elevenlabs.io/a/21m00Tcm4TlvDq8ikWAM' },
  { voice_id: 'AZnzlk1XvdvUeBnqx9VO', name: 'Domi', preview_url: 'https://elevenlabs.io/a/AZnzlk1XvdvUeBnqx9VO' },
  { voice_id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah', preview_url: 'https://elevenlabs.io/a/EXAVITQu4vr4xnSDxMaL' },
  { voice_id: 'ErXwobaYiN019PkySvjV', name: 'Antoni', preview_url: 'https://elevenlabs.io/a/ErXwobaYiN019PkySvjV' },
  { voice_id: 'MF3mGyEYCl7XYWbV9V6O', name: 'Elli', preview_url: 'https://elevenlabs.io/a/MF3mGyEYCl7XYWbV9V6O' },
  { voice_id: 'TxGEqnHWrfWFTfGW9XjX', name: 'Josh', preview_url: 'https://elevenlabs.io/a/TxGEqnHWrfWFTfGW9XjX' },
  { voice_id: 'VR6AewLTigWGxfGxSNwa', name: 'Arnold', preview_url: 'https://elevenlabs.io/a/VR6AewLTigWGxfGxSNwa' },
  { voice_id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam', preview_url: 'https://elevenlabs.io/a/pNInz6obpgDQGcFmaJgB' },
  { voice_id: 'yoZ06aMxZJJ28mfd3POQ', name: 'Sam', preview_url: 'https://elevenlabs.io/a/yoZ06aMxZJJ28mfd3POQ' },
];

export default function Home() {
  const [provider, setProvider] = useState<Provider>('elevenlabs');
  const [text, setText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  const [minimaxApiKey, setMinimaxApiKey] = useState('');
  const [minimaxVoice, setMinimaxVoice] = useState('female-shaonv');
  const [minimaxCustomVoiceId, setMinimaxCustomVoiceId] = useState('');
  const [minimaxSpeed, setMinimaxSpeed] = useState(1.0);
  const [minimaxVol, setMinimaxVol] = useState(1.0);
  const [minimaxModel, setMinimaxModel] = useState('speech-01-turbo');
  
  const [elevenlabsApiKey, setElevenlabsApiKey] = useState('');
  const [elevenlabsVoice, setElevenlabsVoice] = useState('21m00Tcm4TlvDq8ikWAM');
  const [elevenlabsVoices, setElevenlabsVoices] = useState<ElevenLabsVoice[]>(ELEVENLABS_DEFAULT_VOICES);
  const [elevenlabsModel, setElevenlabsModel] = useState('eleven_multilingual_v2');
  const [elevenlabsStability, setElevenlabsStability] = useState(0.5);
  const [elevenlabsSimilarityBoost, setElevenlabsSimilarityBoost] = useState(0.75);
  const [elevenlabsStyle, setElevenlabsStyle] = useState(0);
  const [useSpeakerBoost, setUseSpeakerBoost] = useState(true);

  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (elevenlabsApiKey.length >= 32) {
      fetchVoices();
    }
  }, [elevenlabsApiKey]);

  const fetchVoices = async () => {
    try {
      const res = await fetch(`/api/voices/elevenlabs?apiKey=${elevenlabsApiKey}`);
      const data = await res.json();
      if (data.voices && Array.isArray(data.voices)) {
        setElevenlabsVoices(data.voices);
      }
    } catch (err) {
      console.error('Failed to fetch voices:', err);
    }
  };

  const handleGenerate = async () => {
    if (!text.trim()) {
      setError('Please enter text to synthesize');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setAudioUrl(null);

    try {
      let res;
      if (provider === 'minimax') {
        if (!minimaxApiKey) {
          setError('Please enter MiniMax API Key');
          setIsGenerating(false);
          return;
        }
        res = await fetch('/api/tts/minimax', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            apiKey: minimaxApiKey,
            text,
            model: minimaxModel,
            voiceId: minimaxCustomVoiceId || minimaxVoice,
            speed: minimaxSpeed,
            vol: minimaxVol,
          }),
        });
      } else {
        if (!elevenlabsApiKey) {
          setError('Please enter ElevenLabs API Key');
          setIsGenerating(false);
          return;
        }
        res = await fetch('/api/tts/elevenlabs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            apiKey: elevenlabsApiKey,
            text,
            voiceId: elevenlabsVoice,
            model: elevenlabsModel,
            stability: elevenlabsStability,
            similarityBoost: elevenlabsSimilarityBoost,
            style: elevenlabsStyle,
            useSpeakerBoost,
          }),
        });
      }

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Generation failed');
        return;
      }

      if (provider === 'minimax' && data.audio) {
        const audioBlob = new Blob(
          [new Uint8Array(data.audio.match(/.{1,2}/g)?.map((byte: string) => parseInt(byte, 16)) || [])],
          { type: 'audio/mp3' }
        );
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
      } else if (provider === 'elevenlabs' && data.audio) {
        const audioBlob = new Blob(
          [Uint8Array.from(atob(data.audio), c => c.charCodeAt(0))],
          { type: 'audio/mpeg' }
        );
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePlay = () => {
    if (audioRef.current) {
      audioRef.current.play();
    }
  };

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleDownload = () => {
    if (!audioUrl) return;
    const a = document.createElement('a');
    a.href = audioUrl;
    a.download = `tts-audio-${Date.now()}.mp3`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const playVoicePreview = (previewUrl: string) => {
    if (audioRef.current) {
      audioRef.current.src = previewUrl;
      audioRef.current.play();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">TTS Test Platform</h1>
          <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setProvider('minimax')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                provider === 'minimax'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              MiniMax
            </button>
            <button
              onClick={() => setProvider('elevenlabs')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                provider === 'elevenlabs'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              ElevenLabs
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Text Input</h2>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter text to synthesize..."
                className="w-full h-48 p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="mt-2 text-sm text-gray-500 text-right">
                {text.length} characters
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Audio Player</h2>
                {audioUrl && (
                  <div className="flex gap-2">
                    <button
                      onClick={handlePlay}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                      </svg>
                      Play
                    </button>
                    <button
                      onClick={handleStop}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                    >
                      Stop
                    </button>
                    <button
                      onClick={handleDownload}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download
                    </button>
                  </div>
                )}
              </div>
              
              {audioUrl && (
                <div className="space-y-3">
                  <audio 
                    ref={audioRef} 
                    src={audioUrl} 
                    onEnded={handleStop}
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                  />
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500 w-10">{formatTime(currentTime)}</span>
                    <div className="flex-1 relative">
                      <div 
                        className="h-2 bg-gray-200 rounded-full cursor-pointer overflow-hidden"
                        onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const percent = (e.clientX - rect.left) / rect.width;
                          const newTime = percent * duration;
                          if (audioRef.current) {
                            audioRef.current.currentTime = newTime;
                            setCurrentTime(newTime);
                          }
                        }}
                      >
                        <div 
                          className="h-full bg-blue-600 rounded-full relative"
                          style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                        />
                      </div>
                      <div 
                        className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-blue-600 rounded-full shadow-md pointer-events-none"
                        style={{ left: `${duration ? (currentTime / duration) * 100 : 0}%`, transform: 'translate(-50%, -50%)' }}
                      />
                    </div>
                    <span className="text-sm text-gray-500 w-10">{formatTime(duration)}</span>
                  </div>
                </div>
              )}

              {!audioUrl && !isGenerating && (
                <div className="h-24 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
                  <p className="text-gray-400">Generated audio will appear here</p>
                </div>
              )}

              {isGenerating && (
                <div className="h-24 flex items-center justify-center">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <span className="text-gray-600">Generating audio...</span>
                  </div>
                </div>
              )}

              {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}
            </div>

            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? 'Generating...' : 'Generate Speech'}
            </button>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">API Settings</h2>
              
              {provider === 'minimax' ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                    <input
                      type="password"
                      value={minimaxApiKey}
                      onChange={(e) => setMinimaxApiKey(e.target.value)}
                      placeholder="Enter MiniMax API Key"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                    <select
                      value={minimaxModel}
                      onChange={(e) => setMinimaxModel(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="speech-02-turbo">speech-02-turbo</option>
                      <option value="speech-02-hd">speech-02-hd</option>
                      <option value="speech-2.6-turbo">speech-2.6-turbo</option>
                      <option value="speech-2.6-hd">speech-2.6-hd</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                    <input
                      type="password"
                      value={elevenlabsApiKey}
                      onChange={(e) => setElevenlabsApiKey(e.target.value)}
                      placeholder="Enter ElevenLabs API Key"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                    <select
                      value={elevenlabsModel}
                      onChange={(e) => setElevenlabsModel(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="eleven_multilingual_v2">eleven_multilingual_v2</option>
                      <option value="eleven_monolingual_v1">eleven_monolingual_v1</option>
                      <option value="eleven_flash_v2_5">eleven_flash_v2_5</option>
                      <option value="eleven_flash_v2">eleven_flash_v2</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Voice Settings</h2>
              
              {provider === 'minimax' ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Voice</label>
                    <div className="grid grid-cols-2 gap-2">
                      {MINIMAX_VOICES.map((voice) => (
                        <button
                          key={voice.voice_id}
                          onClick={() => setMinimaxVoice(voice.voice_id)}
                          className={`px-3 py-2 text-sm rounded-lg border transition ${
                            minimaxVoice === voice.voice_id
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          {voice.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Custom Voice ID (Optional)</label>
                    <input
                      type="text"
                      value={minimaxCustomVoiceId}
                      onChange={(e) => setMinimaxCustomVoiceId(e.target.value)}
                      placeholder="Enter custom voice ID"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Speed: {minimaxSpeed}
                    </label>
                    <input
                      type="range"
                      min="0.5"
                      max="2.0"
                      step="0.1"
                      value={minimaxSpeed}
                      onChange={(e) => setMinimaxSpeed(parseFloat(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Volume: {minimaxVol}
                    </label>
                    <input
                      type="range"
                      min="0.1"
                      max="2.0"
                      step="0.1"
                      value={minimaxVol}
                      onChange={(e) => setMinimaxVol(parseFloat(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Voice</label>
                    <div className="max-h-48 overflow-y-auto space-y-2">
                      {elevenlabsVoices.map((voice) => (
                        <div
                          key={voice.voice_id}
                          onClick={() => setElevenlabsVoice(voice.voice_id)}
                          className={`flex items-center justify-between px-3 py-2 rounded-lg border cursor-pointer transition ${
                            elevenlabsVoice === voice.voice_id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          <span className="text-sm font-medium">{voice.name}</span>
                          {voice.preview_url && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                playVoicePreview(voice.preview_url!);
                              }}
                              className="p-1 hover:bg-gray-200 rounded"
                            >
                              <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                              </svg>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Stability: {elevenlabsStability}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={elevenlabsStability}
                      onChange={(e) => setElevenlabsStability(parseFloat(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Similarity Boost: {elevenlabsSimilarityBoost}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={elevenlabsSimilarityBoost}
                      onChange={(e) => setElevenlabsSimilarityBoost(parseFloat(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Style: {elevenlabsStyle}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={elevenlabsStyle}
                      onChange={(e) => setElevenlabsStyle(parseFloat(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="speakerBoost"
                      checked={useSpeakerBoost}
                      onChange={(e) => setUseSpeakerBoost(e.target.checked)}
                      className="rounded"
                    />
                    <label htmlFor="speakerBoost" className="text-sm text-gray-700">
                      Speaker Boost
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
