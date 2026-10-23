#!/bin/bash
cd /home/z/my-project/mini-services/collab-service
while true; do
  bun run dev
  echo "[watchdog] collab exited ($?), restarting in 2s..." >> /home/z/my-project/collab.log
  sleep 2
done
