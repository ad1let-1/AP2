import requests
import json
import time

API_BASE = "http://localhost:8080/api"

def seed():
    # 1. Register and Login
    vendor = {"email": "vendor@nexgen.com", "password": "password123", "name": "Global Vendor"}
    requests.post(f"{API_BASE}/users/register", json=vendor)
    login_res = requests.post(f"{API_BASE}/users/login", json={"email": vendor["email"], "password": vendor["password"]})
    token = login_res.json().get("access_token")
    
    if not token:
        print("Failed to get token!")
        return

    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

    # 2. Create actual Categories and get UUIDs
    print("Creating categories...")
    cat_names = ["Tech", "Wear", "Home"]
    cat_map = {}
    for name in cat_names:
        res = requests.post(f"{API_BASE}/products/categories", json={"name": name}, headers=headers)
        if res.ok:
            cat_data = res.json()
            cat_map[name.lower()] = cat_data["category"]["id"]
            print(f"Category '{name}' created with ID: {cat_map[name.lower()]}")
        else:
            print(f"Error creating category {name}: {res.text}")

    # 3. Products using real Category UUIDs
    products = [
        {"name": "iPhone 15 Pro", "description": "Titanium design, A17 Pro chip.", "price": 999.0, "stock": 50, "category_id": cat_map.get("tech")},
        {"name": "MacBook Air M3", "description": "Supercharged by M3, strikingly thin.", "price": 1299.0, "stock": 30, "category_id": cat_map.get("tech")},
        {"name": "Sony WH-1000XM5", "description": "Industry leading noise canceling.", "price": 349.0, "stock": 100, "category_id": cat_map.get("tech")},
        {"name": "Premium Hoodie", "description": "100% Organic Cotton, Oversized fit.", "price": 89.0, "stock": 200, "category_id": cat_map.get("wear")},
        {"name": "Mechanical Keyboard", "description": "RGB Backlit, Brown Switches.", "price": 120.0, "stock": 45, "category_id": cat_map.get("tech")},
        {"name": "Minimalist Desk Lamp", "description": "Adjustable brightness and temp.", "price": 45.0, "stock": 80, "category_id": cat_map.get("home")},
        {"name": "Coffee Maker Elite", "description": "Brew the perfect espresso.", "price": 299.0, "stock": 15, "category_id": cat_map.get("home")},
        {"name": "Gaming Chair X", "description": "Ergonomic design for long sessions.", "price": 250.0, "stock": 25, "category_id": cat_map.get("tech")}
    ]

    print("Seeding products...")
    for p in products:
        if not p["category_id"]: continue
        res = requests.post(f"{API_BASE}/products", json=p, headers=headers)
        if res.ok:
            print(f"Created: {p['name']}")
        else:
            print(f"Error creating {p['name']}: {res.text}")

if __name__ == "__main__":
    seed()
