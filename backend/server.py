from fastapi import FastAPI, APIRouter, HTTPException, Query
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

STATUSES = {"captured", "under_attack", "lost", "unclaimed"}
DIFFICULTIES = {"Low", "Medium", "High", "Extreme", "Eradication", "Unknown"}


def now_iso():
    return datetime.now(timezone.utc).isoformat()


class ProductionEntry(BaseModel):
    item: str
    rate: float  # items per minute


class SectorIn(BaseModel):
    sector_id: int
    name: str
    preset: Optional[str] = None
    numbered: bool = False
    status: str = "unclaimed"
    difficulty: str = "Unknown"
    power: float = 0
    wave: int = 0
    win_wave: int = 0
    output: float = 0
    production: List[ProductionEntry] = []
    production_text: str = ""
    resources: List[str] = []
    items: Dict[str, float] = {}
    storage_capacity: int = 0
    core_type: Optional[str] = None
    order: int = 9999


class Sector(SectorIn):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    planet: str = "serpulo"
    updated_at: str = Field(default_factory=now_iso)
    created_at: str = Field(default_factory=now_iso)


class ImportPayload(BaseModel):
    planet: str
    sectors: List[SectorIn]
    replace: bool = True


class SectorUpdate(BaseModel):
    name: Optional[str] = None
    status: Optional[str] = None
    difficulty: Optional[str] = None
    power: Optional[float] = None
    wave: Optional[int] = None
    output: Optional[float] = None
    production_text: Optional[str] = None


@api_router.get("/")
async def root():
    return {"message": "Serpulo Command API"}


@api_router.get("/sectors", response_model=List[Sector])
async def list_sectors(planet: Optional[str] = Query(None)):
    q = {"planet": planet} if planet else {}
    docs = await db.sectors.find(q, {"_id": 0}).to_list(5000)
    return docs


@api_router.get("/planets")
async def list_planets():
    planets = await db.sectors.distinct("planet")
    return {"planets": planets}


@api_router.post("/sectors/import")
async def import_sectors(payload: ImportPayload):
    planet = payload.planet.lower().strip()
    if not planet:
        raise HTTPException(400, "planet required")
    ts = now_iso()
    ids = []
    created = 0
    updated = 0
    for s in payload.sectors:
        data = s.model_dump()
        if data["status"] not in STATUSES:
            data["status"] = "unclaimed"
        if data["difficulty"] not in DIFFICULTIES:
            data["difficulty"] = "Unknown"
        ids.append(s.sector_id)
        existing = await db.sectors.find_one({"planet": planet, "sector_id": s.sector_id}, {"_id": 0})
        if existing:
            data["updated_at"] = ts
            await db.sectors.update_one({"planet": planet, "sector_id": s.sector_id}, {"$set": data})
            updated += 1
        else:
            doc = Sector(**data, planet=planet, updated_at=ts, created_at=ts).model_dump()
            await db.sectors.insert_one(doc)
            created += 1
    removed = 0
    if payload.replace:
        res = await db.sectors.delete_many({"planet": planet, "sector_id": {"$nin": ids}})
        removed = res.deleted_count
    return {"planet": planet, "created": created, "updated": updated, "removed": removed, "total": len(ids)}


@api_router.put("/sectors/{sid}", response_model=Sector)
async def update_sector(sid: str, upd: SectorUpdate):
    data = {k: v for k, v in upd.model_dump().items() if v is not None}
    if "status" in data and data["status"] not in STATUSES:
        raise HTTPException(400, "invalid status")
    if "difficulty" in data and data["difficulty"] not in DIFFICULTIES:
        raise HTTPException(400, "invalid difficulty")
    data["updated_at"] = now_iso()
    res = await db.sectors.update_one({"id": sid}, {"$set": data})
    if res.matched_count == 0:
        raise HTTPException(404, "sector not found")
    doc = await db.sectors.find_one({"id": sid}, {"_id": 0})
    return doc


@api_router.delete("/sectors/{sid}")
async def delete_sector(sid: str):
    res = await db.sectors.delete_one({"id": sid})
    if res.deleted_count == 0:
        raise HTTPException(404, "sector not found")
    return {"deleted": True}


@api_router.delete("/sectors")
async def clear_sectors(planet: Optional[str] = Query(None)):
    q = {"planet": planet} if planet else {}
    res = await db.sectors.delete_many(q)
    return {"deleted": res.deleted_count}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
