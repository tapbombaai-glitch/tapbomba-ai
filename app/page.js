

# ============================================
# BOMBA AI - FastAPI Backend
# "Describe it. BOMBA builds it."
# ============================================

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from enum import Enum
from typing import Optional, Dict, Any, List
from dataclasses import dataclass, field
from datetime import datetime
import uuid

app = FastAPI(
    title="BOMBA AI",
    description="Describe it. BOMBA builds it.",
    version="1.0.0"
)

# Allow your frontend to talk to the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Later we will restrict this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------------------------------------
# Request Models
# --------------------------------------------
class GenerateRequest(BaseModel):
    user_id: str
    text: str


# --------------------------------------------
# BOMBA Brain + Modules (same structure)
# --------------------------------------------
class Intent(Enum):
    FLYER = "flyer"
    IMAGE = "image"
    CONTENT = "content"
    LOGO = "logo"
    CODE = "code"
    APP = "app"
    WEBSITE = "website"
    BUSINESS_TOOL = "business_tool"
    SPECIALIST = "specialist"
    UNKNOWN = "unknown"


@dataclass
class UserRequest:
    raw_text: str
    user_id: str
    intent: Intent = Intent.UNKNOWN


class BombaBrain:
    def understand(self, request: UserRequest) -> UserRequest:
        text = request.raw_text.lower()

        if any(w in text for w in ["flyer", "poster", "banner"]):
            request.intent = Intent.FLYER
        elif any(w in text for w in ["image", "picture", "photo"]):
            request.intent = Intent.IMAGE
        elif any(w in text for w in ["content", "caption", "post", "write"]):
            request.intent = Intent.CONTENT
        elif any(w in text for w in ["logo", "brand"]):
            request.intent = Intent.LOGO
        elif any(w in text for w in ["code", "fix", "debug", "ai doctor"]):
            request.intent = Intent.CODE
        elif any(w in text for w in ["app", "application"]):
            request.intent = Intent.APP
        elif any(w in text for w in ["website", "web", "landing"]):
            request.intent = Intent.WEBSITE
        elif any(w in text for w in ["dashboard", "business", "analytics"]):
            request.intent = Intent.BUSINESS_TOOL
        elif any(w in text for w in ["plant", "farm", "horticulture", "garden"]):
            request.intent = Intent.SPECIALIST
        else:
            request.intent = Intent.UNKNOWN
        return request

    def route(self, request: UserRequest) -> str:
        return {
            Intent.FLYER: "FlyerModule",
            Intent.IMAGE: "ImageModule",
            Intent.CONTENT: "ContentModule",
            Intent.LOGO: "LogoModule",
            Intent.CODE: "CodeModule",
            Intent.APP: "AppBuilderModule",
            Intent.WEBSITE: "WebsiteModule",
            Intent.BUSINESS_TOOL: "BusinessToolsModule",
            Intent.SPECIALIST: "SpecialistModule",
        }.get(request.intent, "Fallback")


class BaseModule:
    def create(self, request: UserRequest) -> Dict[str, Any]:
        raise NotImplementedError


class FlyerModule(BaseModule):
    def create(self, request: UserRequest):
        return {
            "type": "flyer",
            "status": "success",
            "message": f"Flyer created for: {request.raw_text}",
            "preview_url": f"/preview/flyer/{uuid.uuid4()}"
        }


class ImageModule(BaseModule):
    def create(self, request: UserRequest):
        return {
            "type": "image",
            "status": "success",
            "message": f"Image generated",
            "image_url": f"/images/{uuid.uuid4()}.png"
        }


class ContentModule(BaseModule):
    def create(self, request: UserRequest):
        return {
            "type": "content",
            "status": "success",
            "content": f"Generated content based on: {request.raw_text}"
        }


class LogoModule(BaseModule):
    def create(self, request: UserRequest):
        return {
            "type": "logo",
            "status": "success",
            "logo_url": f"/logos/{uuid.uuid4()}.png"
        }


class CodeModule(BaseModule):
    def create(self, request: UserRequest):
        return {
            "type": "code",
            "status": "success",
            "code": f"# Code for: {request.raw_text}",
            "explanation": "AI Doctor ready"
        }


class AppBuilderModule(BaseModule):
    def create(self, request: UserRequest):
        return {
            "type": "app",
            "status": "success",
            "app_id": str(uuid.uuid4())
        }


class WebsiteModule(BaseModule):
    def create(self, request: UserRequest):
        return {
            "type": "website",
            "status": "success",
            "site_url": f"https://bomba.ai/sites/{uuid.uuid4()}"
        }


class BusinessToolsModule(BaseModule):
    def create(self, request: UserRequest):
        return {
            "type": "business_tool",
            "status": "success",
            "dashboard_url": f"/dashboard/{uuid.uuid4()}"
        }


class SpecialistModule(BaseModule):
    def create(self, request: UserRequest):
        return {
            "type": "specialist",
            "domain": "horticulture",
            "advice": f"Advice for: {request.raw_text}"
        }


# --------------------------------------------
# Credits & Projects (simple memory version)
# --------------------------------------------
class CreditSystem:
    def __init__(self):
        self.accounts = {}

    def deduct(self, user_id: str, amount: int = 1) -> bool:
        if user_id not in self.accounts:
            self.accounts[user_id] = 100
        if self.accounts[user_id] >= amount:
            self.accounts[user_id] -= amount
            return True
        return False

    def get_credits(self, user_id: str) -> int:
        return self.accounts.get(user_id, 100)


credits = CreditSystem()
brain = BombaBrain()

modules = {
    "FlyerModule": FlyerModule(),
    "ImageModule": ImageModule(),
    "ContentModule": ContentModule(),
    "LogoModule": LogoModule(),
    "CodeModule": CodeModule(),
    "AppBuilderModule": AppBuilderModule(),
    "WebsiteModule": WebsiteModule(),
    "BusinessToolsModule": BusinessToolsModule(),
    "SpecialistModule": SpecialistModule(),
}


# --------------------------------------------
# API Routes
# --------------------------------------------
@app.get("/")
def home():
    return {
        "message": "BOMBA AI is running",
        "tagline": "Describe it. BOMBA builds it."
    }


@app.post("/generate")
def generate(data: GenerateRequest):
    # Check credits
    if not credits.deduct(data.user_id):
        raise HTTPException(status_code=402, detail="Not enough credits")

    # Process with BOMBA Brain
    request = UserRequest(raw_text=data.text, user_id=data.user_id)
    request = brain.understand(request)
    module_name = brain.route(request)

    module = modules.get(module_name)
    if not module:
        raise HTTPException(status_code=400, detail="I didn't understand your request")

    result = module.create(request)
    result["remaining_credits"] = credits.get_credits(data.user_id)
    result["project_id"] = str(uuid.uuid4())

    return result


@app.get("/credits/{user_id}")
def get_credits(user_id: str):
    return {"user_id": user_id, "credits": credits.get_credits(user_id)}