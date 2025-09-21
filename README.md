# AirDelivery.site

AirDelivery is a modern, fast, and reliable delivery platform designed to streamline local and regional logistics. It provides a seamless interface for users to request deliveries, track packages in real-time, and manage orders efficiently.  

**Website:** [https://airdelivery.site](https://airdelivery.site)  

## Features
- Easy-to-use interface for requesting deliveries  
- Private p2p transfer using webrtc
- Near by detection
- Super fast 
- No transfer limits ( direct storage write for files above 1.2 GBs )
- Real-time tracking of packages  
- Secure and reliable order management  
- Multi-platform support (Web, Mobile)  

## Tech Stack
- NextJs 
- NodeJs
- Express 
- MongoDB
- Websocket
- WebRTC

## Getting Started
This repo links the **frontend** and **backend** repositories and provides an easy dev + docker flow. 

To get started with AirDelivery, follow the setup instructions: 

## Quick choices

1. **Submodules (recommended for discoverability)**
- Pros: single `git clone --recurse-submodules` to fetch everything; each repo keeps its history and issues.
- Cons: contributors must understand submodules (easy with docs).

2. **Bootstrap script**
- Pros: very simple for new contributors (`./scripts/bootstrap.sh`).
- Cons: separate commit histories remain independent; less explicit in git metadata.


## Quickstart (submodules)


```bash
# 1) clone meta repo with submodules
git clone --recurse-submodules git@github.com:YOUR_ORG/YOUR_META_REPO.git
cd YOUR_META_REPO


# 2) build & run using docker-compose
cp .env.example .env # set ports / env variables
docker-compose up --build

```bash
git clone <frontend-repo-link>
git clone <backend-repo-link>
