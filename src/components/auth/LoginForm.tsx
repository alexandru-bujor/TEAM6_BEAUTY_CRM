import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Lock, Loader2 } from "lucide-react";
import { authAPI, setToken } from "@/lib/api";
import { toast } from "sonner";

interface LoginFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const LoginForm = ({ onSuccess, onCancel }: LoginFormProps) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await authAPI.login(formData.email, formData.password);
      
      // Store token and user data
      if (response.token) {
        setToken(response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
      }

      toast.success('Logged in successfully!');
      
      onSuccess?.();
      
      // Redirect based on user type after a short delay to allow state updates
      setTimeout(() => {
        const redirectPath = response.user?.user_type === 'admin' 
          ? '/admin' 
          : response.user?.user_type === 'salon_owner' 
          ? '/salon-dashboard' 
          : '/dashboard';
        
        // Use window.location for full page reload to refresh auth state
        window.location.href = `/#${redirectPath}`;
      }, 500);
    } catch (error: any) {
      console.error('Login error:', error);
      const errorMessage = error?.message || 'Login failed. Please check your credentials.';
      toast.error(errorMessage);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center w-full">
      <Card className="w-full max-w-md border-2 shadow-medium">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-2xl font-bold">Sign In</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Welcome back! Please sign in to your account
          </p>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  className="pl-10 h-11"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-10 h-11"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                className="w-full bg-gradient-primary hover:opacity-90 h-11 text-base font-medium"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={isLoading}
                  className="w-full mt-3 h-11"
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

