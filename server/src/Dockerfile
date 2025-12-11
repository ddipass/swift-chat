FROM public.ecr.aws/docker/library/python:3.12.0-slim-bullseye
COPY --from=public.ecr.aws/awsguru/aws-lambda-adapter:0.8.4 /lambda-adapter /opt/extensions/lambda-adapter

# Install Node.js for MCP servers (npx/uvx)
RUN apt-get update && apt-get install -y \
    nodejs \
    npm \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
COPY main.py .
COPY image_nl_processor.py .
COPY tool_manager.py .
COPY builtin_tools.py .
COPY tool_stats.py .
COPY mcp_integration/ ./mcp_integration/
RUN pip install --no-cache-dir -r requirements.txt

CMD ["python", "main.py"]
