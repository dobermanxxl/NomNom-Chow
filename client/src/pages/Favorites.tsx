import { Link } from "wouter";
import { Heart } from "lucide-react";

export default function Favorites() {
  // NOTE: In a real app, this would read from localStorage or a user DB table.
  // For this static demo, we'll show an empty state to demonstrate the UI.
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
      <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6 text-primary animate-pulse">
        <Heart size={48} strokeWidth={2.5} />
      </div>
      
      <h1 className="text-3xl md:text-4xl font-display font-black mb-4">No Favorites Yet</h1>
      <p className="text-lg text-muted-foreground max-w-md mb-8">
        Tap the heart icon on any meal to save it here for quick access later!
      </p>
      
      <Link href="/" className="btn-primary">
        Start Exploring
      </Link>
    </div>
  );
}
