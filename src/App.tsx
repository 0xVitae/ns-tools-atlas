import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { LoginPage, AuthLoading } from "@/components/LoginPage";
import Index from "./pages/Index";
import Data from "./pages/Data";
import Graveyard from "./pages/Graveyard";
import Requests from "./pages/Requests";
import Pending from "./pages/Pending";
import Admin from "./pages/Admin";
import Callback from "./pages/Callback";
import NotFound from "./pages/NotFound";
import OverlayV1 from "./pages/OverlayV1";
import OverlayV2 from "./pages/OverlayV2";
import OverlayV3 from "./pages/OverlayV3";

const queryClient = new QueryClient();

function AuthenticatedApp() {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) return <AuthLoading />;
  if (!isAuthenticated) return <LoginPage />;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/data" element={<Data />} />
        <Route path="/graveyard" element={<Graveyard />} />
        <Route path="/requests" element={<Requests />} />
        <Route path="/pending" element={<Pending />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/callback" element={<Callback />} />
        <Route path="/overlay-v1" element={<OverlayV1 />} />
        <Route path="/overlay-v2" element={<OverlayV2 />} />
        <Route path="/overlay-v3" element={<OverlayV3 />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthenticatedApp />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
