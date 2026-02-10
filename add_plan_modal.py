
import sys
import re

file_path = r'p:\financeiro_kevin\GESTAO-FINANCEIRO-KELVIN\components\Sales.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

modal_ui = """
      {planEditSale && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-100">Personalizar Plano</h3>
              <button onClick={() => setPlanEditSale(null)} className="text-slate-400 hover:text-white"><X /></button>
            </div>
            <div className="p-6 overflow-y-auto space-y-3 custom-scrollbar">
              {editingInstallments.map((inst, idx) => (
                <div key={idx} className={`p-3 rounded-xl border flex flex-col gap-2 ${inst.status === 'PAID' ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-slate-950 border-slate-800'}`}>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-500">{inst.number}ª PARCELA</span>
                    <span className={`text-[10px] font-bold ${inst.status === 'PAID' ? 'text-emerald-500' : 'text-amber-500'}`}>
                      {inst.status === 'PAID' ? 'PAGO' : 'PENDENTE'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <input 
                      type="date" 
                      className="bg-slate-900 border border-slate-800 rounded px-2 py-2 text-xs text-slate-100 flex-1" 
                      value={new Date(inst.dueDate).toISOString().split('T')[0]} 
                      onChange={(e) => {
                        const newPlan = [...editingInstallments];
                        newPlan[idx].dueDate = new Date(e.target.value + 'T12:00:00').getTime();
                        setEditingInstallments(newPlan);
                      }}
                    />
                    <div className="bg-slate-900 border border-slate-800 rounded px-2 py-2 flex items-center gap-1">
                      <span className="text-xs text-slate-500">R$</span>
                      <input 
                        type="number" 
                        step="0.01"
                        className="bg-transparent text-xs text-slate-100 w-24 outline-none font-bold" 
                        value={inst.value} 
                        onChange={(e) => {
                          const newPlan = [...editingInstallments];
                          newPlan[idx].value = Number(e.target.value);
                          setEditingInstallments(newPlan);
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-6 border-t border-slate-800 bg-slate-950/50">
              <div className="flex justify-between items-center mb-4 px-2">
                <span className="text-xs font-bold text-slate-500">TOTAL DO PLANO:</span>
                <span className="text-lg font-black text-slate-100">
                  R$ {editingInstallments.reduce((acc, p) => acc + p.value, 0).toFixed(2)}
                </span>
              </div>
              <button onClick={handleSaveEditedPlan} className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98]">
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}"""

# Insert before receiptSale modal or at the end of modals section
marker = "{receiptSale && <ReceiptModal sale={receiptSale} onClose={() => setReceiptSale(null)} />}"
new_content = content.replace(marker, modal_ui + "\n      " + marker)

if new_content != content:
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Successfully added plan edit modal!")
else:
    print("Marker not found")
