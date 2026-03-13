import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { apiKey, text, model, voiceId, speed, vol, language } = body;

    if (!apiKey || !text) {
      return NextResponse.json(
        { error: 'Missing required parameters: apiKey, text' },
        { status: 400 }
      );
    }

    const requestBody = {
      model: model || 'speech-02-turbo',
      text: text,
      voice_setting: {
        voice_id: voiceId || 'male-qn-qingse',
        speed: speed || 1.0,
        vol: vol || 1.0,
      },
      audio_setting: {
        sample_rate: 32000,
        bitrate: 128000,
        format: 'mp3',
      },
      language: language || 'auto',
    };

    const response = await fetch(
      `https://api.minimax.chat/v1/t2a_v2`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      }
    ).catch((err) => {
      console.error('Fetch error:', err);
      throw new Error(`Network error: Unable to connect to MiniMax API`);
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `MiniMax API error: ${response.status}`, details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();

    if (data.base_resp?.status_code !== 0) {
      return NextResponse.json(
        { error: data.base_resp?.status_msg || 'Unknown error' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      audio: data.data?.audio,
      audioFormat: data.extra_info?.audio_format,
      audioLength: data.extra_info?.audio_length,
      audioSampleRate: data.extra_info?.audio_sample_rate,
      wordCount: data.extra_info?.word_count,
      usageCharacters: data.extra_info?.usage_characters,
    });
  } catch (error) {
    console.error('MiniMax TTS error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
