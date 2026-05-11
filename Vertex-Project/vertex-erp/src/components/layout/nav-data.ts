import {
  ArrowLeftRight, List, BarChart2, Settings,
  ShoppingCart, PackageCheck, ArrowUpFromLine, Receipt,
  TrendingUp, ArrowDownToLine, Package, Landmark,
  Users, BookOpen, Boxes, Building2,
  FileCheck, UserCheck, Brain,
  Layers, ShieldCheck, Zap, Puzzle,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ErpNavItem {
  id: string;
  label: string;
  href: string;
  permission?: string;
  badge?: 'NEW' | 'BETA' | 'AI';
}

export interface ErpNavCategory {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  items: ErpNavItem[];
  permission?: string;
}

export interface ErpNavModule {
  id: string;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  categories: ErpNavCategory[];
}

// ─── Navigation Tree ─────────────────────────────────────────────────────────

export const NAV_MODULES: ErpNavModule[] = [
  // ── TRANSACTIONS ──────────────────────────────────────────────────────────
  {
    id: 'transactions',
    label: 'Transactions',
    shortLabel: 'Txn',
    icon: ArrowLeftRight,
    categories: [
      {
        id: 'purchases',
        label: 'Purchases',
        icon: ShoppingCart,
        items: [
          { id: 'po-create',   label: 'Create Purchase Order',   href: '/purchase-orders/create'   },
          { id: 'po-list',     label: 'List Purchase Orders',    href: '/purchase-orders'          },
          { id: 'po-approve',  label: 'Approve Purchase Orders', href: '/purchase-orders/approve'  },
          { id: 'po-analytics',label: 'Purchase Analytics',      href: '/purchase-orders/analytics', badge: 'AI' },
        ],
      },
      {
        id: 'item-receipt',
        label: 'Item Receipt',
        icon: PackageCheck,
        items: [
          { id: 'ir-receive',  label: 'Receive Purchase Order',  href: '/goods-receipt/create'  },
          { id: 'ir-list',     label: 'List Item Receipts',      href: '/goods-receipt'         },
          { id: 'ir-pending',  label: 'Pending Receipts',        href: '/goods-receipt/pending' },
        ],
      },
      {
        id: 'ap-transactions',
        label: 'Accounts Payable',
        icon: ArrowUpFromLine,
        permission: 'ap:write',
        items: [
          { id: 'ap-bill-po',   label: 'Bill Purchase Order', href: '/vendor-bills/from-po'    },
          { id: 'ap-create',    label: 'Create Vendor Bill',  href: '/vendor-bills/create'     },
          { id: 'ap-pay',       label: 'Pay Bills',           href: '/vendor-bills/pay'        },
          { id: 'ap-credits',   label: 'Vendor Credits',      href: '/vendor-credits'          },
          { id: 'ap-checks',    label: 'Check Preparation',   href: '/vendor-bills/checks'     },
          { id: 'ap-txn',       label: 'A/P Transactions',    href: '/vendor-bills'            },
        ],
      },
      {
        id: 'expenses',
        label: 'Expenses',
        icon: Receipt,
        items: [
          { id: 'exp-create',   label: 'Create Expense Report', href: '/expenses/create'   },
          { id: 'exp-approve',  label: 'Expense Approval',      href: '/expenses/approve'  },
          { id: 'exp-cats',     label: 'Expense Categories',    href: '/expenses/categories'},
          { id: 'exp-history',  label: 'Expense History',       href: '/expenses'          },
        ],
      },
      {
        id: 'sales',
        label: 'Sales',
        icon: TrendingUp,
        items: [
          { id: 'so-create',    label: 'Enter Sales Order',  href: '/sales-orders/create'   },
          { id: 'so-cash',      label: 'Enter Cash Sales',   href: '/cash-sales/create'     },
          { id: 'so-return',    label: 'Sales Return',       href: '/sales-orders/return'   },
          { id: 'so-delivery',  label: 'Delivery Orders',    href: '/deliveries'            },
          { id: 'so-analytics', label: 'Sales Analytics',    href: '/sales-orders/analytics', badge: 'AI' },
        ],
      },
      {
        id: 'ar-transactions',
        label: 'Accounts Receivable',
        icon: ArrowDownToLine,
        permission: 'ar:write',
        items: [
          { id: 'ar-invoice-so',label: 'Invoice Sales Order', href: '/invoicing/from-so'    },
          { id: 'ar-create',    label: 'Create Invoice',      href: '/invoicing/create'     },
          { id: 'ar-payment',   label: 'Accept Payment',      href: '/payments/create'      },
          { id: 'ar-credits',   label: 'Customer Credits',    href: '/customer-credits'     },
          { id: 'ar-collection',label: 'Collection Monitoring',href: '/collections'         },
          { id: 'ar-txn',       label: 'A/R Transactions',   href: '/invoicing'            },
        ],
      },
      {
        id: 'inventory-txn',
        label: 'Inventory',
        icon: Package,
        items: [
          { id: 'inv-adjust',   label: 'Stock Adjustment',       href: '/inventory/adjust'    },
          { id: 'inv-transfer', label: 'Transfer Inventory',     href: '/inventory/transfer'  },
          { id: 'inv-count',    label: 'Inventory Count',        href: '/inventory/count'     },
          { id: 'inv-reorder',  label: 'Reorder Management',     href: '/inventory/reorder'   },
          { id: 'inv-txn',      label: 'Inventory Transactions', href: '/inventory'           },
        ],
      },
      {
        id: 'financial-txn',
        label: 'Financial',
        icon: Landmark,
        permission: 'accounting:write',
        items: [
          { id: 'fin-je',       label: 'Create Journal Entry',    href: '/journal-ledger/create'   },
          { id: 'fin-rje',      label: 'Recurring Journal Entry', href: '/journal-ledger/recurring'},
          { id: 'fin-deposit',  label: 'Bank Deposit',            href: '/bank-deposit'            },
          { id: 'fin-recon',    label: 'Bank Reconciliation',     href: '/bank-reconciliation'     },
          { id: 'fin-txn',      label: 'Financial Transactions',  href: '/general-ledger'          },
        ],
      },
    ],
  },

  // ── LISTS ─────────────────────────────────────────────────────────────────
  {
    id: 'lists',
    label: 'Lists',
    shortLabel: 'Lists',
    icon: List,
    categories: [
      {
        id: 'relationships',
        label: 'Relationship',
        icon: Users,
        items: [
          { id: 'rel-customers', label: 'Customers',           href: '/crm'            },
          { id: 'rel-vendors',   label: 'Vendors',             href: '/suppliers'      },
          { id: 'rel-employees', label: 'Employees',           href: '/employees'      },
          { id: 'rel-salesreps', label: 'Sales Representatives',href: '/sales-reps'   },
          { id: 'rel-contacts',  label: 'Contacts',            href: '/contacts'       },
        ],
      },
      {
        id: 'accounting-list',
        label: 'Accounting',
        icon: BookOpen,
        permission: 'accounting:read',
        items: [
          { id: 'acc-coa',      label: 'Chart of Accounts',   href: '/chart-of-accounts' },
          { id: 'acc-periods',  label: 'Accounting Periods',  href: '/accounting-periods' },
          { id: 'acc-taxes',    label: 'Tax Codes',           href: '/tax-settings'       },
          { id: 'acc-currency', label: 'Currency Setup',      href: '/currency-setup'     },
        ],
      },
      {
        id: 'inventory-list',
        label: 'Inventory',
        icon: Boxes,
        items: [
          { id: 'inv-items',    label: 'Item Master List',    href: '/inventory'             },
          { id: 'inv-cats',     label: 'Product Categories',  href: '/inventory/categories'  },
          { id: 'inv-uom',      label: 'Units of Measure',    href: '/inventory/units'       },
          { id: 'inv-wh',       label: 'Warehouses',          href: '/inventory/warehouses'  },
          { id: 'inv-classes',  label: 'Inventory Classes',   href: '/inventory/classes'     },
        ],
      },
      {
        id: 'fixed-assets',
        label: 'Fixed Assets',
        icon: Building2,
        permission: 'accounting:read',
        items: [
          { id: 'fa-list',      label: 'Asset List',          href: '/fixed-assets'              },
          { id: 'fa-deprec',    label: 'Depreciation Setup',  href: '/fixed-assets/depreciation' },
          { id: 'fa-cats',      label: 'Asset Categories',    href: '/fixed-assets/categories'   },
        ],
      },
    ],
  },

  // ── REPORTS ───────────────────────────────────────────────────────────────
  {
    id: 'reports',
    label: 'Reports',
    shortLabel: 'Reports',
    icon: BarChart2,
    categories: [
      {
        id: 'financial-reports',
        label: 'Financial',
        icon: BarChart2,
        permission: 'reports:read',
        items: [
          { id: 'rpt-tb',       label: 'Trial Balance',        href: '/trial-balance'     },
          { id: 'rpt-is',       label: 'Income Statement',     href: '/income-statement'  },
          { id: 'rpt-bs',       label: 'Balance Sheet',        href: '/balance-sheet'     },
          { id: 'rpt-gl',       label: 'General Ledger',       href: '/general-ledger'    },
          { id: 'rpt-cf',       label: 'Cash Flow Statement',  href: '/cash-flow'         },
          { id: 'rpt-jr',       label: 'Journal Report',       href: '/journal-ledger'    },
        ],
      },
      {
        id: 'ar-reports',
        label: 'Accounts Receivable',
        icon: ArrowDownToLine,
        permission: 'ar:read',
        items: [
          { id: 'ar-aging',     label: 'A/R Aging',            href: '/reports/ar-aging'        },
          { id: 'ar-by-item',   label: 'Sales by Item',        href: '/reports/sales-by-item'   },
          { id: 'ar-by-cust',   label: 'Sales by Customer',    href: '/reports/sales-by-customer'},
          { id: 'ar-stmt',      label: 'Customer Statement',   href: '/reports/customer-statement'},
          { id: 'ar-collect',   label: 'Collection Report',    href: '/reports/collection'      },
        ],
      },
      {
        id: 'ap-reports',
        label: 'Accounts Payable',
        icon: ArrowUpFromLine,
        permission: 'ap:read',
        items: [
          { id: 'ap-aging',     label: 'A/P Aging',            href: '/reports/ap-aging'          },
          { id: 'ap-by-item',   label: 'Purchases by Item',    href: '/reports/purchases-by-item' },
          { id: 'ap-by-vendor', label: 'Purchases by Vendor',  href: '/reports/purchases-by-vendor'},
          { id: 'ap-stmt',      label: 'Vendor Statement',     href: '/reports/vendor-statement'  },
          { id: 'ap-summary',   label: 'Payables Summary',     href: '/reports/payables-summary'  },
        ],
      },
      {
        id: 'inventory-reports',
        label: 'Inventory',
        icon: Package,
        items: [
          { id: 'inv-ledger',   label: 'Stock Ledger',         href: '/stock-ledger'              },
          { id: 'inv-val',      label: 'Inventory Valuation',  href: '/inventory-valuation'       },
          { id: 'inv-snap',     label: 'Inventory Snapshot',   href: '/reports/inventory-snapshot'},
          { id: 'inv-offtake',  label: 'Offtake Report',       href: '/reports/offtake'           },
          { id: 'inv-fast',     label: 'Fast Moving Items',    href: '/reports/fast-moving'       },
          { id: 'inv-slow',     label: 'Slow Moving Items',    href: '/reports/slow-moving'       },
          { id: 'inv-movement', label: 'Stock Movement Report',href: '/reports/stock-movement'    },
        ],
      },
      {
        id: 'tax-reports',
        label: 'Tax Reports',
        icon: FileCheck,
        items: [
          { id: 'tax-vat',      label: 'VAT Report',              href: '/sales-tax'          },
          { id: 'tax-ewt',      label: 'Expanded Withholding Tax',href: '/purchase-tax'       },
          { id: 'tax-2307',     label: '2307 Summary',            href: '/bir-2307'           },
          { id: 'tax-bir',      label: 'BIR Sales Report',        href: '/reports/bir-sales'  },
          { id: 'tax-adj',      label: 'Tax Adjustments',         href: '/reports/tax-adj'    },
          { id: 'tax-cas',      label: 'CAS Compliance Reports',  href: '/reports/cas'        },
        ],
      },
      {
        id: 'hr-reports',
        label: 'HR & Payroll',
        icon: UserCheck,
        permission: 'hr:read',
        items: [
          { id: 'hr-attend',    label: 'Attendance Summary',  href: '/reports/attendance'  },
          { id: 'hr-payroll',   label: 'Payroll Register',    href: '/reports/payroll'     },
          { id: 'hr-leave',     label: 'Leave Report',        href: '/reports/leave'       },
          { id: 'hr-perf',      label: 'Employee Performance',href: '/reports/performance' },
        ],
      },
      {
        id: 'ai-analytics',
        label: 'AI Analytics',
        icon: Brain,
        items: [
          { id: 'ai-sales',     label: 'Sales Forecast',       href: '/ai-forecasting',        badge: 'AI' },
          { id: 'ai-inv',       label: 'Inventory Forecast',   href: '/ai-insights',           badge: 'AI' },
          { id: 'ai-health',    label: 'Business Health Score',href: '/business-health',       badge: 'AI' },
          { id: 'ai-expense',   label: 'Expense Analysis',     href: '/reports/ai-expenses',   badge: 'AI' },
          { id: 'ai-recs',      label: 'AI Recommendations',  href: '/reports/ai-recommendations', badge: 'AI' },
        ],
      },
    ],
  },

  // ── SETUP ─────────────────────────────────────────────────────────────────
  {
    id: 'setup',
    label: 'Setup',
    shortLabel: 'Setup',
    icon: Settings,
    categories: [
      {
        id: 'company',
        label: 'Company',
        icon: Building2,
        permission: 'setup:admin',
        items: [
          { id: 'co-profile',   label: 'Company Profile',        href: '/settings'                  },
          { id: 'co-branch',    label: 'Branch Setup',           href: '/settings/branches'         },
          { id: 'co-fy',        label: 'Fiscal Year',            href: '/settings/fiscal-year'      },
          { id: 'co-periods',   label: 'Accounting Period Setup',href: '/accounting-periods'        },
          { id: 'co-prefs',     label: 'Company Preferences',    href: '/settings/preferences'      },
        ],
      },
      {
        id: 'classification',
        label: 'Classification',
        icon: Layers,
        permission: 'setup:admin',
        items: [
          { id: 'cls-dept',     label: 'Department',    href: '/settings/departments'   },
          { id: 'cls-class',    label: 'Class',         href: '/settings/classes'       },
          { id: 'cls-location', label: 'Location',      href: '/settings/locations'     },
          { id: 'cls-bu',       label: 'Business Unit', href: '/settings/business-units'},
          { id: 'cls-cost',     label: 'Cost Center',   href: '/settings/cost-centers'  },
        ],
      },
      {
        id: 'users-roles',
        label: 'Users & Roles',
        icon: ShieldCheck,
        permission: 'setup:admin',
        items: [
          { id: 'ur-users',     label: 'Manage Users',     href: '/users'              },
          { id: 'ur-roles',     label: 'Roles & Permissions',href: '/users/roles'     },
          { id: 'ur-access',    label: 'Access Control',   href: '/permissions'        },
          { id: 'ur-audit',     label: 'Login Audit Logs', href: '/audit-logs'         },
          { id: 'ur-security',  label: 'Security Policies',href: '/settings/security'  },
        ],
      },
      {
        id: 'automation',
        label: 'Automation',
        icon: Zap,
        permission: 'setup:admin',
        items: [
          { id: 'auto-wf',      label: 'Workflow Automation',href: '/settings/workflows'   },
          { id: 'auto-email',   label: 'Email Templates',    href: '/settings/email'       },
          { id: 'auto-notif',   label: 'Notification Rules', href: '/settings/notifications'},
          { id: 'auto-approval',label: 'Approval Workflow',  href: '/settings/approvals'   },
          { id: 'auto-tasks',   label: 'Scheduled Tasks',    href: '/settings/tasks'       },
        ],
      },
      {
        id: 'integrations',
        label: 'Integrations',
        icon: Puzzle,
        permission: 'setup:admin',
        items: [
          { id: 'int-paymongo', label: 'PayMongo',      href: '/integrations/paymongo', badge: 'NEW' },
          { id: 'int-gcash',    label: 'GCash',         href: '/integrations/gcash',    badge: 'NEW' },
          { id: 'int-maya',     label: 'Maya',          href: '/integrations/maya',     badge: 'NEW' },
          { id: 'int-sheets',   label: 'Google Sheets', href: '/integrations/sheets'                 },
          { id: 'int-openai',   label: 'OpenAI',        href: '/integrations/openai',   badge: 'AI'  },
          { id: 'int-messenger',label: 'Messenger API', href: '/integrations/messenger'              },
        ],
      },
    ],
  },
];

// ─── Utilities ───────────────────────────────────────────────────────────────

export interface FlatNavItem extends ErpNavItem {
  moduleId:    string;
  moduleLabel: string;
  categoryId:  string;
  categoryLabel: string;
  breadcrumb:  string;
}

export function flattenNav(modules: ErpNavModule[]): FlatNavItem[] {
  return modules.flatMap(mod =>
    mod.categories.flatMap(cat =>
      cat.items.map(item => ({
        ...item,
        moduleId:      mod.id,
        moduleLabel:   mod.shortLabel,
        categoryId:    cat.id,
        categoryLabel: cat.label,
        breadcrumb:    `${mod.shortLabel} › ${cat.label}`,
      }))
    )
  );
}

export function findByHref(
  href: string,
  modules: ErpNavModule[]
): { module: ErpNavModule; category: ErpNavCategory; item: ErpNavItem } | null {
  for (const mod of modules) {
    for (const cat of mod.categories) {
      for (const item of cat.items) {
        if (href === item.href || href.startsWith(item.href + '/')) {
          return { module: mod, category: cat, item };
        }
      }
    }
  }
  return null;
}
