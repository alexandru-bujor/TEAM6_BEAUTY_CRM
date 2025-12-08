import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Scissors, Sparkles, Palette, Heart } from "lucide-react";

interface LocationServicesData {
  address: string;
  city: string;
  state: string;
  zipCode: string;
  categories: string[];
}

interface LocationServicesStepProps {
  data: LocationServicesData;
  onDataChange: (data: Partial<LocationServicesData>) => void;
  onNext: () => void;
  onBack: () => void;
}

const serviceCategories = [
  { id: "hair", label: "Hair Services", icon: Scissors, description: "Cuts, styling, coloring, treatments" },
  { id: "nails", label: "Nail Services", icon: Sparkles, description: "Manicures, pedicures, nail art" },
  { id: "skincare", label: "Skincare", icon: Heart, description: "Facials, treatments, skincare" },
  { id: "makeup", label: "Makeup", icon: Palette, description: "Makeup application, lessons" },
  { id: "barber", label: "Barber Services", icon: Scissors, description: "Men's cuts, shaves, grooming" },
  { id: "wellness", label: "Wellness", icon: Heart, description: "Massage, aromatherapy, wellness" }
];

export const LocationServicesStep = ({ data, onDataChange, onNext, onBack }: LocationServicesStepProps) => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!data.address.trim()) {
      newErrors.address = "Street address is required";
    }

    if (!data.city.trim()) {
      newErrors.city = "City is required";
    }

    if (!data.state.trim()) {
      newErrors.state = "State is required";
    }

    if (!data.zipCode.trim()) {
      newErrors.zipCode = "ZIP code is required";
    }

    if (data.categories.length === 0) {
      newErrors.categories = "Please select at least one service category";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onNext();
    }
  };

  const handleCategoryToggle = (categoryId: string) => {
    const updatedCategories = data.categories.includes(categoryId)
      ? data.categories.filter(id => id !== categoryId)
      : [...data.categories, categoryId];
    
    onDataChange({ categories: updatedCategories });
  };

  return (
    <Card className="w-full">
      <CardContent className="p-8">
        <div className="space-y-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2">Location & Services</h2>
            <p className="text-muted-foreground">
              Help customers find you by providing your location and the services you offer.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Address Section */}
            <div className="space-y-6">
              <div className="flex items-center space-x-2 mb-4">
                <MapPin className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold">Salon Address</h3>
              </div>

              {/* Street Address */}
              <div className="space-y-2">
                <Label htmlFor="address" className="text-sm font-medium">
                  Street Address *
                </Label>
                <Input
                  id="address"
                  placeholder="123 Main Street"
                  value={data.address}
                  onChange={(e) => onDataChange({ address: e.target.value })}
                  className={errors.address ? 'border-destructive' : ''}
                />
                {errors.address && (
                  <p className="text-sm text-destructive">{errors.address}</p>
                )}
              </div>

              {/* City, State, ZIP Row */}
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city" className="text-sm font-medium">
                    City *
                  </Label>
                  <Input
                    id="city"
                    placeholder="New York"
                    value={data.city}
                    onChange={(e) => onDataChange({ city: e.target.value })}
                    className={errors.city ? 'border-destructive' : ''}
                  />
                  {errors.city && (
                    <p className="text-sm text-destructive">{errors.city}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state" className="text-sm font-medium">
                    State *
                  </Label>
                  <Input
                    id="state"
                    placeholder="NY"
                    value={data.state}
                    onChange={(e) => onDataChange({ state: e.target.value })}
                    className={errors.state ? 'border-destructive' : ''}
                  />
                  {errors.state && (
                    <p className="text-sm text-destructive">{errors.state}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="zipCode" className="text-sm font-medium">
                    ZIP Code *
                  </Label>
                  <Input
                    id="zipCode"
                    placeholder="10001"
                    value={data.zipCode}
                    onChange={(e) => onDataChange({ zipCode: e.target.value })}
                    className={errors.zipCode ? 'border-destructive' : ''}
                  />
                  {errors.zipCode && (
                    <p className="text-sm text-destructive">{errors.zipCode}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Services Section */}
            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Service Categories</h3>
                <p className="text-sm text-muted-foreground">
                  Select the types of services your salon offers. This helps customers find exactly what they're looking for.
                </p>
                {errors.categories && (
                  <p className="text-sm text-destructive">{errors.categories}</p>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {serviceCategories.map((category) => {
                  const Icon = category.icon;
                  const isSelected = data.categories.includes(category.id);

                  return (
                    <div
                      key={category.id}
                      className={`relative p-4 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-soft ${
                        isSelected 
                          ? 'border-primary bg-primary/5 shadow-soft' 
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => handleCategoryToggle(category.id)}
                    >
                      <div className="flex items-start space-x-3">
                        <span onClick={(e) => e.stopPropagation()} className="mt-1">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => handleCategoryToggle(category.id)}
                          />
                        </span>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <Icon className={`w-4 h-4 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                            <span className={`font-medium ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                              {category.label}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {category.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Selected Categories Display */}
              {data.categories.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Selected Categories:</Label>
                  <div className="flex flex-wrap gap-2">
                    {data.categories.map((categoryId) => {
                      const category = serviceCategories.find(c => c.id === categoryId);
                      return category ? (
                        <Badge key={categoryId} variant="secondary" className="bg-primary/10 text-primary">
                          {category.label}
                        </Badge>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6">
              <Button type="button" variant="outline" onClick={onBack}>
                Back
              </Button>
              <Button type="submit" className="bg-gradient-primary hover:opacity-90">
                Continue
              </Button>
            </div>
          </form>
        </div>
      </CardContent>
    </Card>
  );
};