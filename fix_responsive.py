
import sys
import re

file_path = r'p:\financeiro_kevin\GESTAO-FINANCEIRO-KELVIN\components\Sales.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the flex box with a responsive one
old_pattern = r'(<div className="flex gap-2 mb-4">.*?<Plus size=\{20\} />\s*</button>\s*</div>)'
new_content = """<div className="flex flex-col sm:flex-row gap-3 mb-4">
                            <div className="flex-1">
                               <label className="text-[10px] text-slate-500 font-bold mb-1 ml-1 block">PRODUTO</label>
                               <select 
                                 className={`w-full bg-slate-950 border rounded-xl px-4 py-3 text-slate-100 outline-none shadow-sm transition-colors ${currentProductId && products.find(p => p.id === currentProductId)?.stock === 0 ? 'border-rose-500/50 focus:border-rose-500' : 'border-slate-700 focus:border-emerald-500'}`} 
                                 value={currentProductId} 
                                 onChange={(e) => setCurrentProductId(e.target.value)}
                               >
                                  <option value="">Selecione o Produto...</option>
                                  {products.map(p => (
                                    <option key={p.id} value={p.id} disabled={p.stock <= 0}>
                                      {p.name} - R$ {p.price.toFixed(2)} {p.stock <= 0 ? '(SEM ESTOQUE)' : `(${p.stock} un)`}
                                    </option>
                                  ))}
                               </select>
                            </div>
                            <div className="flex gap-2 items-end">
                               <div className="w-24">
                                  <label className="text-[10px] text-slate-500 font-bold mb-1 ml-1 block">QTD.</label>
                                  <input 
                                    type="number" 
                                    min="1" 
                                    value={quantity} 
                                    onChange={(e) => setQuantity(Number(e.target.value))} 
                                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2 py-3 text-center text-slate-100 outline-none focus:border-emerald-500 shadow-sm" 
                                  />
                               </div>
                               <button 
                                 onClick={handleAddItem} 
                                 disabled={!currentProductId || products.find(p => p.id === currentProductId)?.stock === 0} 
                                 className="flex-1 sm:w-14 h-[50px] bg-emerald-500 text-white flex items-center justify-center rounded-xl disabled:opacity-50 disabled:bg-slate-700 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                                 title="Adicionar ao Carrinho"
                               >
                                 <Plus size={24} />
                               </button>
                            </div>
                         </div>"""

# Using a more robust regex that ignores whitespace differences
# We'll just target the part between SALE activeTab and the cartItems map
pattern = re.compile(r'\{activeTab === \'SALE\' && \(\s*<div.*?(<div className="flex gap-2 mb-4">.*?<Plus size=\{20\} />\s*</button>\s*</div>)', re.DOTALL)

matches = pattern.findall(content)
if matches:
    print(f"Found {len(matches)} matches")
    # Replace the inner div
    updated_content = content.replace(matches[0], new_content)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(updated_content)
    print("Successfully updated!")
else:
    print("Match not found")
