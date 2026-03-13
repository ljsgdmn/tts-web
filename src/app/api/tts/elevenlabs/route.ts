import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { apiKey, text, voiceId, model, stability, similarityBoost, style, useSpeakerBoost } = body;

    if (!apiKey || !text || !voiceId) {
      return NextResponse.json(
        { error: 'Missing required parameters: apiKey, text, voiceId' },
        { status: 400 }
      );
    }

    const requestBody: Record<string, unknown> = {
      text: text,
    };

    if (model) {
      requestBody.model_id = model;
    }

    if (stability !== undefined || similarityBoost !== undefined) {
      requestBody.voice_settings = {};
      if (stability !== undefined) {
        (requestBody.voice_settings as Record<string, unknown>).stability = stability;
      }
      if (similarityBoost !== undefined) {
        (requestBody.voice_settings as Record<string, unknown>).similarity_boost = similarityBoost;
      }
      if (style !== undefined) {
        (requestBody.voice_settings as Record<string, unknown>).style = style;
      }
      if (useSpeakerBoost !== undefined) {
        (requestBody.voice_settings as Record<string, unknown>).use_speaker_boost = useSpeakerBoost;
      }
    }

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      }
    ).catch((err) => {
      console.error('Fetch error:', err);
      throw new Error(`Network error: Unable to connect to ElevenLabs API`);
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `ElevenLabs API error: ${response.status}`, details: errorText },
        { status: response.status }
      );
    }

    const audioBuffer = await response.arrayBuffer();
    const base64Audio = Buffer.from(audioBuffer).toString('base64');

    return NextResponse.json({
      audio: base64Audio,
      contentType: 'audio/mpeg',
    });
  } catch (error) {
    console.error('ElevenLabs TTS error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
