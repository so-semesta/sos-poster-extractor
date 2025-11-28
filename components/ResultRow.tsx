import React, { useState } from 'react';

interface ResultRowProps {
  label: string;
  value: string;
  isLoading: boolean;
  onRefresh: () => void;
  isMultiline?: boolean;
}

const ResultRow: React.FC<ResultRowProps> = ({ 
  label, 
  value, 
  isLoading, 
  onRefresh,
  isMultiline = false
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
      {/* Header Row: Label + Actions */}
      <div className="flex justify-between items-center mb-2">
        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
          {label}
        </label>
        
        <div className="flex items-center gap-1">
          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="text-gray-400 hover:text-blue-600 transition-colors p-1 rounded hover:bg-gray-100"
            title="Analisis Ulang Field Ini"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-600' : ''}`}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
          </button>
          
          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className={`p-1 rounded transition-colors ${copied ? 'text-green-600 bg-green-50' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'}`}
            title="Salin Teks"
          >
            {copied ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" />
              </svg>
            )}
          </button>
        </div>
      </div>
      
      {/* Value Input Box */}
      <div className="w-full">
        {isLoading ? (
          <div className="h-10 bg-gray-100 rounded animate-pulse"></div>
        ) : (
          isMultiline ? (
            <textarea 
              readOnly 
              className="w-full min-h-[100px] p-3 border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-200 text-sm text-gray-800 resize-y"
              value={value}
            />
          ) : (
            <div className="w-full p-3 border border-gray-200 rounded-lg bg-gray-50 text-sm text-gray-800 break-words min-h-[46px] flex items-center">
              {value || '-'}
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default ResultRow;