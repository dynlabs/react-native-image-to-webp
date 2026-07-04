import { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  ActivityIndicator,
  NativeModules,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import {
  useImageConverter,
  setDebugLogging,
  type ConvertPreset,
} from '@dynlabs/react-native-image-to-webp';

// Log effective options and native timing breakdowns to the console
setDebugLogging(__DEV__);

const PRESETS: ConvertPreset[] = [
  'balanced',
  'small',
  'fast',
  'lossless',
  'document',
];

export default function App() {
  const [inputImage, setInputImage] = useState<string | null>(null);
  const [originalDim, setOriginalDim] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [originalFileSize, setOriginalFileSize] = useState<number | null>(null);
  const { convert, isConverting, progress, result, error } =
    useImageConverter();

  const handleSelectImage = async () => {
    const response = await launchImageLibrary({
      mediaType: 'photo',
      quality: 1,
    });
    if (response.assets?.[0]?.uri) {
      setInputImage(response.assets[0].uri);
      setOriginalFileSize(response.assets[0].fileSize || null);
      setOriginalDim({
        width: response.assets[0].width || 0,
        height: response.assets[0].height || 0,
      });
    }
  };

  // Loads the bundled sample photo via a tiny native fixture module, so the
  // Maestro e2e suite can exercise the full pipeline without the system picker
  const handleLoadSample = async () => {
    try {
      const path: string = await NativeModules.SampleImage.getSampleImagePath();
      setInputImage(`file://${path}`);
      setOriginalFileSize(null);
      setOriginalDim(null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleConvert = async (preset: ConvertPreset) => {
    if (!inputImage) return;
    try {
      await convert({
        inputPath: inputImage,
        preset,
      });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>WebP Converter</Text>

        <TouchableOpacity
          style={styles.button}
          onPress={handleSelectImage}
          testID="select-image-button"
        >
          <Text style={styles.buttonText}>
            {inputImage ? 'Change Image' : 'Select Image'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleLoadSample}
          testID="load-sample-button"
        >
          <Text style={styles.secondaryButtonText}>Use Sample Image</Text>
        </TouchableOpacity>

        {inputImage && (
          <View style={styles.previewContainer}>
            <View
              style={{ flexDirection: 'row', justifyContent: 'space-between' }}
            >
              <Text style={styles.label}>
                Original:{' '}
                {originalDim?.width
                  ? `${originalDim.width}x${originalDim.height}`
                  : ''}
              </Text>
              {originalFileSize ? (
                <Text style={styles.label}>
                  Size: {(originalFileSize / 1024).toFixed(1)} KB
                </Text>
              ) : null}
            </View>
            <Image
              source={{ uri: inputImage }}
              style={styles.image}
              onLoad={(e) => {
                if (!originalDim?.width) {
                  setOriginalDim({
                    width: e.nativeEvent.source.width,
                    height: e.nativeEvent.source.height,
                  });
                }
              }}
            />

            <View style={styles.presetContainer}>
              {PRESETS.map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[styles.presetButton, isConverting && styles.disabled]}
                  onPress={() => handleConvert(p)}
                  disabled={isConverting}
                  testID={`preset-${p}`}
                >
                  <Text style={styles.presetText}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {isConverting && (
          <View style={styles.progressContainer} testID="progress-container">
            <ActivityIndicator size="small" color="#007AFF" />
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${progress?.percent ?? 0}%` },
                ]}
              />
            </View>
            <Text style={styles.progressText} testID="progress-text">
              {progress ? `${progress.phase} ${progress.percent}%` : '…'}
            </Text>
          </View>
        )}

        {result && (
          <View style={styles.resultContainer} testID="result-container">
            <Text style={styles.label}>WebP Result:</Text>
            <Image
              source={{
                uri: result.outputPath.startsWith('file://')
                  ? result.outputPath
                  : `file://${result.outputPath}`,
              }}
              style={styles.image}
              testID="result-image"
            />
            <View style={styles.stats}>
              <Text style={styles.statText} testID="result-size">
                Size: {(result.sizeBytes / 1024).toFixed(1)} KB
              </Text>
              <Text style={styles.statText} testID="result-dimensions">
                Dim: {result.width}x{result.height}
              </Text>
            </View>
            <View style={styles.stats}>
              <Text style={styles.statHighlight} testID="result-saved">
                Saved {result.savedPercent.toFixed(1)}% (
                {(result.savedBytes / 1024).toFixed(1)} KB)
              </Text>
              <Text style={styles.statText} testID="result-duration">
                in {result.durationMs.toFixed(0)} ms
              </Text>
            </View>
          </View>
        )}

        {error && (
          <Text style={styles.errorText} testID="error-text">
            Error: {error.message}
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  scrollContent: { padding: 20, alignItems: 'center' },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 30,
    marginTop: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 12,
    marginBottom: 30,
    elevation: 2,
  },
  buttonText: { color: '#FFF', fontSize: 18, fontWeight: '600' },
  secondaryButton: {
    borderColor: '#007AFF',
    borderWidth: 1,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: -18,
    marginBottom: 30,
  },
  secondaryButtonText: { color: '#007AFF', fontSize: 15, fontWeight: '600' },
  previewContainer: { width: '100%', marginBottom: 30 },
  label: { fontSize: 16, fontWeight: '600', color: '#666', marginBottom: 10 },
  image: {
    width: '100%',
    height: 250,
    borderRadius: 12,
    backgroundColor: '#EEE',
  },
  presetContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 20,
    justifyContent: 'center',
  },
  presetButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
  },
  presetText: { color: '#FFF', fontWeight: '600', textTransform: 'capitalize' },
  disabled: { opacity: 0.5 },
  progressContainer: {
    width: '100%',
    marginVertical: 20,
    alignItems: 'center',
    gap: 8,
  },
  progressTrack: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E5EA',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: '#007AFF',
  },
  progressText: { fontSize: 13, color: '#666', fontWeight: '500' },
  statHighlight: { fontSize: 14, color: '#34C759', fontWeight: '700' },
  resultContainer: {
    width: '100%',
    padding: 20,
    backgroundColor: '#FFF',
    borderRadius: 16,
    elevation: 3,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  statText: { fontSize: 14, color: '#444', fontWeight: '500' },
  errorText: { color: '#FF3B30', marginTop: 20, fontWeight: '600' },
});
