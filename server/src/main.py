import base64
import logging
from typing import List
import uvicorn
from fastapi import FastAPI, HTTPException, Depends, Request as FastAPIRequest
from fastapi.responses import StreamingResponse, PlainTextResponse, HTMLResponse
import boto3
import json
import random
import os
import re
from pydantic import BaseModel
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Annotated
from urllib.request import urlopen, Request
import time
from image_nl_processor import get_native_request_with_ref_image, get_analyse_result, get_native_request_with_virtual_try_on
import httpx
from tool_manager import ToolManager
from mcp_integration.manager import MCPManager

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI()
security = HTTPBearer()
mcp_manager = MCPManager()
tool_manager = ToolManager()
tool_manager.mcp_manager = mcp_manager  # 使用共享的 mcp_manager

@app.get("/")
async def root():
    """Health check endpoint"""
    return {"status": "ok", "service": "SwiftChat API"}

auth_token = ''
CACHE_DURATION = 120000
cache = {
    "latest_version": "",
    "last_check": 0
}


class ImageRequest(BaseModel):
    prompt: str
    refImages: List[dict] | None = None
    modelId: str
    region: str
    width: int
    height: int


class ConverseRequest(BaseModel):
    messages: List[dict] = []
    modelId: str
    enableThinking: bool | None = None
    region: str
    system: List[dict] | None = None


class StreamOptions(BaseModel):
    include_usage: bool = True


class GPTRequest(BaseModel):
    model: str
    messages: List[dict]
    stream: bool = True
    stream_options: StreamOptions


class ModelsRequest(BaseModel):
    region: str


class TokenRequest(BaseModel):
    region: str


class UpgradeRequest(BaseModel):
    os: str
    version: str


def get_api_key_from_ssm(use_cache_token: bool):
    global auth_token
    if use_cache_token and auth_token != '':
        return auth_token
    
    # For local testing
    if os.environ.get('LOCAL_API_KEY'):
        auth_token = os.environ.get('LOCAL_API_KEY')
        return auth_token
    
    # Check if API_KEY_NAME is set
    api_key_name = os.environ.get('API_KEY_NAME')
    if not api_key_name:
        raise HTTPException(status_code=500, detail="API_KEY_NAME environment variable not set")
    
    ssm_client = boto3.client('ssm')
    try:
        response = ssm_client.get_parameter(
            Name=api_key_name,
            WithDecryption=True
        )
        auth_token = response['Parameter']['Value']
        return auth_token
    except Exception as error:
        raise HTTPException(status_code=401,
                            detail=f"Error: Please create your API Key in Parameter Store, {str(error)}")


def verify_api_key(credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)],
                   use_cache_token: bool = True):
    if credentials.credentials != get_api_key_from_ssm(use_cache_token):
        raise HTTPException(status_code=401, detail="Invalid API Key")
    return credentials.credentials


def verify_and_refresh_token(credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)]):
    return verify_api_key(credentials, use_cache_token=False)


async def create_bedrock_command(request: ConverseRequest) -> tuple[boto3.client, dict]:
    model_id = request.modelId
    region = request.region

    client = boto3.client("bedrock-runtime", region_name=region)

    max_tokens = 4096
    if model_id.startswith('meta.llama'):
        max_tokens = 2048
    if 'deepseek.r1' in model_id or 'claude-opus-4' in model_id:
        max_tokens = 32000
    if 'claude-3-7-sonnet' in model_id or 'claude-sonnet-4' in model_id:
        max_tokens = 64000

    for message in request.messages:
        if message["role"] == "user":
            for content in message["content"]:
                if 'image' in content:
                    image_bytes = base64.b64decode(content['image']['source']['bytes'])
                    content['image']['source']['bytes'] = image_bytes
                if 'video' in content:
                    video_bytes = base64.b64decode(content['video']['source']['bytes'])
                    content['video']['source']['bytes'] = video_bytes
                if 'document' in content:
                    document_bytes = base64.b64decode(content['document']['source']['bytes'])
                    content['document']['source']['bytes'] = document_bytes

    command = {
        "inferenceConfig": {"maxTokens": max_tokens},
        "messages": request.messages,
        "modelId": model_id
    }

    if request.enableThinking:
        command['additionalModelRequestFields'] = {
            "reasoning_config": {
                "type": "enabled",
                "budget_tokens": 16000
            }
        }

    if request.system is not None:
        command["system"] = request.system

    return client, command


