import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { Card, Screen } from '@/components/primitives';
import { C, T } from '@/lib/theme';

export default function AboutScreen() {
  return (
    <Screen title="About" back>
      <View style={st.brand}>
        <View style={st.logo}>
          <Ionicons name="flower-outline" size={32} color={C.primary} />
        </View>
        <Text style={T.screenTitle}>HallBook</Text>
        <Text style={T.secondary}>Version 1.0.0</Text>
      </View>
      <Card>
        <Text style={T.body}>
          HallBook helps marriage halls manage bookings, customers, payments, rates and auspicious dates from a
          single mobile app.
        </Text>
      </Card>
    </Screen>
  );
}

const st = StyleSheet.create({
  brand: { alignItems: 'center', gap: 4, paddingVertical: 24 },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: C.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
});
