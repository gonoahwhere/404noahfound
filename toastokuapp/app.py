import tkinter as tk
import ctypes
import sys
import os
from PIL import Image, ImageTk

import config

# Creates window
root = tk.Tk()
root.title("Toastoku Sudoku App")

# Allows window to be full screen with title and close buttons visible
root.state("zoomed")

# Set app ID for Windows taskbar icon
if sys.platform.startswith("win"):
    try:
        ctypes.windll.shell32.SetCurrentProcessExplicitAppUserModelID("Toastoku.SudokuApp")
    except Exception as e:
        print("AppUserModelID failed:", e)

# Set window & taskbar icon
icon_path_ico = os.path.abspath("images/app/toastoku-app.ico")
icon_path_png = os.path.abspath("images/app/toastoku-app.png")

if os.path.exists(icon_path_ico):
    try:
        root.iconbitmap(icon_path_ico)
    except Exception as e:
        print("Failed to set .ico icon:", e)

if os.path.exists(icon_path_png):
    icon_img = Image.open(icon_path_png).resize((64, 64))
    tk_icon = ImageTk.PhotoImage(icon_img)
    root.iconphoto(False, tk_icon)

# Creates the canvas for Sudoku
canvas = tk.Canvas(root, bg=config.canvas_bg)
canvas.pack(fill="both", expand=True)