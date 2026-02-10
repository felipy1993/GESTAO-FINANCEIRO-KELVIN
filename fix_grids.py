
import sys
import re

file_path = r'p:\financeiro_kevin\GESTAO-FINANCEIRO-KELVIN\components\Sales.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update Commission Logic grid
content = content.replace('grid-cols-2 gap-4 shadow-inner">', 'grid-cols-1 md:grid-cols-2 gap-4 shadow-inner">')

# 2. Update Shared Details grid
content = content.replace('<div className="grid grid-cols-2 gap-4">', '<div className="grid grid-cols-1 md:grid-cols-2 gap-4">')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Successfully updated grids!")
