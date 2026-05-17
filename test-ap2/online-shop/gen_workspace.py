import os

base_dir = r"c:\Final-AP2\online-shop"

pb_go_mod = """module online-shop/pb

go 1.21

require (
	google.golang.org/grpc v1.60.1
	google.golang.org/protobuf v1.32.0
)
"""

go_work = """go 1.21

use (
	./api-gateway
	./order-service
	./pb
	./product-service
	./user-service
)
"""

with open(os.path.join(base_dir, "pb", "go.mod"), "w") as f:
    f.write(pb_go_mod)

with open(os.path.join(base_dir, "go.work"), "w") as f:
    f.write(go_work)

print("Workspace configured")
