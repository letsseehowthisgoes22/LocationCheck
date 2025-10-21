from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime
from typing import Optional
import uuid

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

locations_db = {}

class LocationData(BaseModel):
    latitude: float
    longitude: float
    accuracy: float
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    city: Optional[str] = None
    region: Optional[str] = None
    country: Optional[str] = None

class LocationResponse(BaseModel):
    id: str
    latitude: float
    longitude: float
    accuracy: float
    ip_address: Optional[str]
    user_agent: Optional[str]
    city: Optional[str]
    region: Optional[str]
    country: Optional[str]
    timestamp: str

@app.get("/healthz")
async def healthz():
    return {"status": "ok"}

@app.post("/api/location", response_model=LocationResponse)
async def save_location(location: LocationData):
    location_id = str(uuid.uuid4())
    timestamp = datetime.utcnow().isoformat()
    
    location_record = {
        "id": location_id,
        "latitude": location.latitude,
        "longitude": location.longitude,
        "accuracy": location.accuracy,
        "ip_address": location.ip_address,
        "user_agent": location.user_agent,
        "city": location.city,
        "region": location.region,
        "country": location.country,
        "timestamp": timestamp
    }
    
    locations_db[location_id] = location_record
    
    return location_record

@app.get("/api/locations")
async def get_all_locations():
    return {
        "locations": list(locations_db.values()),
        "count": len(locations_db)
    }

@app.get("/api/location/{location_id}", response_model=LocationResponse)
async def get_location(location_id: str):
    if location_id not in locations_db:
        raise HTTPException(status_code=404, detail="Location not found")
    return locations_db[location_id]

@app.delete("/api/locations")
async def clear_locations():
    locations_db.clear()
    return {"message": "All locations cleared"}
