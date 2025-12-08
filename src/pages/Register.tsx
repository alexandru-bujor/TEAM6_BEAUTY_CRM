import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Navigation from "@/components/ui/navigation";
import { RegistrationSteps } from "@/components/registration/RegistrationSteps";
import { BasicInfoStep } from "@/components/registration/BasicInfoStep";
import { LocationServicesStep } from "@/components/registration/LocationServicesStep";
import { VerificationStep } from "@/components/registration/VerificationStep";
import { ReviewStep } from "@/components/registration/ReviewStep";
import CustomerRegistrationForm from "@/components/registration/CustomerRegistrationForm";
import { authAPI, setToken } from "@/lib/api";
import { toast } from "sonner";

const Register = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const userType = searchParams.get("type");
  const [currentStep, setCurrentStep] = useState(1);

  if (userType === "customer") {
    return <CustomerRegistrationForm />;
  }
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [basicInfo, setBasicInfo] = useState({
    salonName: "",
    contactName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    isIndividualStylist: false,
  });

  const [locationServices, setLocationServices] = useState({
    address: "",
    city: "",
    state: "",
    zipCode: "",
    categories: [] as string[],
  });

  const [verification, setVerification] = useState({
    emailCode: "",
    phoneCode: "",
    emailVerified: false,
    phoneVerified: false,
  });

  const [review, setReview] = useState({
    agreeToTerms: false,
    agreeToMarketing: false,
  });

  const handleBasicInfoChange = (data: Partial<typeof basicInfo>) => {
    setBasicInfo(prev => ({ ...prev, ...data }));
  };

  const handleLocationServicesChange = (data: Partial<typeof locationServices>) => {
    setLocationServices(prev => ({ ...prev, ...data }));
  };

  const handleVerificationChange = (data: Partial<typeof verification>) => {
    setVerification(prev => ({ ...prev, ...data }));
  };

  const handleReviewChange = (data: Partial<typeof review>) => {
    setReview(prev => ({ ...prev, ...data }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const response = await authAPI.registerSalon({
        email: basicInfo.email,
        password: basicInfo.password,
        salonName: basicInfo.salonName,
        contactName: basicInfo.contactName || undefined,
        phone: basicInfo.phone,
        address: locationServices.address,
        city: locationServices.city,
        state: locationServices.state,
        zipCode: locationServices.zipCode,
        isIndividualStylist: basicInfo.isIndividualStylist,
        categories: locationServices.categories,
      });

      // Store token if provided
      if (response.token) {
        setToken(response.token);
      }

      toast.success('Registration submitted successfully!');
      navigate('/pending-approval');
    } catch (error: any) {
      toast.error(error.message || 'Registration failed. Please try again.');
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <BasicInfoStep
            data={basicInfo}
            onDataChange={handleBasicInfoChange}
            onNext={() => setCurrentStep(2)}
          />
        );
      case 2:
        return (
          <LocationServicesStep
            data={locationServices}
            onDataChange={handleLocationServicesChange}
            onNext={() => setCurrentStep(3)}
            onBack={() => setCurrentStep(1)}
          />
        );
      case 3:
        return (
          <VerificationStep
            data={verification}
            onDataChange={handleVerificationChange}
            onNext={() => setCurrentStep(4)}
            onBack={() => setCurrentStep(2)}
            email={basicInfo.email}
            phone={basicInfo.phone}
          />
        );
      case 4:
        return (
          <ReviewStep
            reviewData={review}
            registrationData={{
              ...basicInfo,
              ...locationServices,
            }}
            onReviewDataChange={handleReviewChange}
            onSubmit={handleSubmit}
            onBack={() => setCurrentStep(3)}
            isSubmitting={isSubmitting}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-secondary">
      <Navigation />
      <div className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <Button variant="ghost" asChild>
                <Link to="/" className="flex items-center text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Link>
              </Button>
            </div>
            <RegistrationSteps currentStep={currentStep} onStepChange={setCurrentStep} />
            {renderStep()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;