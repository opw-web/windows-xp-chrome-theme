"""Regenerate Luna Chrome's horizontally tiled PNGs with standard-library Python."""

import struct
import zlib
from pathlib import Path


IMAGE_DIR = Path(__file__).resolve().parent / "theme" / "images"
WIDTH = 64

# Windows consumes some of the top of the frame in a maximized window.
# Keep highlights both at the restored top edge and in the visible strip.
FRAME = [
    (0, "173783"),
    (1, "6C9FE9"),
    (4, "4882D0"),
    (16, "407BCE"),
    (17, "78A6E8"),
    (19, "568CD7"),
    (24, "3C76CC"),
    (30, "2864C7"),
    (42, "2864C7"),
    (50, "2058BC"),
    (53, "17449F"),
    (55, "12337F"),
    (95, "12337F"),
]
FRAME_INACTIVE = [
    (0, "263C68"),
    (1, "8CA8CC"),
    (5, "678CB9"),
    (16, "597DAC"),
    (17, "90ADD6"),
    (19, "7698C6"),
    (26, "4F73A7"),
    (32, "41669D"),
    (42, "41669D"),
    (50, "385889"),
    (55, "293F6B"),
    (95, "293F6B"),
]
TAB_FACE = [
    (26, "193F83"),
    (27, "FFFFFF"),
    (28, "F3F8FF"),
    (39, "E3EEFE"),
    (45, "CFDFF5"),
    (46, "98B9E6"),
    (47, "173E89"),
]
BACKGROUND_TAB_FACE = [
    (27, "71A2E6"),
    (28, "5188D8"),
    (33, "326FCB"),
    (41, "2A63C2"),
    (46, "255AB3"),
    (47, "174289"),
]
BACKGROUND_TAB_FACE_INACTIVE = [
    (27, "7494BF"),
    (28, "6688B7"),
    (33, "4F73A7"),
    (41, "42679D"),
    (46, "3D5B8B"),
    (47, "2C4777"),
]
TOOLBAR_FACE = [
    (56, "A4C2ED"),
    (57, "FFFFFF"),
    (58, "F1F7FF"),
    (65, "DDEAFB"),
    (84, "CADDF7"),
    (91, "B5CDEE"),
    (93, "ABC4E7"),
    (95, "E7F0FE"),
    (111, "CBDDF6"),
    (127, "B9CEF0"),
]
CAPTION_BLUE = [
    (0, "214B99"), (1, "90BBFA"), (2, "669EEC"), (6, "467DCF"),
    (9, "2C64C3"), (16, "285BB4"), (18, "1E4B9F"), (19, "153878"),
]
CAPTION_RED = [
    (0, "7D251D"), (1, "FFD2AD"), (2, "ED9474"), (6, "D96A4A"),
    (9, "BC4832"), (16, "A93626"), (18, "89241B"), (19, "64221C"),
]


def gradient_rows(stops):
    """Fill the rows between RGB control points by linear interpolation."""
    for (top, first), (bottom, last) in zip(stops, stops[1:]):
        first_rgb, last_rgb = bytes.fromhex(first), bytes.fromhex(last)
        for y in range(top, bottom):
            position = (y - top) / (bottom - top)
            yield bytes(round(a + (b - a) * position) for a, b in zip(first_rgb, last_rgb))
    yield bytes.fromhex(stops[-1][1])


def png_chunk(kind, payload):
    checksum = zlib.crc32(kind + payload)
    return struct.pack(">I", len(payload)) + kind + payload + struct.pack(">I", checksum)


def write_png(path, width, rows, color_type=2):
    header = struct.pack(">IIBBBBB", width, len(rows), 8, color_type, 0, 0, 0)
    path.write_bytes(
        b"\x89PNG\r\n\x1a\n"
        + png_chunk(b"IHDR", header)
        + png_chunk(b"IDAT", zlib.compress(b"".join(b"\0" + row for row in rows), level=9))
        + png_chunk(b"IEND", b"")
    )


def write_gradient(filename, stops):
    rows = [color * WIDTH for color in gradient_rows(stops)]
    write_png(IMAGE_DIR / filename, WIDTH, rows)


