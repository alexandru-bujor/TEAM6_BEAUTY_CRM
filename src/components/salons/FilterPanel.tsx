import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronUp, Star, MapPin, DollarSign, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { salonsAPI } from "@/lib/api";

interface FilterPanelProps {
  filters: {
    services: string[];
    priceRange: string[];
    rating: number;
    distance: number;
    partnersOnly: boolean;
  };
  onFiltersChange: (filters: any) => void;
}

// Default values as fallback
const DEFAULT_SERVICES = [
  { id: "hair", label: "Hair Services", count: 0 },
  { id: "nails", label: "Nail Services", count: 0 },
  { id: "skincare", label: "Skincare & Facials", count: 0 },
  { id: "massage", label: "Massage Therapy", count: 0 },
  { id: "lashes", label: "Lash Extensions", count: 0 },
  { id: "brows", label: "Eyebrow Services", count: 0 },
  { id: "waxing", label: "Waxing", count: 0 },
  { id: "makeup", label: "Makeup Services", count: 0 },
];

const DEFAULT_PRICE_RANGES = [
  { id: "$", label: "$ (Under $50)", count: 0 },
  { id: "$$", label: "$$ ($50-100)", count: 0 },
  { id: "$$$", label: "$$$ ($100-200)", count: 0 },
  { id: "$$$$", label: "$$$$ ($200+)", count: 0 },
];

export const FilterPanel = ({ filters, onFiltersChange }: FilterPanelProps) => {
  const [expandedSections, setExpandedSections] = useState({
    services: true,
    price: true,
    rating: true,
    location: true,
    other: true,
  });

  // Fetch filter statistics from backend
  const { data: filterStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['filter-stats'],
    queryFn: () => salonsAPI.getFilterStats(),
    retry: 1,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Use backend data or fallback to defaults
  const SERVICES = filterStats?.services || DEFAULT_SERVICES;
  const PRICE_RANGES = filterStats?.priceRanges || DEFAULT_PRICE_RANGES;

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section as keyof typeof prev]
    }));
  };

  const handleServiceChange = (serviceId: string, checked: boolean) => {
    const newServices = checked
      ? [...filters.services, serviceId]
      : filters.services.filter(s => s !== serviceId);
    
    onFiltersChange({ ...filters, services: newServices });
  };

  const handlePriceRangeChange = (priceId: string, checked: boolean) => {
    const newPriceRange = checked
      ? [...filters.priceRange, priceId]
      : filters.priceRange.filter(p => p !== priceId);
    
    onFiltersChange({ ...filters, priceRange: newPriceRange });
  };

  const clearFilters = () => {
    onFiltersChange({
      services: [],
      priceRange: [],
      rating: 0,
      distance: 0,
      partnersOnly: false,
    });
  };

  const hasActiveFilters = 
    filters.services.length > 0 ||
    filters.priceRange.length > 0 ||
    filters.rating > 0 ||
    filters.distance > 0 ||
    filters.partnersOnly;

  return (
    <Card className="h-fit shadow-soft border-border sticky top-24">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between mb-4">
          <CardTitle className="text-lg font-semibold">Filters</CardTitle>
        </div>
        <div className="flex gap-2">
          <Button
            variant="default"
            size="sm"
            className="flex-1"
          >
            Apply
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={clearFilters}
            className="flex-1"
          >
            Clear
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Services */}
        <div>
          <button
            onClick={() => toggleSection("services")}
            className="flex items-center justify-between w-full py-2 text-left"
          >
            <h3 className="font-medium">Services</h3>
            {expandedSections.services ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
          
          {expandedSections.services && (
            <div className="space-y-3 mt-3">
              {isLoadingStats ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              ) : SERVICES.length === 0 ? (
                <p className="text-xs text-muted-foreground py-2">No services available</p>
              ) : (
                SERVICES.map((service) => (
                  <div key={service.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={service.id}
                        checked={filters.services.includes(service.id)}
                        onCheckedChange={(checked) => 
                          handleServiceChange(service.id, checked as boolean)
                        }
                      />
                      <Label htmlFor={service.id} className="text-sm">
                        {service.label}
                      </Label>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {service.count}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <Separator />

        {/* Price Range */}
        <div>
          <button
            onClick={() => toggleSection("price")}
            className="flex items-center justify-between w-full py-2 text-left"
          >
            <h3 className="font-medium flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Price Range
            </h3>
            {expandedSections.price ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
          
          {expandedSections.price && (
            <div className="space-y-3 mt-3">
              {isLoadingStats ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              ) : PRICE_RANGES.length === 0 ? (
                <p className="text-xs text-muted-foreground py-2">No price ranges available</p>
              ) : (
                PRICE_RANGES.map((price) => (
                  <div key={price.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={price.id}
                        checked={filters.priceRange.includes(price.id)}
                        onCheckedChange={(checked) => 
                          handlePriceRangeChange(price.id, checked as boolean)
                        }
                      />
                      <Label htmlFor={price.id} className="text-sm">
                        {price.label}
                      </Label>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {price.count}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <Separator />

        {/* Rating */}
        <div>
          <button
            onClick={() => toggleSection("rating")}
            className="flex items-center justify-between w-full py-2 text-left"
          >
            <h3 className="font-medium flex items-center gap-2">
              <Star className="w-4 h-4" />
              Minimum Rating
            </h3>
            {expandedSections.rating ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
          
          {expandedSections.rating && (
            <div className="mt-3">
              <div className="space-y-3">
                <div className="px-3">
                  <Slider
                    value={[filters.rating]}
                    onValueChange={(value) => 
                      onFiltersChange({ ...filters, rating: value[0] })
                    }
                    max={5}
                    min={0}
                    step={0.5}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>Any</span>
                    <span>{filters.rating > 0 ? `${filters.rating}+` : "5"} stars</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Distance */}
        <div>
          <button
            onClick={() => toggleSection("location")}
            className="flex items-center justify-between w-full py-2 text-left"
          >
            <h3 className="font-medium flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Distance
            </h3>
            {expandedSections.location ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
          
          {expandedSections.location && (
            <div className="mt-3">
              <div className="space-y-3">
                <div className="px-3">
                  <Slider
                    value={[filters.distance]}
                    onValueChange={(value) => 
                      onFiltersChange({ ...filters, distance: value[0] })
                    }
                    max={25}
                    min={0}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>Any</span>
                    <span>{filters.distance === 0 ? "25+" : filters.distance} mi</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Other Options */}
        <div>
          <button
            onClick={() => toggleSection("other")}
            className="flex items-center justify-between w-full py-2 text-left"
          >
            <h3 className="font-medium">Other</h3>
            {expandedSections.other ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
          
          {expandedSections.other && (
            <div className="space-y-3 mt-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="partners"
                  checked={filters.partnersOnly}
                  onCheckedChange={(checked) => 
                    onFiltersChange({ ...filters, partnersOnly: checked as boolean })
                  }
                />
                <Label htmlFor="partners" className="text-sm">
                  Partner salons only
                </Label>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
