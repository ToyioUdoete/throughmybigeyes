# through my big eyes

A Pinterest-style photo diary for [throughmybigeyes](https://www.pinterest.com/twiiinklle/).

A real digital camera prints photos when the page opens and every time you press it. Then an animated "shall we?" invites you in and an arrow points to the gallery: a camera at the side of the page keeps printing photos that drift across the screen (hover to pause, tap a print to look closer). "See all" opens a phone with everything, newest first: the Pinterest photos plus the TikTok photo posts and videos (All, Photos and Videos tabs). TikTok posts show and play through TikTok's own embedded player; add new ones at the top of `TIKTOKS` in `index.html` (`["v" or "p", post number, caption]`). After that comes About me ("if you've made it this far, hi, i'm Toyio"): a looping clip of me, how to say my name with a Listen button, a few lines about me, a link to my research portfolio, a card styled like my Apple Music profile, and my favourite book and author. Carmen by Olivia Dean plays quietly in the background once a visitor first taps or clicks (Apple Music's 30-second preview, looped); the player at the top of the page turns it off. Flowers drift around it all.

- Live site: https://toyioudoete.github.io/throughmybigeyes/
- `index.html` (no build step) plus `img/my-big-eyes` (the newspaper-style eyes clipping in the title)
- Photos load from the original Pinterest pins, listed in the `PHOTOS` array near the bottom of `index.html`. To add a photo, add its image hash, size, colour and pin id there.
- Motion is turned off for visitors who have "reduce motion" set on their device.

All photos © throughmybigeyes.

To add to the About me section, add a new `<p>` line where the comment in `index.html` says. To show an Apple Music playlist there, paste its link into `PLAYLIST`. The age works itself out from the birthday.
