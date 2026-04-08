import requests
r = requests.options("http://localhost:8000/api/parent/chat-rooms", headers={"Origin": "http://localhost:3000", "Access-Control-Request-Method": "GET"})
print(r.headers)
