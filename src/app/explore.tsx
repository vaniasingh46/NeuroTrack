import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Svg, { Path, Circle } from 'react-native-svg';

const COLORS = {
  bg: '#080B0D',
  textPrimary: '#F2F0E8',
  textSecondary: '#737A7D',
  textDim: '#3F4648',
  cyan: '#00E5F5',
  green: '#38E89B',
  border: '#20282B',
};

function MotionIcon() {
  return (
    <Svg width={40} height={20} viewBox="0 0 40 20">
      <Path
        d="M0,10 L10,10 L14,3 L18,17 L22,6 L25,10 L40,10"
        stroke={COLORS.cyan}
        strokeWidth={1.2}
        fill="none"
      />
    </Svg>
  );
}

function SpiralIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22">
      <Path
        d="M11,11 
           m0,-1 
           a1,1 0 1,1 -1,1 
           a3,3 0 1,0 3,-3 
           a5,5 0 1,1 -5,5 
           a7,7 0 1,0 7,-7"
        stroke={COLORS.green}
        strokeWidth={1.1}
        fill="none"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function TappingIcon() {
  const dots = [0, 1, 2, 3, 4];
  return (
    <View style={{ flexDirection: 'row', gap: 5, alignItems: 'center' }}>
      {dots.map((d) => (
        <View
          key={d}
          style={{
            width: 4,
            height: 4,
            borderRadius: 2,
            backgroundColor: d === 2 ? COLORS.cyan : COLORS.textDim,
          }}
        />
      ))}
    </View>
  );
}

