import React, { useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Easing,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Line, Circle } from 'react-native-svg';

const COLORS = {
  bg: '#080B0D',
  textPrimary: '#F2F0E8',
  textSecondary: '#737A7D',
  textDim: '#3F4648',
  cyan: '#00E5F5',
  green: '#38E89B',
  border: '#20282B',
  rec: '#C9615F',
};


const AnimatedCircle = Animated.createAnimatedComponent(Circle) as any;

const TRACE_POINTS = [
  { x: 0, y: 100 },
  { x: 60, y: 100 },
  { x: 120, y: 99 },
  { x: 160, y: 95 },
  { x: 190, y: 85 },
  { x: 215, y: 70 },
  { x: 230, y: 60 },
  { x: 245, y: 65 },
  { x: 260, y: 85 },
  { x: 275, y: 115 },
  { x: 285, y: 138 },
  { x: 292, y: 150 },
  { x: 300, y: 140 },
  { x: 312, y: 100 },
  { x: 325, y: 60 },
  { x: 335, y: 40 },
  { x: 345, y: 35 },
  { x: 355, y: 50 },
  { x: 365, y: 85 },
  { x: 373, y: 120 },
  { x: 380, y: 145 },
  { x: 390, y: 150 },
  { x: 405, y: 120 },
  { x: 420, y: 85 },
  { x: 440, y: 55 },
  { x: 460, y: 30 },
  { x: 480, y: 18 },
  { x: 500, y: 15 },
  { x: 520, y: 22 },
  { x: 540, y: 45 },
  { x: 555, y: 70 },
  { x: 568, y: 90 },
  { x: 580, y: 100 },
  { x: 600, y: 100 },
];

const T_INPUT = TRACE_POINTS.map((_, i) => i / (TRACE_POINTS.length - 1));
const X_OUTPUT = TRACE_POINTS.map((p) => p.x);
const Y_OUTPUT = TRACE_POINTS.map((p) => p.y);

