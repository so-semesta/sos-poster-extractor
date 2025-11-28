import React, { useState, useRef } from 'react';
import { extractPosterMetadata, reanalyzeField } from './services/geminiService';
import { INITIAL_METADATA, PosterMetadata, FIELD_CONFIGS } from './types';
import ResultRow from './components/ResultRow';
import CalendarButton from './components/CalendarButton';

const App: React.FC = () => {
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<PosterMetadata>(INITIAL_METADATA);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [loadingField, setLoadingField] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      processFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        processFile(file);
      }
    }
  };

  const processFile = (file: File) => {
    setImage(file);
    setImagePreview(URL.createObjectURL(file));
    setMetadata(INITIAL_METADATA);
    setError(null);
    analyzeImage(file);
  };

  const analyzeImage = async (file: File) => {
    setIsAnalyzing(true);
    setError(null);
    try {
      const result = await extractPosterMetadata(file);
      setMetadata(result);
    } catch (err) {
      setError('Gagal menganalisis gambar. Pastikan API Key valid atau coba gambar lain.');
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRefreshField = async (key: keyof PosterMetadata, label: string) => {
    if (!image) return;
    
    setLoadingField(key);
    try {
      const currentValue = String(metadata[key]);
      const newValue = await reanalyzeField(image, label, currentValue);
      setMetadata(prev => ({
        ...prev,
        [key]: newValue
      }));
    } catch (err) {
      console.error('Failed to refresh field', err);
      alert('Gagal memperbarui data. Silakan coba lagi.');
    } finally {
      setLoadingField(null);
    }
  };

  const handleReset = () => {
    setImage(null);
    setImagePreview(null);
    setMetadata(INITIAL_METADATA);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-20">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex items-center gap-4">
          <img 
            src="https://so-semesta.vercel.app/icon.png" 
            alt="Logo SOS" 
            className="w-10 h-10 rounded-full shadow-sm"
          />
          <div>
            <h1 className="text-xl font-bold leading-none text-gray-900">SOS Poster Meta Data Extractor</h1>
            <p className="text-xs text-gray-500 mt-1">Powered by Gemini 2.5</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: Upload & Preview */}
          <div className="lg:col-span-4 space-y-6">
            <h2 className="text-lg font-medium text-gray-800">Upload Poster</h2>
            
            {/* Upload Area */}
            <div 
              className={`
                border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer bg-white
                ${isAnalyzing ? 'border-blue-300 bg-blue-50 cursor-wait' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'}
              `}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => !isAnalyzing && fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/png, image/jpeg, image/jpg" 
                className="hidden" 
              />
              
              <div className="flex flex-col items-center justify-center text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 mb-3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                </svg>
                <p className="text-sm font-medium text-gray-600">Klik untuk upload <span className="text-gray-400 font-normal">atau drag and drop</span></p>
                <p className="text-xs text-gray-400 mt-1">PNG, JPG (MAX. 5MB)</p>
              </div>
            </div>

            {/* Image Preview */}
            {imagePreview && (
              <div className="bg-white p-2 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
                <img 
                  src={imagePreview} 
                  alt="Poster Preview" 
                  className="w-full h-auto rounded-lg" 
                />
                {isAnalyzing && (
                  <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent mb-3"></div>
                    <p className="text-blue-800 font-semibold animate-pulse text-sm">Menganalisis Poster...</p>
                  </div>
                )}
              </div>
            )}
            
            {error && (
              <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200 text-sm">
                {error}
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Results */}
          <div className="lg:col-span-8">
            <div className="flex justify-between items-end mb-6">
              <h2 className="text-xl font-bold text-gray-900">Hasil Ekstraksi</h2>
              {imagePreview && (
                <button 
                  onClick={handleReset}
                  className="text-sm text-gray-500 hover:text-blue-600 underline decoration-gray-300 hover:decoration-blue-600 transition-all"
                >
                  Reset / Upload Baru
                </button>
              )}
            </div>

            {/* Welcome / Empty State */}
            {!imagePreview && (
              <div className="bg-white rounded-xl p-12 text-center border border-gray-200 border-dashed">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-gray-300">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                  </svg>
                </div>
                <h3 className="text-gray-900 font-medium text-lg">Belum ada data</h3>
                <p className="text-gray-500 mt-1">Silakan upload poster di panel sebelah kiri untuk mulai ekstraksi.</p>
              </div>
            )}

            {/* Results List */}
            {imagePreview && (
              <div className="space-y-4">
                 {/* Calendar Actions */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <CalendarButton data={metadata} type="deadline" />
                  <CalendarButton data={metadata} type="execution" />
                </div>

                {FIELD_CONFIGS.map((field) => (
                  <ResultRow
                    key={field.key}
                    label={field.label}
                    value={String(metadata[field.key])}
                    isLoading={loadingField === field.key || (isAnalyzing && !metadata.competitionName)}
                    onRefresh={() => handleRefreshField(field.key, field.label)}
                    isMultiline={field.multiline}
                  />
                ))}
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
};

export default App;