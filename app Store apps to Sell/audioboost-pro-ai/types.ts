export enum AudioProcessingMode {
    PASSTHROUGH = 'PASSTHROUGH',
    ENHANCED = 'ENHANCED',
    MUTE = 'MUTE'
}

export interface AudioStats {
    peak: number;
    rms: number;
}

export interface AnalysisResult {
    text: string;
    confidence: number;
    timestamp: number;
}
