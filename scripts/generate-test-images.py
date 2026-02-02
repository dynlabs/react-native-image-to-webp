#!/usr/bin/env python3
"""
Generate test images in different resolutions for E2E testing.
Creates 1080p, 2K, and 4K test images.
"""

import os
from PIL import Image, ImageDraw, ImageFont
import sys

def create_test_image(width, height, filename, label):
    """Create a test image with the specified dimensions."""
    # Create a new image with RGB mode
    img = Image.new('RGB', (width, height), color='white')
    draw = ImageDraw.Draw(img)
    
    # Try to use a nice font, fallback to default if not available
    try:
        # Try to use a system font
        font_size = min(width, height) // 20
        font = ImageFont.truetype("arial.ttf", font_size)
    except:
        try:
            font = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", font_size)
        except:
            font = ImageFont.load_default()
    
    # Draw a gradient background
    for y in range(height):
        r = int(255 * (1 - y / height))
        g = int(255 * (y / height))
        b = 128
        for x in range(width):
            img.putpixel((x, y), (r, g, b))
    
    # Redraw the image with gradient
    img = Image.new('RGB', (width, height), color='white')
    draw = ImageDraw.Draw(img)
    
    # Draw gradient rectangles
    colors = [
        (255, 0, 0),    # Red
        (0, 255, 0),    # Green
        (0, 0, 255),    # Blue
        (255, 255, 0),  # Yellow
        (255, 0, 255),  # Magenta
        (0, 255, 255),  # Cyan
    ]
    
    rect_width = width // len(colors)
    for i, color in enumerate(colors):
        x1 = i * rect_width
        x2 = (i + 1) * rect_width if i < len(colors) - 1 else width
        draw.rectangle([x1, 0, x2, height], fill=color)
    
    # Draw text label
    text = f"{label}\n{width}x{height}"
    try:
        bbox = draw.textbbox((0, 0), text, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]
        text_x = (width - text_width) // 2
        text_y = (height - text_height) // 2
        draw.text((text_x, text_y), text, fill='white', font=font, stroke_width=3, stroke_fill='black')
    except:
        # Fallback if text rendering fails
        text_x = width // 2 - 50
        text_y = height // 2
        draw.text((text_x, text_y), label, fill='white')
    
    # Save the image
    img.save(filename, 'JPEG', quality=95)
    print(f"Created {filename} ({width}x{height})")

def main():
    # Create test-images directory if it doesn't exist
    test_images_dir = os.path.join(os.path.dirname(__file__), '..', 'test-images')
    os.makedirs(test_images_dir, exist_ok=True)
    
    # Define test image specifications
    test_images = [
        (1920, 1080, 'test-1080p.jpg', '1080p'),
        (2560, 1440, 'test-2k.jpg', '2K'),
        (3840, 2160, 'test-4k.jpg', '4K'),
    ]
    
    print("Generating test images...")
    for width, height, filename, label in test_images:
        filepath = os.path.join(test_images_dir, filename)
        create_test_image(width, height, filepath, label)
    
    print(f"\nTest images created in: {test_images_dir}")
    print("\nFiles created:")
    for _, _, filename, _ in test_images:
        filepath = os.path.join(test_images_dir, filename)
        size_mb = os.path.getsize(filepath) / (1024 * 1024)
        print(f"  - {filename} ({size_mb:.2f} MB)")

if __name__ == '__main__':
    try:
        main()
    except ImportError as e:
        print("Error: PIL (Pillow) is required. Install it with: pip install Pillow")
        sys.exit(1)
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)
