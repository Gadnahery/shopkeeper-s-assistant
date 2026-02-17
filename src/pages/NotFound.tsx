import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const { language } = useLanguage();

  useEffect(() => {
    // Only log in development
    if (import.meta.env.DEV) {
      console.warn("404 Error: User attempted to access non-existent route:", location.pathname);
    }
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="text-center max-w-md">
        <h1 className="mb-2 text-6xl font-bold text-primary">404</h1>
        <p className="mb-6 text-lg text-muted-foreground">
          {language === "sw" ? "Ukurasa haukupatikana" : "Page not found"}
        </p>
        <p className="mb-6 text-sm text-muted-foreground">
          {language === "sw" ? "Kiungo unaotafutwa huenda kukosekana au kusogezwa." : "The link you followed may be broken or the page may have been moved."}
        </p>
        <Button asChild className="gap-2">
          <Link to="/dashboard">
            <Home className="h-4 w-4" />
            {language === "sw" ? "Rudi kwenye Dashibodi" : "Back to Dashboard"}
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
