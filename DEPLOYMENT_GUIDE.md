# SwiftChat 部署指南

## 🚀 一键部署到 App Runner

### 前提条件

1. **安装 Docker**
   - macOS: [Docker Desktop](https://www.docker.com/products/docker-desktop)
   - 确保 Docker 正在运行

2. **安装 AWS CLI**
   ```bash
   # macOS
   brew install awscli
   
   # 或下载安装包
   # https://aws.amazon.com/cli/
   ```

3. **配置 AWS 凭证**
   ```bash
   aws configure
   # 输入:
   # - AWS Access Key ID
   # - AWS Secret Access Key
   # - Default region (如 us-east-1)
   # - Default output format (json)
   ```

### 部署步骤

1. **进入脚本目录**
   ```bash
   cd /Users/dpliu/swift-chat/server/scripts
   ```

2. **运行部署脚本**
   ```bash
   bash ./deploy-apprunner.sh
   ```

3. **按提示输入配置**
   ```
   Enter ECR repository name (default: swift-chat-api): [回车使用默认]
   Enter AWS region (default: us-east-1): [回车使用默认]
   Enter API Key parameter name in SSM (default: SwiftChatAPIKey): [回车使用默认]
   Enter CloudFormation stack name (default: SwiftChatAPI): [回车使用默认]
   Enter instance type (1=1vCPU/2GB, 2=2vCPU/4GB, default: 1): [输入 1 或 2]
   ```

4. **确认配置**
   ```
   Configuration:
     Repository: swift-chat-api
     Region: us-east-1
     API Key Param: SwiftChatAPIKey
     Stack Name: SwiftChatAPI
     Instance Type: 1
   
   Continue? (y/n): y
   ```

5. **设置 API Key**（如果是首次部署）
   ```
   Enter API Key (will be stored securely): [输入你的 API Key]
   ```

6. **等待部署完成**（约 3-5 分钟）
   ```
   Step 1/3: Building and pushing Docker image...
   ✅ Image pushed
   
   Step 2/3: Checking API Key in SSM Parameter Store...
   ✅ API Key parameter exists
   
   Step 3/3: Deploying CloudFormation stack...
   ✅ Deployment complete!
   
   🎉 SwiftChat API is ready!
   
   API URL: https://xxx.awsapprunner.com
   ```

### 配置 SwiftChat App

1. 打开 SwiftChat
2. 进入 **Settings → Tools Settings**
3. 输入：
   - **Backend URL**: `https://xxx.awsapprunner.com`（脚本输出的 API URL）
   - **API Key**: 你在步骤 5 设置的 API Key
4. 配置其他选项（可选）：
   - Processing Mode: Regex 或 AI Summary
   - Summary Model: 选择模型
   - Timeout、Cache TTL 等
5. 点击右上角 ✓ 保存

### 测试

发送消息测试工具调用：
```
"帮我总结 https://example.com 的内容"
```

应该看到：
1. AI 调用 web_fetch 工具
2. 显示 "🔧 Executing tool..."
3. 显示 "✅ Tool executed (X.Xs)"
4. AI 基于抓取的内容回答

---

## 🔄 更新部署

### 更新代码后重新部署

```bash
cd /Users/dpliu/swift-chat/server/scripts
bash ./deploy-apprunner-no-docker.sh
```

脚本会：
1. 重新上传源码
2. 触发 CodeBuild 构建新镜像
3. 更新 CloudFormation 栈
4. App Runner 自动拉取新镜像并重启

---

## ⏮️ 回滚/清理部署

### 完全删除所有资源

```bash
cd /Users/dpliu/swift-chat/server/scripts
bash ./cleanup-deployment.sh
```

**会删除：**
- ✅ CloudFormation Stack
- ✅ App Runner Service
- ✅ ECR Repository（包括所有镜像）
- ✅ SSM Parameter（API Key）
- ✅ S3 Bucket（构建源码）
- ✅ CodeBuild Project
- ✅ IAM Role（可选）

**安全提示：**
- 脚本会要求输入 `yes` 确认
- 删除前会列出所有将被删除的资源
- IAM Role 会单独询问是否删除

### 重新部署

清理后可以随时重新部署：
```bash
bash ./deploy-apprunner-no-docker.sh
```

---

## 🗑️ 删除部署（手动方式）

如果你想手动删除特定资源：

### 只删除 CloudFormation 栈

```bash
aws cloudformation delete-stack \
    --stack-name SwiftChatAPI \
    --region us-east-1
```

### 只删除 ECR 镜像

```bash
aws ecr delete-repository \
    --repository-name swift-chat-api \
    --region us-east-1 \
    --force
```

### 只删除 SSM 参数

```bash
aws ssm delete-parameter \
    --name SwiftChatAPIKey \
    --region us-east-1
```

---

## 📊 监控和日志

### 查看 App Runner 日志

1. 打开 [App Runner Console](https://console.aws.amazon.com/apprunner/home)
2. 选择你的服务（swiftchat-api）
3. 点击 **Logs** 标签
4. 查看实时日志

### 查看 CloudFormation 栈状态

```bash
aws cloudformation describe-stacks \
    --stack-name SwiftChatAPI \
    --region us-east-1
```

### 查看工具调用统计

```bash
curl -X GET https://YOUR_API_URL/api/tools/stats \
    -H "Authorization: Bearer YOUR_API_KEY"
```

---

## 🐛 故障排查

### 问题 1: Docker 构建失败

**错误：** `ERROR: Failed to build Docker image`

**解决：**
1. 确保 Docker Desktop 正在运行
2. 检查 `server/src/Dockerfile` 是否存在
3. 检查 `server/src/requirements.txt` 是否正确

### 问题 2: ECR 推送失败

**错误：** `ERROR: Failed to push image to ECR`

**解决：**
1. 检查 AWS 凭证是否正确：`aws sts get-caller-identity`
2. 检查 IAM 权限是否包含 ECR 操作
3. 检查网络连接

### 问题 3: CloudFormation 部署失败

**错误：** Stack creation failed

**解决：**
1. 查看 CloudFormation 控制台的错误信息
2. 检查 IAM 权限
3. 检查 region 是否支持 App Runner

### 问题 4: API 无法访问

**错误：** `Unable to resolve host`

**解决：**
1. 等待 3-5 分钟让 App Runner 完全启动
2. 检查 API URL 是否正确
3. 检查 App Runner 服务状态

---

## 💰 成本估算

### App Runner 定价（us-east-1）

**1 vCPU / 2 GB 内存：**
- 计算：$0.064/vCPU-hour + $0.007/GB-hour
- 约 $51/月（持续运行）

**2 vCPU / 4 GB 内存：**
- 计算：$0.128/vCPU-hour + $0.014/GB-hour
- 约 $102/月（持续运行）

**其他费用：**
- ECR 存储：$0.10/GB-month（通常 < $1）
- 数据传输：前 100GB 免费

**节省成本：**
- 使用 Lambda 替代 App Runner（按需付费）
- 参考 `server/template/SwiftChatLambda.template`

---

## 📚 相关文档

- [App Runner 文档](https://docs.aws.amazon.com/apprunner/)
- [ECR 文档](https://docs.aws.amazon.com/ecr/)
- [CloudFormation 文档](https://docs.aws.amazon.com/cloudformation/)
- [SwiftChat README](../README.md)
- [Tools Implementation](./TOOLS_IMPLEMENTATION.md)

---

## ✅ 检查清单

部署前：
- [ ] Docker Desktop 已安装并运行
- [ ] AWS CLI 已安装
- [ ] AWS 凭证已配置
- [ ] 选择了部署 region

部署后：
- [ ] 记录了 API URL
- [ ] 记录了 API Key
- [ ] 在 SwiftChat 中配置了 Tools Settings
- [ ] 测试了工具调用功能

---

需要帮助？查看 [GitHub Issues](https://github.com/aws-samples/swift-chat/issues)
