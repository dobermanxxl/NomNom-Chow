import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Navigation } from "@/components/Navigation";
import { AnimatePresence, motion } from "framer-motion";

// Pages
import Home from "@/pages/Home";
import MealDetail from "@/pages/MealDetail";
import Fridge from "@/pages/Fridge";
import Favorites from "@/pages/Favorites";
import Admin from "@/pages/Admin";
import StarterKitchen from "@/pages/StarterKitchen";
import WeeklyPlan from "@/pages/WeeklyPlan";
import NotFound from "@/pages/not-found";

function Router() {
  const [location] = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Switch location={location} key={location}>
        <Route path="/" component={Home} />
        <Route path="/meal/:id" component={MealDetail} />
        <Route path="/fridge" component={Fridge} />
        <Route path="/favorites" component={Favorites} />
        <Route path="/starter-kitchen" component={StarterKitchen} />
        <Route path="/plan" component={WeeklyPlan} />
        <Route path="/admin" component={Admin} />
        <Route component={NotFound} />
      </Switch>
    </AnimatePresence>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="bg-background min-h-screen text-foreground font-sans selection:bg-primary/20">
          <Router />
          <Navigation />
          <Toaster />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
