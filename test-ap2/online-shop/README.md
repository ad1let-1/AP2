# Online Shop Microservices

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
