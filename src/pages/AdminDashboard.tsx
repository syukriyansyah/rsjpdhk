import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SURVEY_QUESTIONS, LOKET_OPTIONS, JAMINAN_OPTIONS, LAYANAN_OPTIONS, getAnswerScore, getTotalScore, MAX_TOTAL_SCORE, getScoreCategory, SCORE_CATEGORIES, CATEGORY_COLORS } from "@/lib/surveyQuestions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from "recharts";
import { LogOut, Users, FileDown, ClipboardList, ChevronLeft, ChevronRight, TrendingUp } from "lucide-react";
import { toast } from "sonner";

interface SurveyResponse {
  id: string;
  loket: string;
  jaminan: string;
  layanan: string;
  nama: string;
  no_mr: string;
  no_hp: string;
  informasi_keuangan: string;
  kecepatan_pelayanan: string;
  metode_pembayaran: string;
  keramahan_petugas: string;
  komunikasi_petugas: string;
  kritik_saran: string | null;
  created_at: string;
}

const CHART_COLORS = ["#1e7ab5", "#22a87d", "#e6952b", "#d94545", "#8b5cf6", "#ec4899"];
const ROWS_PER_PAGE = 10;

const QUESTION_FIELD_MAP: Record<string, keyof SurveyResponse> = {
  informasi_keuangan: "informasi_keuangan",
  kecepatan_pelayanan: "kecepatan_pelayanan",
  metode_pembayaran: "metode_pembayaran",
  keramahan_petugas: "keramahan_petugas",
  komunikasi_petugas: "komunikasi_petugas",
};

