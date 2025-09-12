export const WEBRTC_CONFIG: RTCConfiguration = {
  iceServers: [
    // Public STUN servers for NAT traversal.
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:global.stun.twilio.com:3478" },

    {
      urls: [
        "turn:your-turn-server.com:3478?transport=udp",
        "turn:your-turn-server.com:3478?transport=tcp",
      ],
      username: process.env.NEXT_PUBLIC_TURN_USERNAME,
      credential: process.env.NEXT_PUBLIC_TURN_CREDENTIAL,
    },
  ],
  // 'all' allows the peer connection to use both STUN and TURN candidates.
  iceTransportPolicy: "all",
};