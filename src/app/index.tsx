import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  Button,
  ScrollView,
  Alert,
} from "react-native";
import { Accelerometer, Gyroscope } from "expo-sensors";

type Vector3 = {
  x: number;
  y: number;
  z: number;
};

type SensorReading = {
  timestamp: number;

  acceleration: Vector3;

  gyroscope: Vector3;

  accelerationMagnitude: number;

  movementSignal: number;
};

const TEST_DURATION = 10;
const SAMPLE_INTERVAL = 100;
const GRAVITY = 9.81;

export default function HomeScreen() {
  const [accelerometer, setAccelerometer] = useState<Vector3>({
    x: 0,
    y: 0,
    z: 0,
  });

  const [gyroscope, setGyroscope] = useState<Vector3>({
    x: 0,
    y: 0,
    z: 0,
  });

  const [running, setRunning] = useState(false);

  const [countdown, setCountdown] = useState(TEST_DURATION);

  const [readings, setReadings] = useState<SensorReading[]>([]);

  const [average, setAverage] = useState(0);

  const [peak, setPeak] = useState(0);

  const [standardDeviation, setStandardDeviation] = useState(0);

  const [frequency, setFrequency] = useState(0);

  const [testComplete, setTestComplete] = useState(false);

  /*
   * Calculate current acceleration magnitude.
   */
  const accelerationMagnitude = Math.sqrt(
    accelerometer.x ** 2 + accelerometer.y ** 2 + accelerometer.z ** 2,
  );

  /*
   * Approximate removal of gravity.
   *
   * This is a simple prototype technique.
   * A production signal-processing pipeline
   * should use a proper filter.
   */
  const currentMovement = Math.abs(accelerationMagnitude - GRAVITY);

  /*
   * Calculate standard deviation.
   */
  const calculateStandardDeviation = (values: number[]) => {
    if (values.length === 0) {
      return 0;
    }

    const mean = values.reduce((sum, value) => sum + value, 0) / values.length;

    const variance =
      values.reduce((sum, value) => sum + (value - mean) ** 2, 0) /
      values.length;

    return Math.sqrt(variance);
  };

  /*
   * Estimate dominant oscillation frequency
   * using zero crossings around the mean.
   *
   * This is intentionally simple for the
   * hackathon prototype.
   */
  const calculateFrequency = (values: number[]) => {
    if (values.length < 3) {
      return 0;
    }

    const mean = values.reduce((sum, value) => sum + value, 0) / values.length;

    let crossings = 0;

    for (let i = 1; i < values.length; i++) {
      const previous = values[i - 1] - mean;

      const current = values[i] - mean;

      if ((previous < 0 && current >= 0) || (previous > 0 && current <= 0)) {
        crossings++;
      }
    }

    /*
     * Two zero crossings ≈ one cycle.
     */
    const duration = (values.length * SAMPLE_INTERVAL) / 1000;

    if (duration <= 0) {
      return 0;
    }

    return crossings / 2 / duration;
  };

  /*
   * Finish test and calculate features.
   */
  const processResults = (data: SensorReading[]) => {
    if (data.length === 0) {
      return;
    }

    const movementValues = data.map((reading) => reading.movementSignal);

    const total = movementValues.reduce((sum, value) => sum + value, 0);

    const avg = total / movementValues.length;

    const max = Math.max(...movementValues);

    const sd = calculateStandardDeviation(movementValues);

    const freq = calculateFrequency(movementValues);

    setAverage(avg);
    setPeak(max);
    setStandardDeviation(sd);
    setFrequency(freq);
    setTestComplete(true);

    /*
     * Print useful information to
     * the Expo terminal.
     */
    console.log("========== NEUROTRACK TEST ==========");

    console.log("Samples:", data.length);

    console.log("Duration:", TEST_DURATION, "seconds");

    console.log("Average movement:", avg);

    console.log("Peak movement:", max);

    console.log("Standard deviation:", sd);

    console.log("Estimated frequency:", freq);

    console.log("First sample:", data[0]);

    console.log("Last sample:", data[data.length - 1]);

    console.log("======================================");
  };

  /*
   * Start sensor recording.
   */
  useEffect(() => {
    if (!running) {
      return;
    }

    let accelerometerSubscription: any;
    let gyroscopeSubscription: any;
    let timer: any;

    /*
     * Reset previous test.
     */
    setReadings([]);
    setCountdown(TEST_DURATION);
    setAverage(0);
    setPeak(0);
    setStandardDeviation(0);
    setFrequency(0);
    setTestComplete(false);

    /*
     * Set sampling rate.
     */
    Accelerometer.setUpdateInterval(SAMPLE_INTERVAL);

    Gyroscope.setUpdateInterval(SAMPLE_INTERVAL);

    /*
     * Accelerometer listener.
     */
    accelerometerSubscription = Accelerometer.addListener((data) => {
      setAccelerometer(data);

      const magnitude = Math.sqrt(data.x ** 2 + data.y ** 2 + data.z ** 2);

      /*
       * Remove approximate gravity.
       */
      const movement = Math.abs(magnitude - GRAVITY);

      /*
       * Save complete timestamped
       * sensor reading.
       *
       * NOTE:
       * Gyroscope values represent
       * the most recent available
       * gyroscope reading.
       */
      const reading: SensorReading = {
        timestamp: Date.now(),

        acceleration: {
          x: data.x,
          y: data.y,
          z: data.z,
        },

        gyroscope: {
          x: gyroscope.x,
          y: gyroscope.y,
          z: gyroscope.z,
        },

        accelerationMagnitude: magnitude,

        movementSignal: movement,
      };

      setReadings((previous) => [...previous, reading]);
    });

    /*
     * Gyroscope listener.
     */
    gyroscopeSubscription = Gyroscope.addListener((data) => {
      setGyroscope(data);
    });

    /*
     * Countdown timer.
     */
    let remaining = TEST_DURATION;

    timer = setInterval(() => {
      remaining--;

      setCountdown(remaining);

      if (remaining <= 0) {
        setRunning(false);
      }
    }, 1000);

    /*
     * Cleanup.
     */
    return () => {
      accelerometerSubscription?.remove();

      gyroscopeSubscription?.remove();

      if (timer) {
        clearInterval(timer);
      }
    };
  }, [running]);

  /*
   * Process data after recording stops.
   */
  useEffect(() => {
    if (!running && readings.length > 0) {
      processResults(readings);
    }
  }, [running]);

  /*
   * Prepare backend payload.
   */
  const createBackendPayload = () => {
    return {
      device: "mobile",

      testDuration: TEST_DURATION,

      sampleInterval: SAMPLE_INTERVAL,

      sampleCount: readings.length,

      features: {
        averageMovement: average,

        peakMovement: peak,

        standardDeviation: standardDeviation,

        estimatedFrequency: frequency,
      },

      samples: readings,
    };
  };

  /*
   * Temporary backend button.
   *
   * For now it only creates and displays
   * the payload size.
   *
   * Later we replace this with
   * fetch(API_URL, ...).
   */
  const sendToBackend = () => {
    const payload = createBackendPayload();

    console.log("BACKEND PAYLOAD:", JSON.stringify(payload));

    Alert.alert(
      "Data Ready",
      `${readings.length} sensor samples are ready to send to the backend.`,
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* TITLE */}

      <Text style={styles.title}>NeuroTrack</Text>

      <Text style={styles.subtitle}>Sensor-Based Movement Analysis</Text>

      {/* ACCELEROMETER */}

      <View style={styles.card}>
        <Text style={styles.heading}>Accelerometer</Text>

        <Text style={styles.value}>X: {accelerometer.x.toFixed(3)}</Text>

        <Text style={styles.value}>Y: {accelerometer.y.toFixed(3)}</Text>

        <Text style={styles.value}>Z: {accelerometer.z.toFixed(3)}</Text>
      </View>

      {/* GYROSCOPE */}

      <View style={styles.card}>
        <Text style={styles.heading}>Gyroscope</Text>

        <Text style={styles.value}>X: {gyroscope.x.toFixed(3)}</Text>

        <Text style={styles.value}>Y: {gyroscope.y.toFixed(3)}</Text>

        <Text style={styles.value}>Z: {gyroscope.z.toFixed(3)}</Text>
      </View>

      {/* CURRENT MOVEMENT */}

      <View style={styles.card}>
        <Text style={styles.heading}>Current Movement</Text>

        <Text style={styles.bigNumber}>{currentMovement.toFixed(3)}</Text>
      </View>

      {/* START TEST */}

      <Button
        title={running ? `Recording... ${countdown}s` : "Start 10 Second Test"}
        disabled={running}
        onPress={() => setRunning(true)}
      />

      {/* RESULTS */}

      {testComplete && !running && (
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>Test Complete</Text>

          <Text style={styles.result}>Samples: {readings.length}</Text>

          <Text style={styles.result}>
            Average Movement: {average.toFixed(3)}
          </Text>

          <Text style={styles.result}>Peak Movement: {peak.toFixed(3)}</Text>

          <Text style={styles.result}>
            Movement Variability: {standardDeviation.toFixed(3)}
          </Text>

          <Text style={styles.result}>
            Estimated Frequency: {frequency.toFixed(2)} Hz
          </Text>
        </View>
      )}

      {/* BACKEND */}

      {testComplete && !running && (
        <View style={styles.backendButton}>
          <Button title="Prepare Data for Backend" onPress={sendToBackend} />
        </View>
      )}

      {/* STATUS */}

      <Text style={styles.status}>
        {running
          ? "Recording sensor data..."
          : testComplete
            ? "Analysis complete"
            : "Ready for test"}
      </Text>

      <Text style={styles.disclaimer}>
        Prototype movement analysis only. Not a medical diagnosis.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },

  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 17,
    marginBottom: 20,
    textAlign: "center",
  },

  card: {
    width: "100%",
    padding: 15,
    marginBottom: 10,
    backgroundColor: "#eeeeee",
    borderRadius: 12,
  },

  heading: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
  },

  value: {
    fontSize: 16,
    marginVertical: 2,
  },

  bigNumber: {
    fontSize: 30,
    fontWeight: "bold",
    textAlign: "center",
  },

  resultCard: {
    width: "100%",
    padding: 18,
    marginTop: 20,
    backgroundColor: "#eeeeee",
    borderRadius: 12,
  },

  resultTitle: {
    fontSize: 23,
    fontWeight: "bold",
    marginBottom: 12,
  },

  result: {
    fontSize: 17,
    marginVertical: 5,
  },

  backendButton: {
    width: "100%",
    marginTop: 15,
  },

  status: {
    marginTop: 18,
    fontSize: 14,
    textAlign: "center",
  },

  disclaimer: {
    marginTop: 12,
    fontSize: 12,
    textAlign: "center",
    color: "#666666",
  },
});
