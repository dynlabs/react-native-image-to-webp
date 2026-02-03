import React, { useState, useEffect } from 'react';
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
  Platform,
  Modal,
  Dimensions,
} from 'react-native';
import {
  launchImageLibrary,
  launchCamera,
  type ImagePickerResponse,
  type MediaType,
} from 'react-native-image-picker';
import {
  convertImageToWebP,
  type ConvertPreset,
  ImageToWebPError,
} from '@dynlabs/react-native-image-to-webp';
import RNFS from 'react-native-fs';

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
  const [inputPath, setInputPath] = useState<string>(
    Platform.OS === 'android'
      ? '/sdcard/Download/test-images/test-2k.jpg'
      : ''
  );
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [originalImageUri, setOriginalImageUri] = useState<string | null>(null);
  const [originalFileSize, setOriginalFileSize] = useState<number | null>(null);
  const [originalImageDimensions, setOriginalImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [maxLongEdge, setMaxLongEdge] = useState<string>('2048');
  const [selectedPreset, setSelectedPreset] =
    useState<ConvertPreset>('balanced');
  const [isConverting, setIsConverting] = useState<boolean>(false);
  const [results, setResults] = useState<ConversionResult[]>([]);
  const [zoomImageUri, setZoomImageUri] = useState<string | null>(null);
  const [isZoomModalVisible, setIsZoomModalVisible] = useState<boolean>(false);
  const [zoomImageSize, setZoomImageSize] = useState<{ width: number; height: number } | null>(null);

  // Set default original image URI when inputPath changes
  useEffect(() => {
    if (inputPath && !selectedImageUri) {
      const displayUri =
        Platform.OS === 'android'
          ? inputPath.startsWith('file://')
            ? inputPath
            : `file://${inputPath}`
          : inputPath.startsWith('file://')
            ? inputPath
            : `file://${inputPath}`;
      setOriginalImageUri(displayUri);
      
      // Try to get file size for manual paths
      if (originalFileSize === null) {
        getFileSize(inputPath).then((size) => {
          if (size !== null) {
            setOriginalFileSize(size);
          }
        });
      }
      
      // Image dimensions will be set via Image's onLoad event
    } else if (!inputPath) {
      setOriginalImageUri(null);
      setOriginalFileSize(null);
      setOriginalImageDimensions(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputPath, selectedImageUri]);

  const getFileSize = async (path: string): Promise<number | null> => {
    try {
      // Remove file:// prefix if present, react-native-fs handles paths directly
      const normalizedPath = path.replace('file://', '');
      
      // Use react-native-fs to get file stats
      const stats = await RNFS.stat(normalizedPath);
      return stats.size;
    } catch (error) {
      console.log('Could not get file size:', error);
      return null;
    }
  };

  const handleImagePickerResponse = (response: ImagePickerResponse) => {
    if (response.didCancel) {
      return;
    }

    if (response.errorCode) {
      let errorMessage = 'Unknown error';
      let errorTitle = 'Error';
      
      // Handle specific error codes
      switch (response.errorCode) {
        case 'permission':
          errorTitle = 'Permission Denied';
          errorMessage = 'Camera or storage permission was denied. Please grant permission in app settings.';
          break;
        case 'camera_unavailable':
          errorTitle = 'Camera Unavailable';
          errorMessage = 'Camera is not available on this device.';
          break;
        case 'others':
          errorMessage = response.errorMessage || 'An error occurred while selecting the image.';
          break;
        default:
          errorMessage = response.errorMessage || 'Unknown error occurred.';
      }
      
      Alert.alert(errorTitle, errorMessage);
      return;
    }

    const asset = response.assets?.[0];
    if (asset?.uri) {
      // Use fileUri if available (Android), otherwise use uri (iOS)
      // For Android, fileUri provides the actual file path needed for native modules
      // For iOS, uri is already in the correct format (file://)
      const fileUri = ('fileUri' in asset && typeof asset.fileUri === 'string') ? asset.fileUri : null;
      const path: string = fileUri || asset.uri;
      
      // Remove file:// prefix for Android if present
      const normalizedPath = Platform.OS === 'android' && path.startsWith('file://')
        ? path.replace('file://', '')
        : path;
      
      setInputPath(normalizedPath);
      const displayUri = asset.uri;
      setSelectedImageUri(displayUri); // Use uri for display (works with Image component)
      setOriginalImageUri(displayUri); // Store original for comparison
      
      // Get original file size if available from image picker
      if (asset.fileSize) {
        setOriginalFileSize(asset.fileSize);
      } else {
        // Try to get file size from the file path
        getFileSize(normalizedPath).then((size) => {
          if (size !== null) {
            setOriginalFileSize(size);
          }
        });
      }
      
      // Get image dimensions from image picker asset
      if (asset.width && asset.height) {
        setOriginalImageDimensions({ width: asset.width, height: asset.height });
      }
      // If dimensions not available from picker, they will be set via Image's onLoad event
      
      setResults([]);
    }
  };

  // react-native-image-picker automatically requests permissions when needed
  // Permissions are declared in AndroidManifest.xml and Info.plist
  // The library handles runtime permission requests automatically
  const selectImageFromLibrary = () => {
    launchImageLibrary(
      {
        mediaType: 'photo' as MediaType,
        quality: 1,
        selectionLimit: 1,
      },
      handleImagePickerResponse
    );
  };

  const takePhoto = () => {
    launchCamera(
      {
        mediaType: 'photo' as MediaType,
        quality: 1,
        saveToPhotos: false,
      },
      handleImagePickerResponse
    );
  };

  const showImagePickerOptions = () => {
    Alert.alert(
      'Select Image',
      'Choose an option',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Photo Library', onPress: selectImageFromLibrary },
        { text: 'Take Photo', onPress: takePhoto },
      ],
      { cancelable: true }
    );
  };

  const convertImage = async (preset: ConvertPreset): Promise<void> => {
    if (!inputPath || inputPath.trim() === '') {
      Alert.alert('Error', 'Please select an image first');
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

      // Get original file size before conversion if not already set
      // This is critical for showing size savings
      if (originalFileSize === null) {
        const size = await getFileSize(inputPath);
        if (size !== null && size > 0) {
          setOriginalFileSize(size);
        } else {
          // Try again with normalized path
          const normalizedPath = Platform.OS === 'android' && inputPath.startsWith('file://')
            ? inputPath.replace('file://', '')
            : inputPath;
          const retrySize = await getFileSize(normalizedPath);
          if (retrySize !== null && retrySize > 0) {
            setOriginalFileSize(retrySize);
          }
        }
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

      const sizeReduction =
        originalFileSize !== null
          ? calculateSizeReduction(originalFileSize, result.sizeBytes)
          : null;
      
      let message = `Converted to WebP!\nWebP Size: ${(result.sizeBytes / 1024).toFixed(2)} KB`;
      if (originalFileSize !== null) {
        message += `\nOriginal Size: ${(originalFileSize / 1024).toFixed(2)} KB`;
      }
      if (sizeReduction !== null) {
        const reductionText = sizeReduction > 0 ? 'Reduced' : 'Increased';
        message += `\nSize ${reductionText}: ${Math.abs(sizeReduction).toFixed(1)}%`;
      }
      message += `\nDuration: ${duration}ms`;
      
      Alert.alert('Success', message);
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


  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const calculateSizeReduction = (
    originalSize: number,
    convertedSize: number
  ): number => {
    if (originalSize === 0) return 0;
    return ((originalSize - convertedSize) / originalSize) * 100;
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Image to WebP Converter</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Select Image</Text>
          
          <TouchableOpacity
            style={[styles.button, styles.selectButton]}
            onPress={showImagePickerOptions}
            disabled={isConverting}
          >
            <Text style={styles.buttonText}>
              {selectedImageUri ? 'Change Image' : 'Select Image'}
            </Text>
          </TouchableOpacity>

          {(selectedImageUri || (originalImageUri && inputPath)) && (
            <View style={styles.selectedImageContainer}>
              <Text style={styles.label}>Original Image:</Text>
              <TouchableOpacity
                onPress={() => {
                  setZoomImageUri(selectedImageUri || originalImageUri || '');
                  setIsZoomModalVisible(true);
                }}
                activeOpacity={0.9}
              >
                <Image
                  source={{ uri: selectedImageUri || originalImageUri || '' }}
                  style={styles.selectedImage}
                  resizeMode="contain"
                  onLoad={(event) => {
                    const { width, height } = event.nativeEvent.source;
                    if (width && height && width > 0 && height > 0) {
                      setOriginalImageDimensions({ width, height });
                    }
                  }}
                  onError={(error) => {
                    console.log('Error loading original image:', error);
                  }}
                />
              </TouchableOpacity>
              {(originalFileSize !== null || originalImageDimensions !== null) && (
                <View style={styles.imageInfoContainer}>
                  {originalImageDimensions !== null && (
                    <Text style={styles.fileSizeText}>
                      Resolution: {originalImageDimensions.width} × {originalImageDimensions.height}
                    </Text>
                  )}
                  {originalFileSize !== null && (
                    <Text style={styles.fileSizeText}>
                      Size: {formatFileSize(originalFileSize)}
                    </Text>
                  )}
                </View>
              )}
              <Text style={styles.pathText} numberOfLines={2}>
                {inputPath}
              </Text>
            </View>
          )}

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <Text style={styles.label}>Manual Path (optional):</Text>
          <TextInput
            style={styles.input}
            value={inputPath}
            onChangeText={(text) => {
              setInputPath(text);
              if (text) {
                setSelectedImageUri(null);
                // Set original image URI for manual paths
                const displayUri =
                  Platform.OS === 'android'
                    ? text.startsWith('file://')
                      ? text
                      : `file://${text}`
                    : text.startsWith('file://')
                      ? text
                      : `file://${text}`;
                setOriginalImageUri(displayUri);
                
                // Reset file size and dimensions - will be fetched by useEffect
                setOriginalFileSize(null);
                setOriginalImageDimensions(null);
              } else {
                setOriginalImageUri(null);
                setOriginalFileSize(null);
                setOriginalImageDimensions(null);
              }
            }}
            placeholder={
              Platform.OS === 'android'
                ? '/sdcard/Download/test-images/test-2k.jpg'
                : 'file:///path/to/image.jpg'
            }
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isConverting}
          />
          <Text style={styles.hintText}>
            You can also manually enter a file path. On iOS, use file:// URIs. On
            Android, use absolute paths.
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

        </View>


        {results.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Results</Text>
            {results.map((result, index) => {
              // Calculate size reduction if we have original file size
              const sizeReduction =
                originalFileSize !== null && originalFileSize > 0
                  ? calculateSizeReduction(originalFileSize, result.sizeBytes)
                  : null;
              // Ensure WebP path has proper file:// prefix for display
              const resultImageUri = Platform.OS === 'android' && !result.outputPath.startsWith('file://')
                ? `file://${result.outputPath}`
                : result.outputPath;
              return (
                <View key={index} style={styles.resultCard}>
                  <Text style={styles.resultPreset}>{result.preset}</Text>
                  <TouchableOpacity
                    onPress={() => {
                      setZoomImageUri(resultImageUri);
                      setIsZoomModalVisible(true);
                    }}
                    activeOpacity={0.9}
                  >
                    <Image
                      source={{ uri: resultImageUri }}
                      style={styles.resultImage}
                      resizeMode="contain"
                      onError={(error) => {
                        console.log('Error loading result image:', error);
                      }}
                    />
                  </TouchableOpacity>
                  {originalFileSize !== null && originalFileSize > 0 && (
                    <Text style={styles.resultText}>
                      Original Size: {formatFileSize(originalFileSize)}
                    </Text>
                  )}
                  <Text style={styles.resultText}>
                    WebP Size: {formatFileSize(result.sizeBytes)}
                  </Text>
                  {originalFileSize !== null && originalFileSize > 0 && (
                    <Text
                      style={[
                        styles.resultText,
                        styles.sizeReduction,
                        sizeReduction !== null && sizeReduction > 0
                          ? styles.sizeReductionPositive
                          : styles.sizeReductionNegative,
                      ]}
                    >
                      {sizeReduction !== null && sizeReduction > 0 ? 'Saved' : 'Increased'}: {sizeReduction !== null ? Math.abs(sizeReduction).toFixed(1) : '0.0'}% ({formatFileSize(Math.abs(originalFileSize - result.sizeBytes))})
                    </Text>
                  )}
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
              );
            })}
          </View>
        )}
      </View>

      {/* Image Zoom Modal */}
      <Modal
        visible={isZoomModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsZoomModalVisible(false)}
      >
        <View style={styles.zoomModalContainer}>
          <TouchableOpacity
            style={styles.zoomModalBackdrop}
            activeOpacity={1}
            onPress={() => setIsZoomModalVisible(false)}
          >
            <View style={styles.zoomModalContent}>
              <TouchableOpacity
                style={styles.zoomCloseButton}
                onPress={() => setIsZoomModalVisible(false)}
              >
                <Text style={styles.zoomCloseButtonText}>✕</Text>
              </TouchableOpacity>
              {zoomImageUri && (
                <ScrollView
                  contentContainerStyle={[
                    styles.zoomScrollContent,
                    zoomImageSize && {
                      minWidth: Math.max(Dimensions.get('window').width, zoomImageSize.width),
                      minHeight: Math.max(Dimensions.get('window').height, zoomImageSize.height),
                    },
                  ]}
                  showsHorizontalScrollIndicator={true}
                  showsVerticalScrollIndicator={true}
                  bounces={true}
                  bouncesZoom={true}
                  maximumZoomScale={5}
                  minimumZoomScale={1}
                  scrollEventThrottle={16}
                  centerContent={true}
                  pinchGestureEnabled={true}
                >
                  <Image
                    source={{ uri: zoomImageUri }}
                    style={[
                      styles.zoomImage,
                      zoomImageSize && {
                        width: zoomImageSize.width,
                        height: zoomImageSize.height,
                      },
                    ]}
                    resizeMode="contain"
                    onLoad={(event) => {
                      const { width, height } = event.nativeEvent.source;
                      if (width && height) {
                        const screenWidth = Dimensions.get('window').width;
                        const screenHeight = Dimensions.get('window').height;
                        const aspectRatio = width / height;
                        
                        let displayWidth = screenWidth;
                        let displayHeight = screenWidth / aspectRatio;
                        
                        if (displayHeight > screenHeight) {
                          displayHeight = screenHeight;
                          displayWidth = screenHeight * aspectRatio;
                        }
                        
                        setZoomImageSize({ width: displayWidth, height: displayHeight });
                      }
                    }}
                    onError={(error) => {
                      console.log('Error loading zoom image:', error);
                      Alert.alert('Error', 'Failed to load image. The file may not exist or may be corrupted.');
                    }}
                  />
                </ScrollView>
              )}
            </View>
          </TouchableOpacity>
        </View>
      </Modal>
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
  fileSizeText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  imageInfoContainer: {
    marginTop: 8,
    gap: 4,
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
  selectButton: {
    backgroundColor: '#007AFF',
    marginBottom: 12,
  },
  selectedImageContainer: {
    marginTop: 12,
    marginBottom: 12,
  },
  selectedImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    marginBottom: 8,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 12,
    color: '#999',
    fontWeight: '600',
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
  comparisonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  comparisonImageWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  comparisonLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  comparisonImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
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
  resultImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    marginBottom: 8,
  },
  sizeReduction: {
    fontWeight: '600',
    fontSize: 15,
  },
  sizeReductionPositive: {
    color: '#34C759', // Green for size reduction
  },
  sizeReductionNegative: {
    color: '#FF3B30', // Red for size increase
  },
  zoomModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  zoomModalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomModalContent: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomCloseButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    right: 20,
    zIndex: 1000,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomCloseButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  zoomScrollView: {
    flex: 1,
    width: '100%',
  },
  zoomScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomImage: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
});
