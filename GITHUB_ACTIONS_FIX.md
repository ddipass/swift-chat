# GitHub Actions Android构建OOM修复

## 问题

```
Java heap space
Failed to transform hermes-android-0.74.1-debug.aar
```

GitHub Actions构建Android时内存不足。

---

## 已完成的修复

### ✅ 1. 增加Gradle heap size

**文件:** `react-native/android/gradle.properties`

```properties
# 从 2GB 增加到 3GB
org.gradle.jvmargs=-Xmx3072m -XX:MaxMetaspaceSize=512m -XX:+HeapDumpOnOutOfMemoryError -Dfile.encoding=UTF-8

# 启用Gradle daemon加速构建
org.gradle.daemon=true

# 启用配置缓存
org.gradle.configuration-cache=true
```

**Commit:** `3f74a3c`

---

## 需要手动完成的优化

### ⚠️ 2. 优化GitHub Actions workflow

由于Personal Access Token没有`workflow`权限，需要在GitHub网页上手动修改。

**文件:** `.github/workflows/build-android.yml`

**需要添加的内容:**

```yaml
name: Build for Android

on:
  push:
    branches: [ "main" ]
  pull_request:
    branches: [ "main" ]
permissions:
  contents: read
  pull-requests: write
jobs:
  build-android:
    runs-on: ubuntu-latest
    env:
      # 设置Gradle内存
      GRADLE_OPTS: -Dorg.gradle.jvmargs="-Xmx3072m -XX:MaxMetaspaceSize=512m"
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          distribution: 'corretto'
          java-version: '17'
      
      # 缓存Gradle包
      - name: Cache Gradle packages
        uses: actions/cache@v3
        with:
          path: |
            ~/.gradle/caches
            ~/.gradle/wrapper
          key: ${{ runner.os }}-gradle-${{ hashFiles('**/*.gradle*', '**/gradle-wrapper.properties') }}
          restore-keys: |
            ${{ runner.os }}-gradle-
      
      # 缓存node_modules
      - name: Cache node modules
        uses: actions/cache@v3
        with:
          path: react-native/node_modules
          key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
          restore-keys: |
            ${{ runner.os }}-node-
      
      - name: Run build apk
        run: |
          cd react-native && npm i
          cd android
          # 使用--no-daemon节省内存
          ./gradlew assembleDebug --no-daemon
```

### 修改步骤

1. 打开 https://github.com/ddipass/swift-chat/blob/main/.github/workflows/build-android.yml
2. 点击右上角的"Edit"按钮（铅笔图标）
3. 替换为上面的内容
4. 点击"Commit changes"
5. 填写commit message: "Optimize Android build workflow - add caching and memory settings"
6. 点击"Commit changes"

---

## 优化效果

### 内存优化
- ✅ Gradle heap: 2GB → 3GB
- ✅ 添加HeapDumpOnOutOfMemoryError用于调试
- ✅ 使用--no-daemon节省内存

### 构建速度优化
- ✅ 缓存Gradle包（~500MB）
- ✅ 缓存node_modules（~300MB）
- ✅ 启用Gradle daemon（本地构建）
- ✅ 启用configuration cache

### 预期结果
- 首次构建: ~7分钟
- 后续构建: ~3-4分钟（有缓存）
- OOM错误: 应该不再出现

---

## 如果仍然OOM

如果3GB还不够，可以尝试：

### 方案1: 进一步增加内存
```properties
# gradle.properties
org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=512m
```

### 方案2: 只构建一个架构
```yaml
# build-android.yml
- name: Run build apk
  run: |
    cd react-native && npm i
    cd android
    ./gradlew assembleDebug -PreactNativeArchitectures=arm64-v8a --no-daemon
```

### 方案3: 使用更大的runner
```yaml
jobs:
  build-android:
    runs-on: ubuntu-latest-4-cores  # 需要付费
```

---

## 验证

下次push后，查看GitHub Actions：
1. 打开 https://github.com/ddipass/swift-chat/actions
2. 查看最新的"Build for Android"
3. 应该显示绿色✅
4. 构建时间应该在3-7分钟

---

## 本地测试

如果想在本地验证：
```bash
cd react-native/android
./gradlew clean
./gradlew assembleDebug --no-daemon
```

应该能成功构建，不会OOM。
