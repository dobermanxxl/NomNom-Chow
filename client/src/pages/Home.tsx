import { useState } from "react";
import { useMeals } from "@/hooks/use-meals";
import { MealCard } from "@/components/MealCard";
import { Filters } from "@/components/Filters";
import { Search, SlidersHorizontal, Sparkles } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const [showFilters, setShowFilters] = useState(false);
  const [search, setSearch] = useState("");
  const [activeFilters, setActiveFilters] = useState({
    ageRange: undefined,
    diet: undefined,
    cuisine: undefined,
    timeLimit: undefined,
  });

  const { data: meals, isLoading, error } = useMeals({
    ...activeFilters,
    search: search || undefined
  });

  const handleFilterChange = (key: string, value: string | undefined) => {
    setActiveFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="min-h-screen pb-24">
      {/* Hero Section */}
      <div className="bg-primary/5 border-b border-primary/10">
        <div className="max-w-7xl mx-auto px-4 pt-12 pb-8 md:pt-20 md:pb-12 text-center">
          <h1 className="text-4xl md:text-6xl font-display font-black text-foreground mb-4">
            Meals kids <span className="text-primary inline-block transform -rotate-2">actually</span> eat.
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 font-medium">
            Discover parent-approved recipes that make dinner time fun, healthy, and completely stress-free.
          </p>

          <div className="flex flex-col md:flex-row gap-4 max-w-xl mx-auto">
            <div className="relative flex-grow group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={20} />
              <input 
                type="text"
                placeholder="Search specifically (e.g. 'pasta')"
                className="w-full pl-11 pr-4 py-4 rounded-2xl border-2 border-transparent bg-white shadow-lg shadow-primary/5 focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all font-medium text-lg placeholder:font-normal"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`
                flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-bold transition-all shadow-lg
                ${showFilters 
                  ? "bg-secondary text-white shadow-secondary/20" 
                  : "bg-white text-foreground hover:bg-white/80 shadow-black/5"}
              `}
            >
              <SlidersHorizontal size={20} />
              <span>Filters</span>
            </button>
          </div>
        </div>
      </div>

      <Filters 
        isOpen={showFilters} 
        onClose={() => setShowFilters(false)}
        filters={activeFilters}
        onChange={handleFilterChange}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-96 rounded-[2rem] bg-black/5 animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <div className="inline-block p-4 rounded-full bg-destructive/10 text-destructive mb-4">
              <Sparkles size={32} />
            </div>
            <h2 className="text-2xl font-bold mb-2">Oops! Something went wrong.</h2>
            <p className="text-muted-foreground">We couldn't load the meals. Please try again.</p>
          </div>
        ) : meals?.length === 0 ? (
          <div className="text-center py-20">
            <h2 className="text-3xl font-display font-bold mb-4">No meals found! 🥕</h2>
            <p className="text-muted-foreground text-lg mb-8">
              Try adjusting your filters or search for something else.
            </p>
            <button 
              onClick={() => {
                setSearch("");
                setActiveFilters({ ageRange: undefined, diet: undefined, cuisine: undefined, timeLimit: undefined });
              }}
              className="btn-primary"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-foreground">Popular Picks</h2>
              <span className="text-muted-foreground font-medium">{meals?.length} delicious ideas</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {meals?.map((meal) => (
                <MealCard key={meal.id} meal={meal} />
              ))}
            </div>
            
            <div className="mt-20 bg-accent/10 rounded-[2.5rem] p-8 md:p-12 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full opacity-10" style={{ 
                backgroundImage: "radial-gradient(circle, #000 1px, transparent 1px)", 
                backgroundSize: "20px 20px" 
              }} />
              <div className="relative z-10">
                <h2 className="text-3xl md:text-4xl font-display font-black mb-4 text-accent-foreground">
                  Need more ideas?
                </h2>
                <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
                  Tell us what's in your fridge and our AI chef will whip up a custom recipe just for you!
                </p>
                <Link href="/fridge" className="btn-secondary inline-flex items-center gap-2">
                  <Sparkles size={20} />
                  <span>Check My Fridge</span>
                </Link>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
