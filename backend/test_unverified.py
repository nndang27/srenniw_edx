from jose import jwt
import json
token = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.invalid_sig"
try:
    print(jwt.decode(token, "", options={"verify_signature": False, "verify_aud": False}))
except Exception as e:
    import traceback
    traceback.print_exc()

print("CLAIMS:", jwt.get_unverified_claims(token))
