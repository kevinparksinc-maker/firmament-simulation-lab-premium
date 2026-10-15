import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Home } from "lucide-react";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();

  const handleGoHome = () => {
    setLocation("/");
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#050b19] via-[#15234c] to-[#050b19]">
      <Card className="w-full max-w-lg mx-4 shadow-2xl border border-amber-200/30 bg-[#0d1933]/90 backdrop-blur-sm">
        <CardContent className="pt-8 pb-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-amber-200/10 rounded-full animate-pulse" />
              <AlertCircle className="relative h-16 w-16 text-amber-200" />
            </div>
          </div>

          <h1 className="text-4xl font-bold text-amber-100 mb-2">404</h1>

          <h2 className="text-xl font-semibold text-slate-100 mb-4">
            Page Not Found
          </h2>

          <p className="text-slate-300 mb-8 leading-relaxed">
            Sorry, the page you are looking for doesn't exist.
            <br />
            It may have been moved or deleted.
          </p>

          <div
            id="not-found-button-group"
            className="flex flex-col sm:flex-row gap-3 justify-center"
          >
            <Button
              onClick={handleGoHome}
              className="bg-gradient-to-r from-amber-200 to-cyan-200 hover:from-amber-100 hover:to-cyan-100 text-slate-950 px-6 py-2.5 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
