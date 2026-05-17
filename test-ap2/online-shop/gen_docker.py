import os

base_dir = r"c:\Final-AP2\online-shop"

files = {
    "user-service/Dockerfile": """FROM golang:1.21-alpine
WORKDIR /app
COPY pb /pb
COPY user-service /app
RUN go mod download
RUN go build -o main ./cmd/main.go
CMD ["./main"]
""",
    "product-service/Dockerfile": """FROM golang:1.21-alpine
WORKDIR /app
COPY pb /pb
COPY product-service /app
RUN go mod download
RUN go build -o main ./cmd/main.go
CMD ["./main"]
""",
    "order-service/Dockerfile": """FROM golang:1.21-alpine
WORKDIR /app
COPY pb /pb
COPY order-service /app
RUN go mod download
RUN go build -o main ./cmd/main.go
CMD ["./main"]
""",
    "api-gateway/Dockerfile": """FROM golang:1.21-alpine
WORKDIR /app
COPY pb /pb
COPY api-gateway /app
RUN go mod download
RUN go build -o main ./cmd/main.go
CMD ["./main"]
""",
    "docker-compose.yml": """version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  nats:
    image: nats:latest
    ports:
      - "4222:4222"
      - "8222:8222"

  user-service:
    build: 
      context: .
      dockerfile: user-service/Dockerfile
    environment:
      - DATABASE_URL=postgres://postgres:bekarys7@postgres:5432/postgres?sslmode=disable
      - NATS_URL=nats://nats:4222
    ports:
      - "50051:50051"
    depends_on:
      - postgres
      - nats

  product-service:
    build: 
      context: .
      dockerfile: product-service/Dockerfile
    environment:
      - DATABASE_URL=postgres://postgres:bekarys7@postgres:5432/postgres?sslmode=disable
      - REDIS_ADDR=redis:6379
      - NATS_URL=nats://nats:4222
    ports:
      - "50052:50052"
    depends_on:
      - postgres
      - redis
      - nats

  order-service:
    build: 
      context: .
      dockerfile: order-service/Dockerfile
    environment:
      - DATABASE_URL=postgres://postgres:bekarys7@postgres:5432/postgres?sslmode=disable
      - NATS_URL=nats://nats:4222
    ports:
      - "50053:50053"
    depends_on:
      - postgres
      - nats

  api-gateway:
    build:
      context: .
      dockerfile: api-gateway/Dockerfile
    environment:
      - USER_SERVICE_URL=user-service:50051
      - PRODUCT_SERVICE_URL=product-service:50052
      - ORDER_SERVICE_URL=order-service:50053
    ports:
      - "8080:8080"
    depends_on:
      - user-service
      - product-service
      - order-service

volumes:
  pgdata:
""",
    "README.md": """# Online Shop Microservices

This is a production-ready microservices-based Online Shop system using Go, gRPC, NATS, PostgreSQL, Redis, and an API Gateway with Gin.

## Architecture

- **User Service**: Authentication (JWT), User management.
- **Product Service**: Product CRUD, Categories, Redis caching.
- **Order Service**: Orders, Payments, Discounts.
- **API Gateway**: REST gateway forwarding to gRPC services.
- **NATS**: Event-driven communication.

## Prerequisites

- Docker and docker-compose
- Go 1.21+ (if running locally)
- protoc (if recompiling protobufs)

## Getting Started

1. **Compile Protobufs (Optional if already compiled)**
If you want to compile the proto files, use:
```sh
docker run --rm -v ${PWD}:/defs namely/protoc-all -d pb -l go -o pb/gen
```
*(Or use your preferred protoc compiler)*

2. **Run the system using Docker Compose**
From the root directory:
```sh
docker-compose up --build
```

This will spin up:
- PostgreSQL (5432)
- Redis (6379)
- NATS (4222)
- User Service (50051)
- Product Service (50052)
- Order Service (50053)
- API Gateway (8080)

## API Examples (via Gateway)

**Register User:**
```sh
curl -X POST http://localhost:8080/api/users/register -d '{"email":"test@example.com", "password":"password", "name":"Test"}'
```

**Login User:**
```sh
curl -X POST http://localhost:8080/api/users/login -d '{"email":"test@example.com", "password":"password"}'
```

**Get Products:**
```sh
curl http://localhost:8080/api/products
```
"""
}

for path, content in files.items():
    full_path = os.path.join(base_dir, path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, "w", encoding="utf-8") as f:
        f.write(content)
print("Docker and Configs Generated")
