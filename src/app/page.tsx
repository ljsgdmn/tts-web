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
  { voice_id: 'female-shaonv', name: '少女' },
  { voice_id: 'female-yujie', name: '御姐' },
  { voice_id: 'female-chengshu', name: '成熟女性' },
  { voice_id: 'female-tianmei', name: '甜美女性' },
  { voice_id: 'male-qn-qingse', name: '青涩青年' },
  { voice_id: 'male-qn-jingying', name: '精英青年' },
  { voice_id: 'male-qn-badao', name: '霸道青年' },
  { voice_id: 'male-qn-daxuesheng', name: '青年大学生' },
  { voice_id: 'clever_boy', name: '聪明男童' },
  { voice_id: 'cute_boy', name: '可爱男童' },
  { voice_id: 'lovely_girl', name: '萌萌女童' },
  { voice_id: 'Chinese (Mandarin)_Male_Announcer', name: '播报男声' },
  { voice_id: 'Chinese (Mandarin)_News_Anchor', name: '新闻女声' },
  { voice_id: 'Chinese (Mandarin)_Gentleman', name: '温润男声' },
  { voice_id: 'Chinese (Mandarin)_Sweet_Lady', name: '甜美女声' },
];

const ELEVENLABS_DEFAULT_VOICES: ElevenLabsVoice[] = [
  { voice_id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel' },
  { voice_id: 'AZnzlk1XvdvUeBnqx9VO', name: 'Domi' },
  { voice_id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah' },
  { voice_id: 'ErXwobaYiN019PkySvjV', name: 'Antoni' },
  { voice_id: 'MF3mGyEYCl7XYWbV9V6O', name: 'Elli' },
  { voice_id: 'TxGEqnHWrfWFTfGW9XjX', name: 'Josh' },
  { voice_id: 'VR6AewLTigWGxfGxSNwa', name: 'Arnold' },
  { voice_id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam' },
  { voice_id: 'yoZ06aMxZJJ28mfd3POQ', name: 'Sam' },
];

export default function Home() {
  const [provider, setProvider] = useState<Provider>('minimax');
  const [text, setText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const [minimaxApiKey, setMinimaxApiKey] = useState('');
  const [minimaxVoice, setMinimaxVoice] = useState('female-shaonv');
  const [minimaxCustomVoiceId, setMinimaxCustomVoiceId] = useState('');
  const [minimaxSpeed, setMinimaxSpeed] = useState(1.0);
  const [minimaxVol, setMinimaxVol] = useState(1.0);
  const [minimaxModel, setMinimaxModel] = useState('speech-2.8-turbo');
  const [minimaxAudioUrl, setMinimaxAudioUrl] = useState<string | null>(null);
  
  const [elevenlabsApiKey, setElevenlabsApiKey] = useState('');
  const [elevenlabsVoice, setElevenlabsVoice] = useState('21m00Tcm4TlvDq8ikWAM');
  const [elevenlabsVoices, setElevenlabsVoices] = useState<ElevenLabsVoice[]>(ELEVENLABS_DEFAULT_VOICES);
  const [elevenlabsModel, setElevenlabsModel] = useState('eleven_multilingual_v2');
  const [elevenlabsStability, setElevenlabsStability] = useState(0.5);
  const [elevenlabsSimilarityBoost, setElevenlabsSimilarityBoost] = useState(0.75);
  const [elevenlabsStyle, setElevenlabsStyle] = useState(0);
  const [useSpeakerBoost, setUseSpeakerBoost] = useState(true);
  const [elevenlabsAudioUrl, setElevenlabsAudioUrl] = useState<string | null>(null);
  const [previewingVoiceId, setPreviewingVoiceId] = useState<string | null>(null);
  const [previewingMinimaxVoice, setPreviewingMinimaxVoice] = useState<string | null>(null);
  const [loadingMinimaxPreview, setLoadingMinimaxPreview] = useState<string | null>(null);
  const [voiceSearchQuery, setVoiceSearchQuery] = useState('');

  const audioRef = useRef<HTMLAudioElement>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const savedMinimaxKey = localStorage.getItem('minimaxApiKey');
    const savedElevenlabsKey = localStorage.getItem('elevenlabsApiKey');
    const savedProvider = localStorage.getItem('provider') as Provider | null;
    
    if (savedMinimaxKey) setMinimaxApiKey(savedMinimaxKey);
    if (savedElevenlabsKey) setElevenlabsApiKey(savedElevenlabsKey);
    if (savedProvider && (savedProvider === 'minimax' || savedProvider === 'elevenlabs')) {
      setProvider(savedProvider);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('minimaxApiKey', minimaxApiKey);
  }, [minimaxApiKey]);

  useEffect(() => {
    localStorage.setItem('elevenlabsApiKey', elevenlabsApiKey);
  }, [elevenlabsApiKey]);

  useEffect(() => {
    localStorage.setItem('provider', provider);
    
    if (audioRef.current) {
      audioRef.current.pause();
    }
    
    const savedAudioUrl = provider === 'minimax' ? minimaxAudioUrl : elevenlabsAudioUrl;
    setAudioUrl(savedAudioUrl);
    setCurrentTime(0);
    setIsPlaying(false);
    setError(null);
  }, [provider]);

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
      setError('请输入要合成的文本');
      return;
    }

    setIsGenerating(true);
    setError(null);

    if (provider === 'minimax') {
      setMinimaxAudioUrl(null);
    } else {
      setElevenlabsAudioUrl(null);
    }
    setAudioUrl(null);

    try {
      let res;
      if (provider === 'minimax') {
        if (!minimaxApiKey) {
          setError('请输入 MiniMax API Key');
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
          setError('请输入 ElevenLabs API Key');
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
        let errorMessage = data.error || '生成失败';
        if (res.status === 401 || errorMessage.includes('401') || errorMessage.includes('unauthorized') || errorMessage.includes('login fail')) {
          errorMessage = 'API Key 无效，请检查后重试';
        } else if (res.status === 429) {
          errorMessage = '请求过于频繁，请稍后重试';
        } else if (res.status === 422) {
          errorMessage = '请求参数错误，请检查输入';
        }
        setError(errorMessage);
        return;
      }

      if (provider === 'minimax' && data.audio) {
        const audioBlob = new Blob(
          [new Uint8Array(data.audio.match(/.{1,2}/g)?.map((byte: string) => parseInt(byte, 16)) || [])],
          { type: 'audio/mp3' }
        );
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        setMinimaxAudioUrl(url);
      } else if (provider === 'elevenlabs' && data.audio) {
        const audioBlob = new Blob(
          [Uint8Array.from(atob(data.audio), c => c.charCodeAt(0))],
          { type: 'audio/mpeg' }
        );
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        setElevenlabsAudioUrl(url);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
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

  const playVoicePreview = async (voiceId: string, previewUrl?: string) => {
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
    }

    if (previewingVoiceId === voiceId) {
      setPreviewingVoiceId(null);
      return;
    }

    if (!previewUrl) {
      return;
    }

    try {
      setPreviewingVoiceId(voiceId);
      previewAudioRef.current = new Audio(previewUrl);
      previewAudioRef.current.onended = () => {
        setPreviewingVoiceId(null);
      };
      previewAudioRef.current.onerror = () => {
        setPreviewingVoiceId(null);
      };
      await previewAudioRef.current.play();
    } catch (err) {
      console.error('Failed to play preview:', err);
      setPreviewingVoiceId(null);
    }
  };

  const playMinimaxVoicePreview = async (voiceId: string) => {
    if (!minimaxApiKey) {
      return;
    }

    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
    }

    if (previewingMinimaxVoice === voiceId || loadingMinimaxPreview === voiceId) {
      setPreviewingMinimaxVoice(null);
      setLoadingMinimaxPreview(null);
      return;
    }

    try {
      setLoadingMinimaxPreview(voiceId);
      setPreviewingMinimaxVoice(null);
      const res = await fetch('/api/tts/minimax', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: minimaxApiKey,
          text: '你好，我是音色试听。',
          model: 'speech-02-turbo',
          voiceId: voiceId,
          speed: 1.2,
          vol: 1,
        }),
      });

      const data = await res.json();
      setLoadingMinimaxPreview(null);

      if (data.audio) {
        const audioBlob = new Blob(
          [new Uint8Array(data.audio.match(/.{1,2}/g)?.map((byte: string) => parseInt(byte, 16)) || [])],
          { type: 'audio/mp3' }
        );
        const url = URL.createObjectURL(audioBlob);
        previewAudioRef.current = new Audio(url);
        previewAudioRef.current.onended = () => {
          setPreviewingMinimaxVoice(null);
        };
        previewAudioRef.current.onerror = () => {
          setPreviewingMinimaxVoice(null);
        };
        setPreviewingMinimaxVoice(voiceId);
        await previewAudioRef.current.play();
      }
    } catch (err) {
      console.error('Failed to play MiniMax preview:', err);
      setLoadingMinimaxPreview(null);
      setPreviewingMinimaxVoice(null);
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

      <main className="max-w-7xl mx-auto p-4 md:p-6 overflow-x-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          <div className="lg:col-span-2 space-y-4 lg:space-y-6 order-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
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

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Audio Player</h2>
                {audioUrl && (
                  <div className="flex gap-2">
                    <button
                      onClick={handlePlay}
                      className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${
                        isPlaying 
                          ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {isPlaying ? (
                        <>
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          Stop
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                          </svg>
                          Play
                        </>
                      )}
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
                    onEnded={() => {
                      handleStop();
                      setCurrentTime(0);
                    }}
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    onPause={() => setIsPlaying(false)}
                    onPlay={() => setIsPlaying(true)}
                  />
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500 w-10">{formatTime(currentTime)}</span>
                    <div 
                      className="flex-1 h-2 bg-gray-200 rounded-full cursor-pointer relative select-none"
                      onMouseDown={(e) => {
                        setIsDragging(true);
                        const rect = e.currentTarget.getBoundingClientRect();
                        const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                        const newTime = percent * duration;
                        setCurrentTime(newTime);
                        if (audioRef.current) {
                          audioRef.current.currentTime = newTime;
                        }
                      }}
                      onMouseMove={(e) => {
                        if (!isDragging) return;
                        const rect = e.currentTarget.getBoundingClientRect();
                        const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                        const newTime = percent * duration;
                        setCurrentTime(newTime);
                        if (audioRef.current) {
                          audioRef.current.currentTime = newTime;
                        }
                      }}
                      onMouseUp={() => setIsDragging(false)}
                      onMouseLeave={() => setIsDragging(false)}
                    >
                      <div 
                        className="absolute left-0 top-0 h-full bg-blue-600 rounded-full"
                        style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                      />
                      <div 
                        className="absolute top-1/2 w-4 h-4 bg-blue-600 rounded-full shadow-md border-2 border-white"
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

          <div className="space-y-4 lg:space-y-6 order-2 lg:order-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
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
                      <option value="speech-2.8-hd">speech-2.8-hd (最新HD)</option>
                      <option value="speech-2.8-turbo">speech-2.8-turbo (最新Turbo)</option>
                      <option value="speech-2.6-hd">speech-2.6-hd</option>
                      <option value="speech-2.6-turbo">speech-2.6-turbo</option>
                      <option value="speech-02-hd">speech-02-hd</option>
                      <option value="speech-02-turbo">speech-02-turbo</option>
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
                      <option value="eleven_v3">eleven_v3 (最新Alpha)</option>
                      <option value="eleven_multilingual_v2">eleven_multilingual_v2</option>
                      <option value="eleven_turbo_v2_5">eleven_turbo_v2_5</option>
                      <option value="eleven_flash_v2_5">eleven_flash_v2_5 (低延迟)</option>
                      <option value="eleven_flash_v2">eleven_flash_v2 (低延迟)</option>
                      <option value="eleven_turbo_v2">eleven_turbo_v2</option>
                      <option value="eleven_multilingual_v1">eleven_multilingual_v1</option>
                      <option value="eleven_monolingual_v1">eleven_monolingual_v1</option>
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
                        <div
                          key={voice.voice_id}
                          className={`flex items-center justify-between px-3 py-2 text-sm rounded-lg border transition ${
                            minimaxVoice === voice.voice_id
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          <span 
                            className="cursor-pointer flex-1"
                            onClick={() => setMinimaxVoice(voice.voice_id)}
                          >
                            {voice.name}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              playMinimaxVoicePreview(voice.voice_id);
                            }}
                            disabled={!minimaxApiKey}
                            className={`p-1 rounded ${
                              previewingMinimaxVoice === voice.voice_id
                                ? 'bg-blue-200'
                                : 'hover:bg-gray-200'
                            } ${!minimaxApiKey ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            {loadingMinimaxPreview === voice.voice_id ? (
                              <svg className="w-4 h-4 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            ) : previewingMinimaxVoice === voice.voice_id ? (
                              <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                              </svg>
                            )}
                          </button>
                        </div>
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
                    <p className="text-xs text-gray-500 mt-1">可在 MiniMax 开放平台获取更多音色ID</p>
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
                    <input
                      type="text"
                      placeholder="搜索声音..."
                      value={voiceSearchQuery}
                      onChange={(e) => setVoiceSearchQuery(e.target.value)}
                      className="w-full px-3 py-2 mb-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                    <div className="max-h-48 overflow-y-auto space-y-2">
                      {elevenlabsVoices
                        .filter((voice) => {
                          if (!voiceSearchQuery.trim()) return true;
                          const query = voiceSearchQuery.toLowerCase();
                          return (
                            (voice.name && voice.name.toLowerCase().includes(query)) ||
                            voice.voice_id.toLowerCase().includes(query)
                          );
                        })
                        .filter((voice) => voice.name && voice.name.trim() !== '')
                        .map((voice) => (
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
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              playVoicePreview(voice.voice_id, voice.preview_url);
                            }}
                            className={`p-1 rounded ${
                              previewingVoiceId === voice.voice_id
                                ? 'bg-blue-100'
                                : 'hover:bg-gray-200'
                            } ${!voice.preview_url ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            {previewingVoiceId === voice.voice_id ? (
                              <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                              </svg>
                            )}
                          </button>
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