@app.post("/api/converse/v3")
async def converse_v3(request: ConverseRequest,
                      _: Annotated[str, Depends(verify_api_key)]):
    try:
        client, command = await create_bedrock_command(request)

        def event_generator():
            try:
                response = client.converse_stream(**command)
                for item in response['stream']:
                    yield json.dumps(item) + '\n\n'
            except Exception as err:
                yield f"Error: {str(err)}"

        return StreamingResponse(event_generator(), media_type="text/event-stream")

    except Exception as error:
        return PlainTextResponse(f"Error: {str(error)}", status_code=500)


@app.post("/api/converse/v2")
async def converse_v2(request: ConverseRequest,
                      _: Annotated[str, Depends(verify_api_key)]):
    try:
        client, command = await create_bedrock_command(request)

        def event_generator():
            try:
                response = client.converse_stream(**command)
                for item in response['stream']:
                    yield json.dumps(item)
            except Exception as err:
                yield f"Error: {str(err)}"

        return StreamingResponse(event_generator(), media_type="text/event-stream")

    except Exception as error:
        return PlainTextResponse(f"Error: {str(error)}", status_code=500)


@app.post("/api/image")
async def gen_image(request: ImageRequest,
                    _: Annotated[str, Depends(verify_api_key)]):
    model_id = request.modelId
    prompt = request.prompt
    ref_images = request.refImages
    width = request.width
    height = request.height
    region = request.region
    client = boto3.client("bedrock-runtime",
                          region_name=region)
    if (ref_images is None or model_id.startswith("stability.")) and contains_chinese(prompt):
        prompt = get_english_prompt(client, prompt)
    return get_image(client, model_id, prompt, ref_images, width, height)


@app.post("/api/token")
async def get_token(request: TokenRequest,
                    _: Annotated[str, Depends(verify_api_key)]):
    region = request.region
    try:
        client_role_arn = os.environ.get('CLIENT_ROLE_ARN')
        if not client_role_arn:
            return {"error": "CLIENT_ROLE_ARN environment variable not set"}
        sts_client = boto3.client('sts', region_name=region)
        session_name = f"SwiftChatClient-{int(time.time())}"
        response = sts_client.assume_role(
            RoleArn=client_role_arn,
            RoleSessionName=session_name,
            DurationSeconds=3600
        )
        credentials = response['Credentials']
        return {
            "accessKeyId": credentials['AccessKeyId'],
            "secretAccessKey": credentials['SecretAccessKey'],
            "sessionToken": credentials['SessionToken'],
            "expiration": credentials['Expiration'].isoformat()
        }
    except Exception as e:
        print(f"Error assuming role: {e}")
        return {"error": str(e)}


@app.post("/api/models")
async def get_models(request: ModelsRequest,
                     _: Annotated[str, Depends(verify_api_key)]):
    region = request.region
    client = boto3.client("bedrock",
                          region_name=region)

    try:
        response = client.list_foundation_models()
        if response.get("modelSummaries"):
            model_names = set()
            text_model = []
            image_model = []
            for model in response["modelSummaries"]:
                need_cross_region = "INFERENCE_PROFILE" in model["inferenceTypesSupported"]
                if (model["modelLifecycle"]["status"] == "ACTIVE"
                        and ("ON_DEMAND" in model["inferenceTypesSupported"] or need_cross_region)
                        and not model["modelId"].endswith("k")
                        and model["modelName"] not in model_names):
                    if ("TEXT" in model.get("outputModalities", []) and
                            model.get("responseStreamingSupported")):
                        if need_cross_region:
                            region_prefix = region.split("-")[0]
                            if region_prefix == 'ap':
                                region_prefix = 'apac'
                            model_id = region_prefix + "." + model["modelId"]
                        else:
                            model_id = model["modelId"]
                        text_model.append({
                            "modelId": model_id,
                            "modelName": model["modelName"]
                        })
                    elif "IMAGE" in model.get("outputModalities", []):
                        image_model.append({
                            "modelId": model["modelId"],
                            "modelName": model["modelName"]
                        })
                    model_names.add(model["modelName"])
            return {"textModel": text_model, "imageModel": image_model}
        else:
            return []
    except Exception as e:
        print(f"bedrock error: {e}")
        return {"error": str(e)}


