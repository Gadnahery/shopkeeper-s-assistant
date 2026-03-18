import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Mail } from "lucide-react";
import { requestPasswordReset } from "@/lib/passwordRecovery";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const message = await requestPasswordReset(email, "en");
      toast.success(message);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not send reset email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-[radial-gradient(circle_at_top,rgba(20,184,166,0.12),transparent_30%)] bg-background p-4">
      <Card className="w-full max-w-md rounded-[2rem] border border-border/60 bg-card/90 shadow-[0_28px_80px_-42px_rgba(15,23,42,0.55)] backdrop-blur-xl">
        <CardHeader className="space-y-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Mail className="h-6 w-6" />
          </div>
          <div>
            <CardTitle className="text-2xl">Forgot password</CardTitle>
            <p className="mt-2 text-sm text-muted-foreground">
              Enter your email and we will send you a reset link.
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="h-12 rounded-2xl"
                required
              />
            </div>
            <Button type="submit" className="h-12 w-full rounded-2xl" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send reset link"}
            </Button>
            <p className="text-xs text-muted-foreground">
              For security, you can request another reset link after about one minute.
            </p>
            <p className="text-center text-sm text-muted-foreground">
              <Link className="inline-flex items-center gap-2 text-primary hover:underline" to="/login">
                <ArrowLeft className="h-4 w-4" />
                Back to login
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
