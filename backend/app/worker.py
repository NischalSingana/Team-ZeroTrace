import asyncio
import json
import logging
from datetime import datetime, timezone
import uuid

from aiokafka import AIOKafkaConsumer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.config import settings
from app.database import AsyncSessionLocal
from app.models import Event, Source
from app.services.parser_engine import parse_log

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("kafka_worker")

async def process_message(msg_value: dict, db: AsyncSession):
    # Expected format: {"source_id": "src_001", "raw_log": "<134>..."}
    source_id = msg_value.get("source_id")
    raw_log = msg_value.get("raw_log")
    
    if not source_id or not raw_log:
        logger.warning("Invalid message format, missing source_id or raw_log")
        return
        
    # Find source
    result = await db.execute(select(Source).where(Source.id == source_id))
    source = result.scalar_one_or_none()
    
    if not source:
        logger.warning(f"Source not found: {source_id}")
        return
        
    # Parse log
    parsed = parse_log(raw_log, source.format)
    
    # Simple mapping (in reality, would use Parser's field_mappings)
    event_id = f"evt_{uuid.uuid4().hex[:8]}"
    ts = datetime.now(timezone.utc)
    
    # Store event
    event = Event(
        id=event_id,
        timestamp=ts,
        source_id=source.id,
        source_name=source.name,
        source_type=source.type,
        severity=parsed.fields.get("severity", "info"),
        category=parsed.fields.get("category", "audit"),
        action=parsed.fields.get("action", "UNKNOWN"),
        outcome=parsed.fields.get("outcome", "unknown"),
        actor={"ip": parsed.fields.get("src", None)},
        target={"ip": parsed.fields.get("dst", None)},
        raw_format=parsed.format_detected,
        raw_preview=raw_log[:200],
        parser_confidence=parsed.confidence,
    )
    db.add(event)
    await db.commit()
    logger.info(f"Processed event {event_id} from source {source_id}")

async def consume():
    logger.info(f"Starting Kafka consumer on {settings.KAFKA_BOOTSTRAP_SERVERS}")
    consumer = AIOKafkaConsumer(
        "ulpf_ingest",
        bootstrap_servers=settings.KAFKA_BOOTSTRAP_SERVERS,
        group_id="ulpf_worker_group",
        value_deserializer=lambda m: json.loads(m.decode('utf-8')),
        auto_offset_reset="earliest"
    )
    
    # Attempt to start the consumer with retries
    for _ in range(5):
        try:
            await consumer.start()
            logger.info("Successfully connected to Kafka")
            break
        except Exception as e:
            logger.error(f"Failed to connect to Kafka: {e}")
            await asyncio.sleep(5)
    else:
        logger.error("Could not start Kafka consumer after retries")
        return

    try:
        async for msg in consumer:
            async with AsyncSessionLocal() as session:
                try:
                    await process_message(msg.value, session)
                except Exception as e:
                    logger.error(f"Error processing message: {e}")
    finally:
        await consumer.stop()

if __name__ == "__main__":
    asyncio.run(consume())
