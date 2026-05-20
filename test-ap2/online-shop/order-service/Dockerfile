# ── Build stage ──────────────────────────────────────────
FROM golang:1.21-alpine AS builder
RUN apk add --no-cache git

WORKDIR /workspace
COPY go.work go.work.sum ./
COPY pb ./pb
COPY order-service ./order-service
COPY api-gateway/go.mod ./api-gateway/
COPY product-service/go.mod ./product-service/
COPY user-service/go.mod ./user-service/

WORKDIR /workspace/order-service
RUN go mod download
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /out/main ./cmd/main.go

# ── Runtime stage ─────────────────────────────────────────
FROM alpine:3.19
RUN apk add --no-cache ca-certificates tzdata
COPY --from=builder /out/main /main
COPY --from=builder /workspace/order-service/migrations /migrations
EXPOSE 50053
ENTRYPOINT ["/main"]
