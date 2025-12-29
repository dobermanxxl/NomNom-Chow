import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md mx-auto rounded-3xl shadow-xl overflow-hidden border-none">
        <CardContent className="pt-12 pb-12 text-center">
          <div className="mb-6 flex justify-center">
            <div className="p-4 bg-destructive/10 rounded-full text-destructive">
              <AlertCircle className="h-16 w-16" />
            </div>
          </div>

          <h1 className="text-4xl font-display font-black text-gray-900 mb-2">404 Page Not Found</h1>
          <p className="text-muted-foreground mb-8 text-lg">
            Whoops! Looks like this recipe got lost in the kitchen.
          </p>
          
          <Link href="/" className="btn-primary inline-flex">
            Return to Menu
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
