# AirDelivery

**The fastest and most private way to send files — peer-to-peer.**  
No cloud. No limits. Just you and the receiver.  

**Live Site:** [https://airdelivery.site](https://airdelivery.site)  
**Follow / Contact:** [@GochiStuff on X](https://x.com/GochiStuff)  

## About the Project

AirDelivery is an open-source peer-to-peer file transfer platform that allows users to send files directly between devices without uploads, signups, or size limits.  

- **Secure & Private:** End-to-end encrypted transfers  
- **Fast & Reliable:** Lightning-fast speeds (100+ Mbps)  
- **Cross-platform:** Works on any modern browser (mobile & desktop)  
- **No Limits:** Send files of any size, instantly  

---

## Frontend

The frontend is built with **Next.js** and provides a clean, minimal, and user-friendly interface for sending and receiving files.  

**Repository:** [airdelivery-frontend](https://github.com/GochiStuff/airdelievery-frontend)  

**Features:**  

- Drag & drop support  
- QR code pairing  
- Room-based sharing  
- Real-time progress tracking  

---

## Backend

The backend handles peer-to-peer signaling, room management, and optional server fallback for transfers when direct P2P is not possible.  

**Repository:** [ad-backend](https://github.com/GochiStuff/ad-backend)  

**Features:**  

- Node.js + Express server  
- WebSocket for real-time communication  
- Secure room/session handling  
- Optional proxied transfer fallback  

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
--
