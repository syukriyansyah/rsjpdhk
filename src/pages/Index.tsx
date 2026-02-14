import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { LOKET_OPTIONS, SURVEY_QUESTIONS } from "@/lib/surveyQuestions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, ClipboardList, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const surveySchema = z.object({
  loket: z.string().min(1, "Pilih loket"),
  nama: z.string().trim().min(1, "Nama wajib diisi").max(100),
  no_mr: z.string().trim().min(1, "No. MR wajib diisi").max(50),
  no_hp: z.string().trim().min(1, "No. HP wajib diisi").max(20),
  informasi_keuangan: z.string().min(1, "Wajib dipilih"),
  kecepatan_pelayanan: z.string().min(1, "Wajib dipilih"),
  metode_pembayaran: z.string().min(1, "Wajib dipilih"),
  keramahan_petugas: z.string().min(1, "Wajib dipilih"),
  komunikasi_petugas: z.string().min(1, "Wajib dipilih"),
  kritik_saran: z.string().max(1000).optional(),
});

type SurveyFormData = z.infer<typeof surveySchema>;

const Index = () => {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SurveyFormData>({
    resolver: zodResolver(surveySchema),
    defaultValues: {
      loket: "",
      nama: "",
      no_mr: "",
      no_hp: "",
      informasi_keuangan: "",
      kecepatan_pelayanan: "",
      metode_pembayaran: "",
      keramahan_petugas: "",
      komunikasi_petugas: "",
      kritik_saran: "",
    },
  });

  const onSubmit = async (data: SurveyFormData) => {
    setLoading(true);
    try {
      const { error } = await supabase.from("survey_responses").insert([data] as any);
      if (error) throw error;
      setSubmitted(true);
      toast.success("Survei berhasil dikirim!");
    } catch {
      toast.error("Gagal mengirim survei. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full text-center shadow-lg">
          <CardContent className="pt-10 pb-8 space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-accent" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Terima Kasih!</h2>
            <p className="text-muted-foreground">
              Survei Anda telah berhasil dikirim. Masukan Anda sangat berarti bagi peningkatan pelayanan kami.
            </p>
            <Button onClick={() => { setSubmitted(false); }} className="mt-4">
              Isi Survei Lagi
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground py-6 px-4 shadow-md">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary-foreground/20 flex items-center justify-center">
            <ClipboardList className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold leading-tight">Survei Kepuasan Pelayanan</h1>
            <p className="text-sm opacity-80">Administrasi Keuangan Rumah Sakit</p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Loket */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Pilihan Loket <span className="text-destructive">*</span></CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={watch("loket")}
                onValueChange={(v) => setValue("loket", v, { shouldValidate: true })}
              >
                {LOKET_OPTIONS.map((opt) => (
                  <div key={opt} className="flex items-center gap-3 py-1">
                    <RadioGroupItem value={opt} id={`loket-${opt}`} />
                    <Label htmlFor={`loket-${opt}`} className="cursor-pointer font-normal">{opt}</Label>
                  </div>
                ))}
              </RadioGroup>
              {errors.loket && <p className="text-sm text-destructive mt-1">{errors.loket.message}</p>}
            </CardContent>
          </Card>

          {/* Data Diri */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Data Diri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="nama">Nama <span className="text-destructive">*</span></Label>
                <Input id="nama" {...register("nama")} placeholder="Masukkan nama Anda" className="mt-1" />
                {errors.nama && <p className="text-sm text-destructive mt-1">{errors.nama.message}</p>}
              </div>
              <div>
                <Label htmlFor="no_mr">No. MR <span className="text-destructive">*</span></Label>
                <Input id="no_mr" {...register("no_mr")} placeholder="Masukkan No. Medical Record" className="mt-1" />
                {errors.no_mr && <p className="text-sm text-destructive mt-1">{errors.no_mr.message}</p>}
              </div>
              <div>
                <Label htmlFor="no_hp">No. HP <span className="text-destructive">*</span></Label>
                <Input id="no_hp" {...register("no_hp")} placeholder="Masukkan No. Handphone" className="mt-1" />
                {errors.no_hp && <p className="text-sm text-destructive mt-1">{errors.no_hp.message}</p>}
              </div>
            </CardContent>
          </Card>

          {/* Survey Questions */}
          {SURVEY_QUESTIONS.map((q) => (
            <Card key={q.id}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold leading-snug">
                  {q.label} <span className="text-destructive">*</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={watch(q.id as keyof SurveyFormData) as string}
                  onValueChange={(v) => setValue(q.id as keyof SurveyFormData, v, { shouldValidate: true })}
                >
                  {q.options.map((opt) => (
                    <div key={opt} className="flex items-center gap-3 py-1">
                      <RadioGroupItem value={opt} id={`${q.id}-${opt}`} />
                      <Label htmlFor={`${q.id}-${opt}`} className="cursor-pointer font-normal">{opt}</Label>
                    </div>
                  ))}
                </RadioGroup>
                {errors[q.id as keyof SurveyFormData] && (
                  <p className="text-sm text-destructive mt-1">
                    {errors[q.id as keyof SurveyFormData]?.message}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}

          {/* Kritik & Saran */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Kritik dan Saran</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                {...register("kritik_saran")}
                placeholder="Tulis kritik dan saran Anda di sini..."
                rows={4}
              />
            </CardContent>
          </Card>

          <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={loading}>
            {loading ? "Mengirim..." : "Kirim Survei"}
          </Button>
        </form>

        <div className="mt-8 text-center">
          <Link to="/admin" className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1">
            <ShieldCheck className="w-4 h-4" />
            Login Admin
          </Link>
        </div>
      </main>
    </div>
  );
};

export default Index;