@app.post("/api/upgrade")
async def upgrade(request: UpgradeRequest,
                  _: Annotated[str, Depends(verify_and_refresh_token)]):
    new_version = get_latest_version()
    total_number = calculate_version_total(request.version)
    need_upgrade = False
    url = ''
    if total_number > 0:
        need_upgrade = total_number < calculate_version_total(new_version)
        if need_upgrade:
            download_prefix = "https://github.com/aws-samples/swift-chat/releases/download/"
            if request.os == 'android':
                url = download_prefix + new_version + "/SwiftChat.apk"
            elif request.os == 'mac':
                url = download_prefix + new_version + "/SwiftChat.dmg"
    return {"needUpgrade": need_upgrade, "version": new_version, "url": url}


@app.post("/api/openai")
async def converse_openai(request: GPTRequest, raw_request: FastAPIRequest):
    auth_header = raw_request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid auth header")
    openai_api_key = auth_header.split(" ")[1]
    request_url = raw_request.headers.get("request_url")
    if not request_url or not request_url.startswith("http"):
        raise HTTPException(status_code=401, detail="Invalid request url")
    http_referer = raw_request.headers.get("HTTP-Referer")
    x_title = raw_request.headers.get("X-Title")

    async def event_generator():
        async with httpx.AsyncClient() as client:
            try:
                async with client.stream(
                        "POST",
                        request_url,
                        json=request.model_dump(),
                        headers={
                            "Authorization": f"Bearer {openai_api_key}",
                            "Content-Type": "application/json",
                            "Accept": "text/event-stream",
                            **({"HTTP-Referer": http_referer} if http_referer else {}),
                            **({"X-Title": x_title} if x_title else {})
                        }
                ) as response:
                    async for line in response.aiter_bytes():
                        if line:
                            yield line

            except Exception as err:
                print("error:", err)
                yield f"Error: {str(err)}".encode('utf-8')

    return StreamingResponse(event_generator(), media_type="text/event-stream")


def calculate_version_total(version: str) -> int:
    versions = version.split(".")
    total_number = 0
    if len(versions) == 3:
        total_number = int(versions[0]) * 10000 + int(versions[1]) * 100 + int(versions[2])
    return total_number


def get_latest_version() -> str:
    timestamp = int(time.time() * 1000)
    if cache["last_check"] > 0 and timestamp - cache["last_check"] < CACHE_DURATION:
        return cache["latest_version"]
    req = Request(
        f"https://api.github.com/repos/aws-samples/swift-chat/tags",
        headers={
            'User-Agent': 'Mozilla/5.0'
        }
    )
    try:
        with urlopen(req) as response:
            content = response.read().decode('utf-8')
            latest_version = json.loads(content)[0]['name']
            cache["latest_version"] = latest_version
            cache["last_check"] = timestamp
            return json.loads(content)[0]['name']
    except Exception as error:
        print(f"Error occurred when get github tag: {error}")
    return '0.0.0'


