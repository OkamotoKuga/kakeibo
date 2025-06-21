import React, { useState, useEffect } from 'react';
import config from './config';

const SubscriptionComponent = ({ onClose, onSubscriptionsUpdated }) => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);  const [newSubscription, setNewSubscription] = useState({
    name: '',
    amount: '',
    startDate: '',
    cycle: 'monthly', 
    category: '娯楽',
    type: '支出' 
  });
  const [error, setError] = useState('');
  const categories = ['娯楽', '通信費', 'ユーティリティ', '教育', 'その他'];
  const incomeCategories = ['給与', '奨学金', '副業', '投資', 'その他'];
  

  const getCategoryIcon = (category) => {
    const icons = {
      '娯楽': '🎮',
      '通信費': '📱',
      'ユーティリティ': '⚡',
      '教育': '📚',
      '給与': '💼',
      '奨学金': '🎓',
      '副業': '💻',
      '投資': '📈',
      'その他': '📋'
    };
    return icons[category] || '📋';
  };

  const getCycleIcon = (cycle) => {
    return cycle === 'monthly' ? '📅' : '📆';
  };


  const getCycleName = (cycle) => {
    return cycle === 'monthly' ? '毎月' : '半年';
  };

  useEffect(() => {
    const savedSubscriptions = localStorage.getItem('kakeibo-subscriptions');
    if (savedSubscriptions) {
      const subs = JSON.parse(savedSubscriptions);
      setSubscriptions(subs);
      
      checkAndProcessPayments(subs);
    }
  }, []);

  const checkAndProcessPayments = async (subs) => {
    const today = new Date();
    const token = localStorage.getItem('auth_token');
    
    if (!token) return;

    for (const sub of subs) {
      if (!sub.isActive) continue;
      
      const nextPayment = new Date(sub.nextPayment);
      const isPaymentDay = today.toDateString() === nextPayment.toDateString();
      
      if (isPaymentDay) {
        await processPayment(sub);
      }
    }
  };

  const processPayment = async (subscription) => {
    try {
      const token = localStorage.getItem('auth_token');
      const today = new Date();
      
      const year = today.getFullYear();
      const month = today.getMonth() + 1;
      const day = today.getDate();
      
      const endpoint = subscription.type === '収入' ? '/data/income' : '/data/purchases';
      
      const response = await fetch(`${config.API_BASE}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          product_name: `[定期] ${subscription.name}`,
          price: Number(subscription.amount),
          year: year,
          month: month,
          day: day,
          category: subscription.category,
          type: subscription.type
        }),
      });

      if (response.ok) {        console.log(`✅ 定期${subscription.type === '収入' ? '収入' : '支払い'}を自動送信: ${subscription.name}`);
        
        // 現在のサブスクリプション一覧を取得
        const currentSubscriptions = JSON.parse(localStorage.getItem('kakeibo-subscriptions') || '[]');
        
        // 次回支払日を更新
        const updatedSubscriptions = currentSubscriptions.map(sub => {
          if (sub.id === subscription.id) {
            return {
              ...sub,
              nextPayment: calculateNextPayment(sub.startDate, sub.cycle)
            };
          }
          return sub;
        });
        
        saveSubscriptions(updatedSubscriptions);
        
        if (onSubscriptionsUpdated) {
          onSubscriptionsUpdated();
        }
      } else {
        console.error(`❌ 定期${subscription.type === '収入' ? '収入' : '支払い'}の自動送信に失敗: ${subscription.name}`);
      }
    } catch (error) {
      console.error('定期支払い処理エラー:', error);
    }
  };


  const saveSubscriptions = (subs) => {
    localStorage.setItem('kakeibo-subscriptions', JSON.stringify(subs));
    setSubscriptions(subs);

    if (onSubscriptionsUpdated) {
      onSubscriptionsUpdated();
    }
  };


  const calculateNextPayment = (startDate, cycle) => {
    const start = new Date(startDate);
    const today = new Date();
    let nextPayment = new Date(start);

    if (cycle === 'monthly') {
   
      while (nextPayment <= today) {
        nextPayment.setMonth(nextPayment.getMonth() + 1);
      }
    } else {
   
      while (nextPayment <= today) {
        nextPayment.setMonth(nextPayment.getMonth() + 6);
      }
    }

    return nextPayment;
  };


  const handleAddSubscription = (e) => {
    e.preventDefault();
    
    if (!newSubscription.name.trim() || !newSubscription.amount || !newSubscription.startDate) {
      setError('すべての項目を入力してください');
      return;
    }

    if (isNaN(newSubscription.amount) || Number(newSubscription.amount) <= 0) {
      setError('正しい金額を入力してください');
      return;
    }


    const existing = subscriptions.find(sub => 
      sub.name.toLowerCase() === newSubscription.name.trim().toLowerCase()
    );

    if (existing) {
      setError('同じ名前のサービスが既に登録されています');
      return;
    }    const subscription = {
      id: Date.now(),
      name: newSubscription.name.trim(),
      amount: Number(newSubscription.amount),
      startDate: newSubscription.startDate,
      cycle: newSubscription.cycle,
      category: newSubscription.category,
      type: newSubscription.type, 
      nextPayment: calculateNextPayment(newSubscription.startDate, newSubscription.cycle),
      isActive: true
    };

    const updatedSubscriptions = [...subscriptions, subscription];
    saveSubscriptions(updatedSubscriptions);
    
    setNewSubscription({
      name: '',
      amount: '',
      startDate: '',
      cycle: 'monthly',
      category: '娯楽',
      type: '支出'
    });
    setShowAddForm(false);
    setError('');
  };
  const handleDeleteSubscription = (id) => {
    if (window.confirm('このサブスクリプションを削除しますか？')) {
      const updatedSubscriptions = subscriptions.filter(sub => sub.id !== id);
      saveSubscriptions(updatedSubscriptions);
    }
  };

  const handleManualPayment = async (subscription) => {
    if (window.confirm(`${subscription.name}の${subscription.type === '収入' ? '収入' : '支払い'}を今すぐ実行しますか？`)) {
      await processPayment(subscription);
      alert(`✅ ${subscription.name}の${subscription.type === '収入' ? '収入' : '支払い'}を記録しました`);
    }
  };

  const toggleSubscription = (id) => {
    const updatedSubscriptions = subscriptions.map(sub =>
      sub.id === id ? { ...sub, isActive: !sub.isActive } : sub
    );
    saveSubscriptions(updatedSubscriptions);
  };

  const isPaymentToday = (subscription) => {
    const today = new Date();
    const nextPayment = new Date(subscription.nextPayment);
    return today.toDateString() === nextPayment.toDateString();
  };

  const getDaysUntilPayment = (subscription) => {
    const today = new Date();
    const nextPayment = new Date(subscription.nextPayment);
    const diffTime = nextPayment - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div style={{ padding: '20px' }}>      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>💳 定期取引管理</h2>
        <button onClick={onClose} style={{ 
          background: 'none', 
          border: 'none', 
          fontSize: '20px', 
          cursor: 'pointer' 
        }}>
          ✕
        </button>
      </div>

      {error && (
        <div style={{ 
          background: '#ffebee', 
          color: '#c62828', 
          padding: '10px', 
          borderRadius: '5px', 
          marginBottom: '15px' 
        }}>
          {error}
        </div>
      )}

      {/* 追加ボタン */}      <button
        onClick={() => setShowAddForm(!showAddForm)}
        className="themed-button"
        style={{ marginBottom: '20px', width: '100%' }}
      >
        {showAddForm ? 'キャンセル' : '+ 新しい定期取引を追加'}
      </button>

      {/* 追加フォーム */}
      {showAddForm && (        <form onSubmit={handleAddSubscription} style={{
          border: '2px solid #ddd',
          borderRadius: '10px',
          padding: '20px',
          marginBottom: '20px',
          backgroundColor: '#f9f9f9'
        }}>
          <h3>新規定期取引</h3>
          
          <div style={{ marginBottom: '15px' }}>
            <label>種別</label>
            <select
              value={newSubscription.type}
              onChange={(e) => {
                const newType = e.target.value;
                setNewSubscription({
                  ...newSubscription, 
                  type: newType,
                  category: newType === '収入' ? '給与' : '娯楽' 
                });
              }}
              className="themed-input"
              style={{ width: '100%', marginTop: '5px' }}
            >
              <option value="支出">支出 (定期支払い)</option>
              <option value="収入">収入 (定期収入)</option>
            </select>
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label>{newSubscription.type === '収入' ? 'サービス・収入源名' : 'サービス名'}</label>
            <input
              type="text"
              placeholder={newSubscription.type === '収入' ? '奨学金、給与、副業等' : 'Netflix, Spotify等'}
              value={newSubscription.name}
              onChange={(e) => setNewSubscription({...newSubscription, name: e.target.value})}
              className="themed-input"
              style={{ width: '100%', marginTop: '5px' }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label>{newSubscription.type === '収入' ? '金額（受け取り額）' : '月額料金'}</label>
            <input
              type="number"
              placeholder={newSubscription.type === '収入' ? '50000' : '980'}
              value={newSubscription.amount}
              onChange={(e) => setNewSubscription({...newSubscription, amount: e.target.value})}
              className="themed-input"
              style={{ width: '100%', marginTop: '5px' }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label>{newSubscription.type === '収入' ? '初回受け取り日' : '開始日（初回支払い日）'}</label>
            <input
              type="date"
              value={newSubscription.startDate}
              onChange={(e) => setNewSubscription({...newSubscription, startDate: e.target.value})}
              className="themed-input"
              style={{ width: '100%', marginTop: '5px' }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label>{newSubscription.type === '収入' ? '受け取り周期' : '支払い周期'}</label>
            <select
              value={newSubscription.cycle}
              onChange={(e) => setNewSubscription({...newSubscription, cycle: e.target.value})}
              className="themed-input"
              style={{ width: '100%', marginTop: '5px' }}
            >
              <option value="monthly">毎月</option>
              <option value="halfyearly">半年</option>
            </select>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label>カテゴリ</label>
            <select
              value={newSubscription.category}
              onChange={(e) => setNewSubscription({...newSubscription, category: e.target.value})}
              className="themed-input"
              style={{ width: '100%', marginTop: '5px' }}
            >
              {(newSubscription.type === '収入' ? incomeCategories : categories).map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <button type="submit" className="themed-button" style={{ width: '100%' }}>
            追加
          </button>
        </form>
      )}      {/* サブスクリプション一覧 */}
      <div>
        <h3>登録済み定期取引 ({subscriptions.length}件)</h3>
        {subscriptions.length === 0 ? (
          <p style={{ textAlign: 'center', opacity: 0.7, padding: '20px' }}>
            まだ定期取引が登録されていません
          </p>
        ) : (
          <div style={{ display: 'grid', gap: '15px' }}>
            {subscriptions.map(sub => {
              const daysUntil = getDaysUntilPayment(sub);
              const isToday = isPaymentToday(sub);
              const isIncome = sub.type === '収入';
              
              return (
                <div key={sub.id} style={{
                  border: `2px solid ${isToday ? '#f44336' : isIncome ? '#4caf50' : sub.isActive ? '#2196f3' : '#999'}`,
                  borderRadius: '10px',
                  padding: '15px',
                  backgroundColor: isToday ? '#ffebee' : isIncome ? '#e8f5e8' : sub.isActive ? '#e3f2fd' : '#f5f5f5'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <h4 style={{ margin: 0 }}>
                      {isIncome ? '💰' : '💳'} {getCategoryIcon(sub.category)} {sub.name}
                      {!sub.isActive && <span style={{ opacity: 0.5 }}> (停止中)</span>}
                    </h4>                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={() => handleManualPayment(sub)}
                        style={{
                          padding: '5px 10px',
                          border: 'none',
                          borderRadius: '5px',
                          cursor: 'pointer',
                          backgroundColor: isIncome ? '#4caf50' : '#2196f3',
                          color: 'white',
                          fontSize: '0.8em'
                        }}
                      >
                        {isIncome ? '💰 受取' : '💸 支払'}
                      </button>
                      <button
                        onClick={() => toggleSubscription(sub.id)}
                        style={{
                          padding: '5px 10px',
                          border: 'none',
                          borderRadius: '5px',
                          cursor: 'pointer',
                          backgroundColor: sub.isActive ? '#ff9800' : '#4caf50',
                          color: 'white'
                        }}
                      >
                        {sub.isActive ? '停止' : '再開'}
                      </button>
                      <button
                        onClick={() => handleDeleteSubscription(sub.id)}
                        style={{
                          padding: '5px 10px',
                          border: 'none',
                          borderRadius: '5px',
                          cursor: 'pointer',
                          backgroundColor: '#f44336',
                          color: 'white'
                        }}
                      >
                        削除
                      </button>
                    </div>
                  </div>
                  
                  <div style={{ fontSize: '0.9em', color: '#666' }}>
                    <p style={{ margin: '5px 0' }}>
                      {isIncome ? '💰' : '💸'} {sub.amount.toLocaleString()}円 / {getCycleName(sub.cycle)}
                      <span style={{ 
                        marginLeft: '10px',
                        padding: '2px 6px',
                        borderRadius: '12px',
                        fontSize: '0.8em',
                        backgroundColor: isIncome ? '#4caf50' : '#f44336',
                        color: 'white'
                      }}>
                        {sub.type}
                      </span>
                    </p>
                    <p style={{ margin: '5px 0' }}>
                      {getCycleIcon(sub.cycle)} 次回{isIncome ? '受取' : '支払'}日: {new Date(sub.nextPayment).toLocaleDateString('ja-JP')}
                      {isToday && <span style={{ color: '#f44336', fontWeight: 'bold' }}> (今日！)</span>}
                      {!isToday && daysUntil > 0 && <span> (あと{daysUntil}日)</span>}
                    </p>
                    <p style={{ margin: '5px 0' }}>
                      📅 開始日: {new Date(sub.startDate).toLocaleDateString('ja-JP')}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionComponent;
