import openpyxl
import json
import re
import os

def clean_text(val):
    if val is None:
        return ""
    text = str(val).strip()
    if text == "None":
        return ""
    return text

def parse_pinyin_and_hanviet(pinyin_raw):
    # Check if there is Han-Viet in brackets, e.g. "ài qíng [ái tình]"
    m = re.search(r'^(.*?)\s*\[(.*?)\]$', pinyin_raw)
    if m:
        pinyin = m.group(1).strip()
        hanviet = m.group(2).strip()
        return pinyin, hanviet
    return pinyin_raw.strip(), ""

def extract_excel():
    excel_path = "từ vựng H1-H6.xlsx"
    wb_cached = openpyxl.load_workbook(excel_path, data_only=True)
    wb_raw = openpyxl.load_workbook(excel_path, data_only=False)

    os.makedirs("public/data", exist_ok=True)

    levels = ["HSK1", "HSK2", "HSK3", "HSK4", "HSK5", "HSK6"]
    summary = {}
    all_words = []

    for level in levels:
        sheet = wb_cached[level]
        sheet_raw = wb_raw[level]

        rows = list(sheet.iter_rows(values_only=True))
        raw_rows = list(sheet_raw.iter_rows(values_only=True))

        words = []
        for idx, (row, raw_row) in enumerate(zip(rows[1:], raw_rows[1:])):
            if not any(row):
                continue
            
            word = clean_text(row[0])
            if not word:
                continue

            # Pinyin handling
            pinyin_raw = clean_text(row[1])
            if not pinyin_raw or pinyin_raw.startswith("=") or pinyin_raw == "#NAME?":
                if level == "HSK1" and word == "爱":
                    pinyin_raw = "ài"
                else:
                    pinyin_raw = ""
            
            pinyin, hanviet = parse_pinyin_and_hanviet(pinyin_raw)

            meaning = clean_text(row[2]) if len(row) > 2 else ""
            example = clean_text(row[3]) if len(row) > 3 else ""

            # Example translation fallback handling
            example_trans = clean_text(row[4]) if len(row) > 4 else ""
            if not example_trans:
                raw_ex = str(raw_row[4]) if len(raw_row) > 4 and raw_row[4] else ""
                m = re.search(r',\"([^\"]+)\"\)\)', raw_ex)
                if m:
                    example_trans = m.group(1)
                else:
                    example_trans = ""

            item = {
                "id": f"{level.lower()}_{len(words)+1}",
                "level": level,
                "word": word,
                "pinyin": pinyin,
                "hanviet": hanviet,
                "meaning": meaning,
                "example": example,
                "example_trans": example_trans
            }
            words.append(item)
            all_words.append(item)

        out_path = f"public/data/{level.lower()}.json"
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(words, f, ensure_ascii=False, indent=2)

        summary[level] = {
            "name": level,
            "count": len(words),
            "file": f"/data/{level.lower()}.json"
        }
        print(f"Exported {level}: {len(words)} words to {out_path}")

    # Write summary
    summary_data = {
        "total": len(all_words),
        "levels": summary
    }
    with open("public/data/summary.json", "w", encoding="utf-8") as f:
        json.dump(summary_data, f, ensure_ascii=False, indent=2)

    # Also write a complete hsk_all.json for quick offline indexing / full search
    with open("public/data/all_words.json", "w", encoding="utf-8") as f:
        json.dump(all_words, f, ensure_ascii=False)

    print(f"Total exported words: {len(all_words)}")

if __name__ == "__main__":
    extract_excel()
