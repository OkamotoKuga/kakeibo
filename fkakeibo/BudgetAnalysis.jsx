import React from "react";

const BudgetAnalysis = ({ budget, records, currentTheme }) => {

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

  const getEffectiveMonthlyIncome = () => {
    if (!budget.includeSubscriptions) {
      return budget.monthlyIncome || 0;
    }
    const subscriptionCost = calculateMonthlySubscriptions();
    return (budget.monthlyIncome || 0) - subscriptionCost;
  };
  const calculateCurrentBalance = () => {
    if (!records) return budget.initialBalance || budget.balance || 0;
    
    const totalIncome = records
      .filter(record => record.type === '収入')
      .reduce((total, record) => total + record.amount, 0);
    
    const totalExpenses = records
      .filter(record => record.type === '支出')
      .reduce((total, record) => total + record.amount, 0);
    
    return (budget.initialBalance || budget.balance || 0) + totalIncome - totalExpenses;
  };

  const currentBalance = calculateCurrentBalance();

  const calculateBudgetInfo = () => {
    if (!budget.targetDate || !budget.monthlyIncome) {
      return null;
    }

    const today = new Date();
    const targetDate = new Date(budget.targetDate);
    const monthsToTarget = Math.max(
      1,
      Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24 * 30))
    );
    const daysToTarget = Math.max(
      1,
      Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24))
    );
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const thisMonthExpenses = records
      .filter((record) => {
        if (!record.date) return false;
        const recordDate = new Date(record.date);
        return (
          recordDate.getMonth() === currentMonth &&
          recordDate.getFullYear() === currentYear &&
          record.type === "支出"
        );
      })
      .reduce((total, record) => total + record.amount, 0);
    const thisMonthIncome = records
      .filter((record) => {
        if (!record.date) return false;
        const recordDate = new Date(record.date);
        return (
          recordDate.getMonth() === currentMonth &&
          recordDate.getFullYear() === currentYear &&
          record.type === "収入"
        );
      })
      .reduce((total, record) => total + record.amount, 0);    const needToSaveTotal = Math.max(0, budget.targetAmount - currentBalance);
    const needToSavePerMonth = needToSaveTotal / monthsToTarget;
    

    const effectiveMonthlyIncome = getEffectiveMonthlyIncome();
    const subscriptionCost = calculateMonthlySubscriptions();
    
    const availablePerMonth = Math.max(
      0,
      effectiveMonthlyIncome - needToSavePerMonth
    );
    const availablePerDay = availablePerMonth / 30;
    const remainingThisMonth = availablePerMonth - thisMonthExpenses;
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const remainingDaysInMonth = Math.max(0, daysInMonth - today.getDate() + 1);
    const remainingDailyBudget =
      remainingDaysInMonth > 0 ? remainingThisMonth / remainingDaysInMonth : 0;

    return {
      monthsToTarget,
      daysToTarget,
      needToSavePerMonth,
      availablePerMonth,
      availablePerDay,
      thisMonthExpenses,
      thisMonthIncome,
      remainingThisMonth,
      remainingDaysInMonth,
      remainingDailyBudget,      effectiveMonthlyIncome,
      subscriptionCost,
      includeSubscriptions: budget.includeSubscriptions
    };
  };

  const analysis = calculateBudgetInfo();
  if (!analysis) {
    return (
      <div className="budget-analysis">
        <h3 style={{ color: currentTheme?.primary || '#333' }}>📊 予算分析</h3>
        <div className="no-data" style={{ 
          padding: '20px', 
          textAlign: 'center',
          color: currentTheme?.textSecondary || '#666',
          backgroundColor: currentTheme?.secondary || '#f5f5f5',
          borderRadius: '8px'
        }}>
          <p>予算設定（目標期日と月収）を完了してください</p>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount) => {
    return amount.toLocaleString("ja-JP", {
      style: "currency",
      currency: "JPY",
    });
  };
  return (
    <div className="budget-analysis">
      <h3 style={{ color: currentTheme?.primary || '#333' }}>📊 予算分析</h3>

      <div className="analysis-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
        <div className="analysis-card primary" style={{
          padding: '20px',
          borderRadius: '12px',
          background: currentTheme?.gradient || 'linear-gradient(135deg, #0078d7 0%, #4a9eff 100%)',
          color: 'white',
          textAlign: 'center'
        }}>
          <h4 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>月間利用可能額</h4>
          <p className="amount" style={{ fontSize: '24px', fontWeight: 'bold', margin: '10px 0' }}>
            {formatCurrency(analysis.availablePerMonth)}
          </p>
          <small style={{ opacity: 0.9 }}>
            目標達成のため月{formatCurrency(analysis.needToSavePerMonth)}
            の貯金が必要
          </small>
        </div>

        <div className="analysis-card" style={{
          padding: '20px',
          borderRadius: '12px',
          backgroundColor: currentTheme?.surface || '#fff',
          border: `1px solid ${currentTheme?.border || '#e1e1e1'}`,
          textAlign: 'center',
          boxShadow: `0 4px 12px ${currentTheme?.shadow || 'rgba(0,0,0,0.1)'}`
        }}>
          <h4 style={{ margin: '0 0 10px 0', fontSize: '16px', color: currentTheme?.text || '#333' }}>1日あたり利用可能額</h4>
          <p className="amount" style={{ 
            fontSize: '24px', 
            fontWeight: 'bold', 
            margin: '10px 0',
            color: currentTheme?.primary || '#0078d7'
          }}>
            {formatCurrency(Math.floor(analysis.availablePerDay))}
          </p>
          <small style={{ color: currentTheme?.textSecondary || '#666' }}>月間予算を30日で割った額</small>
        </div>

        <div
          className={`analysis-card ${
            analysis.remainingThisMonth < 0 ? "warning" : "success"
          }`}
          style={{
            padding: '20px',
            borderRadius: '12px',
            backgroundColor: analysis.remainingThisMonth < 0 ? '#fff5f5' : currentTheme?.secondary || '#e8f5e8',
            border: `1px solid ${analysis.remainingThisMonth < 0 ? '#dc3545' : currentTheme?.border || '#e1e1e1'}`,
            textAlign: 'center',
            boxShadow: `0 4px 12px ${currentTheme?.shadow || 'rgba(0,0,0,0.1)'}`
          }}
        >
          <h4 style={{ margin: '0 0 10px 0', fontSize: '16px', color: currentTheme?.text || '#333' }}>今月の残り予算</h4>
          <p className="amount" style={{ 
            fontSize: '24px', 
            fontWeight: 'bold', 
            margin: '10px 0',
            color: analysis.remainingThisMonth < 0 ? '#dc3545' : currentTheme?.primary || '#28a745'
          }}>
            {formatCurrency(analysis.remainingThisMonth)}
          </p>
          <small style={{ color: currentTheme?.textSecondary || '#666' }}>残り{analysis.remainingDaysInMonth}日</small>
        </div>

        <div className="analysis-card">
          <h4>今日から1日あたり</h4>
          <p className="amount">
            {formatCurrency(
              Math.max(0, Math.floor(analysis.remainingDailyBudget))
            )}
          </p>
          <small>残り予算を残り日数で割った額</small>
        </div>

        <div className="analysis-card">
          <h4>今月の支出</h4>
          <p className="amount expense">
            {formatCurrency(analysis.thisMonthExpenses)}
          </p>
          <small>今月の支出合計</small>
        </div>        <div className="analysis-card">
          <h4>今月の収入</h4>
          <p className="amount income">
            {formatCurrency(analysis.thisMonthIncome)}
          </p>
          <small>今月の収入合計</small>
        </div>

        {/* サブスクリプション情報カード */}
        {analysis.includeSubscriptions && (
          <div className="analysis-card" style={{
            padding: '20px',
            borderRadius: '12px',
            backgroundColor: currentTheme?.secondary || '#f8f9fa',
            border: `1px solid ${currentTheme?.border || '#e1e1e1'}`,
            textAlign: 'center',
            boxShadow: `0 4px 12px ${currentTheme?.shadow || 'rgba(0,0,0,0.1)'}`
          }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '16px', color: currentTheme?.text || '#333' }}>
              💳 定期取引 (月額換算)
            </h4>
            <p className="amount" style={{ 
              fontSize: '20px', 
              fontWeight: 'bold', 
              margin: '10px 0',
              color: analysis.subscriptionCost > 0 ? '#dc3545' : '#28a745'
            }}>
              {formatCurrency(analysis.subscriptionCost)}
            </p>
            <small style={{ color: currentTheme?.textSecondary || '#666' }}>
              実質月収: {formatCurrency(analysis.effectiveMonthlyIncome)}
            </small>
          </div>
        )}

        <div className="analysis-card">
          <h4>現在の残高</h4>
          <p className="amount" style={{ 
            color: currentBalance >= 0 ? '#28a745' : '#dc3545'
          }}>
            {formatCurrency(currentBalance)}
          </p>
          <small>初期残高 + 収入 - 支出</small>
        </div>

        <div className="analysis-card">
          <h4>目標貯金額まで</h4>
          <p className="amount">
            {formatCurrency(Math.max(0, budget.targetAmount - currentBalance))}
          </p>
          <small>残り必要額</small>
        </div>
      </div>

      {analysis.remainingThisMonth < 0 && (
        <div className="alert warning">
          ⚠️ 今月の予算を{formatCurrency(Math.abs(analysis.remainingThisMonth))}
          超過しています
        </div>
      )}

      {analysis.remainingDaysInMonth > 0 && analysis.remainingThisMonth > 0 && (
        <div className="alert info">
          💡 今月残り{analysis.remainingDaysInMonth}日、1日あたり
          {formatCurrency(Math.floor(analysis.remainingDailyBudget))}使えます
        </div>
      )}
    </div>
  );
};

export default BudgetAnalysis;
