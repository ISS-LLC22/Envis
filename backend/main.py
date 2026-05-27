from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from .database import init_db, AsyncSessionLocal
from .services.nws_ingest import ingest_alerts
from .config import settings
from .routers import alerts, islog, wizard, stakeholders, verification

scheduler = AsyncIOScheduler()


async def _scheduled_ingest():
    async with AsyncSessionLocal() as db:
        try:
            result = await ingest_alerts(db)
            print(f"[NWS Ingest] {result}")
        except Exception as e:
            print(f"[NWS Ingest Error] {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    scheduler.add_job(
        _scheduled_ingest,
        "interval",
        seconds=settings.ALERT_POLL_INTERVAL_SECONDS,
        id="nws_ingest",
        replace_existing=True,
    )
    scheduler.start()
    yield
    scheduler.shutdown()


app = FastAPI(
    title="ENVIS API",
    description="Environmental Intelligence Platform",
    version="1.0.0",
    lifespan=lifespan,
)

origins = [o.strip() for o in settings.CORS_ORIGINS.split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(alerts.router)
app.include_router(islog.router)
app.include_router(wizard.router)
app.include_router(stakeholders.router)
app.include_router(verification.router)


@app.get("/")
async def root():
    return {
        "name": "ENVIS API",
        "version": "1.0.0",
        "endpoints": ["/alerts", "/islog", "/wizard", "/stakeholders", "/verification"],
        "docs": "/docs",
    }


@app.get("/health")
async def health():
    return {"status": "ok"}
