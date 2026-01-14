# Next.js build
cd next
npm install
npm run build

# Rust build
cd ../rust
cargo build --release

# Start both
cd ..
pm2 start ecosystem.config.json
pm2 save
pm2 startup
