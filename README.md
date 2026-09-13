# Visual Alankars

A small app that draws sargam alankars as triangles while you sing them.

Each line in the text box is one phrase. Notes are plotted by pitch and beat, so an ascending phrase like `S R G R S` draws an up triangle and `M G R G M` draws a down triangle. Set the tempo in BPM, press Play, and the current note lights up on each beat. Playback loops.

Notation: `S R G M P D N`. Lowercase `r g d n` are komal and sit half a row below their line, with a line under the letter. `M#` (or `m`) is tivra Ma, half a row above, with a stroke over the letter. `S'` is the upper octave, `N.` the lower. Every Sa gets a heavier guide line, so one saptak is the gap between two of them. When a score is taller than the stage, the view slides to keep the current phrase in the middle.

Run it: open `index.html` in a browser, or serve the folder with `python3 -m http.server`.
