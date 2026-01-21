import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface Service {
  id: number;
  name: string;
  category: string;
  duration: number;
  price: number;
  description?: string;
}

interface ServiceSelectionStepProps {
  services: Service[];
  selectedService: Service | null;
  onServiceSelect: (service: Service) => void;
  onNext: () => void;
  isLoading?: boolean;
}

export const ServiceSelectionStep = ({
  services,
  selectedService,
  onServiceSelect,
  onNext,
  isLoading = false
}: ServiceSelectionStepProps) => {
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

  if (services.length === 0) {
    return (
      <Card className="w-full">
        <CardContent className="p-8">
          <div className="text-center py-12">
            <p className="text-muted-foreground">No services available at this salon.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Group services by category
  const servicesByCategory = services.reduce((acc, service) => {
    const category = service.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(service);
    return acc;
  }, {} as Record<string, Service[]>);

  return (
    <Card className="w-full">
      <CardContent className="p-6 sm:p-8">
        <div className="space-y-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold mb-2">Select a Service</h2>
            <p className="text-muted-foreground">
              Choose the service you'd like to book
            </p>
          </div>

          <div className="space-y-6">
            {Object.entries(servicesByCategory).map(([category, categoryServices]) => (
              <div key={category} className="space-y-3">
                <h3 className="text-lg font-semibold text-foreground">{category}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {categoryServices.map((service) => (
                    <Button
                      key={service.id}
                      variant="outline"
                      className={cn(
                        "h-auto p-4 justify-start text-left hover:border-primary hover:bg-primary/5 transition-all",
                        selectedService?.id === service.id && "border-primary bg-primary/10"
                      )}
                      onClick={() => onServiceSelect(service)}
                    >
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="font-semibold text-sm">{service.name}</h4>
                            {service.description && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {service.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-3 pt-3 border-t">
                          <span className="text-xs text-muted-foreground">
                            {service.duration} min
                          </span>
                          <span className="font-semibold text-primary">
                            ${Number(service.price).toFixed(2)}
                          </span>
                        </div>
                      </div>
                      {selectedService?.id === service.id && (
                        <Sparkles className="w-4 h-4 ml-2 text-primary" />
                      )}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-4">
            <Button
              onClick={onNext}
              disabled={!selectedService}
              className="bg-gradient-primary hover:opacity-90"
            >
              Continue
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
