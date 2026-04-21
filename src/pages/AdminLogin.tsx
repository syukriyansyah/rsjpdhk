import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      navigate("/admin/dashboard");
    } catch {
      toast.error("Email atau password salah.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin }
      });
      if (error) throw error;
      toast.success("Akun admin berhasil dibuat! Silakan login.");
    } catch {
      toast.error("Gagal membuat akun. Pastikan email valid dan password minimal 6 karakter.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-sm w-full shadow-lg">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-40 h-20 bg-white rounded-xl shadow-sm p-2 flex items-center justify-center mb-2">
            <img
              src="/rsdjp.png"
              alt="Logo RSJPDHK"
              className="w-full h-full object-cover"
              onError={(e) => { e.currentTarget.src = '/placeholder.svg' }}
            />
          </div>
          <CardTitle className="text-xl">Login Admin</CardTitle>
          <p className="text-sm text-muted-foreground">Admin Survei Kepuasan<br />RS Jantung dan Pembuluh Darah Harapan Kita</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@rumahsakit.com"
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="mt-1"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Memproses..." : "Masuk"}
            </Button>

          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;
