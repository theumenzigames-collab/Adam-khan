import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateTimeTravelHug(currentImageBase64: string, youngerImageBase64: string) {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: currentImageBase64.split(',')[1],
              mimeType: "image/jpeg",
            },
          },
          {
            inlineData: {
              data: youngerImageBase64.split(',')[1],
              mimeType: "image/jpeg",
            },
          },
          {
            text: "These are two photos of the same person at different ages: the first is their current self, and the second is their younger self. Create a single, hyper-realistic, high-fidelity image where the current (older) version of the person is warmly hugging or holding the younger version of themselves in their arms. CRITICAL REQUIREMENT: The facial features of both versions MUST be 100% accurate and identical to the provided photos. Do not stylize or generalize the faces. They must look exactly like the real people in the source images. The composition should be a tender, protective embrace. The background should be soft and cinematic but the subjects must be sharp and realistic. This is a sentimental 'Time Travel Hug'.",
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
          imageSize: "1K"
        }
      }
    });

    let generatedImageUrl = "";
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        generatedImageUrl = `data:image/png;base64,${part.inlineData.data}`;
        break;
      }
    }

    return generatedImageUrl;
  } catch (error) {
    console.error("Error generating hug image:", error);
    throw error;
  }
}

export async function generateHeartfeltMessage(currentImageBase64: string, youngerImageBase64: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          {
            inlineData: {
              data: currentImageBase64.split(',')[1],
              mimeType: "image/jpeg",
            },
          },
          {
            inlineData: {
              data: youngerImageBase64.split(',')[1],
              mimeType: "image/jpeg",
            },
          },
          {
            text: "Based on these two photos of a person's current self and their younger self, write a short, deeply emotional, and inspiring letter from the older self to the younger self. It should be about 100-150 words, full of wisdom, love, and reassurance. Acknowledge the journey they've been through.",
          },
        ],
      },
    });

    return response.text;
  } catch (error) {
    console.error("Error generating message:", error);
    return "A journey of a thousand miles begins with a single step. You are stronger than you know, and the future is brighter than you can imagine.";
  }
}
