from PIL import Image, ImageDraw, ImageFont, ImageTk

import config

# Keep track of all buttons in a list, one item per button
buttons_list = []

def create_pil_button(name, font_path=config.sniglet, font_size=20, width=120, height=40, bg_color=config.button_bg, fg_color=config.canvas_bg, offset_x=0, offset_y=0, callback=None):
    pil_font = ImageFont.truetype(font_path, font_size)
    button_img = Image.new("RGBA", (width, height), bg_color)
    draw = ImageDraw.Draw(button_img)
    bbox = draw.textbbox((0, 0), name, font=pil_font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    text_x = (width - text_width) // 2
    text_y = (height - text_height) // 2 - 4
    draw.text((text_x, text_y), name, font=pil_font, fill=fg_color)

    photo_img = ImageTk.PhotoImage(button_img)

    # Add to buttons list, id will be assigned when added to canvas
    buttons_list.append({ "name": name, "image": photo_img, "callback": callback, "offset_x": offset_x, "offset_y": offset_y, "id": None })
    return photo_img

# Example buttons
create_pil_button("Reset", offset_x=50, offset_y=60, callback=lambda e: print("Reset clicked!"))
create_pil_button("Check", offset_x=50, offset_y=120, callback=lambda e: print("Check clicked!"))

