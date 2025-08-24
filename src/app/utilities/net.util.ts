/* eslint-disable @typescript-eslint/no-explicit-any */
import ipaddr from 'ipaddr.js';

// Normalize IPs like "::ffff:192.168.1.10" -> "192.168.1.10"
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
        // Fall back to simple de-prefix attempt
        return ip.replace(/^::ffff:/, '');
    }
}

// Strict CIDR validation (IPv4 only here, reject /0; allow 1..32)
export function isValidIpv4Cidr(cidr: string): boolean {
    const parts = cidr.split('/');
    if (parts.length !== 2) return false;
    const [ipStr, prefixStr] = parts;
    const prefix = Number(prefixStr);
    if (!Number.isInteger(prefix) || prefix < 1 || prefix > 32) return false; // disallow /0

    try {
        const ip = ipaddr.parse(ipStr);
        if (ip.kind() !== 'ipv4') return false;
        return true;
    } catch {
        return false;
    }
}

// Optional: ensure the CIDR base is private or CGNAT for Wi-Fi
export function isWifiFriendlyCidr(cidr: string): boolean {
    if (!isValidIpv4Cidr(cidr)) return false;
    const [ipStr] = cidr.split('/');
    const ip = ipaddr.parse(ipStr) as ipaddr.IPv4;
    const r: any = ip.range(); // 'private' for 10/8, 172.16/12, 192.168/16; 'carrier' for 100.64/10
    return r === 'private' || r === 'carrier';
}

// Check if a client IP lies within an IPv4 CIDR
export function checkIpInRange(clientIp: string, cidr: string): boolean {
    try {
        const [baseStr, prefixStr] = cidr.split('/');
        const prefix = Number(prefixStr);

        // normalize client IP first (handles IPv4-mapped IPv6)
        const normalizedClientIp = normalizeIp(clientIp);
        const ip = ipaddr.parse(normalizedClientIp);
        const base = ipaddr.parse(baseStr);

        if (ip.kind() === 'ipv6' && (ip as ipaddr.IPv6).isIPv4MappedAddress()) {
            // map to IPv4
            const v4 = (ip as ipaddr.IPv6).toIPv4Address();
            return v4.match(base, prefix);
        }

        if (ip.kind() !== base.kind()) return false;
        return (ip as any).match(base, prefix); // ipaddr.js supports match(ip, [base, prefix]) or ip.match(base, prefix)
    } catch {
        return false;
    }
}
