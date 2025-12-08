import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, Clock, User, Phone, Download, Search, Filter, Loader2 } from "lucide-react";
import { exportToCSV } from "@/utils/csvExport";
import { appointmentsAPI, employeesAPI } from "@/lib/api";
import { toast } from "sonner";

interface Appointment {
  id: number;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  service: string;
  employee: string;
  date: string;
  time: string;
  duration: number;
  price: number;
  status: "confirmed" | "pending" | "cancelled" | "completed";
  notes?: string;
}

const AppointmentManagement = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [employeeFilter, setEmployeeFilter] = useState("all");

  // Fetch appointments
  const { data: appointmentsData, isLoading: appointmentsLoading } = useQuery({
    queryKey: ['salon-appointments', statusFilter, selectedDate],
    queryFn: () => appointmentsAPI.getAll({ 
      status: statusFilter !== 'all' ? statusFilter : undefined,
      date: selectedDate || undefined,
    }),
  });

  // Fetch employees for filter
  const { data: employeesData } = useQuery({
    queryKey: ['my-employees'],
    queryFn: () => employeesAPI.getMyEmployees(),
  });

  const employees = (employeesData || []).map((e: any) => e.name);

  // Format appointments for display
  const appointments: Appointment[] = (appointmentsData || []).map((apt: any) => ({
    id: apt.id,
    customerName: `${apt.customer_first_name || ''} ${apt.customer_last_name || ''}`.trim() || 'Unknown',
    customerPhone: apt.customer_phone || '',
    customerEmail: apt.customer_email || '',
    service: apt.service_name || apt.service || 'Service',
    employee: apt.employee_name || apt.employee || 'Not assigned',
    date: apt.appointment_date,
    time: apt.appointment_time,
    duration: apt.duration || 0,
    price: parseFloat(apt.price) || 0,
    status: apt.status,
    notes: apt.notes || undefined,
  }));

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

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => 
      appointmentsAPI.updateStatus(id, status),
    onSuccess: () => {
      toast.success('Appointment status updated');
      queryClient.invalidateQueries({ queryKey: ['salon-appointments'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update appointment status');
    },
  });

  const updateStatus = (id: number, newStatus: Appointment["status"]) => {
    updateStatusMutation.mutate({ id, status: newStatus });
  };

  const filteredAppointments = appointments.filter(apt => {
    const matchesSearch = 
      apt.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.customerPhone.includes(searchTerm) ||
      apt.service.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDate = !selectedDate || apt.date === selectedDate;
    const matchesStatus = statusFilter === "all" || apt.status === statusFilter;
    const matchesEmployee = employeeFilter === "all" || apt.employee === employeeFilter;
    
    return matchesSearch && matchesDate && matchesStatus && matchesEmployee;
  });

  const getTodayAppointments = () => {
    const today = new Date().toISOString().split('T')[0];
    return appointments.filter(apt => apt.date === today);
  };

  const handleExportCSV = () => {
    const dataToExport = filteredAppointments.map(apt => ({
      "Date": apt.date,
      "Time": apt.time,
      "Customer Name": apt.customerName,
      "Customer Phone": apt.customerPhone,
      "Customer Email": apt.customerEmail,
      "Service": apt.service,
      "Employee": apt.employee,
      "Duration (min)": apt.duration,
      "Price": `$${apt.price}`,
      "Status": apt.status,
      "Notes": apt.notes || ""
    }));

    const filename = `appointments_${selectedDate || "all"}_${new Date().toISOString().split('T')[0]}.csv`;
    exportToCSV(dataToExport, filename);
  };

  const handleExportTodayCSV = () => {
    const todayAppointments = getTodayAppointments();
    const dataToExport = todayAppointments.map(apt => ({
      "Time": apt.time,
      "Customer Name": apt.customerName,
      "Customer Phone": apt.customerPhone,
      "Service": apt.service,
      "Employee": apt.employee,
      "Duration (min)": apt.duration,
      "Price": `$${apt.price}`,
      "Status": apt.status,
      "Notes": apt.notes || ""
    }));

    const today = new Date().toISOString().split('T')[0];
    const filename = `daily_appointments_${today}.csv`;
    exportToCSV(dataToExport, filename);
  };

  const getAppointmentStats = () => {
    const today = new Date().toISOString().split('T')[0];
    const todayAppointments = appointments.filter(apt => apt.date === today);
    
    return {
      total: appointments.length,
      today: todayAppointments.length,
      confirmed: appointments.filter(apt => apt.status === "confirmed").length,
      pending: appointments.filter(apt => apt.status === "pending").length,
      completed: appointments.filter(apt => apt.status === "completed").length,
      revenue: appointments
        .filter(apt => apt.status === "completed")
        .reduce((sum, apt) => sum + apt.price, 0)
    };
  };

  const stats = getAppointmentStats();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Appointment Management</h2>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleExportTodayCSV}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export Today's Schedule
          </Button>
          <Button 
            onClick={handleExportCSV}
            className="bg-gradient-primary flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export Filtered Data
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card className="shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Today</p>
                <p className="text-2xl font-bold">{stats.today}</p>
              </div>
              <Calendar className="w-6 h-6 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Confirmed</p>
                <p className="text-2xl font-bold text-green-600">{stats.confirmed}</p>
              </div>
              <Clock className="w-6 h-6 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-blue-600">{stats.completed}</p>
              </div>
              <User className="w-6 h-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Calendar className="w-6 h-6 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Revenue</p>
                <p className="text-2xl font-bold">${stats.revenue}</p>
              </div>
              <Download className="w-6 h-6 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="shadow-soft">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search customers, services..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              placeholder="Filter by date"
            />
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
              <SelectTrigger>
                <User className="w-4 h-4 mr-2" />
                <SelectValue placeholder="All Staff" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Staff</SelectItem>
                {employees.map(employee => (
                  <SelectItem key={employee} value={employee}>{employee}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm("");
                setSelectedDate("");
                setStatusFilter("all");
                setEmployeeFilter("all");
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Appointments Table */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>
            Appointments ({filteredAppointments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Employee</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {appointmentsLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
                  </TableCell>
                </TableRow>
              ) : filteredAppointments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <p className="text-muted-foreground">No appointments found</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredAppointments.map((appointment) => (
                  <TableRow key={appointment.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{appointment.customerName}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                          <Phone className="w-3 h-3" />
                          {appointment.customerPhone}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{appointment.service}</div>
                      {appointment.notes && (
                        <div className="text-sm text-muted-foreground">{appointment.notes}</div>
                      )}
                    </TableCell>
                    <TableCell>{appointment.employee}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {appointment.date}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {appointment.time}
                      </div>
                    </TableCell>
                    <TableCell>{appointment.duration} min</TableCell>
                    <TableCell>${appointment.price.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(appointment.status)}>
                        {appointment.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        {appointment.status === "pending" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateStatus(appointment.id, "confirmed")}
                            disabled={updateStatusMutation.isPending}
                          >
                            Confirm
                          </Button>
                        )}
                        {appointment.status === "confirmed" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateStatus(appointment.id, "completed")}
                            disabled={updateStatusMutation.isPending}
                          >
                            Complete
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateStatus(appointment.id, "cancelled")}
                          disabled={updateStatusMutation.isPending}
                        >
                          Cancel
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AppointmentManagement;