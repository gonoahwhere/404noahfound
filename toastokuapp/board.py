import random
import difficulty
import config

import os

current_board = [[0]*9 for _ in range(9)]

difficulty_prefilled = {
    "Very Easy": (45, 50),
    "Easy": (40, 44),
    "Medium": (34, 39),
    "Hard": (28, 33),
    "Very Hard": (22, 27),
    "Expert": (17, 21)
}

def fill_grid(grid):
    numbers = list(range(1, 10))
    for i in range(9):
        for j in range(9):
            if grid[i][j] == 0:
                random.shuffle(numbers)
                for n in numbers:
                    if is_safe(grid, i, j, n):
                        grid[i][j] = n
                        if fill_grid(grid):
                            return True
                        grid[i][j] = 0
                return False
    return True

def is_safe(grid, row, col, num):
    if num in grid[row] or num in [grid[r][col] for r in range(9)]:
        return False
    start_row, start_col = 3 * (row // 3), 3 * (col // 3)
    for r in range(start_row, start_row + 3):
        for c in range(start_col, start_col + 3):
            if grid[r][c] == num:
                return False
    return True

def get_images_for_number(number, theme="default"):
    if theme == "default" or theme == "Default":
        return str(number)
    
    theme_path = os.path.join(config.assets, theme, f"{number}.png")
    if os.path.exists(theme_path):
        return theme_path
    else:
        return str(number)
    
def generate_full_board():
    grid = [[0] * 9 for _ in range(9)]
    fill_grid(grid)
    return grid


def generate_board(diff="Easy"):
    full = generate_full_board()
    min_cells, max_cells = difficulty_prefilled.get(diff, (40, 44))
    clues = random.randint(min_cells, max_cells)
    positions = list(range(81))
    random.shuffle(positions)

    for pos in positions[:81 - clues]:
        r, c = divmod(pos, 9)
        full[r][c] = 0
        
    return full


def randomize_board(diff="Easy"):
    global current_board
    current_board = generate_board(diff)
    return current_board


def get_board():
    return current_board
