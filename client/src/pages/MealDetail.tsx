import { useEffect, useState } from "react";
import { useMeal, useGenerateRecipe } from "@/hooks/use-meals";
import { useRoute } from "wouter";
import { Loader2, ArrowLeft, ShoppingCart, ChefHat, Sparkles, Check, Baby, Utensils } from "lucide-react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { type AIResponse } from "@shared/schema";

export default function MealDetail() {
  const [, params] = useRoute("/meal/:id");
  const mealId = parseInt(params?.id || "0");
  const { data: meal, isLoading } = useMeal(mealId);
  const generateRecipe = useGenerateRecipe();
  
  const [activeTab, setActiveTab] = useState<'instructions' | 'shopping' | 'tools'>('instructions');
  const [aiData, setAiData] = useState<AIResponse | null>(null);

  // Auto-generate recipe content when meal loads if not already there
  // In a real app we'd cache this in the generatedRecipes table.
  // For this demo, we'll let user click a button to save tokens, or auto-load.
  // Let's make it a button for "AI Chef Mode"
  
  const handleGenerate = () => {
    if (!meal) return;
    generateRecipe.mutate({
      mealId: meal.id,
      ageRange: (meal.ageRanges as string[])?.[0] || "5-9",
      dietaryFilters: (meal.dietaryFlags as string[]) || [],
    }, {
      onSuccess: (data) => setAiData(data)
    });
  };

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-12 h-12 text-primary animate-spin" />
    </div>
  );

  if (!meal) return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center p-4">
      <h2 className="text-3xl font-display font-bold mb-4">Meal not found 😕</h2>
      <Link href="/" className="btn-primary">Go Home</Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header Image Area */}
      <div className="relative h-[40vh] md:h-[50vh] bg-muted overflow-hidden">
        {meal.imageUrl ? (
          <img src={meal.imageUrl} alt={meal.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-accent/20">
            <span className="text-9xl">🥘</span>
          </div>
        )}
        
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-background via-transparent to-transparent opacity-90" />
        
        <Link href="/" className="absolute top-6 left-6 w-12 h-12 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors z-20">
          <ArrowLeft size={24} className="text-foreground" />
        </Link>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-32 relative z-10">
        <div className="bg-white rounded-[2.5rem] shadow-xl p-6 md:p-10 border border-border/50">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-8">
            <div>
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                  {meal.skillLevel}
                </span>
                <span className="bg-secondary/10 text-secondary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                  {meal.timeMinutes} MIN
                </span>
              </div>
              <h1 className="text-3xl md:text-5xl font-display font-black text-foreground mb-4 leading-tight">
                {meal.title}
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl">
                {meal.description}
              </p>
            </div>
            
            {!aiData && !generateRecipe.isPending && (
              <button 
                onClick={handleGenerate}
                className="btn-primary flex items-center gap-2 whitespace-nowrap shadow-xl shadow-primary/20 animate-bounce-subtle"
              >
                <Sparkles size={20} />
                <span>Ask AI Chef</span>
              </button>
            )}
          </div>

          {generateRecipe.isPending ? (
            <div className="py-20 text-center space-y-4">
              <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
              <h3 className="text-xl font-bold font-display animate-pulse">Consulting the tiny chefs...</h3>
              <p className="text-muted-foreground">Generating kid-friendly instructions just for you.</p>
            </div>
          ) : !aiData ? (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
               <div className="space-y-6">
                 <h3 className="text-2xl font-display font-bold">Ingredients</h3>
                 <ul className="space-y-3">
                   {(meal.ingredients as string[])?.map((ing, i) => (
                     <li key={i} className="flex items-start gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors">
                       <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                       <span className="font-medium text-foreground">{ing}</span>
                     </li>
                   ))}
                 </ul>
               </div>
               <div className="bg-accent/5 rounded-3xl p-6 border border-accent/10">
                 <div className="flex items-center gap-3 mb-4">
                   <div className="p-2 bg-accent rounded-xl text-accent-foreground">
                     <Baby size={24} />
                   </div>
                   <h3 className="text-xl font-display font-bold">Kid-Friendly Tips</h3>
                 </div>
                 <p className="text-muted-foreground leading-relaxed">
                   {meal.kidFriendlyNotes || "Click 'Ask AI Chef' above to get personalized adjustments for picky eaters, detailed step-by-step guides, and shopping lists!"}
                 </p>
               </div>
             </div>
          ) : (
            <div className="mt-8">
              {/* Tabs */}
              <div className="flex p-1 bg-muted/50 rounded-2xl mb-8 overflow-x-auto">
                {[
                  { id: 'instructions', label: 'Instructions', icon: ChefHat },
                  { id: 'shopping', label: 'Shopping List', icon: ShoppingCart },
                  { id: 'tools', label: 'Tools Needed', icon: Utensils }
                ].map((tab) => {
                  const Icon = tab.icon;
                  // @ts-ignore
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      // @ts-ignore
                      onClick={() => setActiveTab(tab.id)}
                      className={`
                        flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm transition-all whitespace-nowrap
                        ${isActive ? 'bg-white text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}
                      `}
                    >
                      <Icon size={18} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {activeTab === 'instructions' && (
                    <div className="space-y-8">
                      {/* Kid Adjustments */}
                      <div className="bg-secondary/10 border border-secondary/20 rounded-2xl p-6">
                        <h4 className="flex items-center gap-2 font-bold text-secondary mb-3">
                          <Baby size={20} />
                          For Picky Eaters
                        </h4>
                        <ul className="space-y-2">
                          {aiData.kidFriendlyAdjustments.map((adj, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm md:text-base font-medium text-foreground/80">
                              <Check size={16} className="text-secondary mt-1 flex-shrink-0" />
                              {adj}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Steps */}
                      <div className="space-y-6">
                        {aiData.instructions.map((step, i) => (
                          <div key={i} className="flex gap-4 group">
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 text-primary font-display font-bold text-lg flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                              {i + 1}
                            </div>
                            <p className="pt-2 text-lg text-foreground leading-relaxed">{step}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeTab === 'shopping' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {Object.entries(aiData.shoppingList).map(([category, items]) => (
                        items.length > 0 && (
                          <div key={category} className="bg-muted/30 rounded-2xl p-5">
                            <h4 className="font-display font-bold text-lg capitalize mb-3 text-muted-foreground">{category}</h4>
                            <ul className="space-y-2">
                              {items.map((item: string, i: number) => (
                                <li key={i} className="flex items-center gap-3">
                                  <div className="w-2 h-2 rounded-full bg-primary/40" />
                                  <span className="font-medium">{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )
                      ))}
                      
                      <div className="sm:col-span-2 mt-4 flex justify-center">
                        <a 
                          href={`https://www.instacart.com/store/s?k=${encodeURIComponent(meal.title)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-primary w-full sm:w-auto text-center"
                        >
                          Shop on Instacart
                        </a>
                      </div>
                    </div>
                  )}

                  {activeTab === 'tools' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {aiData.toolSuggestions.map((tool, i) => (
                        <a 
                          key={i}
                          href={`https://www.amazon.com/s?k=${encodeURIComponent(tool.name)}&tag=nomnomchow-20`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex flex-col p-5 rounded-2xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-all group"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold text-lg group-hover:text-primary transition-colors">{tool.name}</h4>
                            <ShoppingCart size={18} className="text-muted-foreground group-hover:text-primary" />
                          </div>
                          <p className="text-sm text-muted-foreground">{tool.why}</p>
                        </a>
                      ))}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
