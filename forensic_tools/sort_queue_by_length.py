#!/usr/bin/env python3
import os
import subprocess
import re

QUEUE_FILE = "/Users/macarena1/01_ACTIVE_DEV/CONSOLIDATED_CASES/AEON-777_FINAL_PACKAGE/TRANSCRIPTION_PENDING_QUEUE.txt"

def get_duration(filepath):
    try:
        result = subprocess.run(['afinfo', filepath], capture_output=True, text=True)
        if result.returncode == 0:
            match = re.search(r'estimated duration:\s+([\d\.]+)\s+sec', result.stdout)
            if match:
                return float(match.group(1))
    except Exception as e:
        pass
    return -1.0 # If we can't read it, put it at the end

if not os.path.exists(QUEUE_FILE):
    print("Queue file not found")
    exit(1)

with open(QUEUE_FILE, 'r') as f:
    files = [line.strip() for line in f if line.strip()]

print(f"Sorting {len(files)} files by duration...")

file_durations = []
for idx, filepath in enumerate(files):
    dur = get_duration(filepath)
    file_durations.append((filepath, dur))
    if (idx + 1) % 50 == 0:
        print(f"Processed {idx + 1}/{len(files)} files...")

# Sort by duration descending
file_durations.sort(key=lambda x: x[1], reverse=True)

with open(QUEUE_FILE, 'w') as f:
    for filepath, dur in file_durations:
        f.write(filepath + "\n")

if file_durations:
    print(f"\n✅ Queue sorted successfully.")
    print(f"🥇 Longest file: {os.path.basename(file_durations[0][0])} ({file_durations[0][1] / 60:.2f} minutes)")
    print(f"🥈 Second longest: {os.path.basename(file_durations[1][0])} ({file_durations[1][1] / 60:.2f} minutes)")
    print(f"🥉 Third longest: {os.path.basename(file_durations[2][0])} ({file_durations[2][1] / 60:.2f} minutes)")
