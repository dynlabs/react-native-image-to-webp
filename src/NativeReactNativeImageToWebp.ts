import { TurboModuleRegistry, type TurboModule } from 'react-native';

export type ConvertPreset =
  | 'balanced'
  | 'small'
  | 'fast'
  | 'lossless'
  | 'document';

export interface ConvertOptions {
  inputPath: string;
  outputPath?: string;
  preset?: ConvertPreset;
  maxLongEdge?: number;
  quality?: number;
  method?: number;
  lossless?: boolean;
  stripMetadata?: boolean;
}

export interface ConvertResult {
  outputPath: string;
  width: number;
  height: number;
  sizeBytes: number;
}

export interface Spec extends TurboModule {
  convertImageToWebP(options: ConvertOptions): Promise<ConvertResult>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('ReactNativeImageToWebp');
