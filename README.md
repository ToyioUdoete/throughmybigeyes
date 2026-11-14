# through my big eyes

A Pinterest-style photo diary for [throughmybigeyes](https://www.pinterest.com/twiiinklle/).

The orange "Recent news" button in the hero opens `news.html`: a "Breaking news!" screen (one tap plays the news sound, `img/breaking-news.m4a`), then the stories with a news ticker and Nigerian-meme stickers. A real digital camera prints photos when the page opens and every time you press it. Then an animated "shall we?" invites you in and an arrow points to the gallery: two rows of photos drifting in opposite directions. Tap a photo to flip it and see my eyes on the back. "See all my photos" opens the gallery page (`gallery.html`): curtains open, then every photo and TikTok post, newest first, each with a short note. TikTok posts show and play through TikTok's own embedded player. After the gallery comes About me ("if you've made it this far, hi, i'm Toyio"): a looping clip of me, how to say my name with a Listen button that plays my own voice (`img/my-name.m4a`), a few lines about me, a link to my research portfolio, "Quotes I live by" (one quote at a time with next and previous buttons; add one as a new `<figure class="q">`), a card styled like my Apple Music profile, my favourite movie (trailer loads when pressed), and my favourite books and author. Last comes a game, "fix my photo": one of my photos cut into a 3 by 3 sliding puzzle (New photo switches pictures, Peek shows the finished one). Carmen by Olivia Dean plays quietly in the background as soon as the page opens where the browser allows it, otherwise on the visitor's first tap, click or key press (Apple Music's 30-second preview, looped); the player at the top of the page turns it off. Flowers drift around it all.

The photo list, the notes under each photo and the TikTok list all live in `data.js`. To change a note, edit the last bit of text on that photo's line. To add a TikTok post, paste a new line at the top of `tiktoks`.

- Live site: https://toyioudoete.github.io/throughmybigeyes/
- `index.html` (no build step) plus `img/my-big-eyes` (the newspaper-style eyes clipping in the title)
- Photos load from the original Pinterest pins, listed in `data.js`. To add a photo, add its image hash, size, colour, pin id, time and a note there.
- Motion is turned off for visitors who have "reduce motion" set on their device.

All photos © throughmybigeyes.

To add to the About me section, add a new `<p>` line where the comment in `index.html` says. To show an Apple Music playlist there, paste its link into `PLAYLIST`. The age works itself out from the birthday.
