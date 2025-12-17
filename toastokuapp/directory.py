"""
fonts/:
    - stores fonts used within the app
    - used with PIL, instead of locally installing fonts

images/:
    app/:
        - images for the app itself
        - icon/task bar icon
    assets/:
        stores images used for themes
        each folder is a theme, replaces 1-9

app.py:
    - creates the window, and canvas used for the game

board.py:
    - handles randomizing the board when a new game is created

config.py:
    - stores global data such as fonts, colours, styles

difficulty.py:
    - handles difficulty settings
    
directory.py:
    - this file, explains what each file does

grid.py:
    - draws sudoku grid and numbers when buttons are pressed
    
sudoku.py:
    - main file for the app

themeSelect.py:
    - handles theme settings
"""