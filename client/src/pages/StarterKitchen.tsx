import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowLeft, ExternalLink, Star, ChefHat, Baby } from "lucide-react";
import { motion } from "framer-motion";
import { type AffiliateTool } from "@shared/routes";

const AMAZON_TAG = "nomnomchow-20";

function buildAmazonUrl(tool: AffiliateTool): string {
  if (tool.asin) {
    return `https://www.amazon.com/dp/${tool.asin}?tag=${AMAZON_TAG}`;
  }
  return `https://www.amazon.com/s?k=${encodeURIComponent(tool.searchQuery)}&tag=${AMAZON_TAG}`;
}

function ToolCard({ tool, isTopPick = false }: { tool: AffiliateTool; isTopPick?: boolean }) {
  const handleClick = () => {
    fetch('/api/affiliate/click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toolId: tool.id, page: 'starter-kitchen' })
    }).catch(() => {});
  };

  return (
    <motion.a
      href={buildAmazonUrl(tool)}
      target="_blank"
      rel="nofollow sponsored noopener noreferrer"
      onClick={handleClick}
      data-testid={`link-tool-${tool.id}`}
      className={`
        flex flex-col rounded-2xl border border-border bg-white dark:bg-card overflow-hidden
        hover:border-primary/50 hover:shadow-lg transition-all
        ${isTopPick ? 'md:col-span-2 md:flex-row' : ''}
      `}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className={`bg-muted/30 flex items-center justify-center ${isTopPick ? 'p-8 md:w-1/3' : 'p-6'}`}>
        <div className={`${isTopPick ? 'w-20 h-20' : 'w-16 h-16'} rounded-full bg-primary/10 flex items-center justify-center`}>
          <ChefHat className={`${isTopPick ? 'w-10 h-10' : 'w-8 h-8'} text-primary`} />
        </div>
      </div>
      <div className={`p-5 flex flex-col flex-1 ${isTopPick ? 'md:p-6' : ''}`}>
        {isTopPick && (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-primary mb-2">
            <Star size={12} className="fill-primary" /> Top Pick
          </span>
        )}
        <h3 className={`font-display font-bold mb-2 ${isTopPick ? 'text-xl' : 'text-lg'}`}>
          {tool.title}
        </h3>
        <p className="text-muted-foreground text-sm mb-4 flex-1">{tool.benefit}</p>
        <span className="inline-flex items-center gap-2 text-primary font-bold text-sm">
          View on Amazon <ExternalLink size={14} />
        </span>
      </div>
    </motion.a>
  );
}

export default function StarterKitchen() {
  const { data: parentTools, isLoading: parentLoading } = useQuery<AffiliateTool[]>({
    queryKey: ['/api/affiliate/tools/parents']
  });

  const { data: kidTools, isLoading: kidLoading } = useQuery<AffiliateTool[]>({
    queryKey: ['/api/affiliate/tools/kids']
  });

  const parentTopPick = parentTools?.find(t => t.isTopPick);
  const parentOthers = parentTools?.filter(t => !t.isTopPick) || [];
  const kidTopPick = kidTools?.find(t => t.isTopPick);
  const kidOthers = kidTools?.filter(t => !t.isTopPick) || [];

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="bg-gradient-to-br from-primary/10 via-secondary/5 to-background py-12 md:py-20 border-b border-border">
        <div className="max-w-5xl mx-auto px-4">
          <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ArrowLeft size={18} /> Back to Meals
          </Link>
          <h1 className="text-4xl md:text-5xl font-display font-black text-foreground mb-4">
            Starter Kitchen
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl">
            Curated essentials that make weeknight cooking easier. These are the tools parents actually use 
            to get dinner on the table faster.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-12 space-y-16">
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-primary/10 rounded-xl">
              <ChefHat className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-2xl md:text-3xl font-display font-bold">Starter Kitchen for Parents</h2>
          </div>
          <p className="text-muted-foreground mb-8 max-w-2xl">
            These essentials cover 90% of the recipes on Nom Nom Chow. You don't need everything at once—
            start with a good thermometer, skillet, and sheet pan, then build from there.
          </p>
          
          {parentLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-40 rounded-2xl bg-muted/30 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {parentTopPick && <ToolCard tool={parentTopPick} isTopPick />}
              {parentOthers.map(tool => (
                <ToolCard key={tool.id} tool={tool} />
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-secondary/10 rounded-xl">
              <Baby className="w-6 h-6 text-secondary" />
            </div>
            <h2 className="text-2xl md:text-3xl font-display font-bold">Kid Chef Starter Kit</h2>
          </div>
          <p className="text-muted-foreground mb-8 max-w-2xl">
            Get kids involved safely! These tools are designed for small hands and help kids feel like 
            real chefs. Perfect for building confidence and creating memories.
          </p>

          {kidLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-40 rounded-2xl bg-muted/30 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {kidTopPick && <ToolCard tool={kidTopPick} isTopPick />}
              {kidOthers.map(tool => (
                <ToolCard key={tool.id} tool={tool} />
              ))}
            </div>
          )}
        </section>

        <section className="bg-muted/20 rounded-3xl p-8 border border-border">
          <h3 className="text-xl font-display font-bold mb-4">Do I need all of this?</h3>
          <p className="text-muted-foreground mb-4">
            No! Start with the top 3 picks from each section. A good thermometer eliminates guessing, 
            a quality skillet handles most dinners, and kid-safe knives let little ones help safely.
          </p>
          <p className="text-muted-foreground">
            Build your collection over time based on the meals you make most often.
          </p>
        </section>

        <p className="text-xs text-muted-foreground text-center">
          As an Amazon Associate I earn from qualifying purchases.
        </p>
      </div>
    </div>
  );
}
