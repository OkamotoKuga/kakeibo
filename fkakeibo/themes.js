// テーマ定義ファイル
export const themes = {
  blue: {
    name: '青テーマ',
    primary: '#2563eb',
    primaryLight: '#60a5fa',
    primaryDark: '#1d4ed8',
    secondary: '#eff6ff',
    background: '#f8fafc',
    surface: '#ffffff',
    text: '#0f172a',
    textSecondary: '#64748b',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    border: '#e2e8f0',
    shadow: 'rgba(37, 99, 235, 0.15)',
    gradient: 'linear-gradient(135deg, #2563eb 0%, #60a5fa 100%)',
    cardGradient: 'linear-gradient(135deg, #ffffff 0%, #eff6ff 100%)',
    cardShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
  },  green: {
    name: '緑テーマ',
    primary: '#10b981',
    primaryLight: '#34d399',
    primaryDark: '#059669',
    secondary: '#ecfdf5',
    background: '#f0fdf4',
    surface: '#ffffff',
    text: '#0f172a',
    textSecondary: '#64748b',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    border: '#d1fae5',
    shadow: 'rgba(16, 185, 129, 0.15)',
    gradient: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
    cardGradient: 'linear-gradient(135deg, #ffffff 0%, #ecfdf5 100%)',
    cardShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
  },  yellow: {
    name: '黄テーマ',
    primary: '#f59e0b',
    primaryLight: '#fbbf24',
    primaryDark: '#d97706',
    secondary: '#fefce8',
    background: '#fffbeb',
    surface: '#ffffff',
    text: '#0f172a',
    textSecondary: '#64748b',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    border: '#fed7aa',
    shadow: 'rgba(245, 158, 11, 0.2)',
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
    cardGradient: 'linear-gradient(135deg, #ffffff 0%, #fefce8 100%)',
    cardShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
  },  red: {
    name: '赤テーマ',
    primary: '#ef4444',
    primaryLight: '#f87171',
    primaryDark: '#dc2626',
    secondary: '#fef2f2',
    background: '#fef2f2',
    surface: '#ffffff',
    text: '#0f172a',
    textSecondary: '#64748b',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    border: '#fecaca',
    shadow: 'rgba(239, 68, 68, 0.15)',
    gradient: 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)',
    cardGradient: 'linear-gradient(135deg, #ffffff 0%, #fef2f2 100%)',
    cardShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
  },  gold: {
    name: '金ぴかテーマ',
    primary: '#f59e0b',
    primaryLight: '#fcd34d',
    primaryDark: '#d97706',
    secondary: '#fef3c7',
    background: '#fffbeb',
    surface: '#ffffff',
    text: '#0f172a',
    textSecondary: '#64748b',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    border: '#fcd34d',
    shadow: 'rgba(245, 158, 11, 0.25)',
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #fcd34d 50%, #fbbf24 100%)',
    cardGradient: 'linear-gradient(135deg, #ffffff 0%, #fef3c7 50%, #fef9c3 100%)',
    goldShine: 'linear-gradient(45deg, #f59e0b, #fcd34d, #fbbf24, #f59e0b)',
    metallic: 'linear-gradient(135deg, #d97706 0%, #f59e0b 25%, #fcd34d 50%, #f59e0b 75%, #d97706 100%)',
    cardShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(245, 158, 11, 0.1)'
  }
};

// 目標達成状況に応じたテーマ選択ロジック
export const getThemeByProgress = (progressPercentage) => {
  if (progressPercentage >= 100) {
    return themes.gold; // 目標達成！金ぴかテーマ
  } else if (progressPercentage >= 80) {
    return themes.green; // 順調！緑テーマ
  } else if (progressPercentage >= 60) {
    return themes.blue; // まずまず、青テーマ
  } else if (progressPercentage >= 40) {
    return themes.yellow; // 注意、黄テーマ
  } else {
    return themes.red; // 危険！赤テーマ
  }
};

// テーマ選択のための進捗率計算
export const calculateProgress = (budget, records) => {
  if (!budget.targetAmount || !budget.targetDate) {
    return 0;
  }

  const today = new Date();
  const targetDate = new Date(budget.targetDate);
  const totalDays = Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24));
  
  if (totalDays <= 0) {
    // 期日を過ぎている場合
    const currentBalance = calculateCurrentBalance(budget, records);
    return currentBalance >= budget.targetAmount ? 100 : 0;
  }

  // 現在の残高を計算（初期残高 + 収入 - 支出）
  const currentBalance = calculateCurrentBalance(budget, records);
  
  // サブスクリプションを考慮した予測残高を計算
  let adjustedBalance = currentBalance;
  if (budget.includeSubscriptions && totalDays > 0) {
    const monthsRemaining = totalDays / 30;
    const subscriptionCost = calculateMonthlySubscriptions() * monthsRemaining;
    adjustedBalance = currentBalance - subscriptionCost;
  }
  
  // 現在の貯金進捗率を計算
  const progressPercentage = (adjustedBalance / budget.targetAmount) * 100;
  
  return Math.max(0, Math.min(100, progressPercentage));
};

// サブスクリプションの月額合計を計算
const calculateMonthlySubscriptions = () => {
  const subscriptions = JSON.parse(localStorage.getItem('kakeibo-subscriptions') || '[]');
  return subscriptions
    .filter(sub => sub.isActive)
    .reduce((total, sub) => {
      if (sub.cycle === 'monthly') {
        return total + (sub.type === '支出' ? sub.amount : -sub.amount);
      } else if (sub.cycle === 'halfyearly') {
        return total + (sub.type === '支出' ? sub.amount / 6 : -sub.amount / 6);
      }
      return total;
    }, 0);
};

// 現在の残高を計算するヘルパー関数
const calculateCurrentBalance = (budget, records) => {
  const initialBalance = budget.initialBalance || budget.balance || 0;
  
  const totalIncome = records
    .filter(record => record.type === '収入')
    .reduce((sum, record) => sum + (record.price || record.amount || 0), 0);
  
  const totalExpense = records
    .filter(record => record.type === '支出')
    .reduce((sum, record) => sum + (record.price || record.amount || 0), 0);
  
  return initialBalance + totalIncome - totalExpense;
};