const AdminDashboard = () => {
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterLoket, setFilterLoket] = useState<string>("all");
  const [filterJaminan, setFilterJaminan] = useState<string>("all");
  const [filterLayanan, setFilterLayanan] = useState<string>("all");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
    fetchData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterLoket, filterJaminan, filterLayanan, filterDateFrom, filterDateTo]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) navigate("/admin");
  };

  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("survey_responses")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Gagal memuat data");
    } else {
      setResponses(data as SurveyResponse[]);
    }
    setLoading(false);
  };

  const filteredResponses = responses.filter((r) => {
    if (filterLoket !== "all" && r.loket !== filterLoket) return false;
    if (filterJaminan !== "all" && r.jaminan !== filterJaminan) return false;
    if (filterLayanan !== "all" && r.layanan !== filterLayanan) return false;
    if (filterDateFrom && new Date(r.created_at) < new Date(filterDateFrom)) return false;
    if (filterDateTo && new Date(r.created_at) > new Date(filterDateTo + "T23:59:59")) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filteredResponses.length / ROWS_PER_PAGE));
  const paginatedResponses = filteredResponses.slice(
    (currentPage - 1) * ROWS_PER_PAGE,
    currentPage * ROWS_PER_PAGE
  );

  const getQuestionStats = (questionId: string) => {
    const q = SURVEY_QUESTIONS.find((q) => q.id === questionId)!;
    return q.options.map((opt) => ({
      name: opt,
      count: filteredResponses.filter((r) => r[questionId as keyof SurveyResponse] === opt).length,
    }));
  };

  /** Get breakdown stats by a grouping field (loket, jaminan, layanan) */
  const getGroupBreakdown = (groupField: keyof SurveyResponse, options: readonly string[]) => {
    return options.map((opt) => {
      const groupResponses = filteredResponses.filter((r) => r[groupField] === opt);
      const count = groupResponses.length;
      const avgScore = count > 0
        ? groupResponses.reduce((sum, r) => sum + getTotalScore(r as unknown as Record<string, string>), 0) / count
        : 0;
      const category = count > 0 ? getScoreCategory(avgScore) : "-";

      // Count per category
      const categoryCounts = SCORE_CATEGORIES.map((cat) => ({
        name: cat,
        count: groupResponses.filter((r) => getScoreCategory(getTotalScore(r as unknown as Record<string, string>)) === cat).length,
      }));

      return { name: opt, count, avgScore: Math.round(avgScore * 10) / 10, category, categoryCounts };
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin");
  };

  const exportCSV = () => {
    const scoreHeaders = SURVEY_QUESTIONS.map(q => `Skor: ${q.label}`);
    const headers = ["Tanggal", "Loket", "Jaminan", "Layanan", "Nama", "No MR", "No HP", ...SURVEY_QUESTIONS.map(q => q.label), ...scoreHeaders, "Total Skor", "Kategori", "Kritik & Saran"];
    const rows = filteredResponses.map((r) => {
      const totalScore = getTotalScore(r as unknown as Record<string, string>);
      return [
        new Date(r.created_at).toLocaleDateString("id-ID"),
        r.loket,
        r.jaminan,
        r.layanan,
        r.nama,
        r.no_mr,
        r.no_hp,
        r.informasi_keuangan,
        r.kecepatan_pelayanan,
        r.metode_pembayaran,
        r.keramahan_petugas,
        r.komunikasi_petugas,
        ...SURVEY_QUESTIONS.map(q => getAnswerScore(q.id, r[QUESTION_FIELD_MAP[q.id]] as string).toString()),
        totalScore.toString(),
        getScoreCategory(totalScore),
        r.kritik_saran || "",
      ];
    });

    const csv = [headers, ...rows].map((row) => row.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `survei-kepuasan-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Data berhasil diexport ke CSV/Excel");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Memuat data...</p>
      </div>
    );
  }

  const loketBreakdown = getGroupBreakdown("loket", LOKET_OPTIONS);
  const jaminanBreakdown = getGroupBreakdown("jaminan", JAMINAN_OPTIONS);
  const layananBreakdown = getGroupBreakdown("layanan", LAYANAN_OPTIONS);

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground py-4 px-4 shadow-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-40 h-12 bg-white rounded-xl flex items-center justify-center p-1 shadow-sm overflow-hidden">
              <img
                src="/rsdjp.png"
                alt="Logo RSJPDHK"
                className="w-full h-full object-cover"
                onError={(e) => { e.currentTarget.src = '/placeholder.svg' }}
              />
            </div>
            <div>
              <h1 className="text-lg font-bold">Dashboard Admin</h1>
              <p className="text-xs opacity-80 mt-1">Survei Kepuasan - RS Jantung dan Pembuluh Darah Harapan Kita</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-primary-foreground/10" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-1" /> Keluar
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Responden</p>
                <p className="text-2xl font-bold">{responses.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Responden (Filter)</p>
                <p className="text-2xl font-bold">{filteredResponses.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Rata-rata Skor</p>
                <p className="text-2xl font-bold">
                  {filteredResponses.length > 0
                    ? (filteredResponses.reduce((sum, r) => sum + getTotalScore(r as unknown as Record<string, string>), 0) / filteredResponses.length).toFixed(1)
                    : "0"}
                  <span className="text-sm font-normal text-muted-foreground"> / {MAX_TOTAL_SCORE}</span>
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <Button onClick={exportCSV} className="w-full" variant="outline">
                <FileDown className="w-4 h-4 mr-2" /> Export CSV / Excel
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Filter Data</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
              <div>
                <Label>Loket</Label>
                <Select value={filterLoket} onValueChange={setFilterLoket}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Loket</SelectItem>
                    {LOKET_OPTIONS.map((l) => (
                      <SelectItem key={l} value={l}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Jaminan</Label>
                <Select value={filterJaminan} onValueChange={setFilterJaminan}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Jaminan</SelectItem>
                    {JAMINAN_OPTIONS.map((j) => (
                      <SelectItem key={j} value={j}>{j}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Layanan</Label>
                <Select value={filterLayanan} onValueChange={setFilterLayanan}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Layanan</SelectItem>
                    {LAYANAN_OPTIONS.map((l) => (
                      <SelectItem key={l} value={l}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Dari Tanggal</Label>
                <Input type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>Sampai Tanggal</Label>
                <Input type="date" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} className="mt-1" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Breakdown Charts: Loket, Jaminan, Layanan */}
        {[
          { title: "Analisis per Loket", data: loketBreakdown, field: "loket" },
          { title: "Analisis per Jaminan", data: jaminanBreakdown, field: "jaminan" },
          { title: "Analisis per Layanan", data: layananBreakdown, field: "layanan" },
        ].map(({ title, data }) => (
          <Card key={title}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">{title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Average Score Bar Chart */}
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Rata-rata Skor & Kategori</p>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(210,20%,90%)" />
                        <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={120} />
                        <Tooltip
                          formatter={(value: number) => [`${value} / ${MAX_TOTAL_SCORE}`, "Rata-rata Skor"]}
                          labelFormatter={(label) => `${label}`}
                        />
                        <Bar dataKey="avgScore" radius={[0, 4, 4, 0]}>
                          {data.map((entry, i) => (
                            <Cell key={i} fill={CATEGORY_COLORS[entry.category] || CHART_COLORS[i % CHART_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                {/* Category Distribution Pie Chart per group */}
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Distribusi Kategori Skor</p>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={SCORE_CATEGORIES.map((cat) => ({
                            name: cat,
                            count: filteredResponses.filter((r) => getScoreCategory(getTotalScore(r as unknown as Record<string, string>)) === cat).length,
                          })).filter(d => d.count > 0)}
                          dataKey="count"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={75}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          labelLine={false}
                          fontSize={10}
                        >
                          {SCORE_CATEGORIES.map((cat) => (
                            <Cell key={cat} fill={CATEGORY_COLORS[cat]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend fontSize={11} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
              {/* Summary Table */}
              <Table className="mt-4">
                <TableHeader>
                  <TableRow>
                    <TableHead>Kelompok</TableHead>
                    <TableHead className="text-right">Jumlah</TableHead>
                    <TableHead className="text-right">Rata-rata Skor</TableHead>
                    <TableHead className="text-center">Kategori</TableHead>
                    {SCORE_CATEGORIES.map((cat) => (
                      <TableHead key={cat} className="text-center text-xs">{cat}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((d) => (
                    <TableRow key={d.name}>
                      <TableCell className="font-medium">{d.name}</TableCell>
                      <TableCell className="text-right">{d.count}</TableCell>
                      <TableCell className="text-right font-semibold">{d.avgScore}</TableCell>
                      <TableCell className="text-center">
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium text-white" style={{ backgroundColor: CATEGORY_COLORS[d.category] || "#888" }}>
                          {d.category}
                        </span>
                      </TableCell>
                      {d.categoryCounts.map((cc) => (
                        <TableCell key={cc.name} className="text-center">{cc.count}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}

        {/* Charts per question */}
        {SURVEY_QUESTIONS.map((q) => {
          const stats = getQuestionStats(q.id);
          return (
            <Card key={q.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold leading-snug">{q.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Bar Chart */}
                  <div className="h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(210,20%,90%)" />
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                          {stats.map((_, i) => (
                            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  {/* Pie Chart */}
                  <div className="h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stats}
                          dataKey="count"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={70}
                          label={({ name, percent }) => `${name.split(" ").pop()} ${(percent * 100).toFixed(0)}%`}
                          labelLine={false}
                          fontSize={10}
                        >
                          {stats.map((_, i) => (
                            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  {/* Table */}
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Jawaban</TableHead>
                        <TableHead className="text-right">Jumlah</TableHead>
                        <TableHead className="text-right">%</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stats.map((s) => (
                        <TableRow key={s.name}>
                          <TableCell className="text-sm">{s.name}</TableCell>
                          <TableCell className="text-right">{s.count}</TableCell>
                          <TableCell className="text-right">
                            {filteredResponses.length > 0
                              ? ((s.count / filteredResponses.length) * 100).toFixed(1)
                              : "0"}%
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {/* Responses Table with full answers & pagination */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Data Responden ({filteredResponses.length} data)</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">No</TableHead>
                  <TableHead className="whitespace-nowrap">Tanggal</TableHead>
                  <TableHead className="whitespace-nowrap">Loket</TableHead>
                  <TableHead className="whitespace-nowrap">Jaminan</TableHead>
                  <TableHead className="whitespace-nowrap">Layanan</TableHead>
                  <TableHead className="whitespace-nowrap">Nama</TableHead>
                  <TableHead className="whitespace-nowrap">No. MR</TableHead>
                  <TableHead className="whitespace-nowrap">No. HP</TableHead>
                  {SURVEY_QUESTIONS.map((q) => (
                    <TableHead key={q.id} className="whitespace-normal min-w-[150px] text-xs leading-tight" title={q.label}>
                      {q.label}
                    </TableHead>
                  ))}
                  {SURVEY_QUESTIONS.map((q) => (
                    <TableHead key={`score-${q.id}`} className="whitespace-nowrap text-center text-xs">Skor</TableHead>
                  ))}
                  <TableHead className="whitespace-nowrap text-center">Total Skor</TableHead>
                  <TableHead className="whitespace-nowrap text-center">Kategori</TableHead>
                  <TableHead className="whitespace-nowrap">Kritik & Saran</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedResponses.map((r, idx) => {
                  const totalScore = getTotalScore(r as unknown as Record<string, string>);
                  const category = getScoreCategory(totalScore);
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="text-sm">{(currentPage - 1) * ROWS_PER_PAGE + idx + 1}</TableCell>
                      <TableCell className="text-sm whitespace-nowrap">
                        {new Date(r.created_at).toLocaleDateString("id-ID")}
                      </TableCell>
                      <TableCell className="text-sm">{r.loket}</TableCell>
                      <TableCell className="text-sm">{r.jaminan}</TableCell>
                      <TableCell className="text-sm">{r.layanan}</TableCell>
                      <TableCell className="text-sm">{r.nama}</TableCell>
                      <TableCell className="text-sm">{r.no_mr}</TableCell>
                      <TableCell className="text-sm">{r.no_hp}</TableCell>
                      {SURVEY_QUESTIONS.map((q) => (
                        <TableCell key={q.id} className="text-sm">
                          {r[QUESTION_FIELD_MAP[q.id]]}
                        </TableCell>
                      ))}
                      {SURVEY_QUESTIONS.map((q) => (
                        <TableCell key={`score-${q.id}`} className="text-sm text-center font-medium">
                          {getAnswerScore(q.id, r[QUESTION_FIELD_MAP[q.id]] as string)}
                        </TableCell>
                      ))}
                      <TableCell className="text-sm text-center font-bold">
                        {totalScore}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium text-white whitespace-nowrap" style={{ backgroundColor: CATEGORY_COLORS[category] }}>
                          {category}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm max-w-[200px] truncate">{r.kritik_saran || "-"}</TableCell>
                    </TableRow>
                  );
                })}
                {filteredResponses.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9 + SURVEY_QUESTIONS.length * 2 + 2} className="text-center text-muted-foreground py-8">
                      Belum ada data survei
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Halaman {currentPage} dari {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let page: number;
                    if (totalPages <= 5) {
                      page = i + 1;
                    } else if (currentPage <= 3) {
                      page = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      page = totalPages - 4 + i;
                    } else {
                      page = currentPage - 2 + i;
                    }
                    return (
                      <Button
                        key={page}
                        variant={page === currentPage ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className="w-8 h-8 p-0"
                      >
                        {page}
                      </Button>
                    );
                  })}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AdminDashboard;
