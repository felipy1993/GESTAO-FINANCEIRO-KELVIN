
import sys

file_path = r'p:\financeiro_kevin\GESTAO-FINANCEIRO-KELVIN\components\Dashboard.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

target = 'const daysDiff = Math.ceil((inst.dueDate - Date.now()) / (1000 * 60 * 60 * 24));'
replacement = 'const daysDiff = getDaysDiff(inst.dueDate);'

if target in content:
    new_content = content.replace(target, replacement)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Successfully fixed daysDiff in Dashboard.tsx")
else:
    print("Target string not found in Dashboard.tsx")
