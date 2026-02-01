import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import {
  convertImageToWebP,
  type ConvertPreset,
  ImageToWebPError,
} from '@dynlabs/react-native-image-to-webp';

const PRESETS: ConvertPreset[] = [
  'balanced',
  'small',
  'fast',
  'lossless',
  'document',
];

interface ConversionResult {
  outputPath: string;
  width: number;
  height: number;
  sizeBytes: number;
  preset: ConvertPreset;
  duration: number;
}

export default function App(): React.JSX.Element {
  const [inputPath, setInputPath] = useState<string>('');
  const [maxLongEdge, setMaxLongEdge] = useState<string>('2048');
  const [selectedPreset, setSelectedPreset] =
    useState<ConvertPreset>('balanced');
  const [isConverting, setIsConverting] = useState<boolean>(false);
  const [results, setResults] = useState<ConversionResult[]>([]);
  const [outputImageUri, setOutputImageUri] = useState<string | null>(null);

  // Note: For a production example, you might want to use react-native-image-picker
  // or react-native-document-picker to select images. For this example, we use manual path input.
  // On iOS, you can use paths like: file:///path/to/image.jpg
  // On Android, you can use paths like: /storage/emulated/0/DCIM/image.jpg
  // Or use a library like react-native-fs to get common directories.

  const convertImage = async (preset: ConvertPreset): Promise<void> => {
    if (!inputPath || inputPath.trim() === '') {
      Alert.alert('Error', 'Please enter an image path first');
      return;
    }

    setIsConverting(true);
    const startTime = Date.now();

    try {
      const maxEdge = maxLongEdge ? parseInt(maxLongEdge, 10) : undefined;
      if (maxEdge !== undefined && (isNaN(maxEdge) || maxEdge <= 0)) {
        Alert.alert('Error', 'maxLongEdge must be a positive number');
        setIsConverting(false);
        return;
      }

      const result = await convertImageToWebP({
        inputPath,
        preset,
        maxLongEdge: maxEdge,
      });

      const duration = Date.now() - startTime;

      const conversionResult: ConversionResult = {
        ...result,
        preset,
        duration,
      };

      setResults((prev) => [...prev, conversionResult]);
      setOutputImageUri(result.outputPath);

      Alert.alert(
        'Success',
        `Converted to WebP!\nSize: ${(result.sizeBytes / 1024).toFixed(
          2
        )} KB\nDuration: ${duration}ms`
      );
    } catch (error) {
      let errorMessage = 'Unknown error';
      if (error instanceof ImageToWebPError) {
        errorMessage = `${error.code}: ${error.message}`;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      Alert.alert('Conversion Failed', errorMessage);
    } finally {
      setIsConverting(false);
    }
  };

  const convertAllPresets = async (): Promise<void> => {
    if (!inputPath || inputPath.trim() === '') {
      Alert.alert('Error', 'Please enter an image path first');
      return;
    }

    setIsConverting(true);
    setResults([]);
    setOutputImageUri(null);

    for (const preset of PRESETS) {
      try {
        const maxEdge = maxLongEdge ? parseInt(maxLongEdge, 10) : undefined;
        if (maxEdge !== undefined && (isNaN(maxEdge) || maxEdge <= 0)) {
          continue;
        }

        const startTime = Date.now();
        const result = await convertImageToWebP({
          inputPath,
          preset,
          maxLongEdge: maxEdge,
        });
        const duration = Date.now() - startTime;

        setResults((prev) => [
          ...prev,
          {
            ...result,
            preset,
            duration,
          },
        ]);
      } catch (error) {
        console.error(`Failed to convert with preset ${preset}:`, error);
      }
    }

    setIsConverting(false);
    Alert.alert('Complete', `Converted ${results.length} presets`);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Image to WebP Converter</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Image Path</Text>
          <Text style={styles.label}>Input Image Path:</Text>
          <TextInput
            style={styles.input}
            value={inputPath}
            onChangeText={setInputPath}
            placeholder="file:///path/to/image.jpg"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text style={styles.hintText}>
            Enter a file path to an image. On iOS, use file:// URIs. On Android,
            use absolute paths.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Options</Text>
          <Text style={styles.label}>Max Long Edge (optional):</Text>
          <TextInput
            style={styles.input}
            value={maxLongEdge}
            onChangeText={setMaxLongEdge}
            placeholder="2048"
            keyboardType="numeric"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Convert</Text>
          <View style={styles.presetGrid}>
            {PRESETS.map((preset) => (
              <TouchableOpacity
                key={preset}
                style={[
                  styles.presetButton,
                  selectedPreset === preset && styles.presetButtonSelected,
                ]}
                onPress={() => setSelectedPreset(preset)}
                disabled={isConverting}
              >
                <Text
                  style={[
                    styles.presetButtonText,
                    selectedPreset === preset &&
                      styles.presetButtonTextSelected,
                  ]}
                >
                  {preset}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[
              styles.button,
              styles.convertButton,
              isConverting && styles.buttonDisabled,
            ]}
            onPress={() => convertImage(selectedPreset)}
            disabled={isConverting}
          >
            {isConverting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Convert ({selectedPreset})</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, isConverting && styles.buttonDisabled]}
            onPress={convertAllPresets}
            disabled={isConverting}
          >
            <Text style={styles.buttonText}>Convert All Presets</Text>
          </TouchableOpacity>
        </View>

        {outputImageUri && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Output Image</Text>
            <Image
              source={{ uri: outputImageUri }}
              style={styles.outputImage}
            />
            <Text style={styles.pathText} numberOfLines={2}>
              {outputImageUri}
            </Text>
          </View>
        )}

        {results.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Results</Text>
            {results.map((result, index) => (
              <View key={index} style={styles.resultCard}>
                <Text style={styles.resultPreset}>{result.preset}</Text>
                <Text style={styles.resultText}>
                  Size: {formatFileSize(result.sizeBytes)}
                </Text>
                <Text style={styles.resultText}>
                  Dimensions: {result.width} × {result.height}
                </Text>
                <Text style={styles.resultText}>
                  Duration: {result.duration}ms
                </Text>
                <Text style={styles.resultPath} numberOfLines={1}>
                  {result.outputPath}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  convertButton: {
    backgroundColor: '#34C759',
    marginTop: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  pathText: {
    marginTop: 8,
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
  },
  placeholderText: {
    marginTop: 8,
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  hintText: {
    marginTop: 8,
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  presetButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  presetButtonSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  presetButtonText: {
    fontSize: 14,
    color: '#333',
  },
  presetButtonTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  outputImage: {
    width: '100%',
    height: 300,
    resizeMode: 'contain',
    marginBottom: 8,
    backgroundColor: '#f0f0f0',
  },
  resultCard: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  resultPreset: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  resultText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  resultPath: {
    fontSize: 10,
    color: '#999',
    marginTop: 4,
    fontFamily: 'monospace',
  },
});
