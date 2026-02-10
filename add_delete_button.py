
import sys
import re

file_path = r'p:\financeiro_kevin\GESTAO-FINANCEIRO-KELVIN\components\Sales.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replacement: Add the delete button after the receipt button
target = """                       <button 
                         onClick={() => setReceiptSale(sale)}
                         className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                         title="Ver Recibo"
                       >
                         <FileText size={20} />
                       </button>"""

replacement = target + """

                       <button 
                         onClick={() => onDeleteSale(sale.id)}
                         className="p-2 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                         title="Excluir Venda"
                       >
                         <Trash2 size={18} />
                       </button>"""

new_content = content.replace(target, replacement)

if new_content != content:
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Successfully added delete button!")
else:
    print("Target not found.")
