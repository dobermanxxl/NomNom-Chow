import { useState } from "react";
import { 
  useAdminLogin, 
  useAdminStats, 
  useDrafts, 
  useApproveDraft,
  useImageStats,
  useBatchProgress,
  useStartBatchGeneration,
  useStopBatch,
  useAddSampleMeals
} from "@/hooks/use-admin";
import { useGenerateMealImage } from "@/hooks/use-meals";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Loader2, Check, Clock, TrendingUp, Users, BookOpen, Lock, 
  Image as ImageIcon, Play, Square, RefreshCw, Plus, AlertTriangle,
  CheckCircle, XCircle
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

const loginSchema = z.object({
  password: z.string().min(1, "Password is required"),
});

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema)
  });
  
  const login = useAdminLogin();

  const onSubmit = (data: any) => {
    login.mutate(data.password, {
      onSuccess: () => setIsAuthenticated(true)
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/20 p-4">
        <div className="w-full max-w-md bg-white dark:bg-card rounded-3xl shadow-xl p-8 border border-border">
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
                data-testid="input-admin-password"
                className="w-full px-4 py-3 rounded-xl border border-border focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all bg-background"
              />
              {errors.password && (
                <p className="text-destructive text-sm mt-1 ml-1">{errors.password.message as string}</p>
              )}
            </div>
            <button
              type="submit"
              disabled={login.isPending}
              data-testid="button-admin-login"
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
  const [activeTab, setActiveTab] = useState<'overview' | 'images' | 'drafts'>('overview');
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: drafts, isLoading: draftsLoading } = useDrafts();
  const approveDraft = useApproveDraft();
  const addSampleMeals = useAddSampleMeals();

  return (
    <div className="min-h-screen pb-24 max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-wrap justify-between items-end gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display font-black mb-1">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage your meal empire.</p>
        </div>
        <button
          onClick={() => addSampleMeals.mutate()}
          disabled={addSampleMeals.isPending}
          data-testid="button-add-sample-meals"
          className="flex items-center gap-2 px-4 py-2 bg-secondary text-white rounded-xl font-bold text-sm transition-colors"
        >
          {addSampleMeals.isPending ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
          Add Sample Meals
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-8 border-b border-border pb-4">
        <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')}>
          <BookOpen size={16} /> Overview
        </TabButton>
        <TabButton active={activeTab === 'images'} onClick={() => setActiveTab('images')}>
          <ImageIcon size={16} /> Images
        </TabButton>
        <TabButton active={activeTab === 'drafts'} onClick={() => setActiveTab('drafts')}>
          <Clock size={16} /> Drafts ({drafts?.length || 0})
        </TabButton>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
      )}

      {/* Images Tab */}
      {activeTab === 'images' && <ImageManagementSection />}

      {/* Drafts Tab */}
      {activeTab === 'drafts' && (
        <>
          {draftsLoading ? (
            <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
          ) : drafts?.length === 0 ? (
            <div className="bg-muted/10 rounded-2xl p-8 text-center border border-border border-dashed">
              <p className="text-muted-foreground font-medium">No pending drafts to review.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {drafts?.map((draft) => (
                <div key={draft.id} className="bg-white dark:bg-card p-6 rounded-2xl border border-border shadow-sm flex flex-col">
                  <div className="mb-4">
                    <span className="inline-block px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-xs font-bold rounded-lg mb-2 uppercase tracking-wide">
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
                      data-testid={`button-approve-draft-${draft.id}`}
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
        </>
      )}
    </div>
  );
}

function ImageManagementSection() {
  const { data: imageStats, isLoading: imageStatsLoading } = useImageStats();
  const { data: batchProgress } = useBatchProgress();
  const startBatch = useStartBatchGeneration();
  const stopBatch = useStopBatch();

  const progressPercent = batchProgress?.total 
    ? Math.round((batchProgress.current / batchProgress.total) * 100) 
    : 0;

  return (
    <div className="space-y-8">
      {/* Cloudinary Status */}
      {!imageStats?.cloudinaryConfigured && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-2xl p-6 flex items-start gap-4">
          <AlertTriangle className="text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-1" size={24} />
          <div>
            <h3 className="font-bold text-yellow-800 dark:text-yellow-300">Cloudinary Not Configured</h3>
            <p className="text-yellow-700 dark:text-yellow-400 text-sm mt-1">
              Image generation is disabled. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables.
            </p>
          </div>
        </div>
      )}

      {/* Image Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard 
          icon={BookOpen} 
          label="Total Meals" 
          value={imageStats?.totalMeals || 0} 
          color="bg-blue-500" 
          loading={imageStatsLoading} 
        />
        <StatsCard 
          icon={CheckCircle} 
          label="With Images" 
          value={imageStats?.withImages || 0} 
          color="bg-green-500" 
          loading={imageStatsLoading} 
        />
        <StatsCard 
          icon={XCircle} 
          label="Missing Images" 
          value={imageStats?.withoutImages || 0} 
          color="bg-red-500" 
          loading={imageStatsLoading} 
        />
      </div>

      {/* Batch Controls */}
      <div className="bg-white dark:bg-card rounded-2xl border border-border p-6">
        <h3 className="font-display font-bold text-xl mb-4">Batch Image Generation</h3>
        
        <div className="flex flex-wrap gap-3 mb-6">
          <button
            onClick={() => startBatch.mutate({ regenerate: false })}
            disabled={!imageStats?.cloudinaryConfigured || batchProgress?.isRunning || startBatch.isPending}
            data-testid="button-generate-missing"
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl font-bold text-sm disabled:opacity-50 transition-colors"
          >
            {startBatch.isPending ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
            Generate Missing Images
          </button>
          
          <button
            onClick={() => startBatch.mutate({ regenerate: true })}
            disabled={!imageStats?.cloudinaryConfigured || batchProgress?.isRunning || startBatch.isPending}
            data-testid="button-regenerate-all"
            className="flex items-center gap-2 px-4 py-2 bg-secondary text-white rounded-xl font-bold text-sm disabled:opacity-50 transition-colors"
          >
            <RefreshCw size={16} />
            Regenerate All Images
          </button>
          
          {batchProgress?.isRunning && (
            <button
              onClick={() => stopBatch.mutate()}
              disabled={stopBatch.isPending}
              data-testid="button-stop-batch"
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-xl font-bold text-sm transition-colors"
            >
              <Square size={16} />
              Stop Batch
            </button>
          )}
        </div>

        {/* Progress */}
        {(batchProgress?.isRunning || batchProgress?.completed > 0 || batchProgress?.failed > 0) && (
          <div className="space-y-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium">
                {batchProgress?.isRunning ? `Processing: ${batchProgress.currentMealTitle}` : 'Completed'}
              </span>
              <span className="text-muted-foreground">
                {batchProgress?.current || 0} / {batchProgress?.total || 0}
              </span>
            </div>
            <Progress value={progressPercent} className="h-3" />
            
            <div className="flex gap-6 text-sm">
              <span className="text-green-600 dark:text-green-400 font-medium">
                <CheckCircle size={14} className="inline mr-1" />
                {batchProgress?.completed || 0} completed
              </span>
              <span className="text-red-600 dark:text-red-400 font-medium">
                <XCircle size={14} className="inline mr-1" />
                {batchProgress?.failed || 0} failed
              </span>
            </div>

            {/* Failures List */}
            {batchProgress?.failures && batchProgress.failures.length > 0 && (
              <div className="mt-4 bg-red-50 dark:bg-red-900/20 rounded-xl p-4">
                <h4 className="font-bold text-red-800 dark:text-red-300 mb-2">Failed Items</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {batchProgress.failures.map((failure, i) => (
                    <div key={i} className="flex justify-between items-center text-sm">
                      <span className="text-red-700 dark:text-red-400">{failure.title}</span>
                      <span className="text-red-600 dark:text-red-500 text-xs">{failure.error}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-colors ${
        active 
          ? 'bg-primary text-white' 
          : 'bg-muted/50 text-muted-foreground hover:bg-muted'
      }`}
    >
      {children}
    </button>
  );
}

function StatsCard({ icon: Icon, label, value, color, loading }: any) {
  return (
    <div className="bg-white dark:bg-card p-6 rounded-[2rem] border border-border shadow-sm flex items-center gap-4">
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
    generate.mutate({ title, ingredients: ingredients || [], mealId }, {
      onSuccess: (data) => {
        if (data.success && data.imageUrl) {
          setGeneratedUrl(data.imageUrl);
        }
      }
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleGenerate}
        disabled={generate.isPending}
        data-testid={`button-generate-image-${mealId || 'new'}`}
        className="w-full bg-primary/10 hover:bg-primary/20 text-primary py-2 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"
      >
        {generate.isPending ? <Loader2 size={16} className="animate-spin" /> : <ImageIcon size={16} />}
        {generatedUrl ? "Regenerate Image" : "Generate Image"}
      </button>
      {generatedUrl && (
        <div className="relative aspect-square rounded-xl overflow-hidden border border-border">
          <img src={generatedUrl} alt="Generated" className="object-cover w-full h-full" />
        </div>
      )}
    </div>
  );
}
