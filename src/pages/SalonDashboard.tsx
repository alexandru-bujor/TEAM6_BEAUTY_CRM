import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Settings, Bell, Calendar, Users, Scissors, TrendingUp, ArrowLeft, Loader2 } from "lucide-react";
import Navigation from "@/components/ui/navigation";
import SalonStats from "@/components/salon/SalonStats";
import ServiceManagement from "@/components/salon/ServiceManagement";
import EmployeeManagement from "@/components/salon/EmployeeManagement";
import AppointmentManagement from "@/components/salon/AppointmentManagement";
import { salonsAPI } from "@/lib/api";
import { toast } from "sonner";

const SalonDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch salon data
  const { data: salonData, isLoading: salonLoading, error: salonError } = useQuery({
    queryKey: ['my-salon'],
    queryFn: () => salonsAPI.getMySalon(),
    retry: false,
  });

  if (salonLoading) {
    return (
      <div className="min-h-screen bg-gradient-secondary flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (salonError || !salonData) {
    return (
      <div className="min-h-screen bg-gradient-secondary">
        <Navigation />
        <div className="container mx-auto px-4 py-16">
          <Card className="max-w-md mx-auto">
            <CardContent className="py-12 text-center">
              <h2 className="text-xl font-semibold mb-2">Salon Not Found</h2>
              <p className="text-muted-foreground mb-4">
                You don't have a salon registered yet. Please register your salon first.
              </p>
              <Link to="/register">
                <Button className="bg-gradient-primary">Register Salon</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      suspended: "bg-orange-100 text-orange-800",
    };
    return variants[status] || "bg-gray-100 text-gray-800";
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
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="w-16 h-16">
                <AvatarImage src={salonData.profile_image || undefined} />
                <AvatarFallback>
                  {salonData.salon_name?.substring(0, 2).toUpperCase() || 'SB'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold">{salonData.salon_name}</h1>
                <p className="text-muted-foreground">
                  {salonData.contact_name || 'Salon Owner'}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className={getStatusBadge(salonData.status)}>
                    {salonData.status}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    ★ {parseFloat(salonData.rating || 0).toFixed(1)} ({salonData.total_reviews || 0} reviews)
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm">
                <Bell className="w-4 h-4 mr-2" />
                Notifications
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="services" className="flex items-center gap-2">
              <Scissors className="w-4 h-4" />
              Services
            </TabsTrigger>
            <TabsTrigger value="employees" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Staff
            </TabsTrigger>
            <TabsTrigger value="appointments" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Appointments
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Profile
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <SalonStats />
            
            {/* Quick Actions */}
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button 
                    className="h-20 bg-gradient-primary"
                    onClick={() => setActiveTab("services")}
                  >
                    <div className="text-center">
                      <Scissors className="w-6 h-6 mx-auto mb-2" />
                      <div>Add New Service</div>
                    </div>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-20"
                    onClick={() => setActiveTab("employees")}
                  >
                    <div className="text-center">
                      <Users className="w-6 h-6 mx-auto mb-2" />
                      <div>Manage Staff</div>
                    </div>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-20"
                    onClick={() => setActiveTab("appointments")}
                  >
                    <div className="text-center">
                      <Calendar className="w-6 h-6 mx-auto mb-2" />
                      <div>View Appointments</div>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="services">
            <ServiceManagement />
          </TabsContent>

          <TabsContent value="employees">
            <EmployeeManagement />
          </TabsContent>

          <TabsContent value="appointments">
            <AppointmentManagement />
          </TabsContent>

          <TabsContent value="profile" className="space-y-6">
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle>Salon Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Salon Name</label>
                      <p className="text-lg">{salonData.salon_name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Contact Name</label>
                      <p className="text-lg">{salonData.contact_name || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Email</label>
                      <p className="text-lg">{salonData.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Phone</label>
                      <p className="text-lg">{salonData.phone}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Address</label>
                      <p className="text-lg">
                        {salonData.address}, {salonData.city}, {salonData.state} {salonData.zip_code}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Description</label>
                      <p className="text-lg">{salonData.description || 'No description provided'}</p>
                    </div>
                    {salonData.categories && salonData.categories.length > 0 && (
                      <div>
                        <label className="text-sm font-medium">Categories</label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {salonData.categories.map((cat: string, idx: number) => (
                            <Badge key={idx} variant="secondary">{cat}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="pt-4">
                  <Button className="bg-gradient-primary">
                    Edit Profile
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SalonDashboard;