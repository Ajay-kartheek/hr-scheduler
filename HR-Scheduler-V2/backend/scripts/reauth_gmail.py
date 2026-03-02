"""
Re-authenticate Gmail with expanded scopes (send + readonly + modify).
Run this after updating scopes to get a new token.
"""
import os
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request

SCOPES = [
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.modify",
]

BASE_DIR = os.path.dirname(os.path.dirname(__file__))  # V2 backend root
TOKEN_PATH = os.path.join(BASE_DIR, "..", "..", "backend", "token.json")
CREDS_PATH = os.path.join(BASE_DIR, "..", "..", "backend", "credentials.json")

def main():
    # Delete old token
    if os.path.exists(TOKEN_PATH):
        os.remove(TOKEN_PATH)
        print(f"Deleted old token: {TOKEN_PATH}")

    if not os.path.exists(CREDS_PATH):
        print(f"ERROR: credentials.json not found at {CREDS_PATH}")
        return

    flow = InstalledAppFlow.from_client_secrets_file(CREDS_PATH, SCOPES)
    creds = flow.run_local_server(port=0)

    with open(TOKEN_PATH, "w") as f:
        f.write(creds.to_json())

    print(f"New token saved to {TOKEN_PATH}")
    print(f"Scopes: {creds.scopes}")
    print("Gmail re-auth complete!")

if __name__ == "__main__":
    main()
