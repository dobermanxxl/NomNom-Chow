import { type Meal } from "@shared/schema";
import { Clock, Users, ArrowRight, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "wouter";

interface MealCardProps {
  meal: Meal;
  compact?: boolean;
}

export function MealCard({ meal, compact = false }: MealCardProps) {
  // Use meal.imageUrl if available, or a nice colorful placeholder
  const placeholderGradient = `linear-gradient(135deg, hsl(${meal.id * 45 % 360} 70% 85%), hsl(${meal.id * 45 % 360} 70% 95%))`;
  
  return (
    <Link href={`/meal/${meal.id}`} className="group block h-full">
      <article className={cn(
        "bg-white rounded-[2rem] border border-border overflow-hidden h-full flex flex-col transition-all duration-300",
        "hover:shadow-xl hover:-translate-y-1 hover:border-primary/30 group-focus:ring-2 group-focus:ring-primary group-focus:ring-offset-2",
        compact ? "p-4" : "p-0"
      )}>
        {/* Image Area */}
        {!compact && (
          <div className="aspect-[4/3] overflow-hidden relative bg-muted">
            {meal.imageUrl ? (
              <img 
                src={meal.imageUrl} 
                alt={meal.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center" style={{ background: placeholderGradient }}>
                <span className="text-6xl animate-pulse">🥘</span>
              </div>
            )}
            
            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-bold text-foreground shadow-sm border border-black/5">
              {meal.skillLevel}
            </div>
            
            {meal.dietaryFlags && (meal.dietaryFlags as string[]).length > 0 && (
              <div className="absolute top-4 left-4 flex gap-1">
                {(meal.dietaryFlags as string[]).slice(0, 2).map((flag) => (
                  <span key={flag} className="bg-secondary/90 backdrop-blur-sm text-white text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-full shadow-sm">
                    {flag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Content Area */}
        <div className={cn("flex flex-col flex-grow", compact ? "" : "p-6")}>
          <div className="flex justify-between items-start mb-2">
            <h3 className={cn("font-display font-bold text-foreground leading-tight group-hover:text-primary transition-colors", compact ? "text-lg" : "text-xl")}>
              {meal.title}
            </h3>
          </div>
          
          <p className={cn("text-muted-foreground mb-4 line-clamp-2", compact ? "text-xs" : "text-sm")}>
            {meal.description || "A delicious meal perfect for the whole family."}
          </p>
          
          <div className="mt-auto flex items-center justify-between text-sm font-medium text-muted-foreground">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <Clock size={16} className="text-primary" />
                <span>{meal.timeMinutes}m</span>
              </div>
              {!compact && (
                <div className="flex items-center gap-1.5">
                  <Users size={16} className="text-secondary" />
                  <span>{(meal.ageRanges as string[])?.[0] || "All ages"}</span>
                </div>
              )}
            </div>
            
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors duration-300">
              <ArrowRight size={16} strokeWidth={2.5} />
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
