# Visual Alankars

Live: https://visual-alankars-siddharths-projects-71061e6a.vercel.app

A small app that draws sargam alankars as triangles while you sing them.

Each line in the text box is one phrase. Notes are plotted by pitch and beat, so an ascending phrase like `S R G R S` draws an up triangle and `M G R G M` draws a down triangle. Set the tempo in BPM, press Play, and the current note lights up on each beat. Playback loops.

Notation: `S R G M P D N`. Lowercase `r g d n` are komal and sit half a row below their line, with a line under the letter. `M#` (or `m`) is tivra Ma, half a row above, with a stroke over the letter. `S'` is the upper octave, `N.` the lower. Every Sa gets a heavier guide line, so one saptak is the gap between two of them. When a score is taller than the stage, the view slides to keep the current phrase in the middle.

Looks: Original, Notebook, Glow, Zinc and Reel, picked in the sidebar. Reel is a 9:16 frame with the top half left empty for your own video. Its background swatches are green and magenta (to key out), black (Screen blend), white (Multiply), and seven warm colours for a reel with the video in the top half.

Run it: open `index.html` in a browser, or serve the folder with `python3 -m http.server`. URL options: `?autoplay=1` starts playing, `?hide=1` opens with the controls hidden, `?pos=N` starts at beat N.
