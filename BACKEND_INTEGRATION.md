# Backend Integration Guide

This guide explains how to integrate the backend API with the frontend.

## Quick Start

1. **Start the Backend Server**
   ```bash
   cd server
   npm install
   cp .env.example .env
   # Edit .env with your database credentials
   npm run migrate  # Setup database
   npm run dev      # Start server
   ```

2. **Configure Frontend**
   
   Create a `.env` file in the root directory:
   ```env
   VITE_API_URL=http://localhost:3001/api
   ```

3. **Use the API Client**
   
   The API client is available at `src/lib/api.ts`. Import and use it:
   ```typescript
   import { authAPI, salonsAPI } from '@/lib/api';
   
   // Login
   const response = await authAPI.login(email, password);
   setToken(response.token);
   
   // Get salons
   const salons = await salonsAPI.getAll({ page: 1, limit: 12 });
   ```

## Integration Steps

### 1. Authentication

Replace mock authentication with API calls:

```typescript
// In your login component
import { authAPI, setToken } from '@/lib/api';

const handleLogin = async (email: string, password: string) => {
  try {
    const response = await authAPI.login(email, password);
    setToken(response.token);
    // Store user data
    localStorage.setItem('user', JSON.stringify(response.user));
    // Redirect to dashboard
    navigate('/dashboard');
  } catch (error) {
    // Handle error
    console.error('Login failed:', error);
  }
};
```

### 2. Salon Registration

Update the salon registration form:

```typescript
import { authAPI, setToken } from '@/lib/api';

const handleSubmit = async (formData) => {
  try {
    const response = await authAPI.registerSalon({
      email: formData.email,
      password: formData.password,
      salonName: formData.salonName,
      contactName: formData.contactName,
      phone: formData.phone,
      address: formData.address,
      city: formData.city,
      state: formData.state,
      zipCode: formData.zipCode,
      isIndividualStylist: formData.isIndividualStylist,
      categories: formData.categories
    });
    
    setToken(response.token);
    navigate('/pending-approval');
  } catch (error) {
    console.error('Registration failed:', error);
  }
};
```

### 3. Salon Listing

Replace mock data with API calls:

```typescript
import { salonsAPI } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';

const Salons = () => {
  const [filters, setFilters] = useState({});
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['salons', filters, page],
    queryFn: () => salonsAPI.getAll({ ...filters, page, limit: 12 })
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {data.salons.map(salon => (
        <SalonCard key={salon.id} salon={salon} />
      ))}
      <Pagination 
        currentPage={page}
        totalPages={data.pagination.totalPages}
        onPageChange={setPage}
      />
    </div>
  );
};
```

### 4. Salon Dashboard

Update salon dashboard to fetch real data:

```typescript
import { salonsAPI, servicesAPI, employeesAPI, appointmentsAPI, usersAPI } from '@/lib/api';

const SalonDashboard = () => {
  // Get salon data
  const { data: salon } = useQuery({
    queryKey: ['my-salon'],
    queryFn: () => salonsAPI.getMySalon()
  });

  // Get services
  const { data: services } = useQuery({
    queryKey: ['my-services'],
    queryFn: () => servicesAPI.getMyServices()
  });

  // Get employees
  const { data: employees } = useQuery({
    queryKey: ['my-employees'],
    queryFn: () => employeesAPI.getMyEmployees()
  });

  // Get appointments
  const { data: appointments } = useQuery({
    queryKey: ['appointments'],
    queryFn: () => appointmentsAPI.getAll()
  });

  // Get stats
  const { data: stats } = useQuery({
    queryKey: ['salon-stats'],
    queryFn: () => usersAPI.getSalonDashboardStats()
  });

  // ... render components
};
```

### 5. Service Management

```typescript
import { servicesAPI } from '@/lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const ServiceManagement = () => {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: servicesAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-services'] });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => servicesAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-services'] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: servicesAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-services'] });
    }
  });

  // Use mutations in your handlers
};
```

### 6. Appointments

```typescript
import { appointmentsAPI } from '@/lib/api';

// Create appointment
const handleBookAppointment = async (data) => {
  try {
    await appointmentsAPI.create({
      salon_id: data.salonId,
      service_id: data.serviceId,
      employee_id: data.employeeId,
      appointment_date: data.date,
      appointment_time: data.time,
      notes: data.notes
    });
    // Show success message
  } catch (error) {
    // Handle error
  }
};

// Update status (salon owner)
const handleConfirmAppointment = async (id) => {
  await appointmentsAPI.updateStatus(id, 'confirmed');
};

// Cancel appointment (customer)
const handleCancelAppointment = async (id) => {
  await appointmentsAPI.cancel(id);
};
```

## Error Handling

The API client automatically handles:
- 401 Unauthorized (token expired) - redirects to login
- Network errors
- JSON parsing errors

For custom error handling:

```typescript
try {
  const data = await salonsAPI.getAll();
} catch (error) {
  if (error.message.includes('Network')) {
    // Handle network error
  } else {
    // Handle other errors
    toast.error(error.message);
  }
}
```

## Environment Variables

Create `.env` in the root directory:

```env
VITE_API_URL=http://localhost:3001/api
```

For production, update to your production API URL.

## Testing

1. Start backend: `cd server && npm run dev`
2. Start frontend: `npm run dev`
3. Test authentication flow
4. Test CRUD operations
5. Verify data persistence

## Common Issues

### CORS Errors
- Ensure backend CORS is configured for your frontend URL
- Check `FRONTEND_URL` in backend `.env`

### 401 Unauthorized
- Check if token is being sent in headers
- Verify token is stored in localStorage
- Check token expiration

### 404 Not Found
- Verify API endpoint paths match
- Check backend routes are registered
- Ensure server is running

### Database Errors
- Verify database connection
- Check table existence
- Verify foreign key constraints

## Next Steps

1. Replace all mock data with API calls
2. Add loading states
3. Add error handling
4. Implement optimistic updates
5. Add request caching
6. Implement file uploads for images

