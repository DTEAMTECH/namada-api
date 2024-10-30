# Namada Blockchain API Service
This tool provides a REST API for retrieving essential data from the Namada blockchain, such as validator information, staking rewards, and other key metrics. Designed with caching capabilities, it offers both real-time and cached responses to optimize performance and minimize load on the network. With built-in support for TOML configuration, users can easily set up the API to run on a specified port, cache directory, and cache update interval. Ideal for developers and validators working with Namada, this service streamlines data access and makes blockchain information readily available.

## Available Endpoints:
* /validators, **Description:** Returns information about the current validators in the Namada network. The data is cached for efficient access;
* /epoch, **Description:** Returns the current epoch of the Namada blockchain. Data is fetched in real-time;
* /effective_supply, **Description:** Provides the current effective token supply in Namada;
* /total_active_voting_power, **Description:** Returns the total active voting power in the network, which is essential for analyzing voting distribution across the Namada network;
* /pgf, **Description:** Retrieves the Public Goods Funding (PGF) parameters for the Namada network;
* /staking_rewards_rate, **Description:** Returns the current staking rewards rate in the Namada network;
* /total_stake, **Description:** Provides data on the current total staking amount in the Namada network;
* /current_block, **Description:** Returns the height of the current block in the Namada blockchain;
* /total_native_supply, **Description:** Provides the total number of Namada tokens issued on the network;
* /chain_id, **Description:** Returns the chain ID for Namada;
* /total_stake_percentage, **Description:** Calculates and returns the percentage of the total supply of tokens that is staked;
  
### Additional Notes
Caching: Several endpoints utilize caching to improve performance and reduce RPC load.
Cache Updates: The cache is refreshed at an interval specified in the configuration (cache_interval).
Configuration: The service requires a TOML configuration file specifying rpc URL, cache directory (cache), port (port), and cache update interval (cache_interval).

## Build from source:
1. Install bun(JavaScript runtime) https://bun.sh Rust Cargo and Node.js
2. Clone this repo
3. Install dependencies for shared in /shared folder:
```bash
bun install 
```
4. build shared library in /shared folder:
```bash
bun run prepublish
```
5. Install dependencies for exporter in /exporter folder:
```bash
bun install --production --frozen-lockfile
```
6. build binary in root project:
```bash
bun build ./exporter/src/index.ts --compile --outfile namada-data-exporter
```

### Run
```bash
./namada-data-exporter start --config config.toml
```
