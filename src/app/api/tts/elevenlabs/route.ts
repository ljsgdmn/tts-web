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

    const requestBody: {
      text: string;
      model_id: string;
      voice_settings: {
        stability: number;
        similarity_boost: number;
        style?: number;
        use_speaker_boost?: boolean;
      };
    } = {
      text: text,
      model_id: model || 'eleven_multilingual_v2',
      voice_settings: {
        stability: stability ?? 0.5,
        similarity_boost: similarityBoost ?? 0.75,
      },
    };

    if (style !== undefined) {
      requestBody.voice_settings.style = style;
    }

    if (useSpeakerBoost !== undefined) {
      requestBody.voice_settings.use_speaker_boost = useSpeakerBoost;
    }

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/convert`,
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
      throw new Error(`Network error: Unable to connect to ElevenLabs API. This may be a network/firewall issue in local development. Try deploying to Vercel.`);
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
