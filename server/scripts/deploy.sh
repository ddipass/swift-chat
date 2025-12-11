#!/bin/bash
# SwiftChat - Unified Deployment Script
# Supports both local Docker build and cloud-based CodeBuild
# Usage: cd server/scripts && bash ./deploy.sh

set -o errexit
set -o nounset
set -o pipefail

echo "================================================"
echo "SwiftChat - Unified Deployment"
echo "================================================"
echo ""

# Check prerequisites
echo "Checking prerequisites..."

if ! command -v aws &> /dev/null; then
    echo "❌ ERROR: AWS CLI is not installed"
    exit 1
fi

if ! aws sts get-caller-identity >/dev/null 2>&1; then
    echo "❌ ERROR: AWS credentials are not configured"
    exit 1
fi

echo "✅ AWS CLI configured"
echo ""

# Auto-detect AWS configuration
AWS_REGION=$(aws configure get region || echo "us-west-2")
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Check if Docker is available
HAS_DOCKER=false
if command -v docker &> /dev/null && docker info >/dev/null 2>&1; then
    HAS_DOCKER=true
    echo "✅ Docker available"
else
    echo "⚠️  Docker not available - will use CodeBuild"
fi
echo ""

# Get deployment mode
if [ "$HAS_DOCKER" = true ]; then
    echo "Select deployment mode:"
    echo "  1) Local Docker build (faster, requires Docker)"
    echo "  2) Cloud CodeBuild (slower, no Docker required)"
    read -p "Enter mode (1 or 2, default: 1): " MODE
    MODE=${MODE:-1}
else
    MODE=2
    echo "Using CodeBuild mode (Docker not available)"
fi
echo ""

# Configuration
REPO_NAME="swift-chat-api"
API_KEY_PARAM="SwiftChatAPIKey"
STACK_NAME="SwiftChatAPI"
INSTANCE_TYPE_PARAM="1 vCPU 2 GB"
REPOSITORY_URI="${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${REPO_NAME}"

echo "Configuration:"
echo "  Account: $ACCOUNT_ID"
echo "  Region: $AWS_REGION"
echo "  Repository: $REPO_NAME"
echo "  Stack: $STACK_NAME"
echo ""

# Create ECR repository
echo "Creating ECR repository..."
aws ecr create-repository --repository-name "${REPO_NAME}" --region $AWS_REGION >/dev/null 2>&1 || true
echo "✅ ECR repository ready"
echo ""

if [ "$MODE" = "1" ]; then
    # Local Docker build
    echo "Building Docker image locally..."
    
    # Login to AWS Public ECR
    aws ecr-public get-login-password --region us-east-1 | docker login --username AWS --password-stdin public.ecr.aws
    
    # Build image
    docker buildx build --platform linux/amd64 -t $REPO_NAME:latest -f ../src/Dockerfile --load ../src/
    
    # Login to ECR
    aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $REPOSITORY_URI
    
    # Tag and push
    docker tag $REPO_NAME:latest $REPOSITORY_URI:latest
    docker push $REPOSITORY_URI:latest
    
    echo "✅ Image pushed to ECR"
else
    # Cloud CodeBuild
    echo "Building with CodeBuild..."
    
    BUCKET_NAME="swiftchat-build-${ACCOUNT_ID}-${AWS_REGION}"
    BUILD_PROJECT_NAME="swiftchat-build"
    
    # Create S3 bucket
    aws s3 mb s3://${BUCKET_NAME} --region $AWS_REGION 2>/dev/null || true
    
    # Create buildspec
    cat > ../src/buildspec.yml << 'EOF'
version: 0.2
phases:
  pre_build:
    commands:
      - aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $ECR_REPO_URI
  build:
    commands:
      - docker build -t $IMAGE_TAG .
      - docker tag $IMAGE_TAG $ECR_REPO_URI:latest
  post_build:
    commands:
      - docker push $ECR_REPO_URI:latest
