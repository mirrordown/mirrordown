<!-- @case: in a table cell the bar is written escaped -->

| Portrait |
| -------- |
| ![Engelbart\|100x145](e.jpg) |

<!-- @case: an unescaped bar in a table cell ends the cell -->

| Portrait | Size |
| -------- | ---- |
| ![Engelbart|100](e.jpg) |

<!-- @case: sized and unsized images in table cells -->

| Plain | Sized |
| ----- | ----- |
| ![p](a.jpg) | ![s\|50](b.jpg) |
