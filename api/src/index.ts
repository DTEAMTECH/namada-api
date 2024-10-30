import { Query } from '../../shared/src';
import storage from 'node-persist';
import { Command } from 'commander';
import Bun from 'bun';
import toml from 'toml';
import fs from 'fs';

const program = new Command();

type Router = {
    [key: string]: (() => Promise<any>);
};

program
  .command('start')
  .requiredOption('--config <path>', 'Path to the configuration file in TOML format')
  .action(async (options: any) => {
    let config;
    try {
      const configFile = fs.readFileSync(options.config, 'utf-8');
      config = toml.parse(configFile);
    } catch (error) {
      console.error('Error reading or parsing configuration file:', error);
      process.exit(1);
    }

   
    const { cache, port, cache_interval, rpc } = config;

    // Initialize storage with specified cache directory
    await storage.init({
      dir: cache,
    });

    // Initialize the RPC query with the specified RPC URL
    const q = new Query(rpc);

    // Define caching helper function
    function withCache(key: string, fetchFunction: () => Promise<any>) {
      return async function () {
        const cachedData = await storage.getItem(key);
        if (cachedData) {
          console.log(`Using cached ${key}`);
          return cachedData;
        }
        const data = await fetchFunction();
        await storage.setItem(key, data);
        console.log(`${key} cached.`);
        return data;
      };
    }

    // Functions with cache
    const getValidators = withCache('validators', () => q.query_validators_data());
    const getEpoch = q.query_epoch.bind(q);
    const getEffectiveSupply = withCache('effective_supply', () => q.effective_native_supply());
    const getActiveVotingPower = withCache('active_voting_power', () => q.total_active_voting_power());
    const getPGFparams = withCache('pgf', () => q.pgf_params());
    const getStakingRewardsRate = withCache('staking_rewards_rate', () => q.staking_rewards_rate());
    const getTotalStake = withCache('total_stake', () => q.total_stake());
    const getTotalNativeSupply = withCache('total_native_supply', () => q.total_native_supply());
    const getCurrentBlock = async () => {
      const status = await fetch(`${rpc}/status`).then((res) => res.json());
      return status.result.sync_info.latest_block_height;
    };
    const getChainId = async () => {
      const status = await fetch(`${rpc}/status`).then((res) => res.json());
      return status.result.node_info.network;
    };

    // Define router with all endpoints
    const router: Router = {
      '/validators': getValidators,
      '/epoch': async () => ({ value: await getEpoch() }),
      '/effective_supply': async () => ({ value: await getEffectiveSupply() }),
      '/total_active_voting_power': async () => ({ value: await getActiveVotingPower() }),
      '/pgf': async () => ({ value: await getPGFparams() }),
      '/staking_rewards_rate': async () => ({ value: await getStakingRewardsRate() }),
      '/total_stake': async () => ({ value: await getTotalStake() }),
      '/current_block': async () => ({ value: await getCurrentBlock() }),
      '/total_native_supply': async () => ({ value: await getTotalNativeSupply() }),
      '/chain_id': async () => ({ value: await getChainId() }),
      '/total_stake_percentage': async () => {
        const totalStake = await getTotalStake();
        const totalNativeSupply = await getTotalNativeSupply();
        const percentage = (Number(totalStake) / Number(totalNativeSupply)) * 100;
        return { value: percentage.toFixed(2) };
      },
    };

    // Initialize cache for all endpoints
    async function initializeCache() {
      await Promise.all(Object.values(router).map((fn) => fn()));
    }
    await initializeCache();

    // Start periodic cache updates
    function startPeriodicCacheUpdates(interval: number) {
      setInterval(async () => {
        await Promise.all(Object.values(router).map((fn) => fn()));
      }, interval);
    }
    startPeriodicCacheUpdates(cache_interval); // Use interval from config

    // Serve with Bun on specified port
    Bun.serve({
      async fetch(req) {
        const url = new URL(req.url);
        const routeHandler = router[url.pathname];
        if (routeHandler) {
          const response = await routeHandler();
          return new Response(JSON.stringify(response), {
            headers: { 'Content-Type': 'application/json' },
          });
        }
        return new Response('Not Found', { status: 404 });
      },
      port: port, 
    });

    console.log(`Server started successfully on port ${port}.`);
  });


program.parse(process.argv);
