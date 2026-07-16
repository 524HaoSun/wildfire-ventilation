/** Instrumented Architectural Modernism: application boundary and stale-cache recovery. */
import { useEffect } from "react";
import { Route, Switch } from "wouter";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "@/components/ErrorBoundary";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Home from "@/pages/Home";
import NotFound from "@/pages/NotFound";

function App() {
  useEffect(() => {
    const retireLegacyOfflineCache = async () => {
      if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((registration) => registration.unregister()));
      }
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.filter((key) => key.startsWith("cave-workbench")).map((key) => caches.delete(key)));
      }
    };
    void retireLegacyOfflineCache();
  }, []);
  return <ErrorBoundary><ThemeProvider defaultTheme="light"><TooltipProvider><Switch><Route path="/" component={Home} /><Route component={NotFound} /></Switch><Toaster position="bottom-right" /></TooltipProvider></ThemeProvider></ErrorBoundary>;
}
export default App;
