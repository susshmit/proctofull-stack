import urllib.request
import json

URL = "http://localhost:5000/api"

def req(url, data=None, headers=None):
    if headers is None: headers = {}
    if data: headers["Content-Type"] = "application/json"
    req_obj = urllib.request.Request(
        url,
        data=json.dumps(data).encode("utf-8") if data else None,
        headers=headers,
        method="POST" if data else "GET"
    )
    try:
        with urllib.request.urlopen(req_obj) as f:
            return f.status, f.read().decode("utf-8")
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8")

# Login
status, body_str = req(f"{URL}/auth/login", {
    "email": "testabc123xyz@example.com",
    "password": "password123"
})
body = json.loads(body_str)
token = body.get("access_token")

# Get demo exam
status2, body2_str = req(
    f"{URL}/exams/demo-exam-12345",
    headers={"Authorization": f"Bearer {token}"}
)
print("GET EXAM STATUS:", status2)
print("GET EXAM BODY:", body2_str)
