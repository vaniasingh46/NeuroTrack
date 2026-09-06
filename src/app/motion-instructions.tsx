import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const COLORS = {
    bg: '#080B0D',
    textPrimary: '#F2F0E8',
    textSecondary: '#737A7D',
    cyan: '#00E5F5',
};

export default function MotionInstructionsScreen() {
    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
            <View style={styles.container}>
                <Text style={styles.label}>MOTION PROTOCOL</Text>
                <Text style={styles.title}>INSTRUCTIONS</Text>
                <Text style={styles.body}>
                    This screen will hold the Motion test instructions. Coming soon.
                </Text>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: COLORS.bg },
    container: { flex: 1, padding: 20, justifyContent: 'center' },
    label: {
        fontSize: 9,
        letterSpacing: 1,
        color: COLORS.cyan,
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    title: {
        fontFamily: 'serif',
        fontSize: 32,
        color: COLORS.textPrimary,
        marginBottom: 16,
    },
    body: {
        fontSize: 12,
        lineHeight: 18,
        color: COLORS.textSecondary,
    },
});