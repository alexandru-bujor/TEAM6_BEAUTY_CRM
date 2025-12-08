import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, User, Store, Calendar } from "lucide-react";
import { LoginForm } from "@/components/auth/LoginForm";

interface UserTypeSelectionProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const UserTypeSelection = ({ open, onOpenChange }: UserTypeSelectionProps) => {
  const navigate = useNavigate();

  const handleUserTypeSelect = (userType: 'customer' | 'salon') => {
    onOpenChange(false);
    navigate(`/register?type=${userType}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center mb-2">
            Welcome to Beauty Book
          </DialogTitle>
          <DialogDescription className="text-center">
            Sign in to your account or create a new one
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Sign In</TabsTrigger>
            <TabsTrigger value="register">Sign Up</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login" className="mt-6">
            <LoginForm onSuccess={() => onOpenChange(false)} onCancel={() => onOpenChange(false)} />
          </TabsContent>
          
          <TabsContent value="register" className="mt-6">
            <div className="grid md:grid-cols-2 gap-6">
          <Card 
            className="cursor-pointer border-2 hover:border-primary transition-all duration-300 group hover:shadow-medium"
            onClick={() => handleUserTypeSelect('customer')}
          >
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <User className="w-8 h-8 text-primary-foreground" />
              </div>
              <CardTitle className="text-xl">I'm a Customer</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground mb-6">
                Book appointments, discover new salons, and manage your beauty routine.
              </p>
              <ul className="text-left space-y-2 mb-6">
                <li className="flex items-center">
                  <Calendar className="w-4 h-4 text-primary mr-2" />
                  <span className="text-sm">Easy appointment booking</span>
                </li>
                <li className="flex items-center">
                  <Users className="w-4 h-4 text-primary mr-2" />
                  <span className="text-sm">Discover top-rated salons</span>
                </li>
                <li className="flex items-center">
                  <Store className="w-4 h-4 text-primary mr-2" />
                  <span className="text-sm">Manage booking history</span>
                </li>
              </ul>
              <Button 
                className="w-full bg-gradient-primary hover:opacity-90"
                onClick={() => handleUserTypeSelect('customer')}
              >
                Sign Up as Customer
              </Button>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer border-2 hover:border-primary transition-all duration-300 group hover:shadow-medium"
            onClick={() => handleUserTypeSelect('salon')}
          >
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <Store className="w-8 h-8 text-primary-foreground" />
              </div>
              <CardTitle className="text-xl">I'm a Salon Owner</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground mb-6">
                Grow your business, manage bookings, and reach new customers.
              </p>
              <ul className="text-left space-y-2 mb-6">
                <li className="flex items-center">
                  <Calendar className="w-4 h-4 text-primary mr-2" />
                  <span className="text-sm">Advanced booking management</span>
                </li>
                <li className="flex items-center">
                  <Users className="w-4 h-4 text-primary mr-2" />
                  <span className="text-sm">Customer management tools</span>
                </li>
                <li className="flex items-center">
                  <Store className="w-4 h-4 text-primary mr-2" />
                  <span className="text-sm">Business analytics</span>
                </li>
              </ul>
              <Button 
                className="w-full bg-gradient-primary hover:opacity-90"
                onClick={() => handleUserTypeSelect('salon')}
              >
                Sign Up as Salon
              </Button>
            </CardContent>
          </Card>
        </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default UserTypeSelection;