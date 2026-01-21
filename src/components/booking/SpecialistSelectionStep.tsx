import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, User, ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Employee {
  id: number;
  name: string;
  role?: string;
  bio?: string;
  image?: string;
  experience?: number;
  specialties?: string[];
}

interface SpecialistSelectionStepProps {
  employees: Employee[];
  selectedEmployee: Employee | null;
  onEmployeeSelect: (employee: Employee | null) => void;
  onNext: () => void;
  onBack: () => void;
  isLoading?: boolean;
  allowSkip?: boolean;
}

export const SpecialistSelectionStep = ({
  employees,
  selectedEmployee,
  onEmployeeSelect,
  onNext,
  onBack,
  isLoading = false,
  allowSkip = true
}: SpecialistSelectionStepProps) => {
  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="p-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardContent className="p-6 sm:p-8">
        <div className="space-y-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold mb-2">Choose a Specialist</h2>
            <p className="text-muted-foreground">
              Select a specialist or let us assign one for you
            </p>
          </div>

          {employees.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {allowSkip && (
                <Button
                  variant="outline"
                  className={cn(
                    "h-auto p-4 justify-start text-left hover:border-primary hover:bg-primary/5 transition-all",
                    selectedEmployee === null && "border-primary bg-primary/10"
                  )}
                  onClick={() => onEmployeeSelect(null)}
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                      <User className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <div className="flex-1 text-left">
                      <h4 className="font-semibold text-sm">Any Available Specialist</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        We'll assign the best available specialist
                      </p>
                    </div>
                  </div>
                </Button>
              )}

              {employees.map((employee) => (
                <Button
                  key={employee.id}
                  variant="outline"
                  className={cn(
                    "h-auto p-4 justify-start text-left hover:border-primary hover:bg-primary/5 transition-all",
                    selectedEmployee?.id === employee.id && "border-primary bg-primary/10"
                  )}
                  onClick={() => onEmployeeSelect(employee)}
                >
                  <div className="flex items-center gap-3 w-full">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={employee.image} />
                      <AvatarFallback>
                        {employee.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left">
                      <h4 className="font-semibold text-sm">{employee.name}</h4>
                      {employee.role && (
                        <p className="text-xs text-muted-foreground">{employee.role}</p>
                      )}
                      {employee.experience && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {employee.experience} years experience
                        </p>
                      )}
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                No specialists available. We'll assign one for you.
              </p>
              <Button
                variant="outline"
                className={cn(
                  "h-auto p-4 hover:border-primary hover:bg-primary/5 transition-all",
                  selectedEmployee === null && "border-primary bg-primary/10"
                )}
                onClick={() => onEmployeeSelect(null)}
              >
                <div className="flex items-center gap-3">
                  <User className="w-6 h-6" />
                  <span>Any Available Specialist</span>
                </div>
              </Button>
            </div>
          )}

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button
              onClick={onNext}
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
