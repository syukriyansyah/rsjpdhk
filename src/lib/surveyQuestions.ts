export const LOKET_OPTIONS = [
  "Rawat Jalan Umum",
  "Rawat Jalan Eksekutif",
  "Rawat Inap",
  "Verifikasi C1",
  "Verifikasi C2",
] as const;

export const JAMINAN_OPTIONS = [
  "Pribadi",
  "Asuransi",
  "Perusahaan",
  "BPJS Naik Kelas",
] as const;

export const LAYANAN_OPTIONS = [
  "Rawat Jalan",
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

// Scoring: option index 0 (A) = 20, 1 (B) = 17, 2 (C) = 14, 3 (D) = 10
export const OPTION_SCORES = [20, 17, 14, 10] as const;
export const MAX_SCORE_PER_QUESTION = 20;
export const MAX_TOTAL_SCORE = MAX_SCORE_PER_QUESTION * SURVEY_QUESTIONS.length; // 100

/** Get the score for a single answer based on its question */
export function getAnswerScore(questionId: string, answer: string): number {
  const question = SURVEY_QUESTIONS.find((q) => q.id === questionId);
  if (!question) return 0;
  const index = question.options.indexOf(answer);
  if (index < 0 || index >= OPTION_SCORES.length) return 0;
  return OPTION_SCORES[index];
}

/** Calculate total score for a respondent across all questions */
export function getTotalScore(response: Record<string, string>): number {
  return SURVEY_QUESTIONS.reduce(
    (sum, q) => sum + getAnswerScore(q.id, response[q.id] || ""),
    0
  );
}

/** Get score category based on total score */
export function getScoreCategory(score: number): string {
  if (score > 85) return "Sangat Puas";
  if (score > 70) return "Puas";
  if (score > 50) return "Kurang Puas";
  return "Tidak Puas";
}

export const SCORE_CATEGORIES = ["Sangat Puas", "Puas", "Kurang Puas", "Tidak Puas"] as const;
export const CATEGORY_COLORS: Record<string, string> = {
  "Sangat Puas": "#22a87d",
  "Puas": "#1e7ab5",
  "Kurang Puas": "#e6952b",
  "Tidak Puas": "#d94545",
};
