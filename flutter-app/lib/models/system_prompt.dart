class SystemPrompt {
  final String id;
  String name;
  String prompt;
  final bool isBuiltIn;
  int order;

  SystemPrompt({
    required this.id,
    required this.name,
    required this.prompt,
    this.isBuiltIn = false,
    this.order = 0,
  });

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'prompt': prompt,
      'isBuiltIn': isBuiltIn ? 1 : 0,
      'order': order,
    };
  }

  factory SystemPrompt.fromJson(Map<String, dynamic> json) {
    return SystemPrompt(
      id: json['id'],
      name: json['name'],
      prompt: json['prompt'],
      isBuiltIn: json['isBuiltIn'] == 1,
      order: json['order'] ?? 0,
    );
  }

  SystemPrompt copyWith({
    String? id,
    String? name,
    String? prompt,
    bool? isBuiltIn,
    int? order,
  }) {
    return SystemPrompt(
      id: id ?? this.id,
      name: name ?? this.name,
      prompt: prompt ?? this.prompt,
      isBuiltIn: isBuiltIn ?? this.isBuiltIn,
      order: order ?? this.order,
    );
  }
}

// 预设System Prompts
class BuiltInPrompts {
  static final List<SystemPrompt> prompts = [
    SystemPrompt(
      id: 'default',
      name: 'Default Assistant',
      prompt: 'You are a helpful AI assistant.',
      isBuiltIn: true,
      order: 0,
    ),
    SystemPrompt(
      id: 'code_expert',
      name: 'Code Expert',
      prompt: 'You are an expert programmer. Provide clear, efficient, and well-documented code solutions. Explain your reasoning and best practices.',
      isBuiltIn: true,
      order: 1,
    ),
    SystemPrompt(
      id: 'english_teacher',
      name: 'English Teacher',
      prompt: 'You are an English teacher. Help users improve their English by correcting grammar, suggesting better expressions, and explaining language concepts clearly.',
      isBuiltIn: true,
      order: 2,
    ),
    SystemPrompt(
      id: 'translator',
      name: 'Translator',
      prompt: 'You are a professional translator. Translate text accurately while preserving the original meaning, tone, and cultural context.',
      isBuiltIn: true,
      order: 3,
    ),
    SystemPrompt(
      id: 'writer',
      name: 'Creative Writer',
      prompt: 'You are a creative writer. Help users craft engaging stories, articles, and content with vivid descriptions and compelling narratives.',
      isBuiltIn: true,
      order: 4,
    ),
    SystemPrompt(
      id: 'analyst',
      name: 'Data Analyst',
      prompt: 'You are a data analyst. Help users understand data, create visualizations, and derive meaningful insights from information.',
      isBuiltIn: true,
      order: 5,
    ),
  ];
}