export default function HomeScreen() {
  const router = useRouter();
  const { height } = useWindowDimensions();
  const compact = height < 700;

  // Marker travels along the waveform continuously.
  const progress = useRef(new Animated.Value(0)).current;
  // Pulse ring "breathes" outward at the marker position.
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const traveler = Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration: 4200,
        easing: Easing.linear,
        useNativeDriver: false,
      })
    );
    const blip = Animated.loop(
      Animated.timing(pulse, {
        toValue: 1,
        duration: 1300,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false,
      })
    );
    traveler.start();
    blip.start();
    return () => {
      traveler.stop();
      blip.stop();
    };
  }, [progress, pulse]);

  const markerX = progress.interpolate({
    inputRange: T_INPUT,
    outputRange: X_OUTPUT,
  });
  const markerY = progress.interpolate({
    inputRange: T_INPUT,
    outputRange: Y_OUTPUT,
  });
  const pulseRadius = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [4, 12],
  });
  const pulseOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.55, 0],
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.container}>
        {/* 1. TOP HEADER */}
        <View style={styles.headerRow}>
          <Text style={styles.logo}>NEUROTRACK</Text>
          <View style={styles.headerStatusGroup}>
            <View style={styles.statusItem}>
              <View style={[styles.dot, { backgroundColor: COLORS.green }]} />
              <Text style={styles.headerStatusText}>SENSOR READY</Text>
            </View>
            <View style={styles.statusItem}>
              <Text style={styles.headerStatusTextDim}>LOCAL</Text>
            </View>
          </View>
        </View>

        {/* 2. SYSTEM STATUS LINE */}
        <View style={styles.systemLine}>
          <View style={[styles.dot, { backgroundColor: COLORS.cyan }]} />
          <Text style={styles.systemLineText}>KINEMATIC LABS</Text>
          <Text style={styles.systemLineDash}>·</Text>
          <Text style={styles.systemLineText}>INDEX PROTOCOL</Text>
        </View>

        {/* 3. MAIN HERO HEADING */}
        <View style={[styles.heroBlock, compact && styles.heroBlockCompact]}>
          <Text style={[styles.heroLine, compact && styles.heroLineCompact]}>
            UNDERSTAND
          </Text>
          <Text style={[styles.heroLine, compact && styles.heroLineCompact]}>
            YOUR
          </Text>
          <Text
            style={[
              styles.heroLine,
              styles.heroLineAccent,
              compact && styles.heroLineCompact,
            ]}
          >
            MOVEMENT.
          </Text>
        </View>

        {/* 4. DESCRIPTION */}
        <Text style={styles.description}>
          A short movement assessment using your smartphone.
        </Text>

        {/* 5. SENSOR GRAPH / INSTRUMENTATION AREA (flexible) */}
        <View style={styles.graphSection}>
          <View style={styles.graphHeaderRow}>
            <Text style={styles.graphLabelLeft}>
              LABORATORY INSTRUMENT{'\n'}TRACE
            </Text>
            <View style={styles.graphReadoutRight}>
              <Text style={styles.graphReadoutText}>60.0 FPS ·</Text>
              <Text style={styles.graphReadoutText}>NOMINAL</Text>
            </View>
          </View>

          <View style={styles.graphContainer}>
            <Svg
              width="100%"
              height="100%"
              viewBox="0 0 600 160"
              preserveAspectRatio="none"
            >
              <Line
                x1="0"
                y1="100"
                x2="600"
                y2="100"
                stroke={COLORS.border}
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
              />
              <Path
                d="M0,100 C80,100 140,98 170,94 C200,90 220,80 235,68 C250,56 260,56 270,70 C282,88 285,120 288,140 C291,155 300,158 308,140 C318,110 328,50 340,38 C350,30 358,42 364,60 C370,90 372,130 376,148 C382,168 392,168 400,150 C415,120 430,80 450,50 C468,25 485,10 505,15 C525,20 540,45 550,70 C558,90 565,100 580,100 L600,100"
                stroke={COLORS.cyan}
                strokeWidth={1.4}
                fill="none"
                vectorEffect="non-scaling-stroke"
              />
              {/* pulsing "blip" under the traveling marker */}
              <AnimatedCircle
                cx={markerX}
                cy={markerY}
                r={pulseRadius}
                fill="none"
                stroke={COLORS.cyan}
                strokeWidth={1}
                opacity={pulseOpacity}
              />
              {/* traveling live-signal marker */}
              <AnimatedCircle
                cx={markerX}
                cy={markerY}
                r={2.5}
                fill={COLORS.cyan}
              />
            </Svg>
          </View>

          {/* 6. GRAPH DATA LABELS */}
          <View style={styles.dataLabelsRow}>
            <View style={styles.axisGroup}>
              <Text style={styles.axisText}>X: +0.014g</Text>
              <Text style={styles.axisText}>Y: -0.981g</Text>
              <Text style={styles.axisText}>Z: +0.042g</Text>
            </View>
            <Text style={styles.airgapText}>AIRGAP SECURE</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* 7. PROTOCOL METADATA */}
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>03 PROTOCOLS</Text>
          <Text style={styles.metaDash}>·</Text>
          <Text style={styles.metaText}>120S DURATION</Text>
          <Text style={styles.metaDash}>·</Text>
          <Text style={[styles.metaText, styles.metaAccent]}>
            LOCAL AIRGAP
          </Text>
        </View>

        <View style={styles.divider} />

        {/* 8. PRIMARY CTA */}
        <Pressable style={styles.ctaButton} onPress={() => router.push('/explore')}>
          <Text style={styles.ctaText}>BEGIN ASSESSMENT</Text>
          <Text style={styles.ctaArrow}>→</Text>
        </Pressable>

        {/* 9. HOW IT WORKS */}
        <Pressable style={styles.howItWorks}>
          <Text style={styles.howItWorksText}>HOW IT WORKS</Text>
          <Text style={styles.howItWorksIcon}>↗</Text>
        </Pressable>

        {/* 10. DISCLAIMER */}
        <Text style={styles.disclaimer}>
          MONITORING AID · NOT A DIAGNOSTIC TOOL
        </Text>
      </View>

      {/* 11. BOTTOM NAVIGATION */}
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
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
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
  headerStatusGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  headerStatusText: {
    fontSize: 8,
    letterSpacing: 0.6,
    color: COLORS.textSecondary,
  },
  headerStatusTextDim: {
    fontSize: 8,
    letterSpacing: 0.6,
    color: COLORS.textDim,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },

  systemLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  systemLineText: {
    fontSize: 9,
    letterSpacing: 1.2,
    color: COLORS.textSecondary,
  },
  systemLineDash: {
    fontSize: 9,
    color: COLORS.textDim,
  },

  heroBlock: {
    marginBottom: 10,
  },
  heroBlockCompact: {
    marginBottom: 6,
  },
  heroLine: {
    fontFamily: 'serif',
    fontSize: 36,
    lineHeight: 34,
    fontWeight: '400',
    letterSpacing: -0.5,
    color: COLORS.textPrimary,
    textTransform: 'uppercase',
  },
  heroLineCompact: {
    fontSize: 28,
    lineHeight: 27,
  },
  heroLineAccent: {
    color: '#E8F4F2',
  },

  description: {
    fontSize: 10,
    lineHeight: 14,
    color: COLORS.textSecondary,
    marginBottom: 14,
    maxWidth: '85%',
  },

  graphSection: {
    flex: 1,
    minHeight: 90,
    marginBottom: 4,
  },
  graphHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  graphLabelLeft: {
    fontSize: 9,
    letterSpacing: 0.8,
    lineHeight: 13,
    color: COLORS.textDim,
    textTransform: 'uppercase',
  },
  graphReadoutRight: {
    alignItems: 'flex-end',
  },
  graphReadoutText: {
    fontSize: 10,
    letterSpacing: 0.5,
    color: COLORS.green,
    lineHeight: 14,
  },
  graphContainer: {
    flex: 1,
    width: '100%',
  },

  dataLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  axisGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  axisText: {
    fontSize: 9,
    color: COLORS.textSecondary,
  },
  airgapText: {
    fontSize: 8,
    letterSpacing: 0.5,
    color: COLORS.textDim,
  },

  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 12,
  },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  metaText: {
    fontSize: 9,
    letterSpacing: 0.8,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
  },
  metaDash: {
    fontSize: 9,
    color: COLORS.textDim,
  },
  metaAccent: {
    color: COLORS.green,
  },

  ctaButton: {
    backgroundColor: COLORS.cyan,
    borderRadius: 3,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
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

  howItWorks: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 8,
  },
  howItWorksText: {
    fontSize: 9,
    letterSpacing: 0.8,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
  },
  howItWorksIcon: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },

  disclaimer: {
    fontSize: 8,
    letterSpacing: 0.6,
    color: COLORS.textDim,
    textAlign: 'center',
    textTransform: 'uppercase',
    marginBottom: 8,
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