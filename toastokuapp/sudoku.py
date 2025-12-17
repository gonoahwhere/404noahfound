import grid
import app
import buttons
import difficulty
import themeSelect
import board

difficulties = ["Very Easy", "Easy", "Medium", "Hard", "Very Hard", "Expert"]
diff_current_index = 1

def toggle_difficulty(event=None):
    global diff_current_index
    diff_current_index = (diff_current_index + 1) % len(difficulties)
    diff_selected = difficulties[diff_current_index]
    difficulty.set_difficulty(diff_selected)

themes = ["Default", "Animals", "Colorblind", "Faces", "Toastie", "Transport"]
theme_current_index = 0

def toggle_theme(event=None):
    global theme_current_index
    theme_current_index = (theme_current_index + 1) % len(themes)
    theme_selected = themes[theme_current_index]
    themeSelect.set_theme(theme_selected)

buttons.create_pil_button("New Game", offset_x=50, offset_y=0, callback=grid.new_game)
buttons.create_pil_button("Theme", offset_x=190, offset_y=0, callback=toggle_theme)
buttons.create_pil_button("Difficulty", offset_x=190, offset_y=60, callback=toggle_difficulty)

app.root.mainloop()
