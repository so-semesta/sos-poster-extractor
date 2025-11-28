import React from 'react';
import { PosterMetadata } from '../types';

interface CalendarButtonProps {
  data: PosterMetadata;
  type: 'deadline' | 'execution';
}

const CalendarButton: React.FC<CalendarButtonProps> = ({ data, type }) => {
  const isDeadline = type === 'deadline';
  const label = isDeadline ? 'Simpan Deadline' : 'Simpan Tanggal Acara';
  const rawDate = isDeadline ? data.deadlineISO : data.executionDateISO;
  
  if (!rawDate || rawDate.length < 8) return null;

  const title = encodeURIComponent(`${data.competitionName} - ${isDeadline ? 'Deadline Pendaftaran' : 'Pelaksanaan'}`);
  const details = encodeURIComponent(
    `Bidang: ${data.field}\n` +
    `Biaya: ${data.cost}\n` +
    `Status: ${data.status}\n` +
    `Link: ${data.link}\n\n` +
    `Info: Disimpan via SOS Meta Extractor`
  );
  const location = encodeURIComponent(data.location);
  
  // Format Date for GCal (YYYYMMDD or YYYYMMDDTHHMMSS)
  // Assuming API returns YYYYMMDD. We'll make it an all-day event if no time.
  const dates = `${rawDate}/${rawDate}`;

  const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}&dates=${dates}`;

  return (
    <a
      href={gcalUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`
        flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm
        ${isDeadline 
          ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200' 
          : 'bg-green-50 text-green-600 hover:bg-green-100 border border-green-200'}
      `}
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
        <path fillRule="evenodd" d="M5.75 2a.75.75 0 0 1 .75.75V4h7V2.75a.75.75 0 0 1 1.5 0V4h.25A2.75 2.75 0 0 1 18 6.75v8.5A2.75 2.75 0 0 1 15.25 18H4.75A2.75 2.75 0 0 1 2 15.25v-8.5A2.75 2.75 0 0 1 4.75 4H5V2.75A.75.75 0 0 1 5.75 2Zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75Z" clipRule="evenodd" />
      </svg>
      {label}
    </a>
  );
};

export default CalendarButton;