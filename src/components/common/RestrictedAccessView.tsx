import { useLocation, useNavigate } from "react-router-dom";
import { ShieldAlert, Lock, ArrowLeft, Home, HelpCircle, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { PAGE_PATHS } from "@/hooks/useUserPageAccess";

interface RestrictedAccessViewProps {
  pathname?: string;
  moduleName?: string;
}

export function RestrictedAccessView({ pathname, moduleName }: RestrictedAccessViewProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  
  let language = "en";
  try {
    const langContext = useLanguage();
    if (langContext?.language) {
      language = langContext.language;
    }
  } catch {
    language = "en";
  }

  const isDeactivated = moduleName === "DEACTIVATED";
  const currentPath = pathname || location.pathname;
  const pageMeta = (PAGE_PATHS || []).find((p) => p.path === currentPath);
  const resolvedModuleName = isDeactivated
    ? (language === "sw" ? "Akaunti Haipo" : "Account Does Not Exist")
    : moduleName || pageMeta?.label || currentPath.replace("/", "").toUpperCase();

  const handleSignOut = async () => {
    try {
      await signOut();
    } finally {
      navigate("/login", { replace: true });
    }
  };

  return (
    <div className="flex min-h-[70vh] w-full items-center justify-center p-4 md:p-8 animate-in fade-in-50 duration-300">
      <Card className="w-full max-w-2xl border-rose-500/20 bg-card/95 backdrop-blur-md shadow-2xl relative overflow-hidden text-center">
        {/* Ambient background glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 right-10 w-72 h-72 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <CardContent className="pt-12 pb-10 px-6 sm:px-12 relative z-10 flex flex-col items-center">
          {/* Large Shield / Lock Icon */}
          <div className="relative mb-6">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500 shadow-inner">
              <ShieldAlert className="w-12 h-12 sm:w-14 sm:h-14 stroke-[1.75]" />
            </div>
            <div className="absolute -bottom-2 -right-2 bg-background border border-border p-2 rounded-xl shadow-md text-amber-500">
              <Lock className="w-5 h-5" />
            </div>
          </div>

          {/* Section Badge */}
          <Badge
            variant="outline"
            className="mb-4 bg-rose-500/10 text-rose-500 border-rose-500/30 text-xs px-3 py-1 font-semibold uppercase tracking-wider rounded-full"
          >
            {resolvedModuleName}
          </Badge>

          {/* Huge Restriction Headline */}
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground mb-3">
            {isDeactivated
              ? (language === "sw" ? "Akaunti Hii Haipo au Imefutwa" : "Account Does Not Exist or Has Been Deleted")
              : (language === "sw" ? "Ufikiaji Umezuiwa" : "Access Restricted")}
          </h1>

          {/* Restriction Message */}
          <p className="text-base sm:text-lg text-muted-foreground max-w-lg mb-8 leading-relaxed">
            {isDeactivated
              ? (language === "sw"
                  ? "Akaunti hii haipo kwenye mfumo au imefutwa kwenye duka hili na msimamizi. Huna idhini ya kuingia au kufikia sehemu hii."
                  : "This account does not exist or has been deleted from this shop by the administrator. You cannot log in or access this workspace.")
              : (language === "sw"
                  ? "Huruhusiwi kufikia ukurasa huu. Msimamizi wa duka lako hajakupa ruhusa ya kutazama au kutumia sehemu hii."
                  : "You are not allowed to access this page. Your administrator has not granted your account permission to view or manage this section.")}
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            {isDeactivated ? (
              <Button
                size="lg"
                className="w-full sm:w-auto gap-2 font-semibold shadow-md"
                onClick={handleSignOut}
              >
                <ArrowLeft className="w-4 h-4" />
                {language === "sw" ? "Rudi Kwenye Kuingia" : "Back to Login"}
              </Button>
            ) : (
              <>
                <Button
                  size="lg"
                  className="w-full sm:w-auto gap-2 font-semibold shadow-md"
                  onClick={() => navigate("/dashboard")}
                >
                  <Home className="w-4 h-4" />
                  {language === "sw" ? "Rudi kwenye Dashibodi" : "Return to Dashboard"}
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto gap-2 text-muted-foreground hover:text-foreground"
                  onClick={() => navigate(-1)}
                >
                  <ArrowLeft className="w-4 h-4" />
                  {language === "sw" ? "Rudi Nyuma" : "Go Back"}
                </Button>
              </>
            )}
          </div>

          {/* Helpful Footer Notice */}
          {!isDeactivated && (
            <div className="mt-8 pt-6 border-t border-border/60 w-full flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <HelpCircle className="w-3.5 h-3.5 shrink-0" />
              <span>
                {language === "sw"
                  ? "Ikiwa una maswali au unahitaji ufikiaji, wasiliana na mwenye akaunti / mmiliki wa duka."
                  : "If you need access or believe this is an error, please contact your shop owner or administrator."}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

