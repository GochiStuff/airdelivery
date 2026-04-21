# AirDelivery (Monorepo)

**The fastest and most private way to send files — peer-to-peer.**  
No cloud. No limits. Just you and the receiver.  

---

## Project Structure

This is a monorepo managed with **Bun Workspaces**.

- `packages/frontend`: Next.js frontend ([WebRTC signaling & UI])
- `packages/backend`: Node.js backend ([Signaling server & Fallback])

## Getting Started

### Prerequisites
- [Bun](https://bun.sh) installed.

### Installation
```bash
bun install
```

### Development
To start both frontend and backend in development mode:
```bash
bun dev
```

### Building
To build all packages:
```bash
bun build
```

---

## Tech Stack

- **Frontend:** Next.js, React  
- **Backend:** Node.js, Express  
- **Realtime:** WebSocket  
- **Peer-to-Peer:** WebRTC  
- **Database:** MongoDB (optional for analytics/logging)  

---

## Contributing

Contributions are welcome!  

1. Fork the repository  
2. Clone your fork (`git clone <your-fork-url>`)  
3. Create a branch for your feature (`git checkout -b feature-name`)  
4. Make changes and commit with clear messages (`git commit -m "Add feature"`)  
5. Push to your branch (`git push origin feature-name`)  
6. Open a Pull Request  

Please follow the code style and open an issue before starting large features.  

---

## License

This project is licensed under the **GPLv3 License**. See `LICENSE` for details.  

---

## Contact
- **Follow / DM on X:** [@GochiStuff](https://x.com/GochiStuff)  
