import asyncio
import httpx

async def main():
    print("Testing /api/game/generate endpoint...")
    async with httpx.AsyncClient(timeout=10) as client:
        payload = {
            "concept": "addition to 10",
            "year_level": "Year 2",
            "subject": "Mathematics",
            "game_type": "drag_and_drop"
        }
        response = await client.post("http://localhost:8000/api/game/generate", json=payload)
        
        print(f"Status Code: {response.status_code}")
        try:
            print(f"Response: {response.json()}")
        except Exception:
            print(f"Response (text): {response.text}")

        if response.status_code == 200:
            print("E2E Test Passed Successfully!")
        else:
            print("E2E Test Failed.")
            exit(1)

if __name__ == "__main__":
    asyncio.run(main())
