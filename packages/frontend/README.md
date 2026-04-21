# AirDelivery Frontend

The **Next.js frontend** for [AirDelivery](https://github.com/GochiStuff/airdelivery) — a fast, private, and peer-to-peer file sharing app.  
No cloud. No limits. Just direct, secure transfers.

**Live App:** [https://airdelivery.site](https://airdelivery.site)  
**Contact:** [@GochiStuff](https://x.com/GochiStuff)

---

## Overview

This repository contains the **frontend** for AirDelivery.  
It provides a simple and responsive interface for real-time file transfers between devices using WebRTC.

### Features
- Drag & drop file sharing  
- QR code pairing  
- Room-based transfers  
- Real-time progress tracking  
- Fully private and encrypted  

---

## Tech Stack
- **Framework:** Next.js (React)  
- **Styling:** Tailwind CSS  
- **Realtime:** WebSocket  
- **Peer-to-Peer:** WebRTC  

---

## Setup

```bash
# Clone the repo
git clone https://github.com/GochiStuff/airdelievery-frontend.git
cd airdelievery-frontend

# Install dependencies
npm install

# Create .env.local
NEXT_PUBLIC_BACKEND_URL=https://your-backend-url.com

# Run development server
npm run dev