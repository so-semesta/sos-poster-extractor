export interface PosterMetadata {
  competitionName: string;
  field: string;
  deadline: string;
  deadlineISO?: string; // For Calendar
  executionDate: string;
  executionDateISO?: string; // For Calendar
  cost: string;
  type: string; // Individu/Kelompok
  status: string; // Daring/Luring
  location: string;
  broadcastMessage: string;
  link: string;
}

export const INITIAL_METADATA: PosterMetadata = {
  competitionName: '',
  field: '',
  deadline: '',
  executionDate: '',
  cost: '',
  type: '',
  status: '',
  location: '',
  broadcastMessage: '',
  link: '',
};

export interface FieldConfig {
  key: keyof PosterMetadata;
  label: string;
  multiline?: boolean;
}

export const FIELD_CONFIGS: FieldConfig[] = [
  { key: 'competitionName', label: 'Nama Kompetisi' },
  { key: 'field', label: 'Bidang Lomba' },
  { key: 'deadline', label: 'Deadline Pendaftaran' },
  { key: 'executionDate', label: 'Tanggal Pelaksanaan' },
  { key: 'cost', label: 'Biaya' },
  { key: 'type', label: 'Jenis Lomba (Individu/Kelompok)' },
  { key: 'status', label: 'Status Lomba (Daring/Luring)' },
  { key: 'location', label: 'Lokasi' },
  { key: 'link', label: 'Link Guidebook/Pendaftaran' },
  { key: 'broadcastMessage', label: 'Pesan Broadcast', multiline: true },
];