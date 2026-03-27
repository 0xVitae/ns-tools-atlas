---
name: ns-auth
description: "Implement NS Auth (Network School authentication) in any project. Use when the user mentions 'NS Auth', 'Network School login', 'Login with NS', 'NS membership verification', 'Discord NS verify', or wants to gate access to NS members. Provides the full API reference, code examples, and guides integration step by step."
---

# NS Auth — Integration Skill

You are helping the user integrate **NS Auth**, the Network School Discord membership verification API. Follow this documentation exactly. Do not hallucinate endpoints, fields, or scopes.

## How NS Auth Works

1. The user's app implements **Discord OAuth** (standard, using their own Discord app)
2. After login, the app has the user's **Discord ID**
3. The app calls the NS Auth **verify endpoint** with that Discord ID
4. NS Auth checks if the user is an NS member and returns profile data based on approved scopes

## API Reference

### POST https://api.ns.com/api/v1/ns-auth/verify

Verify a Discord user's NS membership.

**Headers**

| Header         | Required | Description                          |
| -------------- | -------- | ------------------------------------ |
| `X-Api-Key`    | Yes      | Your API key (starts with `nsauth_`) |
| `Content-Type` | Yes      | `application/json`                   |

**Request Body**

```json
{
  "discordId": "<discord-user-id>"
}
```

**Response — Member**

```json
{
  "member": true,
  "discordId": "...",
  "discordUsername": "john",
  "discordAvatar": "abc123hash",
  "roles": ["Core"],
  "userType": "core",
  "name": "John Doe",
  "username": "john_ns",
  "email": "john@example.com"
}
```

Fields returned depend on the app's approved scopes. Fields may be `null` if the user hasn't linked their Discord on ns.com.

**Response — Not a Member**

```json
{
  "member": false
}
```

**Error Responses**

| Status | Meaning                                  |
| ------ | ---------------------------------------- |
| 400    | Missing or invalid `discordId`           |
| 401    | Missing or invalid API key               |
| 403    | App not approved or deactivated          |
| 429    | Rate limit exceeded (20 requests/minute) |
| 502    | Discord API error — try again later      |

## Scopes

Apps are assigned scopes during approval. These control what data is returned.

| Scope        | Data                                                                      |
| ------------ | ------------------------------------------------------------------------- |
| `membership` | `member` (true/false), `discordId` — always included                      |
| `roles`      | `roles` (Discord server roles), `userType` (core, longterm, member, etc.) |
| `profile`    | `name`, `username`, `discordUsername`, `discordAvatar`                    |
| `email`      | `email` (if available)                                                    |

## Integration Guidelines

When helping the user integrate NS Auth:

1. **Ask what framework/language they're using** if not obvious from the codebase.
2. **The API key must be server-side only.** Never include `NS_AUTH_API_KEY` in frontend code or client bundles. If the user's stack is client-only (e.g., SPA), they need a backend proxy route.
3. **Set up Discord OAuth first.** The user needs a Discord application at discord.com/developers with OAuth2 configured. Minimum scope: `identify`.
4. **Environment variable:** Guide them to store the API key as `NS_AUTH_API_KEY`.
5. **Always check `member === true`** before granting access. Do not trust other fields without checking membership first.
6. **Rate limit:** 20 requests per minute per API key. Suggest caching membership status in a session or JWT.
7. **Registration:** To get an API key, register at [ns.com/platform](https://ns.com/platform).

## Code Examples

### Next.js with NextAuth

```typescript
import NextAuth from "next-auth";
import DiscordProvider from "next-auth/providers/discord";

export const { handlers, auth } = NextAuth({
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ profile }) {
      const res = await fetch("https://api.ns.com/api/v1/ns-auth/verify", {
        method: "POST",
        headers: {
          "X-Api-Key": process.env.NS_AUTH_API_KEY!,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ discordId: profile?.id }),
      });
      const data = await res.json();
      return data.member === true;
    },
  },
});
```

### Node.js / Express

```typescript
app.post("/api/ns-verify", async (req, res) => {
  const { discordId } = req.body;
  const response = await fetch("https://api.ns.com/api/v1/ns-auth/verify", {
    method: "POST",
    headers: {
      "X-Api-Key": process.env.NS_AUTH_API_KEY!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ discordId }),
  });
  const data = await response.json();
  res.json(data);
});
```

### Python

```python
import os
import requests

NS_AUTH_API_KEY = os.environ["NS_AUTH_API_KEY"]

def verify_ns_membership(discord_id: str) -> dict:
    response = requests.post(
        "https://api.ns.com/api/v1/ns-auth/verify",
        headers={
            "X-Api-Key": NS_AUTH_API_KEY,
            "Content-Type": "application/json",
        },
        json={"discordId": discord_id},
    )
    response.raise_for_status()
    return response.json()
```

### React SPA (requires backend proxy)

```typescript
// Frontend — calls YOUR backend, not NS Auth directly
async function verifyNSMembership(discordId: string) {
  const res = await fetch("/api/ns-verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ discordId }),
  });
  return res.json();
}
```

## Security Reminders

- **API key is a secret.** Server-side only.
- **Discord IDs are public identifiers.** They are not secrets.
- **Always validate `member === true`** before granting access.
- **Cache membership checks** in sessions to stay within the 20 req/min rate limit.

## Support

For questions or help: [support@ns.com](mailto:support@ns.com)
To register a new app: [ns.com/platform](https://ns.com/platform)

$ARGUMENTS