def write_tab_surface(filename, frame_stops, face_stops):
    colors = list(gradient_rows(frame_stops))
    colors[face_stops[0][0] : face_stops[-1][0] + 1] = gradient_rows(face_stops)
    write_png(IMAGE_DIR / filename, WIDTH, [color * WIDTH for color in colors])


def write_toolbar():
    # Chrome paints the tab through a curved mask. The top corners and lower
    # flares receive frame blue. Only the nearly vertical part gets a pale face.
    frame = list(gradient_rows(FRAME))
    tab_top, tab_bottom = TAB_FACE[0][0], TAB_FACE[-1][0]
    toolbar_top = TOOLBAR_FACE[0][0]
    colors = (
        frame[:tab_top]
        + list(gradient_rows(TAB_FACE))
        + frame[tab_bottom + 1 : toolbar_top]
        + list(gradient_rows(TOOLBAR_FACE))
    )
    write_png(IMAGE_DIR / "toolbar.png", WIDTH, [color * WIDTH for color in colors])


def write_caption_buttons():
    # Chrome on Windows samples 45px-wide slots with a 1px gap.
    slot_width = 46
    plate_width = 21
    inset = 12
    blank = b"\0" * 4
    blue, red = list(gradient_rows(CAPTION_BLUE)), list(gradient_rows(CAPTION_RED))
    rows = [blank * (3 * slot_width)] * 9
    for blue_color, red_color in zip(blue, red):
        slots = []
        for fill, edge in [(blue_color, blue[0]), (blue_color, blue[0]), (red_color, red[0])]:
            plate = edge + b"\xff" + (fill + b"\xff") * (plate_width - 2) + edge + b"\xff"
            slots.append(blank * inset + plate + blank * (slot_width - plate_width - inset))
        rows.append(b"".join(slots))
    rows.extend([blank * (3 * slot_width)] * 11)
    write_png(IMAGE_DIR / "caption-buttons.png", 3 * slot_width, rows, color_type=6)


def write_new_tab_icon():
    # A small browser window, aligned to the native 16px tab-icon grid.
    pixels = [
        "................",
        ".oooooooooooooo.",
        ".ohhhhhhhhhhhho.",
        ".obbbbbbbbbbbbo.",
        ".oooooooooooooo.",
        ".oppppppppppppo.",
        ".opwwwwwwwwwwpo.",
        ".opwwwwwwwwwwpo.",
        ".opwgggggwwwwpo.",
        ".opwwwwwwwwwwpo.",
        ".opwgggwwwwwwpo.",
        ".opwwwwwwwwwwpo.",
        ".oppppppppppppo.",
        ".oooooooooooooo.",
        "................",
        "................",
    ]
    colors = {
        ".": bytes(4), "o": bytes.fromhex("173D83FF"),
        "h": bytes.fromhex("76ADFAFF"), "b": bytes.fromhex("2864C7FF"),
        "p": bytes.fromhex("C1DBF9FF"), "w": bytes.fromhex("FEFCF4FF"),
        "g": bytes.fromhex("8BAAD0FF"),
    }
    icons = IMAGE_DIR.parents[1] / "new-tab" / "icons"
    icons.mkdir(parents=True, exist_ok=True)
    for scale in (1, 2):
        rows = [b"".join(colors[pixel] * scale for pixel in row) for row in pixels]
        write_png(icons / f"window-{16 * scale}.png", 16 * scale,
                  [row for row in rows for _ in range(scale)], color_type=6)


if __name__ == "__main__":
    IMAGE_DIR.mkdir(parents=True, exist_ok=True)
    write_gradient("frame.png", FRAME)
    write_gradient("frame-inactive.png", FRAME_INACTIVE)
    write_tab_surface("tabs.png", FRAME, BACKGROUND_TAB_FACE)
    write_tab_surface("tabs-inactive.png", FRAME_INACTIVE, BACKGROUND_TAB_FACE_INACTIVE)
    write_toolbar()
    write_caption_buttons()
    write_new_tab_icon()
