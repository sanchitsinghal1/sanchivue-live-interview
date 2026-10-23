#!/bin/bash
cd /home/z/my-project
while true; do
  bun run dev
  echo "[watchdog] dev server exited ($?), restarting in 2s..." >> /home/z/my-project/dev.log
  sleep 2
done
