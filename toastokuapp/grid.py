import tkinter as tk
from PIL import Image, ImageDraw, ImageFont, ImageTk

import config
import app

canvas_width = 0
canvas_height = 0

persistent_label_id = None
persistent_label_img = None

# Creates the title for the game above the grid
def create_toastoku_label(text="Toastoku Desktop App"):
    global persistent_label_id, persistent_label_img

    canvas_width = app.canvas.winfo_width()
    canvas_height = app.canvas.winfo_height()
    max_grid_size = 600
    rows, cols = 9, 9
    cell_size = min(min(canvas_width, canvas_height) // 9, max_grid_size // 9)
    grid_width = cols * cell_size
    grid_height = rows * cell_size
    offset_x = (canvas_width - grid_width) // 2
    offset_y = (canvas_height - grid_height) // 2
    font = ImageFont.truetype(config.dinofiles, 50)
    dummy_img = Image.new("RGBA", (1, 1))
    draw = ImageDraw.Draw(dummy_img)
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    text_img = Image.new("RGBA", (text_width, text_height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(text_img)
    draw.text((0, 0), text, font=font, fill=config.game_title)
    persistent_label_img = ImageTk.PhotoImage(text_img)

    x = offset_x + grid_width // 2
    y = offset_y - 100

    if persistent_label_id is None:
        persistent_label_id = app.canvas.create_image(x, y, image=persistent_label_img, anchor="n", tags="game_label")
    else:
        app.canvas.itemconfig(persistent_label_id, image=persistent_label_img)
        app.canvas.coords(persistent_label_id, x, y)

# Draw the Sudoku grid
def draw_grid(width, height):
    global canvas_width, canvas_height
    canvas_width = width
    canvas_height = height

    app.canvas.delete("grid")

    max_grid_size = 600
    rows, cols = 9, 9
    cell_size = min(min(width, height) // 9, max_grid_size // 9)
    grid_width = cols * cell_size
    grid_height = rows * cell_size
    offset_x = (width - grid_width) // 2
    offset_y = (height - grid_height) // 2

    # Draw thin grid lines first
    for i in range(1, rows):
        if i % 3 != 0:
            y = offset_y + i * cell_size
            app.canvas.create_line(offset_x, y, offset_x + grid_width, y, fill=config.grid_thinlines, width=1, tags="grid")

    for j in range(1, cols):
        if j % 3 != 0:
            x = offset_x + j * cell_size
            app.canvas.create_line(x, offset_y, x, offset_y + grid_height, fill=config.grid_thinlines, width=1, tags="grid")

    # Draw thick lines after thin lines
    for i in range(1, rows):
        if i % 3 == 0:
            y = offset_y + i * cell_size
            app.canvas.create_line(offset_x, y, offset_x + grid_width, y, fill=config.grid_thicklines, width=3, tags="grid")

    for j in range(1, cols):
        if j % 3 == 0:
            x = offset_x + j * cell_size
            app.canvas.create_line(x, offset_y, x, offset_y + grid_height, fill=config.grid_thicklines, width=3, tags="grid")

    # Draw border after thin and thick lines
    app.canvas.create_rectangle(offset_x, offset_y, offset_x + grid_width, offset_y + grid_height, outline=config.grid_border, width=3, tags="grid")

# Handles grid resizeing
def on_resize(event):
    draw_grid(event.width, event.height)
    create_toastoku_label("Toastoku Desktop App")

app.canvas.bind("<Configure>", on_resize)