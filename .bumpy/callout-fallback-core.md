---
"@mirrordown/core": minor
---

The alert recognition the three `github-alerts` plugins share reads any type and a marker's metadata.

- New export `matchAlertMarker(text)` returns the marker at the start of a text (`[!TYPE|metadata]+`) as `{ length, keyword, metadata, fold }`, or `null`. `AlertMarker` is its type. The three plugins and `isAlertMarkerLine` now read a marker through the one pattern.
- `createAlertResolver(options).resolve(keyword)` normalises the keyword (trimmed, runs of whitespace as `-`, lowercased unless `matchCaseInsensitive` is `false`) and returns it as its own type when no type is registered for it and it holds only letters, marks, numbers, `_` and `-`. It used to return `undefined` for every unregistered keyword; pass `fallback: false` for that.
- `AlertOptions` gains `fallback`, and `AlertParagraph` gains `metadata`.
- `titleFor` and `iconFor` give a fallback type a title made from its identifier (`custom-type` is "Custom type") and the note's icon.
