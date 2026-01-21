import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import { format } from "date-fns";

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
}

interface ReviewStepProps {
  salonName: string;
  service: Service;
  employee: Employee | null;
  appointmentDate: Date;
  appointmentTime: string;
  notes?: string;
  onBack: () => void;
  onConfirm: () => void;
  isSubmitting?: boolean;
}

export const ReviewStep = ({
  salonName,
  service,
  employee,
  appointmentDate,
  appointmentTime,
  notes,
  onBack,
  onConfirm,
  isSubmitting = false
}: ReviewStepProps) => {
  const formattedDate = format(appointmentDate, "EEEE, MMMM d, yyyy");
  const formattedTime = format(new Date(`2000-01-01T${appointmentTime}`), 'h:mm a');

  return (
    <Card className="w-full">
      <CardContent className="p-6 sm:p-8">
        <div className="space-y-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold mb-2">Review Your Booking</h2>
            <p className="text-muted-foreground">
              Please review your appointment details before confirming
            </p>
          </div>

          <div className="space-y-4">
            {/* Salon */}
            <div className="flex justify-between items-start py-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Salon</p>
                <p className="text-base font-semibold mt-1">{salonName}</p>
              </div>
            </div>

            <Separator />

            {/* Service */}
            <div className="flex justify-between items-start py-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Service</p>
                <p className="text-base font-semibold mt-1">{service.name}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {service.category} • {service.duration} minutes
                </p>
              </div>
              <p className="text-base font-semibold">${Number(service.price).toFixed(2)}</p>
            </div>

            <Separator />

            {/* Specialist */}
            <div className="flex justify-between items-start py-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Specialist</p>
                <p className="text-base font-semibold mt-1">
                  {employee ? employee.name : "Any Available Specialist"}
                </p>
                {employee?.role && (
                  <p className="text-sm text-muted-foreground mt-1">{employee.role}</p>
                )}
              </div>
            </div>

            <Separator />

            {/* Date & Time */}
            <div className="flex justify-between items-start py-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Date & Time</p>
                <p className="text-base font-semibold mt-1">{formattedDate}</p>
                <p className="text-base font-semibold mt-1">{formattedTime}</p>
              </div>
            </div>

            {notes && (
              <>
                <Separator />
                <div className="py-3">
                  <p className="text-sm font-medium text-muted-foreground mb-2">Notes</p>
                  <p className="text-sm">{notes}</p>
                </div>
              </>
            )}

            <Separator />

            {/* Total */}
            <div className="flex justify-between items-center py-3">
              <p className="text-base font-semibold">Total</p>
              <p className="text-xl font-bold text-primary">${Number(service.price).toFixed(2)}</p>
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={onBack} disabled={isSubmitting}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button
              onClick={onConfirm}
              disabled={isSubmitting}
              className="bg-gradient-primary hover:opacity-90"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Confirming...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Confirm Booking
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
