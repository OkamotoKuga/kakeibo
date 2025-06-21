import React, { useState, useEffect } from "react";

const BudgetSettings = ({ budget, onBudgetChange, currentTheme, records }) => {  const [localBudget, setLocalBudget] = useState({
    initialBalance: 0,
    targetAmount: 0,
    targetDate: "",
    monthlyIncome: 0,
    includeSubscriptions: true,  
    ...budget,
  });

  useEffect(() => {
    setLocalBudget({ ...localBudget, ...budget });
  }, [budget]);

  const handleChange = (field, value) => {
    const newBudget = { ...localBudget, [field]: value };
    setLocalBudget(newBudget);
    onBudgetChange(newBudget);
  };  const calculateCurrentBalance = () => {
    if (!records) return localBudget.initialBalance || 0;
    
    const totalIncome = records
      .filter(record => record.type === '収入')
      .reduce((total, record) => total + record.amount, 0);
    
    const totalExpenses = records
      .filter(record => record.type === '支出')
      .reduce((total, record) => total + record.amount, 0);
    
    return (localBudget.initialBalance || 0) + totalIncome - totalExpenses;
  };

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
    if (!localBudget.includeSubscriptions) {
      return localBudget.monthlyIncome || 0;
    }
    const subscriptionCost = calculateMonthlySubscriptions();
    return (localBudget.monthlyIncome || 0) - subscriptionCost;
  };

  const currentBalance = calculateCurrentBalance();
  const formatCurrency = (amount) => {
    return amount.toLocaleString("ja-JP", {
      style: "currency",
      currency: "JPY",
    });
  };  return (
    <div className="budget-settings">
      <h3 style={{ color: currentTheme?.primary || '#333' }}>💰 予算設定</h3>
      
      {/* 残高表示セクション */}
      <div className="balance-summary" style={{ 
        marginBottom: '20px', 
        padding: '15px', 
        backgroundColor: currentTheme?.secondary || '#f8f9fa',
        borderRadius: '8px',
        border: `1px solid ${currentTheme?.border || '#e1e1e1'}`
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <div>
            <label style={{ color: currentTheme?.textSecondary || '#666', fontSize: '14px' }}>初期残高</label>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: currentTheme?.text || '#333' }}>
              {formatCurrency(localBudget.initialBalance || 0)}
            </div>
          </div>
          <div>
            <label style={{ color: currentTheme?.textSecondary || '#666', fontSize: '14px' }}>現在の残高（計算値）</label>
            <div style={{ 
              fontSize: '18px', 
              fontWeight: 'bold', 
              color: currentBalance >= 0 ? '#28a745' : '#dc3545' 
            }}>
              {formatCurrency(currentBalance)}
            </div>
            <small style={{ color: currentTheme?.textSecondary || '#666' }}>
              初期残高 + 収入 - 支出
            </small>
          </div>
        </div>
      </div>

      <div className="budget-form" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
        <div className="form-group">
          <label style={{ color: currentTheme?.textSecondary || '#666', marginBottom: '5px', display: 'block' }}>初期残高 (円)</label>
          <input
            type="number"
            value={localBudget.initialBalance || 0}
            onChange={(e) => handleChange("initialBalance", Number(e.target.value))}
            placeholder="初期残高を入力"
            className="themed-input"
            style={{ 
              width: '100%',
              borderColor: currentTheme?.border || '#e1e1e1',
              backgroundColor: currentTheme?.surface || '#fff'
            }}
          />
        </div>

        <div className="form-group">
          <label style={{ color: currentTheme?.textSecondary || '#666', marginBottom: '5px', display: 'block' }}>目標貯金額 (円)</label>
          <input
            type="number"
            value={localBudget.targetAmount}
            onChange={(e) =>
              handleChange("targetAmount", Number(e.target.value))
            }
            placeholder="目標貯金額を入力"
            className="themed-input"
            style={{ 
              width: '100%',
              borderColor: currentTheme?.border || '#e1e1e1',
              backgroundColor: currentTheme?.surface || '#fff'
            }}
          />
        </div>

        <div className="form-group">
          <label style={{ color: currentTheme?.textSecondary || '#666', marginBottom: '5px', display: 'block' }}>目標期日</label>
          <input
            type="date"
            value={localBudget.targetDate}
            onChange={(e) => handleChange("targetDate", e.target.value)}
            className="themed-input"
            style={{ 
              width: '100%',
              borderColor: currentTheme?.border || '#e1e1e1',
              backgroundColor: currentTheme?.surface || '#fff'
            }}
          />
        </div>        <div className="form-group">
          <label style={{ color: currentTheme?.textSecondary || '#666', marginBottom: '5px', display: 'block' }}>月収 (円)</label>
          <input
            type="number"
            value={localBudget.monthlyIncome}
            onChange={(e) =>
              handleChange("monthlyIncome", Number(e.target.value))
            }
            placeholder="平均月収を入力"
            className="themed-input"
            style={{ 
              width: '100%',
              borderColor: currentTheme?.border || '#e1e1e1',
              backgroundColor: currentTheme?.surface || '#fff'
            }}
          />
        </div>

        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
          <label style={{ 
            display: 'flex', 
            alignItems: 'center', 
            color: currentTheme?.textSecondary || '#666',
            fontSize: '14px',
            cursor: 'pointer'
          }}>
            <input
              type="checkbox"
              checked={localBudget.includeSubscriptions}
              onChange={(e) => handleChange("includeSubscriptions", e.target.checked)}
              style={{ marginRight: '8px' }}
            />
            💳 定期取引（サブスクリプション）を予算計算に含める
          </label>
          <small style={{ 
            color: currentTheme?.textSecondary || '#888', 
            marginLeft: '20px',
            display: 'block',
            marginTop: '5px'
          }}>
            {localBudget.includeSubscriptions ? 
              `月額サブスク費用: ${formatCurrency(calculateMonthlySubscriptions())} (実質月収: ${formatCurrency(getEffectiveMonthlyIncome())})` :
              '定期取引は予算計算に含まれません'
            }
          </small>
        </div>
      </div>
    </div>
  );
};

export default BudgetSettings;
