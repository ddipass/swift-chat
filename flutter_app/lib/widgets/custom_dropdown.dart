import 'package:flutter/material.dart';

class CustomDropdown extends StatelessWidget {
  final String label;
  final String value;
  final List<DropdownItem> items;
  final ValueChanged<String?>? onChanged;
  final dynamic colors;

  const CustomDropdown({
    super.key,
    required this.label,
    required this.value,
    required this.items,
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
        Container(
          decoration: BoxDecoration(
            color: colors.surface,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: colors.border),
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              value: value,
              isExpanded: true,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
              dropdownColor: colors.surface,
              style: TextStyle(fontSize: 16, color: colors.text),
              icon: Icon(Icons.arrow_drop_down, color: colors.text),
              items: items.map((item) {
                return DropdownMenuItem<String>(
                  value: item.value,
                  child: Text(item.label),
                );
              }).toList(),
              onChanged: onChanged,
            ),
          ),
        ),
      ],
    );
  }
}

class DropdownItem {
  final String label;
  final String value;

  DropdownItem({required this.label, required this.value});
}
