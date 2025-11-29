import React, { useState, useRef, useEffect } from 'react';
import { extractPosterMetadata, reanalyzeField, saveApiKey, getSavedApiKey } from './services/geminiService';
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
  const [showSettings, setShowSettings] = useState(false);
  const [customKey, setCustomKey] = useState('');
  
  // State khusus untuk error handling di UI
  const [tempKeyInput, setTempKeyInput] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCustomKey(getSavedApiKey() || '');
  }, []);

  const handleSaveKey = (keyToSave: string) => {
    saveApiKey(keyToSave);
    setCustomKey(keyToSave);
    setShowSettings(false);
    setError(null);
    return true;
  };

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
    } catch (err: any) {
      console.error("Full API Error:", err);
      // Extract meaningful error message
      let msg = 'Gagal menganalisis gambar.';
      if (err.message) {
        if (err.message.includes('403')) msg = 'Akses Ditolak (403). API Key mungkin tidak valid atau belum mengaktifkan Generative Language API.';
        else if (err.message.includes('429') || err.message.includes('Quota')) msg = 'Quota Exceeded (429). Batas penggunaan API Key gratis telah habis.';
        else msg += ` Detail: ${err.message}`;
      }
      setError(msg);
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
    } catch (err: any) {
      console.error('Failed to refresh field', err);
      alert(`Gagal update: ${err.message || 'Error tidak diketahui'}`);
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

  const handleRetryWithNewKey = () => {
    if (!tempKeyInput.trim()) {
      alert("Masukkan API Key terlebih dahulu.");
      return;
    }
    handleSaveKey(tempKeyInput);
    if (image) {
      analyzeImage(image);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-20 relative">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
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
          
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
            title="Pengaturan API Key"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 0 1 1.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.11v1.09c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 0 1-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 0 1-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.11v-1.09c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.107-1.204l-.527-.738a1.125 1.125 0 0 1 .12-1.45l.773-.773a1.125 1.125 0 0 1 1.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
          </button>
        </div>
        
        {/* Settings Dropdown */}
        {showSettings && (
          <div className="absolute right-4 top-16 w-80 bg-white shadow-xl rounded-xl p-4 border border-gray-100 z-50 animate-fade-in-down">
            <h3 className="font-semibold text-gray-800 mb-2">Pengaturan API Key</h3>
            <p className="text-xs text-gray-500 mb-3">
              Masukkan API Key Gemini pribadi Anda.
            </p>
            <input 
              type="text" 
              placeholder="Paste Gemini API Key..." 
              className="w-full p-2 border border-gray-300 rounded mb-3 text-sm focus:ring-2 focus:ring-blue-100 outline-none"
              value={customKey}
              onChange={(e) => setCustomKey(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <button 
                onClick={() => setShowSettings(false)}
                className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded"
              >
                Tutup
              </button>
              <button 
                onClick={() => handleSaveKey(customKey)}
                className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700 shadow-sm"
              >
                Simpan
              </button>
            </div>
          </div>
        )}
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
            
            {/* Error State with Smart Recovery */}
            {error && (
              <div className="bg-red-50 text-red-700 p-5 rounded-xl border border-red-200 shadow-sm text-sm">
                <div className="flex items-start gap-3 mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-red-600 shrink-0">
                    <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h3 className="font-bold text-red-800">Gagal Menganalisis</h3>
                    <p className="mt-1 leading-relaxed">{error}</p>
                  </div>
                </div>

                {/* Specific UI for Quota Exceeded */}
                {(error.includes('Quota') || error.includes('429')) && (
                  <div className="bg-white p-4 rounded-lg border border-red-100 mt-2">
                    <p className="text-xs text-gray-600 mb-3 font-medium">
                      Limit API Key bawaan aplikasi telah habis hari ini. Silakan gunakan API Key gratis milik Anda sendiri:
                    </p>
                    
                    <ol className="list-decimal list-inside text-xs text-gray-500 mb-4 space-y-1">
                      <li>Buka <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline font-medium">Google AI Studio</a></li>
                      <li>Klik "Create API Key"</li>
                      <li>Copy dan Paste di bawah ini:</li>
                    </ol>

                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="Paste API Key di sini..." 
                        className="flex-1 p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-200 outline-none"
                        value={tempKeyInput}
                        onChange={(e) => setTempKeyInput(e.target.value)}
                      />
                      <button 
                        onClick={handleRetryWithNewKey}
                        className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2 rounded transition-colors whitespace-nowrap"
                      >
                        Simpan & Coba Lagi
                      </button>
                    </div>
                  </div>
                )}
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