def get_image(client, model_id, prompt, ref_image, width, height):
    try:
        seed = random.randint(0, 2147483647)
        native_request = {}
        if model_id.startswith("amazon"):
            if ref_image is None:
                native_request = {
                    "taskType": "TEXT_IMAGE",
                    "textToImageParams": {"text": prompt},
                    "imageGenerationConfig": {
                        "numberOfImages": 1,
                        "quality": "standard",
                        "cfgScale": 8.0,
                        "height": height,
                        "width": width,
                        "seed": seed,
                    },
                }
            elif len(ref_image) == 2:
                native_request = get_native_request_with_virtual_try_on(client, prompt, ref_image, width, height)
            else:
                native_request = get_native_request_with_ref_image(client, prompt, ref_image, width, height)
        elif model_id.startswith("stability."):
            native_request = {
                "prompt": prompt,
                "output_format": "jpeg",
                "mode": "text-to-image",
            }
            if ref_image:
                native_request['mode'] = 'image-to-image'
                native_request['image'] = ref_image[0]['source']['bytes']
                native_request['strength'] = 0.5
            else:
                native_request['aspect_ratio'] = "1:1"
        request = json.dumps(native_request)
        response = client.invoke_model(modelId=model_id, body=request)
        model_response = json.loads(response["body"].read())
        base64_image_data = model_response["images"][0]
        return {"image": base64_image_data}
    except Exception as error:
        error_msg = str(error)
        print(f"Error occurred: {error_msg}")
        return {"error": error_msg}


def get_english_prompt(client, prompt):
    global_prompt = f"Translate to English image prompt, output only English translation."
    return get_analyse_result(client, prompt, global_prompt)


def contains_chinese(text):
    pattern = re.compile(r'[\u4e00-\u9fff]')
    match = pattern.search(text)
    return match is not None


# ============================================
# Tools API
# ============================================

class ToolExecuteRequest(BaseModel):
    name: str
    arguments: dict
    config: dict | None = None


@app.post("/api/tool/exec")
async def execute_tool(
    request: ToolExecuteRequest,
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)]
):
    """执行工具"""
    api_key = get_api_key_from_ssm(True)
    if credentials.credentials != api_key:
        raise HTTPException(status_code=401, detail="Invalid API key")
    
    try:
        result = await tool_manager.execute_tool(
            name=request.name,
            arguments=request.arguments,
            config=request.config or {}
        )
        
        return {
            "success": True,
            "result": result
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


@app.get("/api/tools/stats")
async def get_tool_stats(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)]
):
    """获取工具统计"""
    api_key = get_api_key_from_ssm(True)
    if credentials.credentials != api_key:
        raise HTTPException(status_code=401, detail="Invalid API key")
    
    return tool_manager.get_stats()


@app.get("/api/tools/list")
async def list_tools(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)]
):
    """获取工具列表（内置 + MCP）"""
    api_key = get_api_key_from_ssm(True)
    if credentials.credentials != api_key:
        raise HTTPException(status_code=401, detail="Invalid API key")
    
    # 内置工具
    tools = [
        {
            "name": "web_fetch",
            "description": "Fetch and extract content from a web URL. Returns the main text content of the page.",
            "parameters": {
                "url": "string (required) - The URL to fetch content from"
            }
        }
    ]
    
    # MCP 工具
    for server_id, server in mcp_manager.servers.items():
        if server["status"] == "active":
            for tool in server.get("tools", []):
                tools.append({
                    "name": f"mcp:{server_id}:{tool['name']}",
                    "description": f"[{server['config']['name']}] {tool.get('description', '')}",
                    "parameters": tool.get("inputSchema", {})
                })
    
    return {"tools": tools}



# ============================================
# MCP API
# ============================================

class MCPServerConfig(BaseModel):
    name: str
    command: str
    args: List[str] = []
    env: dict = {}
    oauth: dict | None = None
    callback_base_url: str = ""


@app.post("/api/mcp/servers")
async def add_mcp_server(
    request: MCPServerConfig,
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)]
):
    """添加 MCP 服务器"""
    api_key = get_api_key_from_ssm(True)
    if credentials.credentials != api_key:
        raise HTTPException(status_code=401, detail="Invalid API key")
    
    try:
        config = request.model_dump()
        print(f"Adding MCP server: {config}")
        result = await mcp_manager.add_server(config)
        print(f"Result: {result}")
        return result
    except Exception as e:
        print(f"Error adding MCP server: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/mcp/servers")
