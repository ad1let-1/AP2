import os

services = ['api-gateway', 'order-service', 'product-service', 'user-service']

for service in services:
    dockerfile_path = f'{service}/Dockerfile'
    content = f"""FROM golang:1.21-alpine
WORKDIR /workspace
COPY go.work go.work.sum ./
COPY pb ./pb
COPY api-gateway ./api-gateway
COPY order-service ./order-service
COPY product-service ./product-service
COPY user-service ./user-service
WORKDIR /workspace/{service}
RUN go mod download
RUN go build -o main ./cmd/main.go
CMD ["./main"]
"""
    with open(dockerfile_path, 'w') as f:
        f.write(content)
