# ── Build stage ──────────────────────────────────────────
FROM golang:1.21-alpine AS builder
RUN apk add --no-cache git

WORKDIR /workspace
COPY go.work go.work.sum ./
COPY pb ./pb
COPY api-gateway ./api-gateway
COPY order-service ./order-service
COPY product-service ./product-service
COPY user-service ./user-service

WORKDIR /workspace/product-service
RUN go mod download
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /out/main ./cmd/main.go

# ── Runtime stage ─────────────────────────────────────────
FROM alpine:3.19
RUN apk add --no-cache ca-certificates tzdata
COPY --from=builder /out/main /main
EXPOSE 50052
ENTRYPOINT ["/main"]
