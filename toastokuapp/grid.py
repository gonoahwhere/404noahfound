import tkinter as tk
from PIL import Image, ImageDraw, ImageFont, ImageTk

import config
import app
import buttons
import board
from board import randomize_board

import difficulty
import themeSelect

canvas_width = 0
canvas_height = 0
number_images = []
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

# Draws the Sudoku grid
def draw_grid(width, height, board_data=None):
    global buttons, canvas_width, canvas_height, number_images
    canvas_width = width
    canvas_height = height

    # Clears previously drawn game when resizing
    app.canvas.delete("grid")
    app.canvas.delete("numbers")
    app.canvas.delete("buttons")
    number_images.clear()
    
    # Define grid sizes, number of cells per row/column
    max_grid_size = 600
    rows, cols = 9, 9

    # Resize grid to fit screen size
    cell_size = min(min(width, height) // 9, max_grid_size // 9)
    grid_width = cols * cell_size
    grid_height = rows * cell_size
    offset_x = (width - grid_width) // 2
    offset_y = (height - grid_height) // 2

    # Draw grid lines and border
    for i in range(1, rows):
        if i % 3 != 0:
            y = offset_y + i * cell_size
            app.canvas.create_line(offset_x, y, offset_x + grid_width, y, fill=config.grid_thinlines, width=1, tags="grid")
    for j in range(1, cols):
        if j % 3 != 0:
            x = offset_x + j * cell_size
            app.canvas.create_line(x, offset_y, x, offset_y + grid_height, fill=config.grid_thinlines, width=1, tags="grid")

    # Draw thick lines on top
    for i in range(1, rows):
        if i % 3 == 0:
            y = offset_y + i * cell_size
            app.canvas.create_line(offset_x, y, offset_x + grid_width, y, fill=config.grid_thicklines, width=3, tags="grid")
    for j in range(1, cols):
        if j % 3 == 0:
            x = offset_x + j * cell_size
            app.canvas.create_line(x, offset_y, x, offset_y + grid_height, fill=config.grid_thicklines, width=3, tags="grid")

    app.canvas.create_rectangle(offset_x, offset_y, offset_x + grid_width, offset_y + grid_height, outline=config.grid_border, width=3, tags="grid")

    # Draw buttons
    for btn in buttons.buttons_list:
        btn_x = offset_x + grid_width + btn["offset_x"]
        btn_y = offset_y + btn["offset_y"]
        btn["id"] = app.canvas.create_image(btn_x, btn_y, anchor="nw", image=btn["image"], tags="buttons")
        if btn["callback"]:
            app.canvas.tag_bind(btn["id"], "<Button-1>", btn["callback"])

    # Draw numbers using PIL
    if board_data:
        current_theme = themeSelect.current_theme
        for i in range(rows):
            for j in range(cols):
                num = board_data[i][j]
                if num != 0:
                    x = offset_x + j * cell_size
                    y = offset_y + i * cell_size
                    tile = board.get_images_for_number(num, current_theme)

                    if isinstance(tile, str) and tile.isdigit():
                        cell_img = Image.new("RGBA", (cell_size, cell_size), (0,0,0,0))
                        draw = ImageDraw.Draw(cell_img)
                        number_font = ImageFont.truetype(config.chewy, int(cell_size*0.4))
                        bbox = draw.textbbox((0,0), str(num), font=number_font)
                        text_width = bbox[2] - bbox[0]
                        text_height = bbox[3] - bbox[1]
                        y_shift = -cell_size * 0.1
                        draw.text(((cell_size - text_width)/2, (cell_size - text_height)/2 + y_shift), str(num), font=number_font, fill=config.prefilled_numbers)
                    else:
                        img = Image.open(tile).convert("RGBA")
                        scale_factor = 0.7
                        new_size = int(cell_size * scale_factor)
                        img = img.resize((new_size, new_size), Image.Resampling.LANCZOS)
                        cell_img = Image.new("RGBA", (cell_size, cell_size), (0, 0, 0, 0))
                        x_offset = (cell_size - new_size) // 2
                        y_offset = (cell_size - new_size) // 2
                        cell_img.paste(img, (x_offset, y_offset), img)

                    tk_img = ImageTk.PhotoImage(cell_img)
                    number_images.append(tk_img)
                    app.canvas.create_image(x, y, image=tk_img, anchor="nw", tags="numbers")

# Generates random numbers 1-9 and draws onto grid
def new_game(event=None):
    global canvas_width, canvas_height
    if canvas_width == 0 or canvas_height == 0:
        return
    board = randomize_board(difficulty.current_difficulty)
    draw_grid(canvas_width, canvas_height, board)


# Handles resizing the grid
def on_resize(event):
    from board import get_board
    draw_grid(event.width, event.height, get_board())
    difficulty.draw_label()
    themeSelect.draw_label()
    create_toastoku_label("Toastoku Desktop App")

app.canvas.bind("<Configure>", on_resize)
