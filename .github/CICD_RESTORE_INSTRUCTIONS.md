# CI/CD 恢复说明

## 备份信息
- **备份时间**: 2025-12-13 23:45
- **备份位置**: `.github/workflows-backup-20251213/`
- **禁用方式**: 将 `.yml` 文件重命名为 `.yml.disabled`

## 已备份的文件
- flutter-android.yml
- flutter-ios.yml
- flutter-macos.yml
- flutter-windows.yml

## 恢复方法

### 方法1: 恢复所有workflow
```bash
cd /Users/dpliu/swift-chat/.github/workflows
for file in *.disabled; do mv "$file" "${file%.disabled}"; done
```

### 方法2: 从备份恢复
```bash
cd /Users/dpliu/swift-chat/.github
cp workflows-backup-20251213/* workflows/
```

### 方法3: 恢复单个workflow
```bash
cd /Users/dpliu/swift-chat/.github/workflows
mv flutter-android.yml.disabled flutter-android.yml
```

## 验证恢复
```bash
cd /Users/dpliu/swift-chat/.github/workflows
ls -la *.yml
```

应该看到4个 `.yml` 文件（不带 `.disabled` 后缀）

---

**创建时间**: 2025-12-13
