import 'package:flutter/material.dart';

class CustomTextField extends StatelessWidget {
  final String label;
  final String? value;
  final String? placeholder;
  final bool obscureText;
  final ValueChanged<String>? onChanged;
  final dynamic colors;

  const CustomTextField({
    super.key,
    required this.label,
    this.value,
    this.placeholder,
    this.obscureText = false,
    this.onChanged,
    required this.colors,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w500,
            color: colors.text,
          ),
        ),
        const SizedBox(height: 8),
        TextField(
          controller: TextEditingController(text: value),
          obscureText: obscureText,
          onChanged: onChanged,
          style: TextStyle(
            fontSize: 16,
            color: colors.text,
          ),
          decoration: InputDecoration(
            hintText: placeholder,
            hintStyle: TextStyle(color: colors.textSecondary),
            filled: true,
            fillColor: colors.surface,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: BorderSide(color: colors.border),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: BorderSide(color: colors.border),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: BorderSide(color: colors.primary, width: 2),
            ),
            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          ),
        ),
      ],
    );
  }
}
