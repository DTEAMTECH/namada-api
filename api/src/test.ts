import { Query } from '../../shared/src';


const q = new Query('https://rpc.knowable.run:443');
const epoch = await q.pgf_params();

console.log(epoch);