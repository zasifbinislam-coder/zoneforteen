# Product videos

Drop short product videos here. The Quick View modal will show a "Play"
thumbnail next to the photo gallery whenever a matching video exists.

## Folder layout

```
videos/
└── jerseys/
    ├── arg-home.mp4      ← Argentina Home Kit
    ├── bra-home.mp4
    ├── fra-home.mp4
    ├── esp-home.mp4
    └── ...               (one file per jersey id, matching the folder name in /images/jerseys/)
```

## Video specs

- **Format:** MP4 (H.264 video + AAC audio — universal browser support).
- **Length:** 10–25 seconds. Long enough to show the kit, short enough to load fast.
- **Size:** under 5 MB per video. Compress with [handbrake](https://handbrake.fr) or
  [ffmpeg](https://ffmpeg.org) (`-vf scale=1080:-1 -crf 28 -preset slow`).
- **Dimensions:** 1080×1080 square or 1080×1350 portrait works best in the modal.
- **Audio:** silent or low ambient music. The modal auto-plays muted on first open.

## What to shoot

- 360° rotation of the jersey (5–6 seconds)
- Fabric close-up (2 seconds)
- Quick "wear it" lifestyle clip (5–8 seconds)

When new videos go in matching the naming convention above, the site picks them up automatically.
