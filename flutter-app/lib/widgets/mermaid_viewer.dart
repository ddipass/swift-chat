import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';

class MermaidViewer extends StatefulWidget {
  final String code;

  const MermaidViewer({super.key, required this.code});

  @override
  State<MermaidViewer> createState() => _MermaidViewerState();
}

class _MermaidViewerState extends State<MermaidViewer> {
  late final WebViewController _controller;

  @override
  void initState() {
    super.initState();
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..loadHtmlString(_buildHtml());
  }

  String _buildHtml() {
    return '''
<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
  <script>mermaid.initialize({startOnLoad:true});</script>
</head>
<body>
  <div class="mermaid">
${widget.code}
  </div>
</body>
</html>
''';
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 300,
      decoration: BoxDecoration(
        border: Border.all(color: Colors.grey),
        borderRadius: BorderRadius.circular(8),
      ),
      child: WebViewWidget(controller: _controller),
    );
  }
}
