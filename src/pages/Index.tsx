import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import UserTypeSelection from "@/components/registration/UserTypeSelection";
import { 
  Search, 
  Users, 
  Calendar, 
  BarChart3, 
  ArrowRight, 
  CheckCircle, 
  Star,
  MapPin,
  Clock,
  Sparkles,
  TrendingUp,
  Shield,
  Zap,
  Heart,
  Award,
  Store
} from "lucide-react";

const Index = () => {
  const [showUserTypeModal, setShowUserTypeModal] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/30">
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
        <nav className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Sparkles className="w-8 h-8 text-primary" />
              <span className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Beauty Book
              </span>
            </div>
            <div className="hidden md:flex items-center">
              <Button 
                className="bg-gradient-primary hover:opacity-90 shadow-md hover:shadow-lg transition-all h-11 px-6"
                onClick={() => setShowUserTypeModal(true)}
              >
                Sign In
              </Button>
            </div>
            <Button 
              variant="ghost"
              size="sm"
              className="md:hidden h-11"
              onClick={() => setShowUserTypeModal(true)}
            >
              Sign In
            </Button>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative container mx-auto px-4 pt-20 pb-32 text-center overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl -z-10" />
        <div className="absolute top-40 right-0 w-[400px] h-[400px] bg-primary/3 rounded-full blur-3xl -z-10" />
        
        <Badge className="mb-6 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors px-4 py-1.5">
          <Star className="w-3.5 h-3.5 mr-1.5 fill-primary" />
          Trusted by 2,500+ Salons Worldwide
        </Badge>
        
        <h1 className="text-3xl sm:text-3xl md:text-4xl lg:text-4xl font-extrabold mb-6 leading-tight tracking-tight">
          <span className="block bg-gradient-primary bg-clip-text text-transparent mb-2">
            Discover & Book
          </span>
          <span className="block text-foreground">
            Your Perfect Beauty Experience
          </span>
        </h1>
        
        <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-12 leading-relaxed font-light">
          Connect with the finest beauty salons and professionals. Book appointments instantly, 
          discover exclusive services, and transform your beauty routine—all in one elegant platform.
        </p>

        {/* Enhanced Search Bar */}
        <div className="max-w-3xl mx-auto mb-10">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-primary opacity-20 rounded-3xl blur-xl group-hover:opacity-30 transition-opacity" />
            <div className="relative bg-background/90 backdrop-blur-sm border-2 border-primary/20 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:border-primary/40">
              <div className="flex items-center p-2">
                <div className="flex-1 flex items-center px-4">
                  <Search className="w-5 h-5 text-muted-foreground mr-3 flex-shrink-0" />
                  <input 
                    type="text" 
                    placeholder="Search for salons, services, or locations..." 
                    className="w-full py-4 text-base bg-transparent border-0 focus:outline-none placeholder:text-muted-foreground"
                  />
                </div>
                <Button className="bg-gradient-primary hover:opacity-90 h-12 px-8 rounded-2xl shadow-lg hover:shadow-xl transition-all">
                  Search
                  <Search className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-20">
          <Button 
            size="lg" 
            className="bg-gradient-primary hover:opacity-90 text-primary-foreground px-10 py-6 text-lg h-14 min-w-[220px] shadow-lg hover:shadow-xl transition-all group"
            onClick={() => setShowUserTypeModal(true)}
          >
            Join Beauty Book
            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
          <Link to="/salons">
            <Button 
              variant="outline" 
              size="lg" 
              className="px-10 py-6 text-lg h-14 min-w-[220px] border-2 hover:bg-primary/5 hover:border-primary/50 transition-all"
            >
              Explore Salons
            </Button>
          </Link>
        </div>

        {/* Enhanced Social Proof */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {[
            { value: "2,500+", label: "Active Salons", icon: Store },
            { value: "150K+", label: "Monthly Bookings", icon: Calendar },
            { value: "4.9★", label: "Customer Rating", icon: Star },
            { value: "50+", label: "Cities Covered", icon: MapPin }
          ].map((stat, index) => (
            <div key={index} className="text-center p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/30 transition-all group">
              <stat.icon className="w-6 h-6 text-primary mx-auto mb-3 group-hover:scale-110 transition-transform" />
              <div className="text-2xl md:text-3xl font-bold text-primary mb-2">{stat.value}</div>
              <div className="text-sm text-muted-foreground font-medium">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-24">
        <div className="text-center mb-20">
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
            Powerful Features
          </Badge>
          <h2 className="text-2xl md:text-3xl lg:text-3xl font-bold mb-6">
            Everything You Need to{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">Scale</span>
          </h2>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            From appointment booking to business analytics, we've got every aspect of your salon business covered.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {[
            {
              icon: Users,
              title: "Smart Salon Management",
              description: "Comprehensive salon profiles with service management, staff scheduling, and real-time availability tracking.",
              features: [
                "Service & pricing management",
                "Staff & schedule coordination",
                "Customer profile management"
              ],
              color: "from-purple-500 to-pink-500"
            },
            {
              icon: Calendar,
              title: "Advanced Booking System",
              description: "Streamlined appointment scheduling with automated reminders, waitlist management, and mobile optimization.",
              features: [
                "Real-time availability sync",
                "Automated SMS & email reminders",
                "Waitlist & cancellation management"
              ],
              color: "from-blue-500 to-purple-500"
            },
            {
              icon: BarChart3,
              title: "Business Analytics",
              description: "Detailed insights and performance metrics to help you make data-driven decisions and grow your business.",
              features: [
                "Revenue & booking analytics",
                "Customer retention insights",
                "Performance benchmarking"
              ],
              color: "from-pink-500 to-rose-500"
            }
          ].map((feature, index) => (
            <Card 
              key={index}
              className="bg-card border-2 border-border/50 hover:border-primary/30 shadow-lg hover:shadow-2xl transition-all duration-300 group overflow-hidden relative"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardContent className="p-8 text-center relative">
                <div className="w-20 h-20 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg">
                  <feature.icon className="w-10 h-10 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-bold mb-4 group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>
                <p className="text-base text-muted-foreground mb-6 leading-relaxed">
                  {feature.description}
                </p>
                <ul className="text-left space-y-3">
                  {feature.features.map((item, idx) => (
                    <li key={idx} className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-primary mr-3 flex-shrink-0" />
                      <span className="text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="relative container mx-auto px-4 py-24 bg-gradient-to-br from-accent/30 via-accent/20 to-primary/10 rounded-3xl my-24 overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10" />
        
        <div className="text-center mb-20 relative z-10">
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
            Simple Process
          </Badge>
          <h2 className="text-2xl md:text-3xl lg:text-3xl font-bold mb-6">
            Get Started in{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">3 Simple Steps</span>
          </h2>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            From registration to your first booking—we'll have you up and running in minutes.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto relative z-10">
          {[
            {
              number: "1",
              title: "Register Your Salon",
              description: "Complete our simple registration form with your salon details and services.",
              icon: Shield
            },
            {
              number: "2",
              title: "Get Verified",
              description: "Our team reviews your registration within 24-48 hours for quality assurance.",
              icon: Award
            },
            {
              number: "3",
              title: "Start Growing",
              description: "Access your dashboard and start managing bookings, customers, and business insights.",
              icon: TrendingUp
            }
          ].map((step, index) => (
            <div key={index} className="text-center group">
              <div className="relative inline-block mb-6">
                <div className="w-20 h-20 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  <step.icon className="w-10 h-10 text-primary-foreground" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-sm shadow-md">
                  {step.number}
                </div>
              </div>
              <h3 className="text-lg font-bold mb-4 group-hover:text-primary transition-colors">
                {step.title}
              </h3>
              <p className="text-base text-muted-foreground leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials/Stats Section */}
      <section className="container mx-auto px-4 py-24">
        <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto items-center">
          <div>
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
              Why Choose Us
            </Badge>
            <h2 className="text-2xl md:text-3xl font-bold mb-6">
              Trusted by{" "}
              <span className="bg-gradient-primary bg-clip-text text-transparent">Industry Leaders</span>
            </h2>
            <p className="text-base md:text-lg text-muted-foreground mb-8 leading-relaxed">
              Join thousands of successful salons that have transformed their business with our platform.
            </p>
            <div className="space-y-4">
              {[
                { icon: Zap, text: "Lightning-fast booking system" },
                { icon: Shield, text: "Secure and reliable platform" },
                { icon: Heart, text: "Dedicated customer support" }
              ].map((item, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-base font-medium">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6">
            {[
              { value: "98%", label: "Satisfaction Rate" },
              { value: "24/7", label: "Support Available" },
              { value: "99.9%", label: "Uptime" },
              { value: "10K+", label: "Happy Customers" }
            ].map((stat, index) => (
              <Card key={index} className="p-6 text-center border-2 border-border/50 hover:border-primary/30 transition-all">
                <div className="text-2xl font-bold text-primary mb-2">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-24 text-center">
        <div className="max-w-4xl mx-auto relative">
          <div className="absolute inset-0 bg-gradient-primary opacity-10 rounded-3xl blur-3xl" />
          <div className="relative bg-gradient-to-br from-card to-card/50 border-2 border-primary/20 rounded-3xl p-12 md:p-16 shadow-2xl">
            <h2 className="text-2xl md:text-3xl lg:text-3xl font-bold mb-6">
              Ready to{" "}
              <span className="bg-gradient-primary bg-clip-text text-transparent">Transform</span>{" "}
              Your Salon?
            </h2>
            <p className="text-base md:text-lg text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              Join thousands of successful salons already using Beauty Book to streamline their operations and grow their business.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link to="/register">
                <Button 
                  size="lg" 
                  className="bg-gradient-primary hover:opacity-90 text-primary-foreground px-10 py-6 text-lg h-14 min-w-[250px] shadow-xl hover:shadow-2xl transition-all group"
                >
                  Start Your Free Trial
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <div className="flex items-center text-sm text-muted-foreground">
                <Clock className="w-4 h-4 mr-2" />
                Get approved in 24-48 hours
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Footer */}
      <footer className="border-t bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-16">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <Sparkles className="w-7 h-7 text-primary" />
                <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  Beauty Book
                </span>
              </div>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Your gateway to the perfect beauty experience. Connect, book, and grow with confidence.
              </p>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Star className="w-4 h-4 text-primary fill-primary" />
                <span>Rated 4.9/5 by 10,000+ users</span>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-foreground">Platform</h4>
              <ul className="space-y-3 text-muted-foreground">
                <li>
                  <Link to="/salons" className="hover:text-primary transition-colors flex items-center group">
                    <ArrowRight className="w-3 h-3 mr-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                    Browse Salons
                  </Link>
                </li>
                <li>
                  <Link to="/register" className="hover:text-primary transition-colors flex items-center group">
                    <ArrowRight className="w-3 h-3 mr-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                    Register Salon
                  </Link>
                </li>
                <li>
                  <Link to="/pricing" className="hover:text-primary transition-colors flex items-center group">
                    <ArrowRight className="w-3 h-3 mr-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                    Pricing
                  </Link>
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-foreground">Support</h4>
              <ul className="space-y-3 text-muted-foreground">
                <li>
                  <Link to="/help" className="hover:text-primary transition-colors flex items-center group">
                    <ArrowRight className="w-3 h-3 mr-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="hover:text-primary transition-colors flex items-center group">
                    <ArrowRight className="w-3 h-3 mr-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link to="/api" className="hover:text-primary transition-colors flex items-center group">
                    <ArrowRight className="w-3 h-3 mr-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                    API Docs
                  </Link>
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-foreground">Legal</h4>
              <ul className="space-y-3 text-muted-foreground">
                <li>
                  <Link to="/privacy" className="hover:text-primary transition-colors flex items-center group">
                    <ArrowRight className="w-3 h-3 mr-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="hover:text-primary transition-colors flex items-center group">
                    <ArrowRight className="w-3 h-3 mr-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-muted-foreground text-sm">
              &copy; 2024 Beauty Book. All rights reserved.
            </p>
            <div className="flex items-center space-x-2 mt-4 md:mt-0">
              <Badge variant="outline" className="text-xs">
                <Shield className="w-3 h-3 mr-1" />
                Secure Platform
              </Badge>
            </div>
          </div>
        </div>
      </footer>

      <UserTypeSelection 
        open={showUserTypeModal} 
        onOpenChange={setShowUserTypeModal} 
      />
    </div>
  );
};

export default Index;
