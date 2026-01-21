import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Clock, MapPin, Star, Plus, Filter, Search, User, Settings, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { appointmentsAPI, usersAPI, authAPI } from "@/lib/api";
import { toast } from "sonner";

const Dashboard = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [user, setUser] = useState<any>(null);

  // Check if user is logged in
  const { data: userData, isLoading: userLoading } = useQuery({
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

  useEffect(() => {
    if (userData) {
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
    } else if (!userLoading) {
      setUser(null);
    }
  }, [userData, userLoading]);

  // Fetch appointments if logged in
  const { data: appointmentsData, isLoading: appointmentsLoading } = useQuery({
    queryKey: ['appointments', filterStatus],
    queryFn: () => appointmentsAPI.getAll({ status: filterStatus !== 'all' ? filterStatus : undefined }),
    enabled: !!user, // Only fetch if user is logged in
    retry: false,
  });

  // Fetch dashboard stats if logged in
  const { data: statsData } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => usersAPI.getDashboardStats(),
    enabled: !!user,
    retry: false,
  });

  const appointments = appointmentsData || [];
  const stats = statsData || { upcoming: 0, completed: 0, favorite_salons: 0, avg_rating: 0 };

  // Separate upcoming and past appointments
  const today = new Date().toISOString().split('T')[0];
  const upcomingAppointments = appointments.filter((apt: any) => {
    const aptDate = apt.appointment_date;
    return aptDate >= today && apt.status !== 'completed' && apt.status !== 'cancelled';
  });

  const pastAppointments = appointments.filter((apt: any) => {
    const aptDate = apt.appointment_date;
    return aptDate < today || apt.status === 'completed';
  });

  // Format appointment for display
  const formatAppointment = (apt: any) => {
    const price = apt.price ? Number(apt.price) : 0;
    return {
      id: apt.id,
      salon: apt.salon_name || 'Unknown Salon',
      service: apt.service_name || apt.service || 'Service',
      date: apt.appointment_date,
      time: apt.appointment_time,
      duration: `${apt.duration} min`,
      stylist: apt.employee_name || apt.employee || 'Not assigned',
      price: `$${price.toFixed(2)}`,
      status: apt.status,
      address: apt.salon_address ? `${apt.salon_address}, ${apt.salon_city}, ${apt.salon_state}` : 'Address not available',
      rating: apt.rating || apt.review_rating || undefined,
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
        }`}
      />
    ));
  };

  const allAppointments = [...upcomingAppointments.map(formatAppointment), ...pastAppointments.map(formatAppointment)];
  const filteredAppointments = allAppointments.filter(apt => {
    const matchesSearch = apt.salon.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         apt.service.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === "all" || apt.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  // Handle appointment actions
  const handleCancelAppointment = async (id: number) => {
    try {
      await appointmentsAPI.cancel(id);
      toast.success('Appointment cancelled');
      window.location.reload(); // Refresh to update list
    } catch (error: any) {
      toast.error(error.message || 'Failed to cancel appointment');
    }
  };

  const handleRescheduleAppointment = (id: number) => {
    // TODO: Implement reschedule functionality
    toast.info('Reschedule functionality coming soon');
  };

  // If loading, show loader
  if (userLoading) {
    return (
      <div className="min-h-screen bg-gradient-secondary flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // If not logged in, redirect (handled by ProtectedRoute, but show message just in case)
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-secondary flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="py-12 text-center">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Please Log In</h3>
            <p className="text-muted-foreground mb-4">
              You need to be logged in to view your appointments and dashboard.
            </p>
            <div className="flex gap-4 justify-center">
              <Link to="/register?type=customer">
                <Button className="bg-gradient-primary">
                  Create Account
                </Button>
              </Link>
              <Link to="/">
                <Button variant="outline">
                  Go to Home
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-secondary">
      {/* Header */}
      <div className="bg-card border-b shadow-soft">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="w-12 h-12">
                <AvatarImage src={user.profile_image || "/placeholder.svg"} />
                <AvatarFallback>
                  {user.first_name?.[0]}{user.last_name?.[0] || user.email?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold">
                  Welcome back, {user.first_name || user.email?.split('@')[0] || 'User'}!
                </h1>
                <p className="text-muted-foreground">Manage your beauty appointments</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/salons">
                <Button className="bg-gradient-primary">
                  <Plus className="w-4 h-4 mr-2" />
                  Book Appointment
                </Button>
              </Link>
              <Link to="/profile">
                <Button variant="outline">
                  <Settings className="w-4 h-4 mr-2" />
                  Profile
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="shadow-soft">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Upcoming</p>
                  <p className="text-2xl font-bold">
                    {appointmentsLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : stats.upcoming || upcomingAppointments.length}
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-soft">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold">
                    {appointmentsLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : stats.completed || pastAppointments.length}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-soft">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Favorite Salons</p>
                  <p className="text-2xl font-bold">
                    {appointmentsLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : stats.favorite_salons || 0}
                  </p>
                </div>
                <MapPin className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-soft">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Rating</p>
                  <p className="text-2xl font-bold">
                    {appointmentsLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : (stats.avg_rating?.toFixed(1) || '0.0')}
                  </p>
                </div>
                <Star className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search appointments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[180px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Appointments Tabs */}
        <Tabs defaultValue="upcoming" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upcoming">Upcoming ({upcomingAppointments.length})</TabsTrigger>
            <TabsTrigger value="history">History ({pastAppointments.length})</TabsTrigger>
            <TabsTrigger value="all">All Appointments</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-4">
            {appointmentsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : upcomingAppointments.length === 0 ? (
              <Card className="shadow-soft">
                <CardContent className="py-12 text-center">
                  <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No upcoming appointments</h3>
                  <p className="text-muted-foreground mb-4">Ready to book your first appointment?</p>
                  <Link to="/salons">
                    <Button className="bg-gradient-primary">
                      <Plus className="w-4 h-4 mr-2" />
                      Book Appointment
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              upcomingAppointments.map((apt: any) => {
                const appointment = formatAppointment(apt);
                return (
              <Card key={appointment.id} className="shadow-soft hover:shadow-medium transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-lg">{appointment.salon}</h3>
                          <p className="text-primary font-medium">{appointment.service}</p>
                          <p className="text-sm text-muted-foreground">{appointment.address}</p>
                        </div>
                        <Badge className={getStatusColor(appointment.status)}>
                          {appointment.status}
                        </Badge>
                      </div>
                      
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {appointment.date}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {appointment.time} ({appointment.duration})
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {appointment.stylist}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                      <div className="text-right">
                        <p className="font-semibold text-lg">{appointment.price}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleRescheduleAppointment(appointment.id)}
                        >
                          Reschedule
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleCancelAppointment(appointment.id)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
                );
              })
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            {appointmentsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : pastAppointments.length === 0 ? (
              <Card className="shadow-soft">
                <CardContent className="py-12 text-center">
                  <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No past appointments</h3>
                  <p className="text-muted-foreground">Your completed appointments will appear here.</p>
                </CardContent>
              </Card>
            ) : (
              pastAppointments.map((apt: any) => {
                const appointment = formatAppointment(apt);
                return (
              <Card key={appointment.id} className="shadow-soft hover:shadow-medium transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-lg">{appointment.salon}</h3>
                          <p className="text-primary font-medium">{appointment.service}</p>
                          <p className="text-sm text-muted-foreground">{appointment.address}</p>
                        </div>
                        <Badge className={getStatusColor(appointment.status)}>
                          {appointment.status}
                        </Badge>
                      </div>
                      
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {appointment.date}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {appointment.time} ({appointment.duration})
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {appointment.stylist}
                        </div>
                      </div>
                      
                      {appointment.rating && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Your rating:</span>
                          <div className="flex gap-1">
                            {renderStars(appointment.rating)}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                      <div className="text-right">
                        <p className="font-semibold text-lg">{appointment.price}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          Book Again
                        </Button>
                        {!appointment.rating && (
                          <Button variant="default" size="sm">
                            Rate Service
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
                );
              })
            )}
          </TabsContent>

          <TabsContent value="all" className="space-y-4">
            {appointmentsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filteredAppointments.length === 0 ? (
              <Card className="shadow-soft">
                <CardContent className="py-12 text-center">
                  <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No appointments found</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm || filterStatus !== "all" 
                      ? "Try adjusting your search or filter criteria"
                      : "Ready to book your first appointment?"
                    }
                  </p>
                  {!searchTerm && filterStatus === "all" && (
                    <Link to="/salons">
                      <Button className="bg-gradient-primary">
                        <Plus className="w-4 h-4 mr-2" />
                        Book Your First Appointment
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            ) : (
              filteredAppointments.map((appointment) => (
                <Card key={appointment.id} className="shadow-soft hover:shadow-medium transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-lg">{appointment.salon}</h3>
                            <p className="text-primary font-medium">{appointment.service}</p>
                            <p className="text-sm text-muted-foreground">{appointment.address}</p>
                          </div>
                          <Badge className={getStatusColor(appointment.status)}>
                            {appointment.status}
                          </Badge>
                        </div>
                        
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {appointment.date}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {appointment.time} ({appointment.duration})
                          </div>
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {appointment.stylist}
                          </div>
                        </div>
                        
                        {(appointment as any).rating && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Your rating:</span>
                            <div className="flex gap-1">
                              {renderStars((appointment as any).rating)}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                        <div className="text-right">
                          <p className="font-semibold text-lg">{appointment.price}</p>
                        </div>
                        <div className="flex gap-2">
                          {appointment.status === "confirmed" ? (
                            <>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleRescheduleAppointment(appointment.id)}
                              >
                                Reschedule
                              </Button>
                              <Button 
                                variant="destructive" 
                                size="sm"
                                onClick={() => handleCancelAppointment(appointment.id)}
                              >
                                Cancel
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => navigate('/salons')}
                              >
                                Book Again
                              </Button>
                              {appointment.status === "completed" && !(appointment as any).rating && (
                                <Button variant="default" size="sm">
                                  Rate Service
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;