async def list_mcp_servers(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)]
):
    """列出所有 MCP 服务器"""
    api_key = get_api_key_from_ssm(True)
    if credentials.credentials != api_key:
        raise HTTPException(status_code=401, detail="Invalid API key")
    
    return {"servers": mcp_manager.list_servers()}


@app.delete("/api/mcp/servers/{server_id}")
async def remove_mcp_server(
    server_id: str,
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)]
):
    """删除 MCP 服务器"""
    api_key = get_api_key_from_ssm(True)
    if credentials.credentials != api_key:
        raise HTTPException(status_code=401, detail="Invalid API key")
    
    try:
        await mcp_manager.remove_server(server_id)
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/mcp/servers/{server_id}/tools")
async def get_mcp_server_tools(
    server_id: str,
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)]
):
    """获取服务器的工具列表"""
    api_key = get_api_key_from_ssm(True)
    if credentials.credentials != api_key:
        raise HTTPException(status_code=401, detail="Invalid API key")
    
    try:
        tools = mcp_manager.get_server_tools(server_id)
        return {"tools": tools}
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.get("/api/mcp/servers/{server_id}/status")
async def get_mcp_server_status(
    server_id: str,
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)]
):
    """获取服务器状态"""
    api_key = get_api_key_from_ssm(True)
    if credentials.credentials != api_key:
        raise HTTPException(status_code=401, detail="Invalid API key")
    
    try:
        status = mcp_manager.get_server_status(server_id)
        return status
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.get("/api/mcp/oauth/callback")
async def mcp_oauth_callback(code: str, state: str):
    """OAuth 回调端点 - 支持传统 OAuth 和 MCP OAuth"""
    print(f"=== CALLBACK RECEIVED: code={code[:20]}..., state={state}")
    logger.info(f"=== CALLBACK RECEIVED: code={code[:20]}..., state={state}")
    try:
        # 先尝试 MCP OAuth 流程（检查是否有 pending_auth 的服务器）
        print(f"=== Trying MCP OAuth for state: {state}")
        logger.info(f"Trying MCP OAuth for state: {state}")
        try:
            server_id = await mcp_manager.complete_mcp_oauth(code, state)
            oauth_type = "MCP"
            logger.info(f"MCP OAuth successful for server: {server_id}")
        except ValueError as e:
            if "No pending auth server found" in str(e):
                # 如果没找到 MCP pending_auth 服务器，尝试传统 OAuth
                logger.info(f"No MCP server found, trying traditional OAuth")
                server_id = await mcp_manager.oauth.handle_callback(code, state)
                await mcp_manager.complete_oauth(server_id)
                oauth_type = "traditional"
            else:
                raise
        
        return HTMLResponse(f"""
            <html>
                <head>
                    <title>Authorization Successful</title>
                    <style>
                        body {{
                            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            height: 100vh;
                            margin: 0;
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        }}
                        .container {{
                            background: white;
                            padding: 40px;
                            border-radius: 10px;
                            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                            text-align: center;
                        }}
                        h1 {{ color: #333; margin-bottom: 10px; }}
                        p {{ color: #666; }}
                        .checkmark {{ font-size: 60px; color: #4CAF50; }}
                    </style>
                    <script>
                        setTimeout(() => window.close(), 3000);
                    </script>
                </head>
                <body>
                    <div class="container">
                        <div class="checkmark">✓</div>
                        <h1>Authorization Successful!</h1>
                        <p>MCP server authorized successfully ({oauth_type} OAuth)</p>
                        <p style="font-size: 12px; margin-top: 20px;">This window will close automatically...</p>
                    </div>
                </body>
                </body>
            </html>
        """)
    except Exception as e:
        return HTMLResponse(f"""
            <html>
                <body>
                    <h1>Authorization Failed</h1>
                    <p>Error: {str(e)}</p>
                </body>
            </html>
        """, status_code=400)


if __name__ == "__main__":
    print("Starting webserver...")
    # Initialize auth_token on startup
    try:
        get_api_key_from_ssm(False)
        print(f"✅ API Key initialized")
    except Exception as e:
        print(f"⚠️  Warning: Could not initialize API key: {e}")
    
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", "8080")))
