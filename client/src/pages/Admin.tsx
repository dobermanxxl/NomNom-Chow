import { useState } from "react";
import { useAdminLogin, useAdminStats, useDrafts, useApproveDraft } from "@/hooks/use-admin";
import { useGenerateMealImage } from "@/hooks/use-meals";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Check, Clock, TrendingUp, Users, BookOpen, Lock, Image as ImageIcon } from "lucide-react";
import { useLocation } from "wouter";

const loginSchema = z.object({
  password: z.string().min(1, "Password is required"),
});

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema)
  });
  
  const login = useAdminLogin();
  const [, setLocation] = useLocation();

  const onSubmit = (data: any) => {
    login.mutate(data.password, {
      onSuccess: () => setIsAuthenticated(true)
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/20 p-4">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 border border-border">
          <div className="text-center mb-8">
            <div className="inline-flex p-4 rounded-full bg-primary/10 text-primary mb-4">
              <Lock size={32} />
            </div>
            <h1 className="text-2xl font-display font-bold">Chef's Table Only</h1>
            <p className="text-muted-foreground">Please enter the secret password.</p>
          </div>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <input
                type="password"
                {...register("password")}
                placeholder="Password"
                className="w-full px-4 py-3 rounded-xl border border-border focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
              />
              {errors.password && (
                <p className="text-destructive text-sm mt-1 ml-1">{errors.password.message as string}</p>
              )}
            </div>
            <button
              type="submit"
              disabled={login.isPending}
              className="w-full btn-primary disabled:opacity-50"
            >
              {login.isPending ? "Checking..." : "Unlock Kitchen"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return <AdminDashboard />;
}

function AdminDashboard() {
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: drafts, isLoading: draftsLoading } = useDrafts();
  const approveDraft = useApproveDraft();

  return (
    <div className="min-h-screen pb-24 max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-display font-black mb-1">Admin Dashboard</h1>
          <p className="text-muted-foreground">Overview of your meal empire.</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <StatsCard 
          icon={BookOpen} 
          label="Total Meals" 
          value={stats?.totalMeals || 0} 
          color="bg-blue-500" 
          loading={statsLoading} 
        />
        <StatsCard 
          icon={TrendingUp} 
          label="AI Generations" 
          value={stats?.mostGenerated?.[0]?.aiGenerations || 0} 
          color="bg-primary" 
          loading={statsLoading} 
        />
        <StatsCard 
          icon={Users} 
          label="Total Views" 
          value={stats?.mostViewed?.[0]?.views || 0} 
          color="bg-secondary" 
          loading={statsLoading} 
        />
      </div>

      {/* Drafts Section */}
      <h2 className="text-2xl font-display font-bold mb-6 flex items-center gap-2">
        <Clock className="text-muted-foreground" />
        Pending Approvals
      </h2>

      {draftsLoading ? (
        <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
      ) : drafts?.length === 0 ? (
        <div className="bg-muted/10 rounded-2xl p-8 text-center border border-border border-dashed">
          <p className="text-muted-foreground font-medium">No pending drafts to review.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {drafts?.map((draft) => (
            <div key={draft.id} className="bg-white p-6 rounded-2xl border border-border shadow-sm flex flex-col">
              <div className="mb-4">
                <span className="inline-block px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-lg mb-2 uppercase tracking-wide">
                  {draft.status}
                </span>
                <h3 className="font-bold text-xl">{draft.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Suggested from: {(draft.ingredients as string[])?.join(", ")}
                </p>
              </div>
              
              <div className="mt-auto pt-4 border-t border-border flex flex-col gap-2">
                <button
                  onClick={() => approveDraft.mutate(draft.id)}
                  disabled={approveDraft.isPending}
                  className="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"
                >
                  {approveDraft.isPending ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  Approve
                </button>
                <GenerateImageButton 
                  title={draft.title} 
                  ingredients={draft.ingredients as string[]} 
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatsCard({ icon: Icon, label, value, color, loading }: any) {
  return (
    <div className="bg-white p-6 rounded-[2rem] border border-border shadow-sm flex items-center gap-4">
      <div className={`w-12 h-12 rounded-2xl ${color} text-white flex items-center justify-center shadow-lg shadow-black/5`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-muted-foreground text-sm font-bold uppercase tracking-wider">{label}</p>
        {loading ? (
          <div className="h-8 w-16 bg-muted animate-pulse rounded mt-1" />
        ) : (
          <p className="text-3xl font-black font-display">{value}</p>
        )}
      </div>
    </div>
  );
}

function GenerateImageButton({ title, ingredients, mealId }: { title: string; ingredients: string[]; mealId?: number }) {
  const generate = useGenerateMealImage();
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);

  const handleGenerate = () => {
    generate.mutate({ title, ingredients, mealId }, {
      onSuccess: (data) => setGeneratedUrl(data.imageUrl)
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleGenerate}
        disabled={generate.isPending}
        className="w-full bg-primary/10 hover:bg-primary/20 text-primary py-2 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"
      >
        {generate.isPending ? <Loader2 size={16} className="animate-spin" /> : <ImageIcon size={16} />}
        {generatedUrl ? "Regenerate Image" : "Generate Image"}
      </button>
      {generatedUrl && (
        <div className="relative aspect-video rounded-xl overflow-hidden border border-border">
          <img src={generatedUrl} alt="Generated" className="object-cover w-full h-full" />
        </div>
      )}
    </div>
  );
}
