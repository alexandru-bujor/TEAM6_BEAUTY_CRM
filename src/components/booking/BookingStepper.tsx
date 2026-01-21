import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  id: number;
  title: string;
  description: string;
}

const steps: Step[] = [
  {
    id: 1,
    title: "Service",
    description: "Choose your service"
  },
  {
    id: 2,
    title: "Specialist",
    description: "Select a specialist"
  },
  {
    id: 3,
    title: "Date & Time",
    description: "Pick a time slot"
  },
  {
    id: 4,
    title: "Review",
    description: "Confirm booking"
  }
];

interface BookingStepperProps {
  currentStep: number;
  onStepChange?: (step: number) => void;
}

export const BookingStepper = ({ currentStep, onStepChange }: BookingStepperProps) => {
  return (
    <div className="w-full mb-8">
      {/* Step Indicators */}
      <div className="relative flex justify-between items-start">
        {/* Connector Lines - Rendered first (behind content) with lower z-index */}
        <div className="absolute top-5 left-0 right-0 h-0.5 hidden sm:block pointer-events-none" style={{ zIndex: 0 }}>
          <div className="relative h-full w-full">
            {steps.map((step, index) => {
              if (index >= steps.length - 1) return null;
              
              const isCompleted = currentStep > step.id;
              const stepWidth = 100 / steps.length;
              const lineStart = (index * stepWidth) + (stepWidth / 2);
              const lineWidth = stepWidth;
              
              return (
                <div
                  key={`line-${index}`}
                  className="absolute h-full"
                  style={{
                    left: `${lineStart}%`,
                    width: `${lineWidth}%`,
                    zIndex: 0
                  }}
                >
                  <div
                    className={cn(
                      "h-full transition-all duration-300",
                      isCompleted ? "bg-primary/40" : "bg-muted/40"
                    )}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content - Rendered on top with higher z-index */}
        {steps.map((step, index) => {
          const isCompleted = currentStep > step.id;
          const isCurrent = currentStep === step.id;
          const isClickable = onStepChange && step.id <= currentStep;

          return (
            <div key={step.id} className="flex flex-col items-center flex-1 relative" style={{ zIndex: 10 }}>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "w-10 h-10 rounded-full p-0 mb-2 transition-all duration-200 relative bg-background",
                  isCompleted && "bg-primary text-primary-foreground hover:bg-primary",
                  isCurrent && "bg-primary/10 text-primary border-2 border-primary",
                  !isCompleted && !isCurrent && "text-muted-foreground border-2 border-muted",
                  isClickable && "cursor-pointer hover:scale-105",
                  !isClickable && "cursor-default"
                )}
                onClick={() => isClickable && onStepChange?.(step.id)}
                disabled={!isClickable}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <span className="text-sm font-semibold">{step.id}</span>
                )}
              </Button>
              
              <div className="text-center relative">
                <div className={cn(
                  "text-sm font-medium transition-colors",
                  isCurrent ? "text-primary" : "text-muted-foreground"
                )}>
                  {step.title}
                </div>
                <div className="text-xs text-muted-foreground mt-1 hidden sm:block">
                  {step.description}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
