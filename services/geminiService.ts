import { GoogleGenAI, Modality } from "@google/genai";
import { TTSVoice } from "../types";

// Helper to get AI instance with fresh key
const getAIClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY environment variable is missing.");
  }
  return new GoogleGenAI({ apiKey });
};

// --- Audio Decoding Logic (from prompt) ---

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

// --- Gemini Operations ---

export const summarizeArticles = async (articles: string[]): Promise<string> => {
  const ai = getAIClient();
  
  const prompt = `
    You are a professional, friendly news anchor preparing a daily briefing.
    I will provide you with several text content pieces.
    
    Your task:
    1. Synthesize these articles into a single, cohesive spoken-word script.
    2. Use a conversational, engaging tone suitable for a morning commute listener.
    3. Smoothly transition between topics.
    4. Keep the total length around 300-500 words.
    5. Do not include markdown formatting, bullet points, or special characters that are hard to read aloud (like URLs). Write it exactly as it should be spoken.
    6. Start with a friendly greeting like "Good morning, here is your personalized briefing."

    Articles:
    ${articles.map((a, i) => `--- ARTICLE ${i + 1} ---\n${a}\n`).join("\n")}
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      temperature: 0.7,
    }
  });

  return response.text || "I'm sorry, I couldn't generate a summary at this time.";
};

export const generateSpeech = async (
  text: string, 
  voice: TTSVoice,
  audioContext: AudioContext
): Promise<AudioBuffer> => {
  const ai = getAIClient();

  // Using the specific TTS model requested
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: voice },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  
  if (!base64Audio) {
    throw new Error("No audio data returned from Gemini.");
  }

  // The model typically returns 24kHz audio
  const sampleRate = 24000; 
  const audioBytes = decode(base64Audio);
  const audioBuffer = await decodeAudioData(audioBytes, audioContext, sampleRate, 1);
  
  return audioBuffer;
};
