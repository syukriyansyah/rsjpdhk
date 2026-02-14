export const LOKET_OPTIONS = [
  "Rawat Jalan Umum",
  "Rawat Jalan Eksekutif",
  "Rawat Inap",
] as const;

export interface SurveyQuestion {
  id: string;
  label: string;
  options: string[];
}

export const SURVEY_QUESTIONS: SurveyQuestion[] = [
  {
    id: "informasi_keuangan",
    label: "Apakah Anda mendapatkan informasi keuangan secara lengkap?",
    options: ["Sangat Lengkap", "Lengkap", "Kurang Lengkap", "Tidak Lengkap"],
  },
  {
    id: "kecepatan_pelayanan",
    label: "Apakah Anda puas dengan kecepatan waktu pelayanan keuangan kami?",
    options: ["Sangat Puas", "Puas", "Kurang Puas", "Tidak Puas"],
  },
  {
    id: "metode_pembayaran",
    label: "Bagaimana pendapat Anda tentang metode pembayaran atas pelayanan keuangan kami?",
    options: ["Sangat Mudah", "Mudah", "Kurang Mudah", "Tidak Mudah"],
  },
  {
    id: "keramahan_petugas",
    label: "Bagaimana pendapat Anda tentang keramahan petugas keuangan kami?",
    options: ["Sangat Ramah", "Ramah", "Kurang Ramah", "Tidak Ramah"],
  },
  {
    id: "komunikasi_petugas",
    label: "Bagaimana pendapat Anda mengenai cara komunikasi/penyampaian petugas keuangan kami?",
    options: ["Sangat Baik", "Baik", "Kurang Baik", "Tidak Baik"],
  },
];
