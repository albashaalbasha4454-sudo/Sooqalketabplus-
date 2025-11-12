

import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, FunctionDeclaration, Type, Chat, Part } from '@google/genai';
import type { Product, Invoice, Expense, Customer, InvoiceItem } from '../types';

interface AIChatAssistantProps {
  products: Product[];
  invoices: Invoice[];
  expenses: Expense[];
  customers: Customer[];
  lowStockThreshold: number;
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, product: Omit<Product, 'id'>) => void;
  deleteProduct: (id: string) => void;
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  deleteExpense: (id: string) => void;
  addCustomer: (customer: Omit<Customer, 'id'>) => Customer;
  updateCustomer: (id: string, customer: Omit<Customer, 'id'>) => void;
  deleteCustomer: (id: string) => void;
  onCompleteSale: (items: InvoiceItem[]) => void;
}

const SimpleMarkdown: React.FC<{ text: string }> = ({ text }) => {
    const renderText = () => {
        // 1. Sanitize to prevent XSS
        let html = text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');

        // 2. Process block elements (lists)
        html = html.replace(/(?:^\s*\*[ \t].*$\r?\n?)+/gm, (match) => {
            const items = match.trim().split('\n').map(item =>
                `<li>${item.replace(/^\s*\*[ \t]/, '').trim()}</li>`
            ).join('');
            return `<ul class="list-disc list-inside space-y-1 my-2">${items}</ul>`;
        });

        // 3. Process inline elements (bold)
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold">$1</strong>');
        
        // 4. Process paragraphs (wrap remaining lines in <p> tags)
        html = html.split('\n').filter(line => line.trim() !== '').map(line => {
             return line.trim().startsWith('<ul') ? line : `<p>${line}</p>`;
        }).join('');

        return { __html: html };
    };

    return <div className="space-y-2" dangerouslySetInnerHTML={renderText()} />;
};


const ChatInput: React.FC<{ onSend: (text: string) => void, isLoading: boolean }> = ({ onSend, isLoading }) => {
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSend(text);
    setText('');
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t bg-white rounded-b-lg">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="اسأل أو أصدر أمرًا..."
          className="flex-1 p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
          disabled={isLoading}
          dir="auto"
        />
        <button
          type="submit"
          className="bg-indigo-600 text-white p-2 rounded-lg disabled:bg-indigo-400 disabled:cursor-not-allowed hover:bg-indigo-700 transition-colors flex items-center justify-center"
          disabled={isLoading || !text.trim()}
          aria-label="إرسال"
        >
          <span className="material-symbols-outlined">send</span>
        </button>
      </div>
    </form>
  );
};

const isWithinLastDays = (dateString: string, days: number) => {
    const date = new Date(dateString);
    const now = new Date();
    const pastDate = new Date();
    pastDate.setDate(now.getDate() - days);
    return date >= pastDate && date <= now;
};

// --- Function Declarations for the AI model ---
const addProductFunctionDeclaration: FunctionDeclaration = {
  name: 'addProduct',
  description: 'إضافة كتاب جديد إلى المخزون',
  parameters: {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING, description: 'عنوان الكتاب' },
      quantity: { type: Type.INTEGER, description: 'الكمية المتوفرة في المخزون' },
      price: { type: Type.NUMBER, description: 'سعر بيع النسخة الواحدة' },
      costPrice: { type: Type.NUMBER, description: 'سعر تكلفة شراء النسخة (اختياري)' },
      author: { type: Type.STRING, description: 'اسم المؤلف (اختياري)' },
      category: { type: Type.STRING, description: 'التصنيف أو القسم (اختياري)' },
    },
    required: ['name', 'quantity', 'price'],
  },
};

const updateProductFunctionDeclaration: FunctionDeclaration = {
  name: 'updateProduct',
  description: 'تعديل بيانات كتاب موجود في المخزون. يجب تحديد الكتاب بالاسم أو بمعرف المنتج.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.STRING, description: 'معرف الكتاب المطلوب تعديله' },
      name: { type: Type.STRING, description: 'الاسم الجديد للكتاب' },
      quantity: { type: Type.INTEGER, description: 'الكمية الجديدة' },
      price: { type: Type.NUMBER, description: 'سعر البيع الجديد' },
      costPrice: { type: Type.NUMBER, description: 'سعر التكلفة الجديد' },
      author: { type: Type.STRING, description: 'المؤلف الجديد' },
      category: { type: Type.STRING, description: 'التصنيف الجديد' },
    },
    required: ['id'],
  },
};

