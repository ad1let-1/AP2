import os

files = {
    'user-service/cmd/main.go': ('user-service/internal/delivery/grpc', 'grpc.NewUserHandler'),
    'order-service/cmd/main.go': ('order-service/internal/delivery/grpc', 'grpc.NewOrderHandler'),
    'product-service/cmd/main.go': ('product-service/internal/delivery/grpc', 'grpc.NewProductHandler')
}

for filepath, (import_path, usage) in files.items():
    with open(filepath, 'r') as f:
        content = f.read()
    content = content.replace(f'"{import_path}"', f'deliveryGrpc "{import_path}"')
    content = content.replace(usage, usage.replace('grpc.', 'deliveryGrpc.'))
    with open(filepath, 'w') as f:
        f.write(content)
