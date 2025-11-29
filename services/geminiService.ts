import { GoogleGenAI, Type, Schema } from "@google/genai";
import { PosterMetadata } from "../types";

const getGeminiClient = () => {
  // 1. Coba baca dari process.env (Standard Node/CRA/Vercel System)
  let apiKey = process.env.API_KEY || process.env.REACT_APP_API_KEY;

  // 2. Coba baca dari Vite env vars (import.meta.env)
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_KEY) {
      // @ts-ignore
      apiKey = import.meta.env.VITE_API_KEY;
    }
  } catch (e) {
    // Ignore error if import.meta is not available
  }

  // 3. Fallback: Gunakan key yang Anda berikan jika Env Vars tidak terbaca di Vercel
  if (!apiKey) {
    apiKey = 'AIzaSyDW0gQvv3zEFWXxjBUnMjPwjgIdPICTGQY';
  }

  if (!apiKey) {
    throw new Error("API Key is missing. Please set VITE_API_KEY in Vercel Environment Variables.");
  }
  
  return new GoogleGenAI({ apiKey });
};

const MODEL_NAME = 'gemini-2.5-flash';

// Define the schema for structured output
const metadataSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    competitionName: { type: Type.STRING, description: "Nama lengkap kompetisi." },
    field: { type: Type.STRING, description: "Bidang atau kategori lomba (misal: Desain, Pemrograman, Fotografi)." },
    deadline: { type: Type.STRING, description: "Tanggal batas akhir pendaftaran. ATURAN: Jika ada beberapa gelombang (batch), ambil tanggal 'Batch Terakhir' atau tanggal penutupan paling akhir." },
    deadlineISO: { type: Type.STRING, description: "Tanggal deadline dalam format YYYYMMDD (contoh: 20241231). Kosongkan jika tidak ada." },
    executionDate: { type: Type.STRING, description: "Tanggal pelaksanaan lomba. ATURAN: Jika ada rangkaian acara (penyisihan, semifinal, final), ambil tanggal dimulainya BABAK PERTAMA/PENYISIHAN/SELEKSI AWAL saja. Output berupa 1 tanggal atau rentang tanggal awal." },
    executionDateISO: { type: Type.STRING, description: "Tanggal pelaksanaan awal dalam format YYYYMMDD (contoh: 20241231). Kosongkan jika tidak ada." },
    cost: { type: Type.STRING, description: "Biaya pendaftaran. ATURAN: Cari biaya untuk kategori SISWA SMP/SMA. Jika ada rentang harga (early bird vs normal), ambil harga TERTINGGI/NORMAL. Output berupa nominal rupiah (contoh: Rp 50.000)." },
    type: { type: Type.STRING, description: "Jenis kepesertaan: 'Individu', 'Kelompok', atau 'Individu/Kelompok'." },
    status: { type: Type.STRING, description: "Status pelaksanaan: 'Daring' (Online) atau 'Luring' (Offline/Onsite)." },
    location: { type: Type.STRING, description: "Nama Kota jika Luring, atau 'Daring' jika online." },
    broadcastMessage: { type: Type.STRING, description: "Buatkan caption/pesan broadcast untuk WhatsApp/Telegram yang SANGAT MENARIK dan PERSUASIF. Gunakan style bahasa anak muda/pelajar yang 'Hype'. \n\nStruktur Wajib:\n1. Headline Bombastis dengan Emoji Api/Sirene 🚨🔥\n2. Paragraf pembuka singkat mengajak ikut.\n3. Detail Event pakai Bullet Points Emoji (📅 Deadline, 📍 Lokasi, 💰 Biaya).\n4. Benefit/Hadiah singkat 🏆.\n5. Call to Action (CTA) tegas untuk klik link 👇.\n\nPastikan banyak menggunakan emoji yang relevan di setiap baris." },
    link: { type: Type.STRING, description: "Link pendaftaran, link guidebook (bit.ly/linktree), atau link website yang tertera." },
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
    const ai = getGeminiClient();
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
            text: "Analisis poster kompetisi ini secara mendalam. Ekstrak informasi spesifik sesuai schema. Hati-hati dengan tanggal tahun (pastikan tahun terbaru/sesuai poster) dan biaya (ambil kategori siswa/umum yang relevan).",
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
    specificInstruction = "Fokus cari biaya untuk siswa SMP/SMA. Jika ada Early Bird dan Normal, ambil harga NORMAL (Tertinggi). Hanya tulis nominalnya.";
  } else if (labelLower.includes("pelaksanaan")) {
    specificInstruction = "Cari tanggal dimulainya babak penyisihan atau seleksi paling awal. Jangan tanggal final. Hanya tulis tanggalnya.";
  } else if (labelLower.includes("deadline")) {
    specificInstruction = "Cari tanggal penutupan pendaftaran PALING TERAKHIR (Batch terakhir). Hanya tulis tanggalnya.";
  } else if (labelLower.includes("broadcast") || labelLower.includes("pesan")) {
    specificInstruction = "Buat ulang pesan broadcast yang lebih menarik, hype, dan penuh emoji. Sertakan Headline, Poin-poin penting, dan Link.";
  }

  try {
    const ai = getGeminiClient();
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
            text: `Perbaiki data untuk kolom: "${fieldLabel}". 
            Instruksi Khusus: ${specificInstruction}
            Data sebelumnya: "${currentVal}".
            Berikan HANYA teks jawaban yang benar tanpa markdown.`,
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