#!/bin/bash
# SwiftChat - Cleanup/Rollback Deployment
# Removes all AWS resources created by deployment scripts
# Usage: cd server/scripts && bash ./cleanup-deployment.sh

set -o errexit
set -o nounset
set -o pipefail

echo "================================================"
echo "SwiftChat - Cleanup Deployment"
echo "================================================"
echo ""

# Check prerequisites
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

# Get inputs
read -p "Enter AWS region (default: us-east-1): " AWS_REGION
AWS_REGION=${AWS_REGION:-us-east-1}

read -p "Enter CloudFormation stack name (default: SwiftChatAPI): " STACK_NAME
STACK_NAME=${STACK_NAME:-SwiftChatAPI}

read -p "Enter API Key parameter name (default: SwiftChatAPIKey): " API_KEY_PARAM
API_KEY_PARAM=${API_KEY_PARAM:-SwiftChatAPIKey}

echo ""
echo "⚠️  WARNING: This will delete the following resources:"
echo "  1. CloudFormation Stack: $STACK_NAME"
echo "  2. App Runner Service"
echo "  3. ECR Repository: swift-chat-api (and all images)"
echo "  4. SSM Parameter: $API_KEY_PARAM"
echo "  5. S3 Bucket: swiftchat-build-* (if exists)"
echo "  6. CodeBuild Project: swiftchat-build (if exists)"
echo "  7. IAM Role: CodeBuildServiceRole (if exists)"
echo ""
read -p "Are you sure you want to continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Aborted"
    exit 0
fi

echo ""
ACCOUNT_ID=$(aws sts get-caller-identity --region $AWS_REGION --query Account --output text)

# Step 1: Delete CloudFormation Stack
echo "Step 1/7: Deleting CloudFormation stack..."
if aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region $AWS_REGION >/dev/null 2>&1; then
    aws cloudformation delete-stack --stack-name "$STACK_NAME" --region $AWS_REGION
    echo "Waiting for stack deletion (this may take 2-3 minutes)..."
    aws cloudformation wait stack-delete-complete --stack-name "$STACK_NAME" --region $AWS_REGION 2>/dev/null || true
    echo "✅ CloudFormation stack deleted"
else
    echo "ℹ️  Stack not found, skipping"
fi
echo ""

# Step 2: Delete ECR Repository
echo "Step 2/7: Deleting ECR repository..."
if aws ecr describe-repositories --repository-names swift-chat-api --region $AWS_REGION >/dev/null 2>&1; then
    aws ecr delete-repository --repository-name swift-chat-api --region $AWS_REGION --force
    echo "✅ ECR repository deleted"
else
    echo "ℹ️  ECR repository not found, skipping"
fi
echo ""

# Step 3: Delete SSM Parameter
echo "Step 3/7: Deleting SSM parameter..."
if aws ssm get-parameter --name "$API_KEY_PARAM" --region $AWS_REGION >/dev/null 2>&1; then
    aws ssm delete-parameter --name "$API_KEY_PARAM" --region $AWS_REGION
    echo "✅ SSM parameter deleted"
else
    echo "ℹ️  SSM parameter not found, skipping"
fi
echo ""

# Step 4: Delete S3 Bucket
echo "Step 4/7: Deleting S3 bucket..."
BUCKET_NAME="swiftchat-build-${ACCOUNT_ID}"
if aws s3 ls s3://${BUCKET_NAME} --region $AWS_REGION >/dev/null 2>&1; then
    aws s3 rb s3://${BUCKET_NAME} --force --region $AWS_REGION
    echo "✅ S3 bucket deleted"
else
    echo "ℹ️  S3 bucket not found, skipping"
fi
echo ""

# Step 5: Delete CodeBuild Project
echo "Step 5/7: Deleting CodeBuild project..."
if aws codebuild batch-get-projects --names swiftchat-build --region $AWS_REGION --query 'projects[0].name' --output text 2>/dev/null | grep -q swiftchat-build; then
    aws codebuild delete-project --name swiftchat-build --region $AWS_REGION
    echo "✅ CodeBuild project deleted"
else
    echo "ℹ️  CodeBuild project not found, skipping"
fi
echo ""

# Step 6: Delete IAM Role (optional, ask user)
echo "Step 6/7: Checking IAM role..."
if aws iam get-role --role-name CodeBuildServiceRole --region $AWS_REGION >/dev/null 2>&1; then
    read -p "Delete IAM role 'CodeBuildServiceRole'? (y/n): " DELETE_ROLE
    if [[ "$DELETE_ROLE" =~ ^[Yy]$ ]]; then
        # Detach policies
        aws iam detach-role-policy --role-name CodeBuildServiceRole --policy-arn arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryPowerUser 2>/dev/null || true
        aws iam detach-role-policy --role-name CodeBuildServiceRole --policy-arn arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess 2>/dev/null || true
        aws iam detach-role-policy --role-name CodeBuildServiceRole --policy-arn arn:aws:iam::aws:policy/CloudWatchLogsFullAccess 2>/dev/null || true
        
        # Delete role
        aws iam delete-role --role-name CodeBuildServiceRole --region $AWS_REGION
        echo "✅ IAM role deleted"
    else
        echo "ℹ️  IAM role kept"
    fi
else
    echo "ℹ️  IAM role not found, skipping"
fi
echo ""

# Step 7: Summary
echo "Step 7/7: Cleanup summary"
echo ""
echo "================================================"
echo "✅ Cleanup Complete!"
echo "================================================"
echo ""
echo "Deleted resources:"
echo "  ✅ CloudFormation Stack: $STACK_NAME"
echo "  ✅ App Runner Service"
echo "  ✅ ECR Repository: swift-chat-api"
echo "  ✅ SSM Parameter: $API_KEY_PARAM"
echo "  ✅ S3 Bucket: $BUCKET_NAME"
echo "  ✅ CodeBuild Project: swiftchat-build"
echo ""
echo "Your AWS account is now clean."
echo "You can re-deploy anytime by running:"
echo "  bash ./deploy-apprunner-no-docker.sh"
echo ""
