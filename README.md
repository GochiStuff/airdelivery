# AirDelivery.site

**A modern, fast, and reliable delivery platform for local and regional logistics.**

**Live site:** https://airdelivery.site

**Follow:** https://x.com/GochiStuff (@GochiStuff)

---

## Project Overview

AirDelivery is an open-source delivery system that aims to simplify local and regional logistics. The project provides a parent repository that links the frontend and backend applications, and it includes development and Docker workflows to get contributors up and running quickly.

AirDelivery focuses on low-latency transfers, secure peer-to-peer file transfers, and real-time order tracking for a cross-platform experience (web and mobile).

---

## Highlights

- Seamless, user-friendly interface for placing and managing delivery requests
- Private peer-to-peer transfers using WebRTC
- Nearby detection for optimized routing and pickup
- Real-time package tracking and status updates
- Support for large file transfers (direct storage writes for files > 1.2 GB)
- Multi-platform support (Web -> works on all .)

---

## Tech Stack

- **Frontend:** Next.js
- **Backend:** Node.js, Express
- **Database:** MongoDB
- **Realtime:** WebSocket
- **Peer-to-peer:** WebRTC
- **Containerization / Orchestration:** Docker, Docker Compose

---

## Repository Structure (Parent Repo)

This repository functions as the parent/umbrella repo and links the service repositories:

- `ad-backend` — Backend service (realtime gateway)
- `airdelivery-frontend` — Frontend application (Next.js)


- Backend: `https://github.com/GochiStuff/ad-backend`
- Frontend: `https://github.com/GochiStuff/airdelivery-frontend`

---


## Architecture & Design Notes

- **Peer-to-peer transfers:** WebRTC is used to establish private, encrypted P2P channels for direct file transfer between clients when possible, falling back to server proxied transfer when required.
- **Realtime updates:** WebSocket is used for order status updates and live tracking.
- **Nearby detection:** ip pasing and grouping is implemented on the backend to match nearby drivers or couriers to requests.

---

## Contributing

Contributions are welcome. 

Please include meaningful commit messages and follow the repository's code style. If you plan to work on a large feature, open an issue first so we can coordinate.

---

## License

This project is released under the License. See `LICENSE` for details.

---

## Roadmap

Planned improvements and next milestones:

- Mobile native clients (iOS, Android)
- Driver/courier partner portal
- Multi-tenant support for enterprise customers
- Improved monitoring and observability

---

## Security & Responsible Disclosure

If you discover a security vulnerability, please report it privately by opening an issue labeled `security` or by contacting the repository owner directly. Do not post security issues in public issue threads.

---

## Contact

- Live site: https://airdelivery.site
- GitHub: https://github.com/GochiStuff
- Follow / Contact on X: https://x.com/GochiStuff (@GochiStuff)

---
