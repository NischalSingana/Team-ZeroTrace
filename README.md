# ULPF — Universal Log Pre-processing Framework

> **SIH Problem Statement:** SIH26156 — Universal Log Pre-processing Framework  
> An AI-assisted, vendor-agnostic log preprocessing platform for enterprise security operations.

---

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────────┐
│  Next.js    │────▶│  FastAPI    │────▶│  PostgreSQL     │
│  Frontend   │     │  Backend    │     │  (Metadata)     │
└─────────────┘     └──────┬──────┘     └─────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  OpenRouter  │  │  OpenSearch  │  │    Kafka     │
│  (AI/LLM)    │  │  (Search)    │  │  (Streaming) │
└──────────────┘  └──────────────┘  └──────────────┘
```

---

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Git

### 1. Clone & Configure
```bash
git clone <repo-url>
cd ulpf
cp .env.example .env
# Edit .env and add your OPENROUTER_API_KEY (optional)
```

### 2. Launch
```bash
docker-compose up --build
```

### 3. Access
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs

### 4. Seed Demo Data
Click **"Seed Demo Data"** on the Demo Console page, or:
```bash
curl -X POST http://localhost:8000/api/demo/seed
```

---

## Tech Stack

| Layer        | Technology                          |
|-------------|-------------------------------------|
| Frontend    | Next.js 16, React 19, Tailwind CSS  |
| Backend     | FastAPI, SQLAlchemy, Pydantic       |
| Database    | PostgreSQL 16                       |
| Search      | OpenSearch 2.15                     |
| Streaming   | Apache Kafka + Zookeeper            |
| Cache       | Redis 7                             |
| Object Store| MinIO                               |
| AI/LLM      | OpenRouter API (Nemotron-3-Ultra-550B) |
| Deployment  | Docker, Docker Compose, Nginx       |

---

## Supported Log Formats

- ✅ Syslog (RFC 3164, RFC 5424)
- ✅ JSON / JSON Lines
- ✅ CEF (Common Event Format)
- ✅ LEEF (Log Event Extended Format)
- ✅ CSV
- ✅ XML
- ✅ Key-Value / Custom
- ✅ Plain Text

---

## AI-Assisted Onboarding

1. Paste an unknown log into **AI Copilot**
2. AI analyzes semantics and suggests field mappings
3. Review, approve, or reject each suggestion
4. Click **Generate Parser** to create a deterministic parser
5. Parser is registered and ready for production use

> AI is **optional** — the core pipeline works fully offline with deterministic parsers.

---

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/health` | Health check |
| `GET /api/events` | List events |
| `POST /api/events/search` | Search & filter events |
| `GET /api/sources` | List sources |
| `GET /api/parsers` | List parsers |
| `GET /api/pipeline/metrics` | Pipeline metrics |
| `GET /api/health/system` | System health |
| `POST /api/ai/analyze` | AI log analysis |
| `POST /api/ai/generate-parser` | Generate parser from mappings |
| `POST /api/demo/seed` | Seed demo data |

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection | `postgresql+asyncpg://ulpf:ulpf@postgres:5432/ulpf` |
| `OPENROUTER_API_KEY` | OpenRouter API key | *(empty)* |
| `OPENROUTER_MODEL` | LLM model | `nvidia/nemotron-3-ultra-550b-a55b:free` |
| `AI_ENABLED` | Enable AI features | `true` |
| `KAFKA_BOOTSTRAP_SERVERS` | Kafka brokers | `kafka:29092` |
| `REDIS_URL` | Redis connection | `redis://redis:6379/0` |
| `DEMO_MODE` | Enable demo features | `true` |

---

## Development

### Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend
```bash
cd my-app
npm install
npm run dev
```

### Tests
```bash
cd backend
pytest tests/
```

---

## Air-Gapped Deployment

The core ULPF pipeline works without internet access:
- Disable `AI_ENABLED=false` in `.env`
- AI features gracefully fall back to deterministic field mapping
- Parsing, normalization, and data storage processes continue to function without interruption.


---

## License

MIT
