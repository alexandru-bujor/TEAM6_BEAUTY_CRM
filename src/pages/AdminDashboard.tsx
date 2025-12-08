import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { 
  Shield, 
  Building2, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Clock, 
  Users, 
  Calendar,
  ArrowLeft,
  Loader2,
  Search,
  Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Navigation from "@/components/ui/navigation";
import { adminAPI, authAPI } from "@/lib/api";
import { toast } from "sonner";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("pending");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  
  // Reset to page 1 when filters change
  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };
  
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  // Check if user is admin
  const { data: userData, isLoading: userLoading, error: userError } = useQuery({
    queryKey: ['admin-user'],
    queryFn: async () => {
      try {
        const response = await authAPI.getMe();
        if (response.user?.user_type !== 'admin') {
          throw new Error('You must be logged in as an admin to access this page.');
        }
        return response.user;
      } catch (error: any) {
        // If it's a 401, redirect to login
        if (error.message?.includes('401') || error.message?.includes('token')) {
          window.location.href = '/#/register?type=customer';
        }
        throw error;
      }
    },
    retry: false,
  });

  // Fetch admin stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => adminAPI.getStats(),
    enabled: !!userData,
  });

  // Fetch all pending salons (no pagination, we'll do it on frontend)
  const { data: pendingData, isLoading: pendingLoading } = useQuery({
    queryKey: ['admin-pending-salons'],
    queryFn: async () => {
      // Fetch all pending salons without pagination
      const response = await adminAPI.getAllSalons({ status: 'pending' });
      return response;
    },
    enabled: !!userData && activeTab === 'pending',
  });

  // Fetch all salons (no pagination or status filter, we'll do it on frontend)
  const { data: allSalonsData, isLoading: allSalonsLoading } = useQuery({
    queryKey: ['admin-all-salons'],
    queryFn: () => adminAPI.getAllSalons(),
    enabled: !!userData && activeTab === 'all',
  });

  // Approve salon mutation
  const approveMutation = useMutation({
    mutationFn: (id: number) => adminAPI.approveSalon(id),
    onSuccess: () => {
      toast.success('Salon approved successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-pending-salons'] });
      queryClient.invalidateQueries({ queryKey: ['admin-all-salons'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to approve salon');
    },
  });

  // Reject salon mutation
  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason?: string }) => 
      adminAPI.rejectSalon(id, reason),
    onSuccess: () => {
      toast.success('Salon rejected');
      queryClient.invalidateQueries({ queryKey: ['admin-pending-salons'] });
      queryClient.invalidateQueries({ queryKey: ['admin-all-salons'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to reject salon');
    },
  });

  // Suspend salon mutation
  const suspendMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason?: string }) => 
      adminAPI.suspendSalon(id, reason),
    onSuccess: () => {
      toast.success('Salon suspended');
      queryClient.invalidateQueries({ queryKey: ['admin-all-salons'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to suspend salon');
    },
  });

  const handleApprove = (id: number) => {
    if (confirm('Are you sure you want to approve this salon?')) {
      approveMutation.mutate(id);
    }
  };

  const handleReject = (id: number) => {
    const reason = prompt('Please provide a reason for rejection (optional):');
    if (reason !== null) {
      rejectMutation.mutate({ id, reason: reason || undefined });
    }
  };

  const handleSuspend = (id: number) => {
    const reason = prompt('Please provide a reason for suspension (optional):');
    if (reason !== null) {
      suspendMutation.mutate({ id, reason: reason || undefined });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { className: string; icon: any }> = {
      pending: { className: "bg-yellow-100 text-yellow-800", icon: Clock },
      approved: { className: "bg-green-100 text-green-800", icon: CheckCircle },
      rejected: { className: "bg-red-100 text-red-800", icon: XCircle },
      suspended: { className: "bg-orange-100 text-orange-800", icon: AlertCircle },
    };

    const variant = variants[status] || variants.pending;
    const Icon = variant.icon;

    return (
      <Badge className={variant.className}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  // Show loading or error if not admin
  if (userLoading) {
    return (
      <div className="min-h-screen bg-gradient-secondary flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!userData || userError) {
    return (
      <div className="min-h-screen bg-gradient-secondary">
        <Navigation />
        <div className="container mx-auto px-4 py-16">
          <Card className="max-w-md mx-auto">
            <CardContent className="py-12 text-center">
              <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Admin Access Required</h2>
              <p className="text-muted-foreground mb-4">
                {userError?.message || 'You need to be logged in as an admin to access this page.'}
              </p>
              <div className="flex gap-4 justify-center mb-4">
                <Button 
                  variant="outline"
                  onClick={() => {
                    // Clear auth and redirect to login
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    window.location.href = '/#/register?type=customer';
                  }}
                >
                  Log Out & Sign In
                </Button>
                <Link to="/">
                  <Button variant="outline">Go to Home</Button>
                </Link>
              </div>
              <div className="mt-4 p-4 bg-muted rounded-lg text-sm text-left">
                <p className="font-semibold mb-2">To access admin dashboard:</p>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                  <li>Log out of your current account</li>
                  <li>Sign in with admin credentials:</li>
                  <li className="ml-4">Email: <code className="bg-background px-1 rounded">admin@lume.com</code></li>
                  <li className="ml-4">Password: <code className="bg-background px-1 rounded">admin123</code></li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Get all salons based on active tab
  const allSalons = activeTab === 'pending' 
    ? (pendingData?.salons || [])
    : (allSalonsData?.salons || []);

  // Apply status filter (frontend)
  const statusFilteredSalons = statusFilter === 'all' 
    ? allSalons 
    : allSalons.filter((salon: any) => salon.status === statusFilter);

  // Apply search filter (frontend)
  const filteredSalons = statusFilteredSalons.filter((salon: any) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      salon.salon_name?.toLowerCase().includes(search) ||
      salon.email?.toLowerCase().includes(search) ||
      salon.city?.toLowerCase().includes(search) ||
      salon.owner_email?.toLowerCase().includes(search)
    );
  });

  // Frontend pagination
  const itemsPerPage = 20;
  const totalPages = Math.ceil(filteredSalons.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedSalons = filteredSalons.slice(startIndex, endIndex);
  
  const pagination = {
    total: filteredSalons.length,
    totalPages: totalPages,
    currentPage: currentPage,
    itemsPerPage: itemsPerPage
  };

  return (
    <div className="min-h-screen bg-gradient-secondary">
      <Navigation />
      
      {/* Back Navigation */}
      <div className="container mx-auto px-4 py-4">
        <Button variant="ghost" asChild>
          <Link to="/" className="flex items-center text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </Button>
      </div>

      {/* Header */}
      <div className="bg-card border-b shadow-soft">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Shield className="w-8 h-8 text-primary" />
                Admin Dashboard
              </h1>
              <p className="text-muted-foreground mt-1">Manage salon registrations and approvals</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        {statsLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="shadow-soft">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Pending Approval</p>
                    <p className="text-2xl font-bold">{stats?.pending_salons || 0}</p>
                  </div>
                  <Clock className="w-8 h-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-soft">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Approved Salons</p>
                    <p className="text-2xl font-bold">{stats?.approved_salons || 0}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-soft">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Customers</p>
                    <p className="text-2xl font-bold">{stats?.total_customers || 0}</p>
                  </div>
                  <Users className="w-8 h-8 text-primary" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-soft">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Appointments</p>
                    <p className="text-2xl font-bold">{stats?.total_appointments || 0}</p>
                  </div>
                  <Calendar className="w-8 h-8 text-primary" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pending">
              Pending Approval ({stats?.pending_salons || 0})
            </TabsTrigger>
            <TabsTrigger value="all">All Salons</TabsTrigger>
          </TabsList>

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search salons..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
            {activeTab === 'all' && (
              <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>

          <TabsContent value="pending" className="space-y-4">
            {pendingLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : paginatedSalons.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No pending salons</h3>
                  <p className="text-muted-foreground">All salons have been reviewed.</p>
                </CardContent>
              </Card>
            ) : (
              paginatedSalons.map((salon: any) => (
                <Card key={salon.id} className="shadow-soft">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="text-xl font-semibold">{salon.salon_name}</h3>
                            <p className="text-sm text-muted-foreground">
                              Owner: {salon.owner_first_name} {salon.owner_last_name} ({salon.owner_email})
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {salon.address}, {salon.city}, {salon.state} {salon.zip_code}
                            </p>
                            {salon.categories && salon.categories.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {salon.categories.map((cat: string, idx: number) => (
                                  <Badge key={idx} variant="secondary" className="text-xs">
                                    {cat}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                          {getStatusBadge(salon.status)}
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">
                          Registered: {new Date(salon.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleApprove(salon.id)}
                          className="bg-green-600 hover:bg-green-700"
                          disabled={approveMutation.isPending}
                        >
                          {approveMutation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Approve
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={() => handleReject(salon.id)}
                          variant="destructive"
                          disabled={rejectMutation.isPending}
                        >
                          {rejectMutation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <XCircle className="w-4 h-4 mr-2" />
                              Reject
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="all" className="space-y-4">
            {allSalonsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : paginatedSalons.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No salons found</h3>
                  <p className="text-muted-foreground">Try adjusting your filters.</p>
                </CardContent>
              </Card>
            ) : (
              paginatedSalons.map((salon: any) => (
                <Card key={salon.id} className="shadow-soft">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="text-xl font-semibold">{salon.salon_name}</h3>
                            <p className="text-sm text-muted-foreground">
                              Owner: {salon.owner_first_name} {salon.owner_last_name} ({salon.owner_email})
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {salon.address}, {salon.city}, {salon.state} {salon.zip_code}
                            </p>
                          </div>
                          {getStatusBadge(salon.status)}
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">
                          Registered: {new Date(salon.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      
                      <div className="flex gap-2">
                        {salon.status === 'pending' && (
                          <>
                            <Button
                              onClick={() => handleApprove(salon.id)}
                              className="bg-green-600 hover:bg-green-700"
                              size="sm"
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Approve
                            </Button>
                            <Button
                              onClick={() => handleReject(salon.id)}
                              variant="destructive"
                              size="sm"
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              Reject
                            </Button>
                          </>
                        )}
                        {salon.status === 'approved' && (
                          <Button
                            onClick={() => handleSuspend(salon.id)}
                            variant="outline"
                            size="sm"
                          >
                            <AlertCircle className="w-4 h-4 mr-2" />
                            Suspend
                          </Button>
                        )}
                        {salon.status === 'suspended' && (
                          <Button
                            onClick={() => handleApprove(salon.id)}
                            className="bg-green-600 hover:bg-green-700"
                            size="sm"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Re-approve
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="flex items-center px-4">
              Page {currentPage} of {pagination.totalPages} ({pagination.total} total)
            </span>
            <Button
              variant="outline"
              onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))}
              disabled={currentPage === pagination.totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;

