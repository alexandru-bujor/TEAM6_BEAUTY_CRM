import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/ui/navigation";
import { BookingStepper } from "@/components/booking/BookingStepper";
import { ServiceSelectionStep } from "@/components/booking/ServiceSelectionStep";
import { SpecialistSelectionStep } from "@/components/booking/SpecialistSelectionStep";
import { DateTimeSelectionStep } from "@/components/booking/DateTimeSelectionStep";
import { ReviewStep } from "@/components/booking/ReviewStep";
import { salonsAPI, servicesAPI, employeesAPI, appointmentsAPI, authAPI } from "@/lib/api";
import { toast } from "sonner";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

interface Service {
  id: number;
  name: string;
  category: string;
  duration: number;
  price: number;
  description?: string;
}

interface Employee {
  id: number;
  name: string;
  role?: string;
  bio?: string;
  image?: string;
  experience?: number;
  specialties?: string[];
}

const BookAppointment = () => {
  const { salonId } = useParams<{ salonId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  // Get current user
  const { data: userData } = useQuery({
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

  // Fetch salon details
  const { data: salon, isLoading: salonLoading } = useQuery({
    queryKey: ['salon', salonId],
    queryFn: () => salonsAPI.getById(Number(salonId)),
    enabled: !!salonId,
  });

  // Fetch services
  const { data: services, isLoading: servicesLoading } = useQuery({
    queryKey: ['salon-services', salonId],
    queryFn: () => servicesAPI.getBySalon(Number(salonId), true),
    enabled: !!salonId,
  });

  // Fetch employees
  const { data: employees, isLoading: employeesLoading } = useQuery({
    queryKey: ['salon-employees', salonId],
    queryFn: () => employeesAPI.getBySalon(Number(salonId), true),
    enabled: !!salonId,
  });

  // Fetch existing appointments for date/time availability
  const { data: existingAppointments } = useQuery({
    queryKey: ['salon-appointments', salonId],
    queryFn: () => appointmentsAPI.getAll({ salonId: Number(salonId) }),
    enabled: !!salonId && currentStep >= 3,
  });

  // Format appointments for date/time step
  const formattedAppointments = existingAppointments?.map((apt: any) => ({
    date: apt.appointment_date,
    time: apt.appointment_time,
    duration: apt.duration || 30,
  })) || [];

  // Create appointment mutation
  const createAppointmentMutation = useMutation({
    mutationFn: (data: {
      salon_id: number;
      service_id: number;
      employee_id?: number;
      appointment_date: string;
      appointment_time: string;
      notes?: string;
    }) => appointmentsAPI.create(data),
    onSuccess: (data) => {
      toast.success('Appointment booked successfully!');
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      navigate('/dashboard');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to book appointment. Please try again.');
    },
  });

  const handleStepChange = (step: number) => {
    if (step <= currentStep) {
      setCurrentStep(step);
    }
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleConfirm = () => {
    if (!salonId || !selectedService || !selectedDate || !selectedTime || !userData) {
      toast.error('Please complete all required fields');
      return;
    }

    const appointmentDate = selectedDate.toISOString().split('T')[0];
    
    createAppointmentMutation.mutate({
      salon_id: Number(salonId),
      service_id: selectedService.id,
      employee_id: selectedEmployee?.id,
      appointment_date: appointmentDate,
      appointment_time: selectedTime,
      notes: notes || undefined,
    });
  };

  // Redirect if salon not found or user not logged in
  useEffect(() => {
    if (!salonLoading && salonId && !salon) {
      toast.error('Salon not found');
      navigate('/salons');
    }
  }, [salon, salonLoading, salonId, navigate]);

  // Check if user is customer
  useEffect(() => {
    if (userData && userData.user_type !== 'customer') {
      toast.error('Only customers can book appointments');
      navigate('/dashboard');
    }
  }, [userData, navigate]);

  if (!salonId) {
    return (
      <div className="min-h-screen bg-gradient-secondary">
        <Navigation />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <p className="text-muted-foreground">Invalid salon ID</p>
            <Button onClick={() => navigate('/salons')} className="mt-4">
              Browse Salons
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (salonLoading || servicesLoading || employeesLoading) {
    return (
      <div className="min-h-screen bg-gradient-secondary">
        <Navigation />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-secondary">
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold mb-2">Book Appointment</h1>
          {salon && (
            <p className="text-muted-foreground">
              {salon.salon_name || salon.name}
            </p>
          )}
        </div>

        {/* Stepper */}
        <BookingStepper
          currentStep={currentStep}
          onStepChange={handleStepChange}
        />

        {/* Step Content */}
        <div className="mt-8">
          {currentStep === 1 && (
            <ServiceSelectionStep
              services={services || []}
              selectedService={selectedService}
              onServiceSelect={(service) => {
                setSelectedService(service);
              }}
              onNext={handleNext}
              isLoading={servicesLoading}
            />
          )}

          {currentStep === 2 && (
            <SpecialistSelectionStep
              employees={employees || []}
              selectedEmployee={selectedEmployee}
              onEmployeeSelect={(employee) => {
                setSelectedEmployee(employee);
              }}
              onNext={handleNext}
              onBack={handleBack}
              isLoading={employeesLoading}
            />
          )}

          {currentStep === 3 && (
            <DateTimeSelectionStep
              selectedDate={selectedDate}
              selectedTime={selectedTime}
              onDateSelect={(date) => {
                setSelectedDate(date);
                setSelectedTime(""); // Reset time when date changes
              }}
              onTimeSelect={setSelectedTime}
              onNext={handleNext}
              onBack={handleBack}
              existingAppointments={formattedAppointments}
              serviceDuration={selectedService?.duration}
            />
          )}

          {currentStep === 4 && selectedService && selectedDate && selectedTime && (
            <ReviewStep
              salonName={salon?.salon_name || salon?.name || 'Salon'}
              service={selectedService}
              employee={selectedEmployee}
              appointmentDate={selectedDate}
              appointmentTime={selectedTime}
              notes={notes}
              onBack={handleBack}
              onConfirm={handleConfirm}
              isSubmitting={createAppointmentMutation.isPending}
            />
          )}
        </div>
      </div>
    </div>
  );
};

// Wrap with ProtectedRoute to ensure user is logged in
const BookAppointmentProtected = () => (
  <ProtectedRoute requiredUserType="customer">
    <BookAppointment />
  </ProtectedRoute>
);

export default BookAppointmentProtected;
