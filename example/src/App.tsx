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
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import {
  useImageConverter,
  type ConvertPreset,
} from '@dynlabs/react-native-image-to-webp';

const PRESETS: ConvertPreset[] = ['balanced', 'small', 'fast', 'lossless'];

export default function App() {
  const [inputImage, setInputImage] = useState<string | null>(null);
  const [originalDim, setOriginalDim] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const { convert, isConverting, result, error } = useImageConverter();

  const handleSelectImage = async () => {
    const response = await launchImageLibrary({
      mediaType: 'photo',
      quality: 1,
    });
    if (response.assets?.[0]?.uri) {
      setInputImage(response.assets[0].uri);
      setOriginalDim({
        width: response.assets[0].width || 0,
        height: response.assets[0].height || 0,
      });
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

        <TouchableOpacity style={styles.button} onPress={handleSelectImage}>
          <Text style={styles.buttonText}>
            {inputImage ? 'Change Image' : 'Select Image'}
          </Text>
        </TouchableOpacity>

        {inputImage && (
          <View style={styles.previewContainer}>
            <Text style={styles.label}>
              Original:{' '}
              {originalDim?.width
                ? `${originalDim.width}x${originalDim.height}`
                : ''}
            </Text>
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
                >
                  <Text style={styles.presetText}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {isConverting && (
          <ActivityIndicator
            style={styles.loader}
            size="large"
            color="#007AFF"
          />
        )}

        {result && (
          <View style={styles.resultContainer}>
            <Text style={styles.label}>WebP Result:</Text>
            <Image
              source={{
                uri: result.outputPath.startsWith('file://')
                  ? result.outputPath
                  : `file://${result.outputPath}`,
              }}
              style={styles.image}
            />
            <View style={styles.stats}>
              <Text style={styles.statText}>
                Size: {(result.sizeBytes / 1024).toFixed(1)} KB
              </Text>
              <Text style={styles.statText}>
                Dim: {result.width}x{result.height}
              </Text>
            </View>
          </View>
        )}

        {error && <Text style={styles.errorText}>Error: {error.message}</Text>}
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
  loader: { marginVertical: 20 },
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
