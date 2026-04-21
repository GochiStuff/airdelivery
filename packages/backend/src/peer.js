

export default class Peer{

    constructor( socket , request , config){
        this.config = config;
        this.ipv6Localize = 3;
        this.socket = socket;
        this._setIP(request);

    }

    // set user ip 
    _setIP(request){
        // Extract real 
        const cf = request.headers['cf-connecting-ip'];
        const forwarded = request.headers['x-forwarded-for'];
        let ip = cf ? cf.split(',')[0].trim() : (forwarded ? forwarded.split(',')[0].trim() : request.socket.remoteAddress || '');
        if (ip.startsWith('::ffff:')) ip = ip.slice(7);

        // Normalize IPv6 segments
        if (this.ipv6Localize && ip.includes(':')) {
        ip = ip.split(':', this.ipv6Localize).join(':');
        }

        // Private IP detection

        const isPrivate = this.ipIsPrivate(ip);
        this.isPrivate = isPrivate;
        this.ip = (ip === '::1' || isPrivate) ? '127.0.0.1' : ip;

        if (this.ip === '127.0.0.1') {
            this.ipPrefix = null; // loopback ignored
        } else {
            const parts = this.ip.split('.');
            this.ipPrefix = isPrivate ? parts.slice(0, 3).join('.') : parts.slice(0, 2).join('.');
        }

        // grouping 
        // Private IPs by /24 subnet: 192.168.1.x → 192.168.1
        // Public IPs by /16 prefix: 45.250.48.206 → 45.250

        //  DEBUG 
        if(this.config.debug){
            console.log("NEW IP:", this.ip, "| Private:", this.isPrivate, "| Prefix:", this.ipPrefix);
        }
        
        
    }


    // check if IP is private  
    ipIsPrivate(ip) {
        if (!ip.includes(':')) {
            return /^(10|172\.(1[6-9]|2[0-9]|3[0-1])|192\.168)\./.test(ip);
        }
        const first = ip.split(':').find(Boolean);
        return /^(fc|fd)/.test(first) || first === 'fe80';
    }




}