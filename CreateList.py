import sys

name = input("輸入單字庫名稱")
items = []

print("輸入單字表(英文 中文)")

for voc in sys.stdin:
    line = voc.strip()
    if not line:
        break
        
    en, zh = line.rsplit(" ", 1)
    items.append(f'{{en: "{en}", zh: "{zh}"}}')

result = f'var {name} = [{", ".join(items)}];'
print(result)