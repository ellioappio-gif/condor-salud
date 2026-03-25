#!/usr/bin/env python3
"""Strip all emoji characters from source files.

Uses a comprehensive approach: targets all Unicode emoji ranges while
preserving box-drawing, arrows, and other non-emoji special characters.
Also handles functional characters (close buttons, star ratings, etc.)
by replacing them with appropriate text alternatives.
"""
import re
import glob

# ── Step 1: Direct character replacements (functional chars) ──
# These get replaced with text alternatives, not just removed
REPLACEMENTS = {
    '\u2715': '\u00D7',  # ✕ close button → × (multiplication sign)
    '\u2717': '\u2014',  # ✗ cross mark → — (em dash, meaning "none")
    '\u2605': '*',       # ★ star → asterisk
}

# ── Step 2: Characters to remove entirely ──
# Comprehensive list of ALL emoji/symbol characters to strip
REMOVE = [
    # Checkmarks & crosses
    '\u2705',  # ✅
    '\u274C',  # ❌
    '\u274E',  # ❎
    '\u2713',  # ✓
    '\u2714',  # ✔
    '\u2716',  # ✖
    '\u2728',  # ✨
    # Warning / info symbols
    '\u26A0',  # ⚠
    '\u26A1',  # ⚡
    # Circles
    '\u2B50',  # ⭐
    '\u2764',  # ❤
    '\u2744',  # ❄
    # Clock / timer
    '\u23F0',  # ⏰
    '\u23F1',  # ⏱
    '\u23F2',  # ⏲
    # Medical
    '\u2695',  # ⚕
    # Variation selector & ZWJ
    '\uFE0F',  # variation selector-16
    '\u200D',  # zero width joiner
]

# ── Full emoji Unicode blocks (surrogate pairs / astral plane) ──
# These ranges cover all standard emoji pictographs
EMOJI_RANGES = [
    ('\U0001F600', '\U0001F64F'),  # Emoticons (😀–🙏)
    ('\U0001F300', '\U0001F5FF'),  # Misc Symbols & Pictographs (🌀–🗿)
    ('\U0001F680', '\U0001F6FF'),  # Transport & Map (🚀–🛿)
    ('\U0001F700', '\U0001F77F'),  # Alchemical Symbols
    ('\U0001F780', '\U0001F7FF'),  # Geometric Shapes Extended (🟠–🟫)
    ('\U0001F800', '\U0001F8FF'),  # Supplemental Arrows-C
    ('\U0001F900', '\U0001F9FF'),  # Supplemental Symbols & Pictographs (🤐–🧿)
    ('\U0001FA00', '\U0001FA6F'),  # Chess Symbols
    ('\U0001FA70', '\U0001FAFF'),  # Symbols & Pictographs Extended-A (🩰–🫿)
    ('\U0001F1E0', '\U0001F1FF'),  # Regional Indicators (flags)
    ('\U00010000', '\U0001004F'),  # Linear B
]

# Build single character class pattern
parts = []
# Add individual chars to remove
for ch in REMOVE:
    parts.append(re.escape(ch))
# Add ranges
for start, end in EMOJI_RANGES:
    parts.append(f'{re.escape(start)}-{re.escape(end)}')

remove_pattern = re.compile('[' + ''.join(parts) + ']+')

# Pattern: emoji(+optional trailing space)
remove_with_space = re.compile('[' + ''.join(parts) + ']+[ ]?')

files_changed = 0
total_replacements = 0

for pattern in ['src/**/*.ts', 'src/**/*.tsx']:
    for filepath in glob.glob(pattern, recursive=True):
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        new_content = content

        # Step 1: Apply direct replacements first
        for old_char, new_char in REPLACEMENTS.items():
            new_content = new_content.replace(old_char, new_char)

        # Step 2: Remove all remaining emojis (with trailing space if present)
        new_content = remove_with_space.sub('', new_content)

        if new_content != content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            orig_lines = content.split('\n')
            new_lines = new_content.split('\n')
            changes = sum(1 for a, b in zip(orig_lines, new_lines) if a != b)
            total_replacements += changes
            files_changed += 1
            print(f'  {filepath}: {changes} lines changed')

print(f'\nTotal: {files_changed} files, {total_replacements} lines changed')
