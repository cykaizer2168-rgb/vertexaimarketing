export interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
  role: 'admin' | 'staff';
}

export interface MetricCard {
  label: string;
  value: string;
  change: number;
  changeType: 'increase' | 'decrease';
  icon: React.ComponentType<{ className?: string }>;
  color: 'green' | 'red' | 'blue' | 'amber';
}

export interface Transaction {
  id: string;
  date: string;
  reference: string;
  description: string;
  type: 'Invoice' | 'Cash Sale' | 'Expense' | 'Payment';
  amount: number;
  status: 'Paid' | 'Pending' | 'Overdue';
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  onHand: number;
  reorderPoint: number;
  unitCost: number;
  category: string;
}

export interface Invoice {
  id: string;
  date: string;
  dueDate: string;
  customer: string;
  amount: number;
  status: 'Paid' | 'Pending' | 'Overdue';
  balance: number;
}

export interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

export interface NavGroup {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  items: NavItem[];
}

export interface ErpUser {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  roleId: string;
  roleName: string;
  status: 'active' | 'disabled';
  lastLogin: string | null;
  createdAt: string;
}

export interface ErpRole {
  id: string;
  roleName: string;
  description: string;
  isSystemRole: boolean;
  createdAt: string;
}

export type AccessLevel = 'full' | 'edit' | 'view' | 'none';
