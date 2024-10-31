import { type Config } from './types'
import ip from 'ip';

const tryFetch = async (url: string) => {
    try {
        return await fetch(url).then((res) => res.json()) as Record<string, any>;
    } catch (error) {
        console.error('Error fetching data:', error);
        return null;
    }
}
const parseIpsAddrbook = (addressbook: Record<string, any> | null) => {
    if (!addressbook) {
        return [];
    }
    return addressbook.addrs.map((node: any) => {
        return {
            id: node.addr.id,
            ip: ip.isPrivate(node.addr.ip) ? null : node.addr.ip,
            port: node.addr.port,
        }
    });

};
const parseIpsNetInfo = (netInfo: Record<string, any> | null) => {
    if (!netInfo) {
        return [];
    }
    return netInfo.result.peers.map((node: any) => {
        const globalIpOrNull = (() => {
            const is0 = (ip: string) => ip.trim() === '0.0.0.0';
    
            if(!ip.isPrivate(node.remote_ip) && !is0(node.remote_ip)) { 
                return node.remote_ip;
            }
            const listenIp = node.node_info.listen_addr.split('/')[2].split(':')[0];
            if (!ip.isPrivate(listenIp) && !is0(listenIp)) {
                return listenIp
            }
            const otherIp = node.node_info.other.rpc_address.split('/')[2].split(':')[0];
            if (!ip.isPrivate(otherIp) && !is0(otherIp)) {
                return otherIp;
            }
            return null;

        })();

        return {
            id: node.node_info.id,
            ip: globalIpOrNull,
            port: node.node_info.listen_addr.split(':').at(-1),
        }
    });
}
export const getNodesLocations = async (config: Config) => {
    const addressbook = await tryFetch(config.addressbook_url);
    const addrsNode = parseIpsAddrbook(addressbook);
    const netInfo = await tryFetch(`${config.rpc}/net_info`);
    const netInfoNodes = parseIpsNetInfo(netInfo);
    const ipsWithLocation = []; 
    const uniqueIps = new Set();

    for (const node of [...addrsNode, ...netInfoNodes].filter((node) => node.ip && !uniqueIps.has(node.ip))) {
        const res = await fetch(`https://ipapi.co/${node.ip}/json/`).then((res) => res.json());
        if(!uniqueIps.has(node.ip)) {
            ipsWithLocation.push({
                ...node,
                location: res,
            });
        }
       
        uniqueIps.add(node.ip);
    }
    return ipsWithLocation;
}

if (require.main === module) {
    (async () => {
        const res = await getNodesLocations({
            cache: 'cache',
            port: 26660,
            cache_interval: 10000,
            rpc: 'https://rpc.knowable.run:443',
            addressbook_url: 'https://download.dteam.tech/namada/testnet/addrbook'
        });
        console.log(res);
    })();
}
