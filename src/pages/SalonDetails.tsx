import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { salonsAPI, servicesAPI, employeesAPI, appointmentsAPI, verificationAPI } from "@/lib/api";
import Navigation from "@/components/ui/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ArrowLeft, Clock, MapPin, Phone, Mail, Calendar, Scissors } from "lucide-react";
import { toast } from "sonner";

const SalonDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const salonId = Number(id);

  const storedUser = useMemo(() => {
    try {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const token = localStorage.getItem("token");
  const isCustomer = storedUser?.user_type === "customer";

  const [selectedService, setSelectedService] = useState<number | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null);
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");
  const [notes, setNotes] = useState("");
  const [phoneCode, setPhoneCode] = useState("");
  const [step, setStep] = useState<"details" | "verify" | "booking">("details");
  const [pendingPayload, setPendingPayload] = useState<any | null>(null);

  const [firstName, setFirstName] = useState(storedUser?.first_name || "");
  const [lastName, setLastName] = useState(storedUser?.last_name || "");
  const [email, setEmail] = useState(storedUser?.email || "");
  const [phone, setPhone] = useState(storedUser?.phone || "");

  const { data: salon, isLoading: salonLoading, error: salonError } = useQuery({
    queryKey: ["salon", salonId],
    queryFn: () => salonsAPI.getById(salonId),
    enabled: !!salonId,
  });

  const { data: services, isLoading: servicesLoading } = useQuery({
    queryKey: ["services", salonId],
    queryFn: () => servicesAPI.getBySalon(salonId),
    enabled: !!salonId,
  });

  const { data: employees } = useQuery({
    queryKey: ["employees", salonId],
    queryFn: () => employeesAPI.getBySalon(salonId, true),
    enabled: !!salonId,
  });

  useEffect(() => {
    if (services && services.length > 0 && !selectedService) {
      setSelectedService(services[0].id);
    }
  }, [services, selectedService]);

  const bookingMutation = useMutation({
    mutationFn: async () => {
      if (!pendingPayload) {
        throw new Error("Missing booking data. Please start again.");
      }

      if (token && isCustomer) {
        return appointmentsAPI.create(pendingPayload);
      }

      return appointmentsAPI.createGuest(pendingPayload);
    },
    onSuccess: (data: any) => {
      toast.success("Appointment booked! We'll send a confirmation.");
      if (data?.temp_password) {
        toast.info(`Account created. Temporary password: ${data.temp_password}`);
      }
      setNotes("");
      setAppointmentTime("");
      setAppointmentDate("");
      setPhoneCode("");
      setStep("details");
      setPendingPayload(null);
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to book appointment");
      setStep("details");
    },
  });

  const handleStartBooking = async () => {
    try {
      if (!selectedService || !appointmentDate || !appointmentTime) {
        throw new Error("Please pick a service, date, and time.");
      }

      const payload: any = {
        salon_id: salonId,
        service_id: selectedService,
        employee_id: selectedEmployee || undefined,
        appointment_date: appointmentDate,
        appointment_time: appointmentTime,
        notes: notes || undefined,
      };

      if (token && isCustomer) {
        if (!storedUser?.phone) {
          throw new Error("Please add a phone number in your profile before booking.");
        }
        payload.phone = storedUser.phone;
      } else {
        if (!firstName || !lastName || !email || !phone) {
          throw new Error("Please provide your name, email, and phone to book without an account.");
        }
        payload.first_name = firstName;
        payload.last_name = lastName;
        payload.email = email;
        payload.phone = phone;
      }

      setPendingPayload(payload);
      setStep("booking");
      await verificationAPI.sendPhoneCode(payload.phone);
      toast.success("We sent a verification code to your phone.");
      setStep("verify");
    } catch (err: any) {
      toast.error(err?.message || "Failed to start booking");
      setStep("details");
    }
  };

  const handleVerifyAndBook = async () => {
    if (!pendingPayload || !pendingPayload.phone) {
      toast.error("Missing phone number for verification.");
      return;
    }
    if (!phoneCode) {
      toast.error("Enter the verification code sent to your phone.");
      return;
    }
    setStep("booking");
    try {
      await verificationAPI.verifyPhone(pendingPayload.phone, phoneCode);
      toast.success("Phone verified. Booking your appointment...");
      bookingMutation.mutate();
    } catch (err: any) {
      toast.error(err?.message || "Verification failed. Check the code and try again.");
      setStep("verify");
    }
  };

  if (salonLoading || servicesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (salonError || !salon) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-16">
          <Card className="max-w-md mx-auto">
            <CardContent className="py-12 text-center space-y-4">
              <h2 className="text-xl font-semibold">Salon not found</h2>
              <p className="text-muted-foreground">Try browsing other salons.</p>
              <Button asChild>
                <Link to="/salons">Back to salons</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 py-4">
        <Button variant="ghost" onClick={() => navigate(-1)} className="flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
      </div>

      <div className="container mx-auto px-4 pb-12 grid lg:grid-cols-3 gap-6">
        {/* Salon info */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="text-2xl">{salon.salon_name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-3 text-muted-foreground">
                <span className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {salon.address}, {salon.city}, {salon.state} {salon.zip_code}
                </span>
                <span className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  {salon.phone}
                </span>
                <span className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  {salon.email}
                </span>
              </div>

              {salon.categories && salon.categories.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {salon.categories.map((cat: string, idx: number) => (
                    <Badge key={idx} variant="secondary">
                      {cat}
                    </Badge>
                  ))}
                </div>
              )}

              <p className="text-muted-foreground">{salon.description || "No description provided."}</p>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scissors className="w-4 h-4" />
                Services
              </CardTitle>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-3">
              {(services || []).length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  No services available yet. Please check back later.
                </div>
              ) : (
                (services || []).map((service: any) => (
                  <button
                    key={service.id}
                    onClick={() => setSelectedService(service.id)}
                    className={`text-left border rounded-lg p-3 transition hover:border-primary ${
                      selectedService === service.id ? "border-primary bg-primary/5" : "border-border"
                    }`}
                  >
                    <div className="flex justify-between">
                      <div className="font-semibold">{service.name}</div>
                      <div className="text-primary font-semibold">${Number(service.price).toFixed(2)}</div>
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                      <Clock className="w-4 h-4" />
                      {service.duration} mins
                    </div>
                    {service.description && (
                      <div className="text-sm text-muted-foreground mt-2 line-clamp-2">{service.description}</div>
                    )}
                  </button>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Booking form */}
        <div className="lg:col-span-1">
          <Card className="shadow-soft sticky top-24">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Book an appointment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Service</label>
                <Select
                  value={selectedService ? String(selectedService) : undefined}
                  onValueChange={(val) => setSelectedService(Number(val))}
                  disabled={(services || []).length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a service" />
                  </SelectTrigger>
                  <SelectContent>
                    {(services || []).map((service: any) => (
                      <SelectItem key={service.id} value={String(service.id)}>
                        {service.name} — ${Number(service.price).toFixed(2)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Preferred staff (optional)</label>
                <Select
                  value={selectedEmployee ? String(selectedEmployee) : "any"}
                  onValueChange={(val) => setSelectedEmployee(val === "any" ? null : Number(val))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any available staff" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any staff</SelectItem>
                    {(employees || []).map((emp: any) => (
                      <SelectItem key={emp.id} value={String(emp.id)}>
                        {emp.name} {emp.role ? `• ${emp.role}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Date</label>
                  <Input type="date" value={appointmentDate} onChange={(e) => setAppointmentDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Time</label>
                  <Input type="time" value={appointmentTime} onChange={(e) => setAppointmentTime(e.target.value)} />
                </div>
              </div>

              {!token && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Your details (no account needed)</label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input placeholder="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                    <Input placeholder="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                  </div>
                  <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
                  <Input placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
                  <p className="text-xs text-muted-foreground">
                    We'll create a simple account for you to track this booking.
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Notes (optional)</label>
                <Textarea
                  placeholder="Any preferences or notes for the salon?"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              {!token && (
                <p className="text-xs text-muted-foreground">
                  Prefer to create an account first?{" "}
                  <Link to="/register?type=customer" className="text-primary underline">
                    Sign up
                  </Link>
                </p>
              )}

              {step === "details" && (
                <Button
                  className="w-full bg-gradient-primary"
                  onClick={handleStartBooking}
                  disabled={bookingMutation.isPending}
                >
                  {bookingMutation.isPending ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Booking...
                    </span>
                  ) : (
                    "Book now"
                  )}
                </Button>
              )}

              {step === "verify" && (
                <div className="space-y-3">
                  <label className="text-sm font-medium">Enter verification code</label>
                  <Input
                    placeholder="6-digit code"
                    value={phoneCode}
                    onChange={(e) => setPhoneCode(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setStep("details");
                        setPhoneCode("");
                        setPendingPayload(null);
                      }}
                      disabled={bookingMutation.isPending}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="flex-1 bg-gradient-primary"
                      onClick={handleVerifyAndBook}
                      disabled={bookingMutation.isPending}
                    >
                      {bookingMutation.isPending ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Booking...
                        </span>
                      ) : (
                        "Confirm & Book"
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SalonDetails;

