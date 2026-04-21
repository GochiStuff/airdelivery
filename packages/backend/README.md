# AirDelivery Backend

The **Node.js/Bun backend** for AirDelivery.  
Handles peer-to-peer signaling, room management, and optional server fallback for transfers.

**Contact:** [@imgochi](https://x.com/imgochi)

---

## Overview

This package handles the signaling server logic required to establish WebRTC connections between peers.

### Features
- Node.js + Express server (running on Bun)
- WebSocket for real-time signaling
- Secure room/session handling
- Optional proxied transfer fallback

---

## Tech Stack
- **Runtime:** Bun
- **Framework:** Express
- **Realtime:** Socket.io
- **Database:** MongoDB (Mongoose)

---

## Development

This package is part of a monorepo. It is recommended to run it from the root:

```bash
# From the root directory
bun dev --filter backend
```