const deleteProductFunctionDeclaration: FunctionDeclaration = {
  name: 'deleteProduct',
  description: 'حذف كتاب من المخزون بشكل نهائي. يجب تحديد الكتاب بالاسم أو بمعرف المنتج.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.STRING, description: 'معرف الكتاب المطلوب حذفه' },
    },
    required: ['id'],
  },
};

const addExpenseFunctionDeclaration: FunctionDeclaration = {
  name: 'addExpense',
  description: 'تسجيل مصروف جديد',
  parameters: {
    type: Type.OBJECT,
    properties: {
      description: { type: Type.STRING, description: 'وصف أو بيان للمصروف' },
      amount: { type: Type.NUMBER, description: 'المبلغ المدفوع' },
      category: { type: Type.STRING, description: 'تصنيف المصروف (اختياري)' },
    },
    required: ['description', 'amount'],
  },
};

const deleteExpenseFunctionDeclaration: FunctionDeclaration = {
  name: 'deleteExpense',
  description: 'حذف مصروف مسجل. يجب تحديد المصروف بالوصف أو بمعرف المصروف.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.STRING, description: 'معرف المصروف المطلوب حذفه' },
    },
    required: ['id'],
  },
};

const addCustomerFunctionDeclaration: FunctionDeclaration = {
  name: 'addCustomer',
  description: 'إضافة عميل جديد إلى سجل العملاء.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING, description: 'اسم العميل' },
      phone: { type: Type.STRING, description: 'رقم هاتف العميل' },
      address: { type: Type.STRING, description: 'عنوان العميل (اختياري)' },
      email: { type: Type.STRING, description: 'البريد الإلكتروني للعميل (اختياري)' },
    },
    required: ['name', 'phone'],
  },
};

const updateCustomerFunctionDeclaration: FunctionDeclaration = {
  name: 'updateCustomer',
  description: 'تعديل بيانات عميل موجود. يجب تحديد العميل بالاسم أو رقم الهاتف أو المعرف.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.STRING, description: 'معرف العميل المطلوب تعديله' },
      name: { type: Type.STRING, description: 'الاسم الجديد للعميل' },
      phone: { type: Type.STRING, description: 'رقم الهاتف الجديد' },
      address: { type: Type.STRING, description: 'العنوان الجديد' },
      email: { type: Type.STRING, description: 'البريد الإلكتروني الجديد' },
    },
    required: ['id'],
  },
};

const deleteCustomerFunctionDeclaration: FunctionDeclaration = {
  name: 'deleteCustomer',
  description: 'حذف عميل من السجل. يجب تحديد العميل بالاسم أو رقم الهاتف أو المعرف.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.STRING, description: 'معرف العميل المطلوب حذفه' },
    },
    required: ['id'],
  },
};

const createSaleFunctionDeclaration: FunctionDeclaration = {
  name: 'createSale',
  description: 'إنشاء فاتورة بيع جديدة.',
  parameters: {
    type: Type.OBJECT,
    properties: {
        items: {
            type: Type.ARRAY,
            description: 'قائمة بالمنتجات المباعة',
            items: {
                type: Type.OBJECT,
                properties: {
                    productId: { type: Type.STRING, description: 'معرف المنتج' },
                    quantity: { type: Type.INTEGER, description: 'الكمية المباعة' },
                },
                required: ['productId', 'quantity'],
            },
        },
    },
    required: ['items'],
  },
};


