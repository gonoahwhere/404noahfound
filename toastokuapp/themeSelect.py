from tkinter import font as tkFont

import app
import config

theme_text_id = None
current_theme = "Default"

theme_options = ["Default", "Animals", "Colorblind", "Faces", "Toastie", "Transport"]

fnt = tkFont.Font(family="Sniglet", size=16)
max_theme_length = max(len(t) for t in theme_options)
label_template = f"Theme: {{:<{max_theme_length}}}"

def set_theme(theme=None):
    global current_theme
    if theme:
        current_theme = theme
    draw_label()

def draw_label():
    global theme_text_id, current_theme

    canvas_width = app.canvas.winfo_width()
    canvas_height = app.canvas.winfo_height()
    max_grid_size = 600
    rows, cols = 9, 9
    cell_size = min(min(canvas_width, canvas_height) // 9, max_grid_size // 9)
    grid_width = cols * cell_size
    grid_height = rows * cell_size
    offset_x = (canvas_width - grid_width) // 2
    offset_y = (canvas_height - grid_height) // 2

    # Position label to the left of the grid
    label_x = offset_x - 350
    label_y = offset_y + grid_height // 2 - 30
    label_text = label_template.format(current_theme)

    if theme_text_id is not None:
        app.canvas.itemconfig(theme_text_id, text=label_text, font=fnt)
        app.canvas.coords(theme_text_id, label_x, label_y)
    else:
        theme_text_id = app.canvas.create_text(label_x, label_y, text=label_text, font=fnt, fill=config.game_stats, anchor="w")