EOF
    
    # Create source zip
    cd ../src
    zip -q -r /tmp/swiftchat-source.zip . -x "*.pyc" -x "__pycache__/*" -x ".DS_Store" -x "venv/*" -x "*.log"
    cd ../scripts
    
    # Upload to S3
    aws s3 cp /tmp/swiftchat-source.zip s3://${BUCKET_NAME}/swiftchat-source.zip --region $AWS_REGION --quiet
    rm /tmp/swiftchat-source.zip
    rm ../src/buildspec.yml
    
    # Create IAM role if needed
    if ! aws iam get-role --role-name CodeBuildServiceRole >/dev/null 2>&1; then
        cat > /tmp/trust-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {"Service": "codebuild.amazonaws.com"},
    "Action": "sts:AssumeRole"
  }]
}
EOF
        aws iam create-role --role-name CodeBuildServiceRole --assume-role-policy-document file:///tmp/trust-policy.json
        aws iam attach-role-policy --role-name CodeBuildServiceRole --policy-arn arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryPowerUser
        aws iam attach-role-policy --role-name CodeBuildServiceRole --policy-arn arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess
        aws iam attach-role-policy --role-name CodeBuildServiceRole --policy-arn arn:aws:iam::aws:policy/CloudWatchLogsFullAccess
        rm /tmp/trust-policy.json
        sleep 10
    fi
    
    # Create/update CodeBuild project
    cat > /tmp/codebuild-project.json << EOF
{
  "name": "${BUILD_PROJECT_NAME}",
  "source": {
    "type": "S3",
    "location": "${BUCKET_NAME}/swiftchat-source.zip",
    "buildspec": "buildspec.yml"
  },
  "artifacts": {"type": "NO_ARTIFACTS"},
  "environment": {
    "type": "LINUX_CONTAINER",
    "image": "aws/codebuild/standard:7.0",
    "computeType": "BUILD_GENERAL1_SMALL",
    "privilegedMode": true,
    "environmentVariables": [
      {"name": "ECR_REPO_URI", "value": "${REPOSITORY_URI}"},
      {"name": "IMAGE_TAG", "value": "swift-chat-api"},
      {"name": "AWS_DEFAULT_REGION", "value": "${AWS_REGION}"}
    ]
  },
  "serviceRole": "arn:aws:iam::${ACCOUNT_ID}:role/CodeBuildServiceRole"
}
EOF
    
    aws codebuild create-project --cli-input-json file:///tmp/codebuild-project.json --region $AWS_REGION 2>/dev/null || \
    aws codebuild update-project --cli-input-json file:///tmp/codebuild-project.json --region $AWS_REGION >/dev/null
    rm /tmp/codebuild-project.json
    
    # Start build
    BUILD_ID=$(aws codebuild start-build --project-name ${BUILD_PROJECT_NAME} --region $AWS_REGION --query 'build.id' --output text)
    echo "Build ID: $BUILD_ID"
    
    # Wait for build
    while true; do
        BUILD_STATUS=$(aws codebuild batch-get-builds --ids $BUILD_ID --region $AWS_REGION --query 'builds[0].buildStatus' --output text)
        
        if [ "$BUILD_STATUS" = "SUCCEEDED" ]; then
            echo "✅ Build succeeded"
            break
        elif [ "$BUILD_STATUS" = "FAILED" ] || [ "$BUILD_STATUS" = "FAULT" ] || [ "$BUILD_STATUS" = "TIMED_OUT" ] || [ "$BUILD_STATUS" = "STOPPED" ]; then
            echo "❌ Build failed: $BUILD_STATUS"
            exit 1
        fi
        
        echo "Building... ($BUILD_STATUS)"
        sleep 10
    done
fi

echo ""

# Check/create API Key
echo "Checking API Key..."
if aws ssm get-parameter --name "$API_KEY_PARAM" --region $AWS_REGION >/dev/null 2>&1; then
    API_KEY_VALUE=$(aws ssm get-parameter --name "$API_KEY_PARAM" --with-decryption --region $AWS_REGION --query 'Parameter.Value' --output text)
    echo "✅ Using existing API Key"
else
    API_KEY_VALUE=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
    aws ssm put-parameter --name "$API_KEY_PARAM" --value "$API_KEY_VALUE" --type "SecureString" --region $AWS_REGION
    echo "✅ Created new API Key"
fi
echo ""

# Deploy CloudFormation
echo "Deploying CloudFormation stack..."
IMAGE_URI="${REPOSITORY_URI}:latest"

aws cloudformation deploy \
    --template-file ../template/SwiftChatAppRunner.template \
    --stack-name "$STACK_NAME" \
    --parameter-overrides \
        ApiKeyParam="$API_KEY_PARAM" \
        ContainerImageUri="$IMAGE_URI" \
        InstanceTypeParam="$INSTANCE_TYPE_PARAM" \
    --capabilities CAPABILITY_IAM \
    --region $AWS_REGION

echo ""

# Get API URL
API_URL=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region $AWS_REGION --query 'Stacks[0].Outputs[?OutputKey==`APIURL`].OutputValue' --output text)

echo "================================================"
echo "🎉 SwiftChat API Deployed!"
echo "================================================"
echo ""
echo "API URL: $API_URL"
echo "API Key: $API_KEY_VALUE"
echo ""
echo "✨ Features:"
echo "  - MCP (Model Context Protocol) integration"
echo "  - Built-in web_fetch tool"
echo "  - Support for stdio and OAuth MCP servers"
echo ""
echo "Testing API..."
curl -s "$API_URL" | jq . || echo "API is starting up..."
echo ""
