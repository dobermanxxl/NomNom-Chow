import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface FiltersProps {
  filters: {
    ageRange?: string;
    diet?: string;
    cuisine?: string;
    timeLimit?: string;
  };
  onChange: (key: string, value: string | undefined) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function Filters({ filters, onChange, isOpen, onClose }: FiltersProps) {
  const categories = [
    {
      id: "ageRange",
      label: "Age Range",
      options: ["Toddler (1-3)", "Preschool (3-5)", "Big Kid (5-9)", "Pre-teen (10+)"]
    },
    {
      id: "diet",
      label: "Dietary Need",
      options: ["Vegetarian", "Vegan", "Gluten-Free", "Nut-Free", "Dairy-Free"]
    },
    {
      id: "cuisine",
      label: "Cuisine",
      options: ["Italian", "Mexican", "Asian", "American", "Mediterranean"]
    },
    {
      id: "timeLimit",
      label: "Time Limit",
      options: ["15 min", "30 min", "45 min", "60+ min"]
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="overflow-hidden border-b border-border bg-white"
        >
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-display text-xl font-bold text-foreground">Filter Meals</h3>
              <button onClick={onClose} className="p-2 hover:bg-muted rounded-full">
                <X size={20} />
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {categories.map((category) => (
                <div key={category.id} className="space-y-3">
                  <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                    {category.label}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {category.options.map((option) => {
                      // @ts-ignore
                      const isActive = filters[category.id] === option;
                      return (
                        <button
                          key={option}
                          onClick={() => onChange(category.id, isActive ? undefined : option)}
                          className={`
                            px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200
                            ${isActive 
                              ? "bg-primary text-white shadow-md shadow-primary/25 scale-105" 
                              : "bg-muted/50 text-foreground hover:bg-muted hover:scale-105"}
                          `}
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-8 flex justify-end">
              <button 
                onClick={() => {
                  onChange("ageRange", undefined);
                  onChange("diet", undefined);
                  onChange("cuisine", undefined);
                  onChange("timeLimit", undefined);
                }}
                className="text-sm text-muted-foreground hover:text-destructive transition-colors font-medium"
              >
                Clear all filters
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
