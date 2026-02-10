
import sys
import re

file_path = r'p:\financeiro_kevin\GESTAO-FINANCEIRO-KELVIN\components\Sales.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Part to insert: Customize Plan UI
custom_ui = """                           <div className="col-span-2">
                              <label className="text-xs text-slate-500 mb-1 block">Vencimento / 1ª Parcela</label>
                              <input type="date" className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-2 text-slate-100" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                           </div>

                           <div className="col-span-2 mt-2">
                             <button 
                               type="button"
                               onClick={() => setIsEditingPlan(!isEditingPlan)}
                               className={`text-xs font-bold flex items-center gap-1 transition-colors ${isEditingPlan ? 'text-amber-500' : 'text-emerald-500'}`}
                             >
                                <Edit2 size={12} /> {isEditingPlan ? 'Calc. Automático (Limpar)' : 'Personalizar Datas/Valores'}
                             </button>
                           </div>

                           {isEditingPlan && (
                             <div className="col-span-2 space-y-2 mt-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                               {customPlan.map((p, idx) => (
                                 <div key={idx} className="flex gap-2 items-center bg-slate-900/50 p-2 rounded-lg border border-slate-800 animate-in slide-in-from-left-2 duration-200" style={{ animationDelay: f'{idx * 50}ms' }}>
                                   <span className="text-[10px] font-bold text-slate-500 w-8">{p.number}ª</span>
                                   <input 
                                     type="date" 
                                     className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-100 flex-1 outline-none focus:border-emerald-500/50" 
                                     value={new Date(p.dueDate).toISOString().split('T')[0]} 
                                     onChange={(e) => {
                                       const newPlan = [...customPlan];
                                       newPlan[idx].dueDate = new Date(e.target.value + 'T12:00:00').getTime();
                                       setCustomPlan(newPlan);
                                     }}
                                   />
                                   <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded border border-slate-800">
                                     <span className="text-[10px] text-slate-500">R$</span>
                                     <input 
                                       type="number" 
                                       step="0.01"
                                       className="bg-transparent text-xs text-slate-100 w-20 outline-none font-bold" 
                                       value={p.value} 
                                       onChange={(e) => {
                                         const newPlan = [...customPlan];
                                         newPlan[idx].value = Number(e.target.value);
                                         setCustomPlan(newPlan);
                                       }}
                                     />
                                   </div>
                                 </div>
                               ))}
                               <div className="p-2 bg-slate-950 rounded border border-dashed border-slate-800">
                                 <div className="flex justify-between items-center text-[10px] font-bold">
                                   <span className="text-slate-500">SOMA DAS PARCELAS:</span>
                                   <span className={Math.abs(customPlan.reduce((acc, p) => acc + p.value, 0) - (cartTotals.totalPrice - (downPayment || 0))) < 0.01 ? 'text-emerald-500' : 'text-rose-500'}>
                                     R$ {customPlan.reduce((acc, p) => acc + p.value, 0).toFixed(2)}
                                   </span>
                                 </div>
                               </div>
                             </div>
                           )}"""

# Re-match the block
pattern = r'(<div className="col-span-2">\s*<label className="text-xs text-slate-500 mb-1 block">Vencimento / 1ª Parcela</label>.*?</div>)'
replacement = custom_ui

new_content = re.sub(pattern, replacement, content, flags=re.DOTALL)

if new_content != content:
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Successfully updated with Python!")
else:
    print("Pattern not found in Python script")
