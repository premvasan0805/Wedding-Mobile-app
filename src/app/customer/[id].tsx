import { useLocalSearchParams } from 'expo-router';

import { CustomerProfile } from '@/components/customer-profile';

/** Full-screen profile, opened from a booking (outside the Customers tab). */
export default function CustomerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <CustomerProfile id={id} />;
}
