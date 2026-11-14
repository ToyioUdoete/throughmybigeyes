# through my big eyes

A Pinterest-style photo diary for [throughmybigeyes](https://www.pinterest.com/twiiinklle/).

A real digital camera prints photos when the page opens and every time you press it. Then an animated "shall we?" invites you in, followed by four app icons in a row. The Gallery icon opens a phone showing everything newest first: the Pinterest photos plus the TikTok photo posts and videos (All, Photos and Videos tabs; tap one to view it full screen). TikTok posts show and play through TikTok's own embedded player. Instagram, TikTok and Pinterest link to the profiles. Set the Instagram handle in `INSTAGRAM`, and add new TikTok posts at the top of `TIKTOKS` in `index.html` (`["v" or "p", post number, caption]`). Flowers drift around it all.

- Live site: https://toyioudoete.github.io/throughmybigeyes/
- `index.html` (no build step) plus `img/my-big-eyes` (the newspaper-style eyes clipping in the title)
- Photos load from the original Pinterest pins, listed in the `PHOTOS` array near the bottom of `index.html`. To add a photo, add its image hash, size, colour and pin id there.
- Motion is turned off for visitors who have "reduce motion" set on their device.

All photos © throughmybigeyes.
