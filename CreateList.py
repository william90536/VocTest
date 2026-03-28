import sys

name = input()
items = []

for voc in sys.stdin:
    en, zh = voc.strip().rsplit(" ", 1)
    items.append(f'{{en: "{en}", zh: "{zh}"}}')

result = f'var {name} = [{", ".join(items)}];'
print(result)