const AIChatAssistant: React.FC<AIChatAssistantProps> = ({ 
    products, invoices, expenses, customers, lowStockThreshold, 
    addProduct, updateProduct, deleteProduct, 
    addExpense, deleteExpense,
    addCustomer, updateCustomer, deleteCustomer,
    onCompleteSale
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'model'; content: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<Chat | null>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isLoading]);
  
  const generateDataSummary = () => {
    const recentInvoices = invoices.filter(inv => isWithinLastDays(inv.date, 30));
    const totalRecentRevenue = recentInvoices.reduce((sum, inv) => sum + inv.total, 0);
    const recentExpenses = expenses.filter(exp => isWithinLastDays(exp.date, 30));
    const totalRecentExpenses = recentExpenses.reduce((sum, exp) => sum + exp.amount, 0);

    const lowStockCount = products.filter(p => p.quantity > 0 && p.quantity <= lowStockThreshold).length;
    const outOfStockCount = products.filter(p => p.quantity === 0).length;

    return {
      totalProducts: products.length,
      lowStockCount,
      outOfStockCount,
      totalRecentRevenue: totalRecentRevenue.toFixed(2),
      recentInvoiceCount: recentInvoices.length,
      totalRecentExpenses: totalRecentExpenses.toFixed(2),
      recentExpenseCount: recentExpenses.length,
    };
  };

  const handleSendMessage = async (prompt: string) => {
    if (!prompt.trim() || isLoading) return;

    const newMessages = [...messages, { role: 'user' as const, content: prompt }];
    setMessages(newMessages);
    setIsLoading(true);
    setError(null);

    try {
      if (!process.env.API_KEY) {
        throw new Error("API key is not configured.");
      }
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

      if (!chatRef.current) {
        const systemInstruction = `
          أنت مساعد أعمال ذكي ومتكامل باللغة العربية. مهمتك هي مساعدة المستخدم في إدارة أعمال مكتبته بشكل كامل.
          لديك القدرة على:
          1.  **تحليل البيانات:** قدم رؤى دقيقة وقابلة للتنفيذ حول المبيعات، المصروفات، المخزون، والعملاء. يمكنك إنشاء تقارير متقدمة مثل تقارير الأرباح والخسائر. عند تحليل المخزون، انتبه دائمًا للعناصر التي على وشك النفاذ.
          2.  **إدارة المخزون:** يمكنك إضافة، تعديل، وحذف الكتب من المخزون.
          3.  **إدارة المصروفات:** يمكنك تسجيل وحذف المصروفات. لتعديل مصروف، يجب حذفه ثم إضافته من جديد.
          4.  **إدارة العملاء:** يمكنك إضافة، تعديل، وحذف العملاء من السجل.
          5.  **معالجة المبيعات:** يمكنك إنشاء فواتير بيع مباشرة.

          عند التفاعل مع المستخدم:
          - كن احترافيًا، استخدم لغة واضحة، وقدم البيانات بطريقة منظمة (استخدم القوائم والعناوين عند الحاجة).
          - عند تنفيذ أي عملية (إضافة، تعديل، حذف)، قم بتأكيد إتمامها بنجاح.
          - قبل تنفيذ عمليات التعديل أو الحذف، اطلب من المستخدم التأكيد إن أمكن.
          - إذا كان الطلب خارج نطاق إدارة الأعمال، اعتذر بأدب موضحًا تخصصك.
          - للبحث عن عنصر (كتاب, مصروف, عميل) لتعديله أو حذفه، استخدم البيانات المتاحة في السياق. إذا لم تجده، أخبر المستخدم بذلك.
        `;
        chatRef.current = ai.chats.create({
          model: 'gemini-2.5-flash',
          config: {
            systemInstruction: systemInstruction,
            tools: [{ functionDeclarations: [
                addProductFunctionDeclaration, addExpenseFunctionDeclaration,
                updateProductFunctionDeclaration, deleteProductFunctionDeclaration,
                deleteExpenseFunctionDeclaration, addCustomerFunctionDeclaration,
                updateCustomerFunctionDeclaration, deleteCustomerFunctionDeclaration,
                createSaleFunctionDeclaration
            ] }],
          },
        });
      }
      
      const dataContext = `
          سياق البيانات الحالي (لا تعرضه للمستخدم، استخدمه للبحث والإجابة على الأسئلة):
          - ملخص آخر 30 يومًا: ${JSON.stringify(generateDataSummary())}
          - جميع المنتجات: ${JSON.stringify(products)}
          - جميع العملاء: ${JSON.stringify(customers)}
          - أحدث 50 فاتورة: ${JSON.stringify(invoices.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 50))}
          - أحدث 50 مصروف: ${JSON.stringify(expenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 50))}
      `;

      let response = await chatRef.current.sendMessage({ message: `${prompt}\n\n${dataContext}` });

      while(response.functionCalls && response.functionCalls.length > 0) {
        const functionResponseParts: Part[] = [];
        for (const funcCall of response.functionCalls) {
            let result;
            try {
                if (funcCall.name === 'addProduct') {
                    const args = funcCall.args as Omit<Product, 'id'>;
                    addProduct(args);
                    result = { success: true, message: `تمت إضافة الكتاب ${args.name} بنجاح.` };
                } else if (funcCall.name === 'addExpense') {
                    const args = funcCall.args as Omit<Expense, 'id'>;
                    const expenseData = { ...args, date: new Date().toISOString() };
                    addExpense(expenseData);
                    result = { success: true, message: `تم تسجيل المصروف ${args.description} بنجاح.` };
                } else if (funcCall.name === 'updateProduct') {
                    const args = funcCall.args as { id: string } & Partial<Omit<Product, 'id'>>;
                    const existingProduct = products.find(p => p.id === args.id);
                    if (existingProduct) {
                        const updatedData = {
                            name: args.name || existingProduct.name,
                            quantity: args.quantity ?? existingProduct.quantity,
                            price: args.price ?? existingProduct.price,
                            costPrice: args.costPrice ?? existingProduct.costPrice,
                            author: args.author ?? existingProduct.author,
                            category: args.category ?? existingProduct.category,
                        };
                        updateProduct(args.id, updatedData);
                        result = { success: true, message: `تم تحديث بيانات الكتاب ${updatedData.name} بنجاح.` };
                    } else {
                        result = { success: false, message: `لم يتم العثور على كتاب بالمعرف ${args.id}.` };
                    }
                } else if (funcCall.name === 'deleteProduct') {
                    const { id } = funcCall.args as { id: string };
                    deleteProduct(id);
                    result = { success: true, message: `تم حذف الكتاب بالمعرف ${id} بنجاح.` };
                } else if (funcCall.name === 'deleteExpense') {
                    const { id } = funcCall.args as { id: string };
                    deleteExpense(id);
                    result = { success: true, message: `تم حذف المصروف بالمعرف ${id} بنجاح.` };
                } else if (funcCall.name === 'addCustomer') {
                    const args = funcCall.args as Omit<Customer, 'id'>;
                    const newCustomer = addCustomer(args);
                    result = { success: true, message: `تمت إضافة العميل ${newCustomer.name} بنجاح. معرف العميل هو ${newCustomer.id}.` };
                } else if (funcCall.name === 'updateCustomer') {
                    const args = funcCall.args as { id: string } & Partial<Omit<Customer, 'id'>>;
                    const existingCustomer = customers.find(c => c.id === args.id);
                    if (existingCustomer) {
                        const updatedData = {
                            name: args.name || existingCustomer.name,
                            phone: args.phone || existingCustomer.phone,
                            address: args.address || existingCustomer.address,
                            email: args.email || existingCustomer.email,
                            notes: existingCustomer.notes,
                        };
                        updateCustomer(args.id, updatedData);
                        result = { success: true, message: `تم تحديث بيانات العميل ${updatedData.name} بنجاح.` };
                    } else {
                        result = { success: false, message: `لم يتم العثور على عميل بالمعرف ${args.id}.` };
                    }
                } else if (funcCall.name === 'deleteCustomer') {
                    const { id } = funcCall.args as { id: string };
                    deleteCustomer(id);
                    result = { success: true, message: `تم حذف العميل بالمعرف ${id} بنجاح.` };
                } else if (funcCall.name === 'createSale') {
                    const { items } = funcCall.args as { items: { productId: string, quantity: number }[] };
                    const invoiceItems: InvoiceItem[] = [];
                    let salePossible = true;
                    for (const item of items) {
                        const product = products.find(p => p.id === item.productId);
                        if (!product) {
                            result = { success: false, message: `المنتج بالمعرف ${item.productId} غير موجود.` };
                            salePossible = false;
                            break;
                        }
                        if (product.quantity < item.quantity) {
                            result = { success: false, message: `الكمية غير كافية للمنتج ${product.name}. المتوفر: ${product.quantity}, المطلوب: ${item.quantity}.` };
                            salePossible = false;
                            break;
                        }
                        invoiceItems.push({
                            productId: product.id,
                            productName: product.name,
                            quantity: item.quantity,
                            price: product.price,
                            costPrice: product.costPrice,
                        });
                    }
                    if (salePossible) {
                        onCompleteSale(invoiceItems);
                        result = { success: true, message: 'تم إنشاء فاتورة البيع بنجاح.' };
                    }
                }
                else {
                    throw new Error(`Function ${funcCall.name} not found.`);
                }
            } catch (e) {
                result = { success: false, message: e instanceof Error ? e.message : 'Unknown error' };
            }
            
            functionResponseParts.push({
                functionResponse: {
                    name: funcCall.name,
                    response: result,
                },
            });
        }
        
        response = await chatRef.current.sendMessage({ message: functionResponseParts });
      }

      const text = response.text;
      setMessages(prev => [...prev, { role: 'model', content: text }]);

    } catch (err) {
      console.error(err);
      setError('عذراً، حدث خطأ ما. يرجى المحاولة مرة أخرى لاحقاً.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {isOpen && (
        <div className="fixed bottom-24 end-4 w-full max-w-md h-[70vh] max-h-[600px] bg-white rounded-lg shadow-2xl z-50 flex flex-col transition-transform transform-gpu animate-[slide-up_0.3s_ease-out]">
          <header className="flex items-center gap-3 justify-between p-4 bg-slate-900 text-white rounded-t-lg flex-shrink-0">
            <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-indigo-400">auto_awesome</span>
                <h3 className="font-bold text-lg">المساعد الذكي للأعمال</h3>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-slate-700 rounded-full p-1 transition-colors" aria-label="إغلاق">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </header>
          <div ref={chatContainerRef} className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-100">
            {messages.length === 0 && !isLoading && (
                 <div className="text-center p-4 text-slate-500 animate-[fade-in_0.5s_ease-out]">
                    <span className="material-symbols-outlined text-5xl text-slate-400">insights</span>
                    <h4 className="font-semibold mt-2 text-slate-700">مساعد الأعمال الذكي</h4>
                    <p className="text-sm mt-1">اطرح أسئلة حول بياناتك أو أصدر أوامر مباشرة.</p>
                    <div className="text-xs mt-4 space-y-2 text-left bg-white p-3 rounded-lg border">
                        <p className="font-semibold text-slate-600">جرب أن تطلب:</p>
                        <button onClick={() => handleSendMessage('ما هي الكتب التي على وشك النفاذ؟')} className="block w-full text-right text-indigo-600 hover:underline">"ما هي الكتب التي على وشك النفاذ؟"</button>
                        <button onClick={() => handleSendMessage("عدّل سعر كتاب 'لا تحزن' إلى 65")} className="block w-full text-right text-indigo-600 hover:underline">"عدّل سعر كتاب 'لا تحزن' إلى 65"</button>
                        <button onClick={() => handleSendMessage("احذف العميل 'أحمد محمود'")} className="block w-full text-right text-indigo-600 hover:underline">"احذف العميل 'أحمد محمود'"</button>
                        <button onClick={() => handleSendMessage("أنشئ فاتورة بيع لنسخة واحدة من 'مقدمة ابن خلدون'")} className="block w-full text-right text-indigo-600 hover:underline">"أنشئ فاتورة بيع لنسخة واحدة من 'مقدمة ابن خلدون'"</button>
                    </div>
                </div>
            )}
            {messages.map((msg, index) => (
              <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-[fade-in_0.5s_ease-out]`}>
                <div className={`max-w-[85%] p-3 rounded-xl shadow-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-800'}`}>
                  {msg.role === 'model' ? <SimpleMarkdown text={msg.content} /> : <p className="whitespace-pre-wrap">{msg.content}</p>}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start animate-[fade-in_0.5s_ease-out]">
                  <div className="max-w-[80%] p-3 rounded-xl bg-white text-slate-800 shadow-sm">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                         <span>المساعد يعمل...</span>
                         <span className="w-2 h-2 bg-slate-400 rounded-full animate-pulse"></span>
                         <span className="w-2 h-2 bg-slate-400 rounded-full animate-pulse [animation-delay:0.2s]"></span>
                         <span className="w-2 h-2 bg-slate-400 rounded-full animate-pulse [animation-delay:0.4s]"></span>
                      </div>
                  </div>
              </div>
            )}
            {error && (
                <div className="p-3 rounded-xl bg-red-100 text-red-700 border border-red-200 animate-[fade-in_0.5s_ease-out]">
                  <p>{error}</p>
                </div>
            )}
          </div>
          <ChatInput onSend={handleSendMessage} isLoading={isLoading} />
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 end-6 w-16 h-16 bg-indigo-600 text-white rounded-full shadow-lg flex items-center justify-center z-50 hover:bg-indigo-700 transition-all transform hover:scale-110"
        aria-label="افتح المساعد الذكي"
      >
        <span className="material-symbols-outlined text-3xl">auto_awesome</span>
      </button>
      <style>{`
        @keyframes slide-up {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </>
  );
};

export default AIChatAssistant;