
import sys
import re

file_path = r'p:\financeiro_kevin\GESTAO-FINANCEIRO-KELVIN\components\Sales.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Using regex to find the button block
pattern = r'(<button\s+onClick=\{\(\)\s*=>\s*setReceiptSale\(sale\)\}.*?</button>)'
replacement = r'\1\n\n                       <button \n                         onClick={() => onDeleteSale(sale.id)} \n                         className="p-2 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors" \n                         title="Excluir Venda" \n                       > \n                         <Trash2 size={18} /> \n                       </button>'

new_content = re.sub(pattern, replacement, content, flags=re.DOTALL)

if new_content != content:
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Successfully added delete button via regex!")
else:
    print("Regex pattern not found.")
