#!/bin/bash
# Convert video.mp4 to WebM (VP9) for smaller file size
# Requires: ffmpeg (install via: brew install ffmpeg)

INPUT="assets/video.mp4"
OUTPUT="assets/video.webm"

if [ ! -f "$INPUT" ]; then
    echo "Error: $INPUT not found"
    exit 1
fi

echo "Converting to WebM (VP9)..."
ffmpeg -i "$INPUT" \
    -c:v libvpx-vp9 \
    -crf 35 \
    -b:v 0 \
    -row-mt 1 \
    -c:a libopus \
    -b:a 128k \
    "$OUTPUT"

echo "Done! Output: $OUTPUT"
echo "Original size: $(ls -lh "$INPUT" | awk '{print $5}')"
echo "New size: $(ls -lh "$OUTPUT" | awk '{print $5}')"
