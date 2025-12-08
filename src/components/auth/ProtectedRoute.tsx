import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { authAPI } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredUserType?: 'customer' | 'salon_owner' | 'admin';
  redirectTo?: string;
}

export const ProtectedRoute = ({ 
  children, 
  requiredUserType,
  redirectTo = '/'
}: ProtectedRouteProps) => {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);

  const { data: userData, isLoading, error } = useQuery({
    queryKey: ['auth-user'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No token');
      }
      const response = await authAPI.getMe();
      return response.user;
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  useEffect(() => {
    if (!isLoading) {
      setIsChecking(false);
      
      if (error || !userData) {
        // Not authenticated
        navigate(redirectTo);
        return;
      }

      // Check user type if required
      if (requiredUserType && userData.user_type !== requiredUserType) {
        // Wrong user type
        navigate(redirectTo);
        return;
      }
    }
  }, [isLoading, error, userData, requiredUserType, navigate, redirectTo]);

  if (isChecking || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-secondary flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !userData) {
    return (
      <div className="min-h-screen bg-gradient-secondary flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="py-12 text-center">
            <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
            <p className="text-muted-foreground mb-4">
              Please log in to access this page.
            </p>
            <div className="flex gap-4 justify-center">
              <Link to="/register?type=customer">
                <Button>Create Account</Button>
              </Link>
              <Link to="/">
                <Button variant="outline">Go to Home</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (requiredUserType && userData.user_type !== requiredUserType) {
    return (
      <div className="min-h-screen bg-gradient-secondary flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="py-12 text-center">
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-4">
              You don't have permission to access this page.
            </p>
            <Link to="/">
              <Button variant="outline">Go to Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};

