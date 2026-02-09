import { GoogleGenAI } from "@google/genai";
import { Product, Sale } from "../types";

const SYSTEM_INSTRUCTION = `
Você é um analista de negócios sênior para pequenas empresas.
Analise os dados JSON fornecidos contendo Vendas e Produtos.
Identifique tendências, fugas de lucro e oportunidades.
Sua resposta deve estar estritamente em Português do Brasil (PT-BR).
Forneça sua resposta em formato JSON válido com a seguinte estrutura:
{
  "summary": "Um resumo de 1 frase sobre a saúde do negócio.",
  "insights": [
    "Insight 1 (ex: desempenho de produto específico)",
    "Insight 2 (ex: tendências de categoria)",
    "Insight 3 (ex: aviso de margem)"
  ],
  "recommendation": "Uma ação concreta para tomar imediatamente."
}
Seja conciso e prático.
`;

export const analyzeBusiness = async (sales: Sale[], products: Product[]) => {
  if (!process.env.API_KEY) {
    throw new Error("API Key not found");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Prepare a lightweight context to avoid token limits
  const recentSales = sales.slice(0, 50); // Analyze last 50 sales
  const dataContext = JSON.stringify({
    totalProducts: products.length,
    recentSales: recentSales.map(s => ({
      date: new Date(s.date).toLocaleDateString('pt-BR'),
      items: s.items.map(i => ({ name: i.productName, qty: i.quantity, profit: i.totalPrice - i.totalCost })),
      totalProfit: s.totalProfit,
      margin: s.profitMargin
    }))
  });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analise estes dados de vendas: ${dataContext}`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json"
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};