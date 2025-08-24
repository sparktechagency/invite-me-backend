/* eslint-disable @typescript-eslint/no-explicit-any */
// /* eslint-disable @typescript-eslint/no-explicit-any */
// import ipaddr from 'ipaddr.js';

// // Normalize IPs like "::ffff:192.168.1.10" -> "192.168.1.10"
// export function normalizeIp(ip: string): string {
//     if (!ip) return ip;
//     try {
//         const parsed = ipaddr.parse(ip);
//         if (
//             parsed.kind() === 'ipv6' &&
//             (parsed as ipaddr.IPv6).isIPv4MappedAddress()
//         ) {
//             return (parsed as ipaddr.IPv6).toIPv4Address().toString();
//         }
//         return parsed.toString();
//     } catch {
//         // Fall back to simple de-prefix attempt
//         return ip.replace(/^::ffff:/, '');
//     }
// }

// // Strict CIDR validation (IPv4 only here, reject /0; allow 1..32)
// export function isValidIpv4Cidr(cidr: string): boolean {
//     const parts = cidr.split('/');
//     if (parts.length !== 2) return false;
//     const [ipStr, prefixStr] = parts;
//     const prefix = Number(prefixStr);
//     if (!Number.isInteger(prefix) || prefix < 1 || prefix > 32) return false; // disallow /0

//     try {
//         const ip = ipaddr.parse(ipStr);
//         if (ip.kind() !== 'ipv4') return false;
//         return true;
//     } catch {
//         return false;
//     }
// }

// // Optional: ensure the CIDR base is private or CGNAT for Wi-Fi
// export function isWifiFriendlyCidr(cidr: string): boolean {
//     if (!isValidIpv4Cidr(cidr)) return false;
//     const [ipStr] = cidr.split('/');
//     const ip = ipaddr.parse(ipStr) as ipaddr.IPv4;
//     const r: any = ip.range(); // 'private' for 10/8, 172.16/12, 192.168/16; 'carrier' for 100.64/10
//     return r === 'private' || r === 'carrier';
// }

// // Check if a client IP lies within an IPv4 CIDR
// export function checkIpInRange(clientIp: string, cidr: string): boolean {
//     try {
//         const [baseStr, prefixStr] = cidr.split('/');
//         const prefix = Number(prefixStr);

//         // normalize client IP first (handles IPv4-mapped IPv6)
//         const normalizedClientIp = normalizeIp(clientIp);
//         const ip = ipaddr.parse(normalizedClientIp);
//         const base = ipaddr.parse(baseStr);

//         if (ip.kind() === 'ipv6' && (ip as ipaddr.IPv6).isIPv4MappedAddress()) {
//             // map to IPv4
//             const v4 = (ip as ipaddr.IPv6).toIPv4Address();
//             return v4.match(base, prefix);
//         }

//         if (ip.kind() !== base.kind()) return false;
//         return (ip as any).match(base, prefix); // ipaddr.js supports match(ip, [base, prefix]) or ip.match(base, prefix)
//     } catch {
//         return false;
//     }
// }

/* utils/net.util.ts */
import ipaddr from 'ipaddr.js';

// "::ffff:1.2.3.4" -> "1.2.3.4"
export function normalizeIp(ip: string): string {
    if (!ip) return ip;
    try {
        const parsed = ipaddr.parse(ip);
        if (
            parsed.kind() === 'ipv6' &&
            (parsed as ipaddr.IPv6).isIPv4MappedAddress()
        ) {
            return (parsed as ipaddr.IPv6).toIPv4Address().toString();
        }
        return parsed.toString();
    } catch {
        return ip.replace(/^::ffff:/, '');
    }
}

// Validate "x.x.x.x/y", 1 <= y <= 32
export function isValidIpv4Cidr(cidr: string): boolean {
    const parts = cidr.split('/');
    if (parts.length !== 2) return false;
    const [ipStr, prefixStr] = parts;
    const prefix = Number(prefixStr);
    if (!Number.isInteger(prefix) || prefix < 1 || prefix > 32) return false;

    try {
        const ip = ipaddr.parse(ipStr);
        return ip.kind() === 'ipv4';
    } catch {
        return false;
    }
}

// Store canonical network address (e.g., "103.159.73.129/24" -> "103.159.73.0/24")
export function canonicalizeIpv4Cidr(cidr: string): string {
    const [ipStr, prefixStr] = cidr.split('/');
    const prefix = Number(prefixStr);

    if (!Number.isInteger(prefix) || prefix < 1 || prefix > 32) {
        throw new Error('Invalid IPv4 prefix length');
    }

    const parts = ipStr.split('.').map(Number);
    if (
        parts.length !== 4 ||
        parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)
    ) {
        throw new Error('Invalid IPv4 address');
    }

    // Convert to 32-bit unsigned int
    const ipNum =
        ((parts[0] << 24) >>> 0) |
        ((parts[1] << 16) >>> 0) |
        ((parts[2] << 8) >>> 0) |
        (parts[3] >>> 0);

    // Build mask and apply
    const mask = (0xffffffff << (32 - prefix)) >>> 0; // safe because 1..32
    const networkNum = (ipNum & mask) >>> 0;

    const a = (networkNum >>> 24) & 0xff;
    const b = (networkNum >>> 16) & 0xff;
    const c = (networkNum >>> 8) & 0xff;
    const d = networkNum & 0xff;

    return `${a}.${b}.${c}.${d}/${prefix}`;
}

// Check if clientIp ∈ cidr (IPv4 + IPv4-mapped IPv6)
export function checkIpInRange(clientIp: string, cidr: string): boolean {
    try {
        const [baseStr, prefixStr] = cidr.split('/');
        const prefix = Number(prefixStr);

        const normalizedClientIp = normalizeIp(clientIp);
        const ip = ipaddr.parse(normalizedClientIp);
        const base = ipaddr.parse(baseStr);

        if (ip.kind() === 'ipv6' && (ip as ipaddr.IPv6).isIPv4MappedAddress()) {
            const v4 = (ip as ipaddr.IPv6).toIPv4Address();
            return v4.match(base, prefix);
        }

        if (ip.kind() !== base.kind()) return false;
        return (ip as any).match(base, prefix);
    } catch {
        return false;
    }
}
