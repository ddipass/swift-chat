import '../models/message.dart';

/// Abstract API service interface
/// This will be implemented by real API services in Week 3
abstract class ApiService {
  /// Send a text message and get AI response
  /// Returns a stream for real-time streaming responses
  Stream<String> sendMessage({
    required String text,
    required List<Message> history,
    String? model,
  });

  /// Generate an image from text prompt
  /// Returns progress updates and final image URL
  Stream<ImageGenerationProgress> generateImage({
    required String prompt,
    String? model,
  });

  /// Get available models for the current provider
  Future<List<ModelInfo>> getModels();

  /// Get current token usage statistics
  Future<TokenUsage> getTokenUsage();
}

/// Image generation progress
class ImageGenerationProgress {
  final double progress; // 0.0 to 1.0
  final String? imageUrl;
  final String? error;

  ImageGenerationProgress({
    required this.progress,
    this.imageUrl,
    this.error,
  });
}

/// Model information
class ModelInfo {
  final String id;
  final String name;
  final String provider;
  final bool supportsText;
  final bool supportsImage;

  ModelInfo({
    required this.id,
    required this.name,
    required this.provider,
    this.supportsText = true,
    this.supportsImage = false,
  });
}

/// Token usage statistics
class TokenUsage {
  final int inputTokens;
  final int outputTokens;
  final int totalTokens;

  TokenUsage({
    required this.inputTokens,
    required this.outputTokens,
    required this.totalTokens,
  });
}
