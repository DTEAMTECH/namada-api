### Or build from source:
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