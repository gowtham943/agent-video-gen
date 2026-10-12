---
description: Create a cinematic product video from a prompt (any product, up to 10 minutes)
argument-hint: <product and what the video should say>
---

Use the `make-product-video` skill to create a video for the following request. Follow it end to end: intake, pick a length (never default to 30 seconds; maximum 10 minutes), scaffold, brief, storyboard with this product's words/images/symbols, write `video.config.json`, `npm run validate`, then `npm run render`. Do not generate stills, frames, or a preview. The MP4 is the deliverable.

Request: $ARGUMENTS
