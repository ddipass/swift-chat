import '../models/message.dart';

class MockApiService {
  Future<Message> sendMessage(String text) async {
    // Simulate network delay
    await Future.delayed(const Duration(milliseconds: 500));
    
    return Message(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      text: 'This is a mock AI response to: "$text"',
      isUser: false,
      createdAt: DateTime.now(),
    );
  }
}
