import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowLeft, Calendar, RefreshCw, ShoppingCart, ChefHat, Check, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import { type Meal } from "@shared/schema";
import { type AffiliateTool } from "@shared/routes";
import { Button } from "@/components/ui/button";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const AMAZON_TAG = "nomnomchow-20";

function buildAmazonUrl(tool: AffiliateTool): string {
  if (tool.asin) {
    return `https://www.amazon.com/dp/${tool.asin}?tag=${AMAZON_TAG}`;
  }
  return `https://www.amazon.com/s?k=${encodeURIComponent(tool.searchQuery)}&tag=${AMAZON_TAG}`;
}

export default function WeeklyPlan() {
  const [preferences, setPreferences] = useState({
    pickyEaterOnly: false,
    glutenFree: false,
    maxTime: 45
  });
  const [plan, setPlan] = useState<(Meal | null)[]>(Array(7).fill(null));
  const [showPlan, setShowPlan] = useState(false);

  const { data: meals } = useQuery<Meal[]>({
    queryKey: ['/api/meals']
  });

  const { data: tools } = useQuery<AffiliateTool[]>({
    queryKey: ['/api/affiliate/tools'],
    enabled: showPlan
  });

  const generatePlan = () => {
    if (!meals || meals.length === 0) return;
    
    let filtered = [...meals];
    
    if (preferences.pickyEaterOnly) {
      filtered = filtered.filter(m => 
        (m.tags as string[])?.includes('picky-eater-approved') ||
        m.skillLevel === 'Easy'
      );
    }
    
    if (preferences.glutenFree) {
      filtered = filtered.filter(m => 
        (m.dietaryFlags as string[])?.includes('Gluten-Free') ||
        (m.dietaryFlags as string[])?.includes('gluten-free')
      );
    }
    
    if (preferences.maxTime) {
      filtered = filtered.filter(m => m.timeMinutes <= preferences.maxTime);
    }

    const shuffled = filtered.sort(() => Math.random() - 0.5);
    const newPlan = DAYS.map((_, i) => shuffled[i % shuffled.length] || null);
    setPlan(newPlan);
    setShowPlan(true);
  };

  const regenerateDay = (index: number) => {
    if (!meals) return;
    const available = meals.filter(m => !plan.some(p => p?.id === m.id));
    if (available.length > 0) {
      const newMeal = available[Math.floor(Math.random() * available.length)];
      const newPlan = [...plan];
      newPlan[index] = newMeal;
      setPlan(newPlan);
    }
  };

  const allIngredients = plan
    .filter(Boolean)
    .flatMap(m => (m?.ingredients as string[]) || [])
    .filter((v, i, a) => a.indexOf(v) === i);

  const topTools = tools?.filter(t => t.isTopPick).slice(0, 6) || [];

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="bg-gradient-to-br from-secondary/10 via-primary/5 to-background py-12 md:py-20 border-b border-border">
        <div className="max-w-5xl mx-auto px-4">
          <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ArrowLeft size={18} /> Back to Meals
          </Link>
          <h1 className="text-4xl md:text-5xl font-display font-black text-foreground mb-4">
            Weekly Meal Plan
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl">
            Let us pick 7 family-friendly dinners for the week. Customize your preferences and we'll 
            create a plan with a combined shopping list.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-12">
        {!showPlan ? (
          <div className="max-w-xl mx-auto space-y-8">
            <div className="bg-white dark:bg-card rounded-3xl p-8 border border-border shadow-sm">
              <h2 className="text-2xl font-display font-bold mb-6">Your Preferences</h2>
              
              <div className="space-y-6">
                <label className="flex items-center gap-4 p-4 rounded-xl border border-border hover:border-primary/50 transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.pickyEaterOnly}
                    onChange={(e) => setPreferences(p => ({ ...p, pickyEaterOnly: e.target.checked }))}
                    className="w-5 h-5 rounded border-border text-primary"
                    data-testid="checkbox-picky-eater"
                  />
                  <div>
                    <span className="font-bold block">Picky Eater Friendly</span>
                    <span className="text-sm text-muted-foreground">Simple flavors, familiar textures</span>
                  </div>
                </label>

                <label className="flex items-center gap-4 p-4 rounded-xl border border-border hover:border-primary/50 transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.glutenFree}
                    onChange={(e) => setPreferences(p => ({ ...p, glutenFree: e.target.checked }))}
                    className="w-5 h-5 rounded border-border text-primary"
                    data-testid="checkbox-gluten-free"
                  />
                  <div>
                    <span className="font-bold block">Gluten-Free Only</span>
                    <span className="text-sm text-muted-foreground">No wheat, barley, or rye</span>
                  </div>
                </label>

                <div className="p-4 rounded-xl border border-border">
                  <label className="font-bold block mb-3">Max Cook Time</label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="15"
                      max="60"
                      step="5"
                      value={preferences.maxTime}
                      onChange={(e) => setPreferences(p => ({ ...p, maxTime: parseInt(e.target.value) }))}
                      className="flex-1"
                      data-testid="slider-max-time"
                    />
                    <span className="font-bold text-primary w-20 text-right">{preferences.maxTime} min</span>
                  </div>
                </div>
              </div>

              <Button
                onClick={generatePlan}
                size="lg"
                className="w-full mt-8"
                data-testid="button-generate-plan"
              >
                <Calendar size={20} className="mr-2" />
                Generate This Week's Plan
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-12">
            <section>
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <h2 className="text-2xl font-display font-bold">This Week's Plan</h2>
                <Button variant="outline" onClick={generatePlan} data-testid="button-regenerate-all">
                  <RefreshCw size={16} className="mr-2" /> Start Over
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {DAYS.map((day, i) => {
                  const meal = plan[i];
                  return (
                    <motion.div
                      key={day}
                      className="bg-white dark:bg-card rounded-2xl border border-border overflow-hidden"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <div className="p-3 bg-primary/5 border-b border-border">
                        <span className="font-bold text-sm">{day}</span>
                      </div>
                      {meal ? (
                        <>
                          <div className="aspect-square bg-muted/30">
                            {meal.imageUrl ? (
                              <img src={meal.imageUrl} alt={meal.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <ChefHat className="w-12 h-12 text-muted-foreground/30" />
                              </div>
                            )}
                          </div>
                          <div className="p-4">
                            <Link href={`/meal/${meal.id}`}>
                              <h3 className="font-bold hover:text-primary transition-colors line-clamp-2">{meal.title}</h3>
                            </Link>
                            <p className="text-xs text-muted-foreground mt-1">{meal.timeMinutes} min</p>
                            <button
                              onClick={() => regenerateDay(i)}
                              className="text-xs text-primary font-medium mt-2 flex items-center gap-1 hover:underline"
                              data-testid={`button-swap-${day.toLowerCase()}`}
                            >
                              <RefreshCw size={12} /> Swap
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="p-4 text-center text-muted-foreground">
                          <p className="text-sm">No meal assigned</p>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </section>

            {topTools.length > 0 && (
              <section className="bg-muted/20 rounded-3xl p-6 border border-border">
                <h3 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
                  <ChefHat size={20} /> Tools That Help This Week
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  {topTools.map(tool => (
                    <a
                      key={tool.id}
                      href={buildAmazonUrl(tool)}
                      target="_blank"
                      rel="nofollow sponsored noopener noreferrer"
                      className="bg-white dark:bg-card p-4 rounded-xl border border-border hover:border-primary/50 transition-all text-center"
                      data-testid={`link-plan-tool-${tool.id}`}
                    >
                      <p className="font-bold text-sm line-clamp-2">{tool.title}</p>
                      <span className="text-xs text-primary flex items-center justify-center gap-1 mt-2">
                        View <ExternalLink size={10} />
                      </span>
                    </a>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground text-center mt-4">
                  As an Amazon Associate I earn from qualifying purchases.
                </p>
              </section>
            )}

            <section className="bg-white dark:bg-card rounded-3xl p-8 border border-border">
              <h3 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
                <ShoppingCart size={20} /> Combined Shopping List
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {allIngredients.map((ingredient, i) => (
                  <label key={i} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/30 cursor-pointer">
                    <input type="checkbox" className="rounded" />
                    <span className="text-sm">{ingredient}</span>
                  </label>
                ))}
              </div>
              {allIngredients.length > 0 && (
                <div className="mt-6 flex flex-wrap gap-3">
                  <Button
                    variant="outline"
                    onClick={() => navigator.clipboard.writeText(allIngredients.join('\n'))}
                    data-testid="button-copy-list"
                  >
                    Copy List
                  </Button>
                  <a
                    href={`https://www.instacart.com/store/s?k=${encodeURIComponent(allIngredients.slice(0, 5).join(' '))}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Button data-testid="button-shop-instacart">
                      Shop on Instacart
                    </Button>
                  </a>
                </div>
              )}
            </section>
          </div>
        )}

        <div className="mt-8 text-center">
          <Link href="/starter-kitchen" className="text-primary hover:underline font-medium">
            Build your starter kitchen
          </Link>
        </div>
      </div>
    </div>
  );
}
