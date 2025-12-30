import { Link, useLocation } from "wouter";
import { UtensilsCrossed, ChefHat, Search, Lock, Heart, Calendar, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export function Navigation() {
  const [location] = useLocation();

  const links = [
    { href: "/", label: "Meals", icon: UtensilsCrossed },
    { href: "/fridge", label: "My Fridge", icon: Search },
    { href: "/plan", label: "Plan", icon: Calendar },
    { href: "/favorites", label: "Faves", icon: Heart },
    { href: "/starter-kitchen", label: "Kitchen", icon: ShoppingBag },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-lg border-t border-border shadow-[0_-5px_20px_rgba(0,0,0,0.05)] md:sticky md:top-0 md:border-b md:border-t-0">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          
          {/* Logo */}
          <Link href="/" className="hidden md:flex items-center space-x-2 group">
            <div className="bg-primary p-2 rounded-xl text-white transform group-hover:rotate-12 transition-transform duration-300">
              <ChefHat size={28} strokeWidth={2.5} />
            </div>
            <div className="flex flex-col">
              <span className="font-display font-bold text-xl text-foreground leading-none">Nom Nom</span>
              <span className="font-handwriting text-2xl text-primary -mt-1 leading-none">Chow</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-1">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = location === link.href;
              return (
                <Link key={link.href} href={link.href} className={cn(
                  "flex items-center space-x-2 px-5 py-2.5 rounded-2xl font-display font-medium transition-all duration-200",
                  isActive 
                    ? "bg-secondary/15 text-secondary" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}>
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
            <Link href="/admin" className="ml-4 p-2.5 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
              <Lock size={18} />
            </Link>
          </div>

          {/* Mobile Nav */}
          <div className="md:hidden flex items-center justify-around w-full">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = location === link.href;
              return (
                <Link key={link.href} href={link.href} className="flex flex-col items-center p-2 min-w-[64px]">
                  <motion.div 
                    whileTap={{ scale: 0.9 }}
                    className={cn(
                      "p-2 rounded-xl transition-colors",
                      isActive ? "bg-secondary/15 text-secondary" : "text-muted-foreground"
                    )}
                  >
                    <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                  </motion.div>
                  <span className={cn(
                    "text-[10px] font-bold mt-1",
                    isActive ? "text-secondary" : "text-muted-foreground"
                  )}>
                    {link.label}
                  </span>
                </Link>
              );
            })}
          </div>

        </div>
      </div>
    </nav>
  );
}
