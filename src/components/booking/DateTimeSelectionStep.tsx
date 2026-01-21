import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Clock, ArrowLeft, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface DateTimeSelectionStepProps {
  selectedDate: Date | undefined;
  selectedTime: string;
  onDateSelect: (date: Date | undefined) => void;
  onTimeSelect: (time: string) => void;
  onNext: () => void;
  onBack: () => void;
  existingAppointments?: Array<{ date: string; time: string; duration: number }>;
  serviceDuration?: number;
}

// Generate time slots from 9 AM to 6 PM in 30-minute intervals
const generateTimeSlots = () => {
  const slots = [];
  for (let hour = 9; hour < 18; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      const displayTime = format(new Date(`2000-01-01T${timeString}`), 'h:mm a');
      slots.push({ value: timeString, display: displayTime });
    }
  }
  return slots;
};

const TIME_SLOTS = generateTimeSlots();

export const DateTimeSelectionStep = ({
  selectedDate,
  selectedTime,
  onDateSelect,
  onTimeSelect,
  onNext,
  onBack,
  existingAppointments = [],
  serviceDuration = 30
}: DateTimeSelectionStepProps) => {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Get minimum date (today)
  const minDate = new Date();
  minDate.setHours(0, 0, 0, 0);

  // Get maximum date (30 days from now)
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 30);
  maxDate.setHours(23, 59, 59, 59);

  // Calculate unavailable time slots for selected date
  const unavailableSlots = useMemo(() => {
    if (!selectedDate) return [];

    const dateString = format(selectedDate, 'yyyy-MM-dd');
    const appointmentsOnDate = existingAppointments.filter(
      apt => apt.date === dateString
    );

    const unavailable: string[] = [];
    appointmentsOnDate.forEach(apt => {
      const aptStart = new Date(`2000-01-01T${apt.time}`);
      const aptEnd = new Date(aptStart.getTime() + apt.duration * 60000);
      
      TIME_SLOTS.forEach(slot => {
        const slotTime = new Date(`2000-01-01T${slot.value}`);
        const slotEnd = new Date(slotTime.getTime() + serviceDuration * 60000);
        
        // Check if slot overlaps with appointment
        if (
          (slotTime >= aptStart && slotTime < aptEnd) ||
          (slotEnd > aptStart && slotEnd <= aptEnd) ||
          (slotTime <= aptStart && slotEnd >= aptEnd)
        ) {
          unavailable.push(slot.value);
        }
      });
    });

    return unavailable;
  }, [selectedDate, existingAppointments, serviceDuration]);

  const availableSlots = TIME_SLOTS.filter(
    slot => !unavailableSlots.includes(slot.value)
  );

  const isDateValid = selectedDate && selectedDate >= minDate && selectedDate <= maxDate;
  const canProceed = isDateValid && selectedTime && !unavailableSlots.includes(selectedTime);

  return (
    <Card className="w-full">
      <CardContent className="p-6 sm:p-8">
        <div className="space-y-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold mb-2">Select Date & Time</h2>
            <p className="text-muted-foreground">
              Choose when you'd like your appointment
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Date Selection */}
            <div className="space-y-3">
              <Label>Select Date</Label>
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? (
                      format(selectedDate, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      onDateSelect(date);
                      setIsCalendarOpen(false);
                    }}
                    disabled={(date) => {
                      const dateOnly = new Date(date);
                      dateOnly.setHours(0, 0, 0, 0);
                      return dateOnly < minDate || dateOnly > maxDate;
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Time Selection */}
            <div className="space-y-3">
              <Label>Select Time</Label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-[300px] overflow-y-auto p-2 border rounded-md">
                {availableSlots.length > 0 ? (
                  availableSlots.map((slot) => (
                    <Button
                      key={slot.value}
                      variant={selectedTime === slot.value ? "default" : "outline"}
                      size="sm"
                      className={cn(
                        "h-10",
                        selectedTime === slot.value && "bg-primary"
                      )}
                      onClick={() => onTimeSelect(slot.value)}
                    >
                      {slot.display}
                    </Button>
                  ))
                ) : (
                  <div className="col-span-full text-center py-4 text-muted-foreground text-sm">
                    {selectedDate
                      ? "No available time slots for this date"
                      : "Please select a date first"}
                  </div>
                )}
              </div>
            </div>
          </div>

          {selectedDate && unavailableSlots.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>{unavailableSlots.length} time slot(s) unavailable on this date</span>
            </div>
          )}

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button
              onClick={onNext}
              disabled={!canProceed}
              className="bg-gradient-primary hover:opacity-90"
            >
              Continue
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
