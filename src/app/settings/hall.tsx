import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { Card, Divider, Screen, type IconName } from '@/components/primitives';
import { useStore } from '@/lib/store';
import { C, radius, T } from '@/lib/theme';

export default function HallDetailsScreen() {
  const { hall } = useStore();
  const rows: [IconName, string, string][] = [
    ['business-outline', 'Organisation', hall.org],
    ['person-outline', 'Your role', hall.role],
    ['location-outline', 'Address', hall.address],
    ['call-outline', 'Contact', hall.phone],
    ['people-outline', 'Capacity', hall.capacity],
  ];
  return (
    <Screen title="Hall Details" back>
      <View style={st.hero}>
        <Ionicons name="business" size={34} color={C.onPrimary} />
        <Text style={[T.section, { color: C.onPrimary }]}>{hall.name}</Text>
      </View>
      <Card style={{ padding: 0 }}>
        {rows.map(([icon, label, value], i) => (
          <View key={label}>
            <View style={st.row}>
              <Ionicons name={icon} size={19} color={C.primary} />
              <View style={{ flex: 1 }}>
                <Text style={T.caption}>{label}</Text>
                <Text style={T.bodyMedium}>{value}</Text>
              </View>
            </View>
            {i < rows.length - 1 ? <Divider inset={48} /> : null}
          </View>
        ))}
      </Card>
    </Screen>
  );
}

const st = StyleSheet.create({
  hero: {
    height: 140,
    borderRadius: radius.xl,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 14 },
});
