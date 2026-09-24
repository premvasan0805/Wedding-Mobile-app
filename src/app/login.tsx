import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TextField } from '@/components/form';
import { PrimaryButton, Touchable } from '@/components/primitives';
import { useStore } from '@/lib/store';
import { C, F, radius, T } from '@/lib/theme';

/** Welcome + sign in. UI only: any 10-digit number and 4-digit PIN signs in locally, nothing leaves the device. */
export default function LoginScreen() {
  const { setSignedIn } = useStore();
  const [stage, setStage] = useState<'welcome' | 'form'>('welcome');
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const valid = phone.replace(/\D/g, '').length === 10 && /^\d{4}$/.test(pin);

  if (stage === 'welcome') {
    return (
      <View style={st.welcome}>
        <View style={[st.ring, { width: 420, height: 420, top: -120, right: -160 }]} />
        <View style={[st.ring, { width: 300, height: 300, bottom: 120, left: -150 }]} />
        <SafeAreaView style={st.welcomeInner}>
          <Animated.View entering={FadeIn.duration(500)} style={st.brand}>
            <View style={st.logo}>
              <Ionicons name="flower-outline" size={34} color={C.accentOnPrimary} />
            </View>
            <Text style={st.brandName}>HallBook</Text>
            <Text style={st.tagline}>Make every celebration memorable</Text>
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(200).duration(400)} style={{ gap: 14 }}>
            <Text style={st.pitch}>Bookings, payments and important dates for your marriage hall — in one place.</Text>
            <Touchable style={st.getStarted} onPress={() => setStage('form')}>
              <Text style={[T.button, { color: C.primaryDark }]}>Get Started</Text>
              <Ionicons name="arrow-forward" size={18} color={C.primaryDark} />
            </Touchable>
            <Text style={st.small}>Manage your wedding hall with ease</Text>
          </Animated.View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={st.form} keyboardShouldPersistTaps="handled">
          <Touchable onPress={() => setStage('welcome')} style={st.back} accessibilityLabel="Back">
            <Ionicons name="arrow-back" size={24} color={C.text} />
          </Touchable>
          <Animated.View entering={FadeInDown.duration(300)} style={{ gap: 6 }}>
            <View style={st.formLogo}>
              <Ionicons name="flower-outline" size={26} color={C.primary} />
            </View>
            <Text style={T.screenTitle}>Welcome back</Text>
            <Text style={T.secondary}>Sign in to manage your hall.</Text>
          </Animated.View>
          <View style={{ gap: 16, marginTop: 12 }}>
            <TextField
              label="Mobile number"
              prefix="+91"
              keyboardType="phone-pad"
              placeholder="10-digit number"
              value={phone}
              onChangeText={setPhone}
              maxLength={10}
            />
            <TextField
              label="PIN"
              secureTextEntry
              keyboardType="number-pad"
              placeholder="4-digit PIN"
              value={pin}
              onChangeText={setPin}
              maxLength={4}
            />
          </View>
          <View style={{ flex: 1, minHeight: 24 }} />
          <PrimaryButton
            title="Sign in"
            disabled={!valid}
            loading={loading}
            onPress={() => {
              setLoading(true);
              setTimeout(() => {
                setSignedIn(true);
                router.replace('/');
              }, 400);
            }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  welcome: { flex: 1, backgroundColor: C.primaryDark, overflow: 'hidden' },
  ring: { position: 'absolute', borderRadius: 999, borderWidth: 1, borderColor: 'rgba(230,198,138,0.18)' },
  welcomeInner: { flex: 1, justifyContent: 'space-between', padding: 28 },
  brand: { alignItems: 'center', marginTop: 72, gap: 8 },
  logo: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 1,
    borderColor: 'rgba(230,198,138,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  brandName: { fontFamily: F.semibold, fontSize: 38, color: C.onPrimary, letterSpacing: -0.5 },
  tagline: { fontFamily: F.regular, fontSize: 16, color: C.onPrimarySoft },
  pitch: { fontFamily: F.regular, fontSize: 15, lineHeight: 22, color: C.onPrimarySoft, textAlign: 'center' },
  getStarted: {
    minHeight: 54,
    borderRadius: radius.md,
    backgroundColor: C.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  small: { fontFamily: F.regular, fontSize: 13, color: C.onPrimaryMuted, textAlign: 'center' },
  form: { flexGrow: 1, padding: 24, gap: 8 },
  back: { width: 44, height: 44, justifyContent: 'center', marginLeft: -6, marginBottom: 12 },
  formLogo: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: C.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
});
