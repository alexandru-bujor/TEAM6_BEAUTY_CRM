import { Link, useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Sparkles, Search, Menu, X, User, LogOut, Settings } from "lucide-react";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { authAPI, removeToken } from "@/lib/api";
import { toast } from "sonner";

const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  // Check if user is logged in
  const { data: user, isLoading: userLoading } = useQuery({
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
    staleTime: 5 * 60 * 1000,
  });

  const handleLogout = () => {
    removeToken();
    localStorage.removeItem('user');
    toast.success('Logged out successfully');
    navigate('/');
    window.location.reload();
  };

  const getDashboardLink = () => {
    if (!user) return '/dashboard';
    if (user.user_type === 'admin') return '/admin';
    if (user.user_type === 'salon_owner') return '/salon-dashboard';
    return '/dashboard';
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <Sparkles className="w-6 h-6 text-primary" />
            <span className="text-lg font-bold bg-gradient-primary bg-clip-text text-transparent">
              Beauty Book
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link 
              to="/salons" 
              className={`text-sm font-medium transition-colors hover:text-primary ${
                isActive('/salons') ? 'text-primary' : 'text-foreground/80'
              }`}
            >
              Browse Salons
            </Link>
            {!user && (
              <Link 
                to="/register" 
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isActive('/register') ? 'text-primary' : 'text-foreground/80'
                }`}
              >
                Register Salon
              </Link>
            )}
            {user && (
              <Link 
                to={getDashboardLink()}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isActive(getDashboardLink()) ? 'text-primary' : 'text-foreground/80'
                }`}
              >
                Dashboard
              </Link>
            )}
          </nav>

          {/* Search & Auth */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <input 
                type="text" 
                placeholder="Search salons..." 
                className="w-64 pl-10 pr-4 py-2 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            {userLoading ? (
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.profile_image || undefined} />
                      <AvatarFallback>
                        {user.first_name?.[0] || user.email?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user.first_name && user.last_name
                          ? `${user.first_name} ${user.last_name}`
                          : user.email}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {user.user_type === 'customer' && (
                    <DropdownMenuItem asChild>
                      <Link to="/profile">
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild>
                    <Link to={getDashboardLink()}>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Dashboard</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button 
                size="sm"
                className="bg-gradient-primary hover:opacity-90"
                asChild
              >
                <Link to="/register">Get Started</Link>
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t py-4">
            <nav className="flex flex-col space-y-4">
              <Link 
                to="/salons" 
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isActive('/salons') ? 'text-primary' : 'text-foreground/80'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Browse Salons
              </Link>
              {!user && (
                <Link 
                  to="/register" 
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    isActive('/register') ? 'text-primary' : 'text-foreground/80'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Register Salon
                </Link>
              )}
              {user && (
                <Link 
                  to={getDashboardLink()}
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    isActive(getDashboardLink()) ? 'text-primary' : 'text-foreground/80'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
              )}
              <div className="pt-2 border-t">
                {user ? (
                  <Button 
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      handleLogout();
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Log Out
                  </Button>
                ) : (
                  <Button 
                    size="sm"
                    className="w-full bg-gradient-primary hover:opacity-90"
                    asChild
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Link to="/register">Get Started</Link>
                  </Button>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navigation;