export default function ExploreScreen() {
  const router = useRouter();

  const handleContinue = () => {
    router.push('/motion-instructions');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}
        <View style={styles.headerRow}>
          <Text style={styles.logo}>NEUROTRACK</Text>
          <Text style={styles.headerIndex}>02 / 04</Text>
        </View>
        <View style={styles.headerDivider} />

        {/* MAIN TITLE */}
        <View style={styles.heroBlock}>
          <Text style={styles.heroLine}>ASSESSMENT</Text>
          <Text style={[styles.heroLine, styles.heroLineAccent]}>
            PROTOCOL
          </Text>
        </View>
        <Text style={styles.subtitle}>
          Three short tests. One movement profile.
        </Text>

        {/* TEST 01 — MOTION */}
        <View style={styles.divider} />
        <View style={styles.testRow}>
          <Text style={styles.testNumber}>01</Text>
          <View style={styles.testBody}>
            <View style={styles.testTitleRow}>
              <Text style={styles.testTitle}>MOTION</Text>
              <Text style={styles.testDuration}>10 SEC</Text>
            </View>
            <View style={styles.testDescRow}>
              <Text style={styles.testDesc}>
                Measures movement{'\n'}through your phone&apos;s{'\n'}motion
                sensors.
              </Text>
              <MotionIcon />
            </View>
          </View>
        </View>

        {/* TEST 02 — SPIRAL */}
        <View style={styles.divider} />
        <View style={styles.testRow}>
          <Text style={styles.testNumber}>02</Text>
          <View style={styles.testBody}>
            <View style={styles.testTitleRow}>
              <Text style={styles.testTitle}>SPIRAL</Text>
              <Text style={styles.testDuration}>~30 SEC</Text>
            </View>
            <View style={styles.testDescRow}>
              <Text style={styles.testDesc}>
                Trace the spiral{'\n'}as accurately as{'\n'}you can.
              </Text>
              <SpiralIcon />
            </View>
          </View>
        </View>

        {/* TEST 03 — TAPPING */}
        <View style={styles.divider} />
        <View style={styles.testRow}>
          <Text style={styles.testNumber}>03</Text>
          <View style={styles.testBody}>
            <View style={styles.testTitleRow}>
              <Text style={styles.testTitle}>TAPPING</Text>
              <Text style={styles.testDuration}>10 SEC</Text>
            </View>
            <View style={styles.testDescRow}>
              <Text style={styles.testDesc}>
                Tap repeatedly to{'\n'}measure movement{'\n'}consistency.
              </Text>
              <TappingIcon />
            </View>
          </View>
        </View>
        <View style={styles.divider} />

        {/* ESTIMATED TIME */}
        <Text style={styles.estimatedTime}>ESTIMATED TIME · 1 MIN</Text>

        {/* CONTINUE CTA */}
        <Pressable style={styles.ctaButton} onPress={handleContinue}>
          <Text style={styles.ctaText}>CONTINUE</Text>
          <Text style={styles.ctaArrow}>→</Text>
        </Pressable>
      </ScrollView>

      {/* BOTTOM NAVIGATION (visual only) */}
      <View style={styles.bottomNav}>
        <View style={styles.navItem}>
          <Text style={[styles.navIcon, styles.navIconActive]}>⊞</Text>
          <Text style={[styles.navLabel, styles.navLabelActive]}>
            OVERVIEW
          </Text>
        </View>
        <View style={styles.navItem}>
          <Text style={styles.navIcon}>⌁</Text>
          <Text style={styles.navLabel}>TELEMETRY</Text>
        </View>
        <View style={styles.navItem}>
          <Text style={styles.navIcon}>⚙</Text>
          <Text style={styles.navLabel}>DIAGNOSTICS</Text>
        </View>
        <View style={styles.navItem}>
          <Text style={styles.navIcon}>▤</Text>
          <Text style={styles.navLabel}>RECORDS</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  logo: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
    color: COLORS.textPrimary,
    fontFamily: 'serif',
  },
  headerIndex: {
    fontSize: 9,
    letterSpacing: 1,
    color: COLORS.textDim,
  },
  headerDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginBottom: 26,
  },

  heroBlock: {
    marginBottom: 8,
  },
  heroLine: {
    fontFamily: 'serif',
    fontSize: 34,
    lineHeight: 34,
    fontWeight: '400',
    letterSpacing: -0.5,
    color: COLORS.textPrimary,
    textTransform: 'uppercase',
  },
  heroLineAccent: {
    color: '#E8F4F2',
  },
  subtitle: {
    fontSize: 11,
    lineHeight: 16,
    color: COLORS.textSecondary,
    marginBottom: 20,
  },

  divider: {
    height: 1,
    backgroundColor: COLORS.border,
  },

  testRow: {
    flexDirection: 'row',
    paddingVertical: 20,
    gap: 14,
  },
  testNumber: {
    fontFamily: 'serif',
    fontSize: 28,
    color: COLORS.textDim,
    width: 36,
  },
  testBody: {
    flex: 1,
  },
  testTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  testTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 1,
    color: COLORS.textPrimary,
    textTransform: 'uppercase',
  },
  testDuration: {
    fontSize: 9,
    letterSpacing: 0.6,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
  },
  testDescRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  testDesc: {
    fontSize: 11,
    lineHeight: 16,
    color: COLORS.textSecondary,
    flex: 1,
    paddingRight: 12,
  },

  estimatedTime: {
    fontSize: 9,
    letterSpacing: 0.8,
    color: COLORS.textDim,
    textTransform: 'uppercase',
    marginTop: 24,
    marginBottom: 12,
  },

  ctaButton: {
    backgroundColor: COLORS.cyan,
    borderRadius: 3,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ctaText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: '#080B0D',
    textTransform: 'uppercase',
  },
  ctaArrow: {
    fontSize: 15,
    fontWeight: '700',
    color: '#080B0D',
  },

  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 6,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.bg,
  },
  navItem: {
    alignItems: 'center',
    gap: 4,
  },
  navIcon: {
    fontSize: 16,
    color: COLORS.textDim,
  },
  navIconActive: {
    color: COLORS.cyan,
  },
  navLabel: {
    fontSize: 8,
    letterSpacing: 0.5,
    color: COLORS.textDim,
    textTransform: 'uppercase',
  },
  navLabelActive: {
    color: COLORS.cyan,
  },
});