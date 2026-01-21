import { Star, MapPin, Clock, Heart, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Salon {
  id: number;
  name: string;
  rating: number;
  reviewCount: number;
  location: string;
  address: string;
  image: string;
  services: string[];
  priceRange: string;
  isPartner: boolean;
  nextAvailable: string;
  specialties: string[];
}

interface SalonCardProps {
  salon: Salon;
  viewMode: "grid" | "list";
}

export const SalonCard = ({ salon, viewMode }: SalonCardProps) => {
  if (viewMode === "list") {
    return (
      <Card className="hover:shadow-medium transition-shadow bg-card border-border">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
            <div className="relative w-full sm:w-48 h-48 sm:h-32 flex-shrink-0">
              <img
                src={salon.image}
                alt={salon.name}
                className="w-full h-full object-cover rounded-lg"
              />
              {salon.isPartner && (
                <Badge className="absolute top-2 left-2 bg-gradient-primary text-primary-foreground">
                  Partner
                </Badge>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2">
                <div className="mb-2 sm:mb-0">
                  <h3 className="text-xl font-semibold text-foreground mb-1">
                    {salon.name}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <MapPin className="w-4 h-4" />
                    {salon.location}
                  </div>
                </div>
                
                <div className="text-right mb-2 sm:mb-0">
                  <div className="flex items-center gap-1 mb-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold">{salon.rating}</span>
                    <span className="text-sm text-muted-foreground">
                      ({salon.reviewCount})
                    </span>
                  </div>
                  <div className="text-sm font-medium text-primary">
                    {salon.priceRange}
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-1 mb-3">
                {salon.specialties.slice(0, 3).map((specialty, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {specialty}
                  </Badge>
                ))}
              </div>
              
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                <div className="flex items-center gap-1 text-sm text-muted-foreground order-2 sm:order-1">
                  <Clock className="w-4 h-4" />
                  {salon.nextAvailable}
                </div>
                
                <div className="flex gap-2 order-1 sm:order-2">
                  <Button variant="outline" size="sm">
                    <Heart className="w-4 h-4" />
                  </Button>
                  <Link to={`/book/${salon.id}`}>
                    <Button size="sm" className="bg-gradient-primary hover:opacity-90">
                      Book Appointment
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="group hover:shadow-medium transition-all duration-300 hover:-translate-y-1 bg-card border-border h-full flex flex-col">
      <CardHeader className="p-0 flex-shrink-0">
        <div className="relative overflow-hidden rounded-t-lg h-48">
          <img
            src={salon.image}
            alt={salon.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {salon.isPartner && (
            <Badge className="absolute top-3 left-3 bg-gradient-primary text-primary-foreground">
              Partner
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            className="absolute top-3 right-3 w-8 h-8 p-0 bg-card/80 hover:bg-card"
          >
            <Heart className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 sm:p-6 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-2 flex-wrap gap-2">
          <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
            {salon.name}
          </h3>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="font-semibold text-sm">{salon.rating}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
          <MapPin className="w-4 h-4" />
          {salon.location}
        </div>
        
        <div className="flex flex-wrap gap-1 mb-4">
          {salon.specialties.slice(0, 2).map((specialty, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {specialty}
            </Badge>
          ))}
          {salon.specialties.length > 2 && (
            <Badge variant="secondary" className="text-xs">
              +{salon.specialties.length - 2} more
            </Badge>
          )}
        </div>
        
        <div className="flex items-center justify-between text-sm mb-4 mt-auto">
          <div className="flex items-center gap-1 text-muted-foreground min-w-0">
            <Clock className="w-4 h-4" />
            <span className="truncate">{salon.nextAvailable}</span>
          </div>
          <span className="font-medium text-primary flex-shrink-0">{salon.priceRange}</span>
        </div>
        
        <Link to={`/book/${salon.id}`} className="w-full">
          <Button className="w-full bg-gradient-primary hover:opacity-90 text-primary-foreground">
            <ExternalLink className="w-4 h-4 mr-2" />
            Book Appointment
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
};