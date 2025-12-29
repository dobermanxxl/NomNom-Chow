import { useState } from "react";
import { useSuggestMeals } from "@/hooks/use-meals";
import { Plus, X, Sparkles, Loader2, ArrowRight } from "lucide-react";
import { MealCard } from "@/components/MealCard";
import { motion, AnimatePresence } from "framer-motion";

export default function Fridge() {
  const [ingredient, setIngredient] = useState("");
  const [ingredients, setIngredients] = useState<string[]>([]);
  const suggestMeals = useSuggestMeals();

  const addIngredient = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (ingredient.trim() && !ingredients.includes(ingredient.trim())) {
      setIngredients([...ingredients, ingredient.trim()]);
      setIngredient("");
    }
  };

  const removeIngredient = (ing: string) => {
    setIngredients(ingredients.filter(i => i !== ing));
  };

  const handleSuggest = () => {
    if (ingredients.length > 0) {
      suggestMeals.mutate(ingredients);
    }
  };

  return (
    <div className="min-h-screen pb-24 px-4 py-8 md:py-12 max-w-7xl mx-auto">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h1 className="text-4xl font-display font-black mb-4">What's in your fridge?</h1>
        <p className="text-lg text-muted-foreground">
          Enter 3+ ingredients you have, and we'll find something yummy to make.
        </p>
      </div>

      <div className="max-w-xl mx-auto mb-16">
        <form onSubmit={addIngredient} className="relative mb-6">
          <input
            type="text"
            value={ingredient}
            onChange={(e) => setIngredient(e.target.value)}
            placeholder="e.g. Chicken, Broccoli, Rice..."
            className="w-full pl-6 pr-14 py-4 rounded-2xl border-2 border-border bg-white focus:outline-none focus:border-secondary focus:ring-4 focus:ring-secondary/10 transition-all font-medium text-lg"
          />
          <button 
            type="submit"
            disabled={!ingredient.trim()}
            className="absolute right-2 top-2 p-2 bg-secondary text-white rounded-xl hover:bg-secondary/90 disabled:opacity-50 disabled:hover:bg-secondary transition-colors"
          >
            <Plus size={24} />
          </button>
        </form>

        <div className="flex flex-wrap gap-2 mb-8 min-h-[40px]">
          <AnimatePresence>
            {ingredients.map((ing) => (
              <motion.span
                key={ing}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-border rounded-xl font-bold text-foreground shadow-sm"
              >
                {ing}
                <button 
                  onClick={() => removeIngredient(ing)}
                  className="p-0.5 hover:bg-destructive/10 hover:text-destructive rounded-full transition-colors"
                >
                  <X size={14} />
                </button>
              </motion.span>
            ))}
          </AnimatePresence>
          {ingredients.length === 0 && (
            <span className="text-muted-foreground italic w-full text-center">No ingredients added yet...</span>
          )}
        </div>

        <button
          onClick={handleSuggest}
          disabled={ingredients.length < 1 || suggestMeals.isPending}
          className="w-full btn-primary py-4 text-xl flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {suggestMeals.isPending ? (
            <Loader2 className="animate-spin" />
          ) : (
            <Sparkles />
          )}
          {suggestMeals.isPending ? "Cooking up ideas..." : "Find Recipes"}
        </button>
      </div>

      {suggestMeals.isSuccess && suggestMeals.data && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <div className="flex items-center gap-4">
            <div className="h-px flex-grow bg-border" />
            <h2 className="font-display font-bold text-2xl text-foreground">We found these matches!</h2>
            <div className="h-px flex-grow bg-border" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {suggestMeals.data.map((meal) => (
              <MealCard key={meal.id} meal={meal} />
            ))}
          </div>

          {suggestMeals.data.length === 0 && (
            <div className="text-center py-12 bg-muted/30 rounded-[2rem]">
              <p className="text-xl font-medium text-muted-foreground mb-4">
                Hmm, that's a tricky combo. We couldn't find exact matches.
              </p>
              <button onClick={() => setIngredients([])} className="text-primary font-bold hover:underline">
                Try different ingredients?
              </button>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
