#!/usr/bin/env python3
"""
Generate the Apple Sign In client_secret JWT.

Apple requires Supabase (or any backend that wants to verify Sign in
with Apple identity tokens) to authenticate itself via a JWT signed
by your downloaded .p8 key. The JWT is valid for at most 6 months —
set a calendar reminder to regenerate it.

Usage:

    python3 scripts/generateAppleClientSecret.py \\
        --team-id 8M8FD3KA57 \\
        --client-id com.daanvos.namenest \\
        --key-id YOUR_KEY_ID \\
        --p8 ~/Downloads/AuthKey_YOUR_KEY_ID.p8

Where:
  --team-id    Your Apple Developer Team ID (10 chars, shown top-right
               of the Apple Developer Portal). For Babinom: 8M8FD3KA57.
  --client-id  The App ID bundle identifier for native iOS sign in,
               OR the Services ID for web sign in. For Babinom native:
               com.daanvos.namenest.
  --key-id     The 10-character Key ID shown next to your downloaded
               key in Apple Developer Portal → Keys.
  --p8         Path to the AuthKey_<KEY_ID>.p8 file you downloaded
               from Apple Developer Portal.

Optional:
  --days       Validity in days. Default 180 (6 months, Apple's max).

Output:
  Prints the JWT to stdout. Copy this into Supabase Studio:
    Authentication → Sign In / Providers → Apple → Secret Key (for OAuth)

Dependencies:
    pip install --break-system-packages pyjwt[crypto]
"""

from __future__ import annotations

import argparse
import sys
import time
from pathlib import Path

try:
    import jwt  # pyjwt
except ImportError:
    print(
        "ERROR: pyjwt[crypto] not installed.\n"
        "Install with:  pip install --break-system-packages 'pyjwt[crypto]'",
        file=sys.stderr,
    )
    sys.exit(1)


def build_client_secret(
    team_id: str,
    client_id: str,
    key_id: str,
    private_key_pem: str,
    valid_days: int,
) -> str:
    """Sign the standardised Apple client_secret JWT."""
    now = int(time.time())
    payload = {
        # Issuer: your Apple Team ID
        "iss": team_id,
        # Issued at: now
        "iat": now,
        # Expires: now + N days (Apple caps at 6 months = 180 days)
        "exp": now + (60 * 60 * 24 * valid_days),
        # Audience: always Apple's identity endpoint
        "aud": "https://appleid.apple.com",
        # Subject: the App ID or Services ID this secret authenticates
        "sub": client_id,
    }
    # The 'kid' header field tells Apple which of your registered keys
    # signed this JWT — Apple uses it to pick the right public half
    # from your developer account when verifying.
    headers = {"kid": key_id, "alg": "ES256"}
    token = jwt.encode(payload, private_key_pem, algorithm="ES256", headers=headers)
    # pyjwt sometimes returns bytes on older versions
    if isinstance(token, bytes):
        token = token.decode("utf-8")
    return token


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Generate the Apple Sign In client_secret JWT for Supabase.",
    )
    parser.add_argument("--team-id", required=True, help="Apple Team ID (10 chars)")
    parser.add_argument("--client-id", required=True, help="App ID or Services ID")
    parser.add_argument("--key-id", required=True, help="10-char Key ID from Apple")
    parser.add_argument("--p8", required=True, help="Path to the AuthKey_xxx.p8 file")
    parser.add_argument("--days", type=int, default=180, help="Validity in days (max 180)")
    args = parser.parse_args()

    if args.days > 180:
        print("WARNING: Apple's max client_secret validity is 180 days. Clamping.", file=sys.stderr)
        args.days = 180

    p8_path = Path(args.p8).expanduser()
    if not p8_path.exists():
        print(f"ERROR: .p8 file not found at {p8_path}", file=sys.stderr)
        return 1

    private_key_pem = p8_path.read_text(encoding="utf-8")
    if "BEGIN PRIVATE KEY" not in private_key_pem:
        print(
            "ERROR: file does not look like a PEM-encoded Apple .p8 key.\n"
            "Expected first line to contain '-----BEGIN PRIVATE KEY-----'.",
            file=sys.stderr,
        )
        return 1

    token = build_client_secret(
        team_id=args.team_id,
        client_id=args.client_id,
        key_id=args.key_id,
        private_key_pem=private_key_pem,
        valid_days=args.days,
    )

    print(token)
    print(
        f"\n[ok] JWT generated. Valid for {args.days} days.\n"
        f"     Paste into Supabase Studio:\n"
        f"       Authentication → Sign In / Providers → Apple\n"
        f"       Secret Key (for OAuth)",
        file=sys.stderr,
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
