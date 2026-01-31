#!/bin/python3
import csv
from pathlib import Path
import os

CSV_FILE = os.environ["CSV_FILE"]
MD_FILE = os.environ["MD_FILE"]

def safe(val):
    return val.strip() if val else ""

rows = []

with open(CSV_FILE, newline="", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    for row in reader:
        rows.append({
            "From": safe(row.get("From")),
            "To": safe(row.get("To")),
            "Sent": safe(row.get("Sent")),
            "File": safe(row.get("File")),
            "Content": safe(row.get("Content")),
        })

with open(MD_FILE, "w", encoding="utf-8") as f:
    f.write("# Email Correspondence\n\n")

    for r in rows:
        print("writing entry")
        f.write(f"## {r['Sent']}\n\n")
        f.write(f"**From:** {r['From']}\n\n")
        f.write(f"**To:** {r['To']}\n\n")
        f.write(f"{r['Content']}\n\n")
        f.write(f"[Source]({r['File']})\n\n")
        f.write("---\n\n")

print(f"Wrote {len(rows)} messages to {MD_FILE}")
