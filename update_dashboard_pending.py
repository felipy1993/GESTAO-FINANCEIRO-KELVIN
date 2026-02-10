
import sys
import re

file_path = r'p:\financeiro_kevin\GESTAO-FINANCEIRO-KELVIN\components\Dashboard.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update return of metrics useMemo
old_return = 'return { totalRevenue, totalCost, netProfit, margin, alerts, pendingTotal, receivedMonth, profitMonth };'
new_return = 'return { totalRevenue, totalCost, netProfit, margin, alerts, pendingTotal, receivedMonth, profitMonth, pendingMonth };'

if old_return in content:
    content = content.replace(old_return, new_return)

# 2. Update KPI Card for "A Receber (Mês)"
# Target the specific calculation: metrics.totalRevenue - metrics.receivedMonth
old_kpi = 'R$ {(metrics.totalRevenue - metrics.receivedMonth).toLocaleString(\'pt-BR\', { minimumFractionDigits: 2 })}'
new_kpi = 'R$ {metrics.pendingMonth.toLocaleString(\'pt-BR\', { minimumFractionDigits: 2 })}'

if old_kpi in content:
    content = content.replace(old_kpi, new_kpi)

# 3. Add pendingMonth calculation after profitMonth
# The current code has receivedMonth calculation that is quite large.
# I'll look for where profitMonth is defined and insert after it.

profit_month_pattern = r'const profitMonth = filteredSales\.reduce\(\(acc, s\) => acc \+ s\.totalProfit, 0\);'
pending_month_calc = """
    const profitMonth = filteredSales.reduce((acc, s) => acc + s.totalProfit, 0);

    // Calculate PENDING amount ONLY for the SELECTED month
    const pendingMonth = sales.reduce((acc, s) => {
      let amount = 0;
      if (s.customInstallments && s.customInstallments.length > 0) {
        s.customInstallments.forEach(inst => {
          if (inst.status !== PaymentStatus.PAID) {
            const dueDate = new Date(inst.dueDate);
            if (dueDate.getMonth() === selectedMonth && dueDate.getFullYear() === selectedYear) {
              amount += inst.value;
            }
          }
        });
      } else if (s.dueDate) {
        const totalToInstall = s.totalPrice - (s.downPayment || 0);
        const installmentsCount = s.installments || 1;
        const installmentValue = totalToInstall / installmentsCount;
        const baseDate = new Date(s.dueDate);
        for (let i = 0; i < installmentsCount; i++) {
          if ((s.paidInstallments || 0) <= i) {
            const instDate = new Date(baseDate);
            instDate.setMonth(instDate.getMonth() + i);
            if (instDate.getMonth() === selectedMonth && instDate.getFullYear() === selectedYear) {
              amount += installmentValue;
            }
          }
        }
      }
      return acc + amount;
    }, 0);"""

content = re.sub(profit_month_pattern, pending_month_calc, content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Dashboard metrics updated successfully.")
