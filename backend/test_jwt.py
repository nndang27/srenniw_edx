from jose import jwt
try:
    jwt.decode("eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6InRlc3QifQ.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.invalid", "", algorithms=["RS256"], options={"verify_aud": False})
except Exception as e:
    import traceback
    traceback.print_exc()
