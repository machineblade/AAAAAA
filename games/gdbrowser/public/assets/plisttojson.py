import sys
import json
import plistlib
import re
from pathlib import Path


def parse_rect(s):
    nums = list(map(float, re.findall(r'-?\d+\.?\d*', s)))
    return {"x": nums[0], "y": nums[1], "w": nums[2], "h": nums[3]}


def parse_size(s):
    nums = list(map(float, re.findall(r'-?\d+\.?\d*', s)))
    return {"w": nums[0], "h": nums[1]}


def parse_point(s):
    nums = list(map(float, re.findall(r'-?\d+\.?\d*', s)))
    return {"x": nums[0], "y": nums[1]}


def convert(plist_path):
    with open(plist_path, "rb") as f:
        data = plistlib.load(f)

    frames_data = data.get("frames", {})
    meta = data.get("metadata", {})

    image_file = (
        meta.get("textureFileName")
        or meta.get("realTextureFileName")
        or Path(plist_path).with_suffix(".png").name
    )

    sheet_size = {"w": 0, "h": 0}
    if "size" in meta:
        sheet_size = parse_size(meta["size"])

    frames = {}
    for name, fd in frames_data.items():
        rect_str = fd.get("textureRect") or fd.get("frame", "{0,0,0,0}")
        rect = parse_rect(rect_str)

        is_rotated = fd.get("textureRotated", fd.get("rotated", False))

        src_size = parse_size(fd["sourceSize"]) if "sourceSize" in fd else {"w": rect["w"], "h": rect["h"]}

        sss = parse_size(fd["spriteSourceSize"]) if "spriteSourceSize" in fd else {"w": src_size["w"], "h": src_size["h"]}

        off = parse_point(fd["spriteOffset"]) if "spriteOffset" in fd else (parse_point(fd["offset"]) if "offset" in fd else {"x": 0, "y": 0})

        is_trimmed = fd.get("spriteTrimmed", fd.get("trimmed", False))

        frames[name] = {
            "frame": {
                "x": int(rect["x"]),
                "y": int(rect["y"]),
                "w": int(rect["h"] if is_rotated else rect["w"]),
                "h": int(rect["w"] if is_rotated else rect["h"]),
            },
            "rotated": bool(is_rotated),
            "trimmed": bool(is_trimmed),
            "spriteSourceSize": {
                "x": round(src_size["w"] / 2 + off["x"] - sss["w"] / 2),
                "y": round(src_size["h"] / 2 - off["y"] - sss["h"] / 2),
                "w": int(sss["w"]),
                "h": int(sss["h"]),
            },
            "sourceSize": {"w": int(src_size["w"]), "h": int(src_size["h"])},
            "anchor": {"x": 0.5, "y": 0.5},
        }

    result = {
        "frames": frames,
        "meta": {
            "app": "plist-to-pixi",
            "version": "1.0",
            "image": image_file,
            "format": "RGBA8888",
            "size": sheet_size,
            "scale": "1",
        },
    }

    out_path = Path(plist_path).with_suffix(".json")
    with open(out_path, "w") as f:
        json.dump(result, f, indent=2)

    print(f"Converted {len(frames)} frames -> {out_path}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python plist_to_pixi.py spritesheet.plist")
        sys.exit(1)
    convert(sys.argv[1])