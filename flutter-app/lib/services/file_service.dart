import 'dart:convert';
import 'dart:io';
import 'package:image_picker/image_picker.dart';
import 'package:file_picker/file_picker.dart';
import 'package:image/image.dart' as img;
import 'package:mime/mime.dart';
import '../models/message.dart';

class FileService {
  final ImagePicker _imagePicker = ImagePicker();

  /// 选择图片
  Future<List<MessageContent>?> pickImages() async {
    final images = await _imagePicker.pickMultiImage();
    if (images.isEmpty) return null;

    final contents = <MessageContent>[];
    for (final image in images) {
      final base64 = await _imageToBase64(File(image.path));
      if (base64 != null) {
        contents.add(MessageContent(
          type: 'image',
          imageSource: base64,
          format: _getImageFormat(image.path),
        ));
      }
    }

    return contents.isEmpty ? null : contents;
  }

  /// 拍照
  Future<MessageContent?> takePhoto() async {
    final image = await _imagePicker.pickImage(source: ImageSource.camera);
    if (image == null) return null;

    final base64 = await _imageToBase64(File(image.path));
    if (base64 == null) return null;

    return MessageContent(
      type: 'image',
      imageSource: base64,
      format: _getImageFormat(image.path),
    );
  }

  /// 选择视频
  Future<MessageContent?> pickVideo() async {
    final video = await _imagePicker.pickVideo(source: ImageSource.gallery);
    if (video == null) return null;

    final base64 = await _fileToBase64(File(video.path));
    if (base64 == null) return null;

    return MessageContent(
      type: 'video',
      videoSource: base64,
      format: 'mp4',
    );
  }

  /// 选择文档
  Future<MessageContent?> pickDocument() async {
    final result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['pdf', 'doc', 'docx', 'txt', 'csv', 'xlsx'],
    );

    if (result == null || result.files.isEmpty) return null;

    final file = File(result.files.first.path!);
    final base64 = await _fileToBase64(file);
    if (base64 == null) return null;

    final format = result.files.first.extension ?? 'pdf';

    return MessageContent(
      type: 'document',
      documentSource: base64,
      format: format,
    );
  }

  /// 图片转Base64（压缩）
  Future<String?> _imageToBase64(File file) async {
    try {
      final bytes = await file.readAsBytes();
      final image = img.decodeImage(bytes);
      if (image == null) return null;

      // 压缩图片
      final resized = img.copyResize(
        image,
        width: image.width > 1024 ? 1024 : image.width,
      );

      final compressed = img.encodeJpg(resized, quality: 85);
      return base64Encode(compressed);
    } catch (e) {
      return null;
    }
  }

  /// 文件转Base64
  Future<String?> _fileToBase64(File file) async {
    try {
      final bytes = await file.readAsBytes();
      return base64Encode(bytes);
    } catch (e) {
      return null;
    }
  }

  /// 获取图片格式
  String _getImageFormat(String path) {
    final mimeType = lookupMimeType(path);
    if (mimeType == null) return 'jpeg';
    
    if (mimeType.contains('png')) return 'png';
    if (mimeType.contains('gif')) return 'gif';
    if (mimeType.contains('webp')) return 'webp';
    return 'jpeg';
  }
}
