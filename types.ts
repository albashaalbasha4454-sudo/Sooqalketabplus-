export interface Product {
  id: string;
  name: string;
  author?: string;
  category?: string;
  quantity: number;
  price: number;
  costPrice?: number;
}

export interface InvoiceItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  costPrice?: number;
  discount?: number;
}

export interface PurchaseItem {
    productId: string;
    productName: string;
    quantity: number;
    costPrice: number;
    price?: number;
    category?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address?: string;
  email?: string;
  notes?: string;
}

export interface User {
  id:string;
  username: string;
  passwordHash: string;
  salt: string;
  role: 'admin' | 'cashier';
}

export type OrderType = 'sale' | 'return' | 'shipping' | 'reservation';
export type OrderStatus = 'pending' | 'completed' | 'cancelled' | 'shipped';
export type PaymentStatus = 'paid' | 'unpaid' | 'partial';

export interface Invoice {
  id: string;
  date: string; // ISO string
  paidDate?: string; // ISO string, set when payment is completed
  items: InvoiceItem[];
  total: number;
  totalProfit?: number;
  totalCost?: number;
  type: OrderType;
  customerInfo?: {
    id?: string | null;
    name: string;
    phone: string;
    address?: string;
  };
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  source?: 'in-store' | 'facebook' | 'instagram' | 'whatsapp' | 'other';
  shippingFee?: number;
  processedBy?: string;
}


export interface Expense {
  id: string;
  date: string; // ISO string
  description: string;
  amount: number;
  category?: string;
  accountId: string; // The account it was paid from
}

export interface ReturnRequest {
  id: string;
  requestDate: string; // ISO string
  originalInvoiceId: string;
  requestedBy: string; // username
  status: 'pending' | 'approved' | 'rejected';
  items: InvoiceItem[];
  processedBy?: string; // username
  processedDate?: string; // ISO string
}

export interface RequestedBook {
    id: string;
    name: string;
    customerName?: string;
    customerPhone?: string;
    requestedCount: number;
    lastRequestedDate: string; // ISO String
    status: 'pending' | 'fulfilled';
}

export interface Supplier {
    id: string;
    name: string;
    contactPerson?: string;
    phone?: string;
    email?: string;
    address?: string;
}

export interface Purchase {
    id: string;
    date: string;
    supplierId: string;
    supplierName: string;
    items: PurchaseItem[];
    totalCost: number;
    paymentStatus: PaymentStatus;
    payments: {
        date: string;
        amount: number;
        accountId: string; // Account used for payment
    }[];
    isStockedIn: boolean;
}

export interface FinancialAccount {
    id: string;
    name:string;
    type: 'cash' | 'bank' | 'other';
    userId?: string;
}

export type FinancialTransactionType = 
    'sale_income' 
    | 'expense' 
    | 'capital_deposit' 
    | 'profit_withdrawal' 
    | 'supplier_payment' 
    | 'return_refund'
    | 'transfer'
    | 'expense_reversal';

export interface FinancialTransaction {
    id: string;
    date: string;
    description: string;
    amount: number; // Always positive
    type: FinancialTransactionType;
    fromAccountId?: string; // Source of funds (for expense, withdrawal, transfer)
    toAccountId?: string; // Destination of funds (for income, deposit, transfer)
    relatedInvoiceId?: string;
    relatedPurchaseId?: string;
    category?: string;
}

export interface Budget {
    id: string;
    name: string;
    targetAmount: number;
}

export interface TillCloseout {
  id: string;
  date: string; // ISO string for the closing time
  closedByUserId: string;
  closedByUsername: string;
  forDate: string; // ISO string YYYY-MM-DD
  totalSales: number;
  totalReturns: number; // Positive number representing refund amount
  netCashExpected: number;
  countedCash: number;
  difference: number;
  notes?: string;
  invoiceIds: string[];
}