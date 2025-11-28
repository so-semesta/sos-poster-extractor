import { GoogleGenAI, Type, Schema } from "@google/genai";
import { PosterMetadata } from "../types";

// Initialize Gemini
// Note: In Vercel, process.env.API_KEY will be populated from the Environment Variables settings.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_NAME = 'gemini-2.5-flash';

// Define the schema for structured output
const metadataSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    competitionName: { type: Type.STRING, description: "Nama lengkap kompetisi." },
    field: { type: Type.STRING, description: "Bidang atau kategori lomba (misal: Desain, Pemrograman, Fotografi)." },
    deadline: { type: Type.STRING, description: "Tanggal batas akhir pendaftaran. Jika ada beberapa gelombang, ambil tanggal yang PALING TERAKHIR." },
    deadlineISO: { type: Type.STRING, description: "Tanggal deadline dalam format YYYYMMDD (contoh: 20241231). Kosongkan jika tidak ada." },
    executionDate: { type: Type.STRING, description: "Tanggal pelaksanaan babak penyisihan atau seleksi yang PALING AWAL. Output harus berupa 1 tanggal spesifik saja." },
    executionDateISO: { type: Type.STRING, description: "Tanggal pelaksanaan dalam format YYYYMMDD (contoh: 20241231). Kosongkan jika tidak ada." },
    cost: { type: Type.STRING, description: "Biaya pendaftaran TERTINGGI khusus untuk kategori siswa SMP/SMA. Output harus berupa 1 nominal biaya saja." },
    type: { type: Type.STRING, description: "Jenis kepesertaan: 'Individu', 'Kelompok', atau 'Individu/Kelompok'." },
    status: { type: Type.STRING, description: "Status pelaksanaan: 'Daring' (Online) atau 'Luring' (Offline/Onsite)." },
    location: { type: Type.STRING, description: "Nama Kota jika Luring, atau 'Daring' jika online." },
    broadcastMessage: { type: Type.STRING, description: "Buatkan pesan broadcast WhatsApp yang SANGAT MENARIK, rapi, dan persuasif untuk disebar di grup chat. WAJIB GUNAKAN BANYAK EMOJI yang relevan di judul dan poin-poin. Struktur: 1. Headline Bombastis/Hype 🔥 2. Detail singkat (Nama Lomba, Kategori, Deadline, Biaya) dengan bullet points 3. Benefit singkat 4. Call to Action (Link Pendaftaran) yang jelas. Buat agar orang antusias mendaftar." },
    link: { type: Type.STRING, description: "Link pendaftaran, link guidebook, atau link website/sosmed yang tertera." },
  },
  required: [
    "competitionName", "field", "deadline", "executionDate", "cost", 
    "type", "status", "location", "broadcastMessage", "link"
  ],
};

/**
 * Converts a File object to a Base64 string.
 */
const fileToGenerativePart = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Extracts all metadata from the poster image.
 */
export const extractPosterMetadata = async (file: File): Promise<PosterMetadata> => {
  const base64Data = await fileToGenerativePart(file);

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: file.type,
            },
          },
          {
            text: "Analisis poster ini dan ekstrak informasi berikut ke dalam format JSON. Jika informasi tidak ditemukan secara eksplisit, simpulkan dengan masuk akal atau tulis 'Tidak tertera'.",
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: metadataSchema,
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text) as PosterMetadata;
  } catch (error) {
    console.error("Error extracting metadata:", error);
    throw error;
  }
};

/**
 * Re-analyzes a specific field from the poster image.
 */
export const reanalyzeField = async (file: File, fieldLabel: string, currentVal: string): Promise<string> => {
  const base64Data = await fileToGenerativePart(file);

  // Add specific instructions based on the field label logic
  let specificInstruction = "";
  const labelLower = fieldLabel.toLowerCase();
  
  if (labelLower.includes("biaya")) {
    specificInstruction = "Ambil biaya tertinggi khusus untuk siswa SMP/SMA. Output 1 nominal saja.";
  } else if (labelLower.includes("pelaksanaan")) {
    specificInstruction = "Ambil tanggal pelaksanaan babak penyisihan/seleksi paling awal. Output 1 tanggal saja.";
  } else if (labelLower.includes("deadline")) {
    specificInstruction = "Ambil tanggal terakhir pendaftaran.";
  } else if (labelLower.includes("broadcast") || labelLower.includes("pesan")) {
    specificInstruction = "Buatkan pesan broadcast WhatsApp yang menarik, penuh emoji, rapi, dan hype. Sertakan headline, detail penting, dan ajakan mendaftar.";
  }

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: file.type,
            },
          },
          {
            text: `Perbaiki atau ekstrak ulang data untuk kolom: "${fieldLabel}". 
            Instruksi Khusus: ${specificInstruction}
            Nilai sebelumnya yang mungkin salah adalah: "${currentVal}".
            Berikan HANYA jawaban teks singkat yang benar dan akurat untuk kolom tersebut berdasarkan gambar. Jangan gunakan markdown atau JSON.`,
          },
        ],
      },
    });

    const text = response.text;
    return text ? text.trim() : "";
  } catch (error) {
    console.error(`Error re-analyzing field ${fieldLabel}:`, error);
    throw error;
  }
};