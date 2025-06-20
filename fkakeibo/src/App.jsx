import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './CustomCalendar.css';
import './ThemeStyles.css';
import './OCRComponent.css';
import './QuickEntryComponent.css';
import './SidebarStyles.css';
import './SubscriptionComponent.css';
import BudgetSettings from './BudgetSettings';
import BudgetAnalysis from './BudgetAnalysis';
import SimpleWeatherForecast from './SimpleWeatherForecast';
import OCRComponent from './OCRComponent';
import QuickEntryComponent from './QuickEntryComponent';
import SubscriptionComponent from './SubscriptionComponent';
import LoginComponent from './LoginComponentSimple';
import SignUpComponent from './SignUpComponentSimple';
import config from './config';

import { themes, getThemeByProgress, calculateProgress } from './themes';

function formatYen(num) {
  return num.toLocaleString('ja-JP', { style: 'currency', currency: 'JPY' });
}


function isSameDate(date1, date2) {
  if (!date1 || !date2) return false;
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const result = d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
  
  
  
  return result;
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  
  const [records, setRecords] = useState([]);
  const [form, setForm] = useState({ type: '支出', amount: '', memo: '', date: new Date(), category: 'その他' });
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [budget, setBudget] = useState({
    balance: 0,
    targetAmount: 0,
    targetDate: '',
    monthlyIncome: 0
  });
  
  const [showLogin, setShowLogin] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);  const [showBudgetSettings, setShowBudgetSettings] = useState(false);
  const [showBudgetAnalysis, setShowBudgetAnalysis] = useState(false);
  const [showWeatherForecast, setShowWeatherForecast] = useState(false);  const [showOCR, setShowOCR] = useState(false);  const [showQuickEntry, setShowQuickEntry] = useState(false);
  const [showSubscriptions, setShowSubscriptions] = useState(false);
  const [frequentItems, setFrequentItems] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [editingRecord, setEditingRecord] = useState(null);
  const [editForm, setEditForm] = useState({ type: '支出', amount: '', memo: '', date: new Date(), category: 'その他' });
  
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = () => {
    const token = localStorage.getItem('auth_token');
    const userData = localStorage.getItem('user_data');
    
    if (token && userData) {
      try {
        const user = JSON.parse(userData);
        setIsAuthenticated(true);
        setCurrentUser(user);
      } catch (error) {
        console.error('ユーザーデータの解析に失敗:', error);
        handleLogout();
      }
    }
  };

  const handleLogin = (userData) => {
    localStorage.setItem('auth_token', userData.token);
    localStorage.setItem('user_data', JSON.stringify(userData.user));
    setIsAuthenticated(true);
    setCurrentUser(userData.user);
    setShowLogin(false);
  };

  const handleSignUp = (userData) => {
    localStorage.setItem('auth_token', userData.token);
    localStorage.setItem('user_data', JSON.stringify(userData.user));
    setIsAuthenticated(true);
    setCurrentUser(userData.user);
    setShowSignUp(false);
  };
  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    setIsAuthenticated(false);
    setCurrentUser(null);
    setRecords([]);
    setBudget({
      balance: 0,
      targetAmount: 0,
      targetDate: '',
      monthlyIncome: 0
    });
  };
  const loadUserData = async () => {
    if (!isAuthenticated) return;

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        console.log('認証トークンがありません');
        return;
      }

      console.log('データ取得開始:', `${config.API_BASE}/data/purchases`);
      
      const response = await fetch(`${config.API_BASE}/data/purchases`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('データ取得レスポンス:', response.status);
      const responseText = await response.text();
      console.log('データ取得内容:', responseText);

      if (response.ok) {        const data = JSON.parse(responseText);        if (data.purchases) {
          const formattedRecords = data.purchases.map(purchase => {                        console.log('=== loadUserData デバッグ ===');
            console.log('バックエンドから受信:', purchase);
            console.log('受信した年月日:', purchase.year, purchase.month, purchase.day);
            console.log('受信したtype:', purchase.type);
            console.log('受信したcategory:', purchase.category);                        const monthStr = String(purchase.month).padStart(2, '0');
            const dayStr = String(purchase.day).padStart(2, '0');
            const recordDate = new Date(purchase.year, purchase.month - 1, purchase.day);            console.log('作成したローカル時間のDate:', recordDate);
            console.log('作成したDateの年月日:', recordDate.getFullYear(), recordDate.getMonth() + 1, recordDate.getDate());
            
            const record = {
              id: purchase.product_id,
              type: purchase.type || '支出',               amount: purchase.price,
              memo: purchase.product_name,
              date: recordDate,
              category: purchase.category
            };
            
            console.log('作成したレコードオブジェクト:', record);
            console.log('---');

            return record;
          });
          setRecords(formattedRecords);
          console.log('データ読み込み完了:', formattedRecords.length, '件');
          console.log('変換後のレコード例:', formattedRecords[0]);
        } else {
          console.log('購入データがありません');
          setRecords([]);
        }
      } else {
        console.error('データ取得失敗:', response.status, responseText);
      }
    } catch (error) {
      console.error('データの読み込みに失敗:', error);
    }
  };

  useEffect(() => {
    const savedItems = localStorage.getItem('kakeibo-frequent-items');
    if (savedItems) {
      setFrequentItems(JSON.parse(savedItems));
    }
  }, [showQuickEntry]);   useEffect(() => {
    const savedSubscriptions = localStorage.getItem('kakeibo-subscriptions');
    if (savedSubscriptions) {
      setSubscriptions(JSON.parse(savedSubscriptions));
    }
    checkAndProcessSubscriptions();
  }, [showSubscriptions]);
  const checkAndProcessSubscriptions = () => {
    const savedSubscriptions = localStorage.getItem('kakeibo-subscriptions');
    if (!savedSubscriptions) return;

    const subs = JSON.parse(savedSubscriptions);
    const today = new Date();
    const todayString = today.toDateString();
    const processedToday = localStorage.getItem(`kakeibo-processed-${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`);
    
    if (processedToday) return; 
    let newRecords = [];
    let updatedSubscriptions = [];

    subs.forEach(sub => {
      if (!sub.isActive) {
        updatedSubscriptions.push(sub);
        return;
      }

      const nextPayment = new Date(sub.nextPayment);
        if (nextPayment.toDateString() === todayString) {
        const newRecord = {
          type: sub.type,           amount: sub.amount,
          memo: `${sub.name} (定期${sub.type === '収入' ? '収入' : '支払い'})`,
          date: today,
          id: Date.now() + Math.random(),
          isAutomatic: true         };
        
        newRecords.push(newRecord);
        const nextPaymentDate = new Date(nextPayment);
        if (sub.cycle === 'monthly') {
          nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
        } else {
          nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 6);
        }
        
        updatedSubscriptions.push({
          ...sub,
          nextPayment: nextPaymentDate
        });
      } else {
        updatedSubscriptions.push(sub);
      }
    });

    if (newRecords.length > 0) {
      const currentRecords = JSON.parse(localStorage.getItem('kakeibo-records') || '[]');
      const allRecords = [...currentRecords, ...newRecords];
      setRecords(allRecords);
      localStorage.setItem('kakeibo-records', JSON.stringify(allRecords));
      localStorage.setItem('kakeibo-subscriptions', JSON.stringify(updatedSubscriptions));
      setSubscriptions(updatedSubscriptions);
      localStorage.setItem(`kakeibo-processed-${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`, 'true');
      alert(`${newRecords.length}件の定期支払いを自動で記録しました！\n${newRecords.map(r => `・${r.memo}: ${formatYen(r.amount)}`).join('\n')}`);
    }
  };
  const getCategoryIcon = (category) => {
    const icons = {
      '食品': '🍎',
      '娯楽': '🎮', 
      '衣類': '👕',
      '日用品': '🧴',
      'その他': '📦'
    };
    return icons[category] || '📦';
  };  const handleQuickAdd = async (item, quantity = 1) => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        alert('ログインが必要です');
        return;
      }
      const targetDate = selectedDate || new Date();
      
      console.log('=== handleQuickAdd 日付デバッグ ===');
      console.log('selectedDate:', selectedDate);
      console.log('使用するtargetDate:', targetDate);
      
      const year = targetDate.getFullYear();
      const month = targetDate.getMonth() + 1;
      const day = targetDate.getDate();
      
      console.log('取得した年月日:', year, month, day);
      
      const sendData = {
        product_name: quantity > 1 ? `${item.name} x${quantity}` : item.name,
        price: item.price * quantity,
        year: year,
        month: month,
        day: day,
        category: item.category || 'その他'
      };
      
      console.log('送信データ:', sendData);

      const response = await fetch(`${config.API_BASE}/data/purchases`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(sendData),
      });

      if (response.ok) {
        await loadUserData();
        alert(`${quantity > 1 ? `${item.name} x${quantity}` : item.name} (${formatYen(item.price * quantity)}) を追加しました！`);
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('クイック追加エラー:', error);
      alert(`⚠️ 登録に失敗しました: ${error.message}`);
    }
  };
  const getThisMonthSubscriptions = () => {
    const today = new Date();
    const thisMonth = today.getMonth();
    const thisYear = today.getFullYear();
    
    return subscriptions
      .filter(sub => sub.isActive)
      .map(sub => {
        const nextPayment = new Date(sub.nextPayment);
        return {
          ...sub,
          nextPayment,
          isThisMonth: nextPayment.getMonth() === thisMonth && nextPayment.getFullYear() === thisYear,
          daysUntil: Math.ceil((nextPayment - today) / (1000 * 60 * 60 * 24))
        };
      })
      .filter(sub => sub.isThisMonth)
      .sort((a, b) => a.nextPayment - b.nextPayment);
  };
  const progressPercentage = calculateProgress(budget, records);  const currentTheme = getThemeByProgress(progressPercentage);
  const themeClass = `theme-${Object.keys(themes).find(key => themes[key] === currentTheme)}`;
    useEffect(() => {
    if (isAuthenticated) {
      loadUserData();
      const savedBudget = localStorage.getItem('kakeibo-budget');
      if (savedBudget) {
        setBudget(JSON.parse(savedBudget));
      }
    }
  }, [isAuthenticated]);
  useEffect(() => {
    localStorage.setItem('kakeibo-records', JSON.stringify(records));
  }, [records]);

  const handleBudgetChange = (newBudget) => {
    setBudget(newBudget);
    localStorage.setItem('kakeibo-budget', JSON.stringify(newBudget));
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };  const handleDateChange = (date) => {
    console.log('=== 日付選択デバッグ ===');
    console.log('カレンダーで選択された日付:', date);
    console.log('選択された年月日:', date.getFullYear(), date.getMonth() + 1, date.getDate());
    const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    console.log('ローカル時間に調整後:', localDate);
    console.log('調整後の年月日:', localDate.getFullYear(), localDate.getMonth() + 1, localDate.getDate());
    console.log('selectedDateに設定される値:', localDate);
    
    setSelectedDate(localDate);
    setForm({ ...form, date: localDate });
    
    console.log('setSelectedDate完了');
  };const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.amount || isNaN(form.amount)) return;

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        alert('ログインが必要です');
        return;
      }            const targetDate = selectedDate || form.date;
        console.log('=== handleSubmit 日付デバッグ ===');
      console.log('selectedDate:', selectedDate);
      console.log('form.date:', form.date);
      console.log('form.type:', form.type);
      console.log('使用するtargetDate:', targetDate);
      const year = targetDate.getFullYear();
      const month = targetDate.getMonth() + 1;       const day = targetDate.getDate();
      
      console.log('取得した年月日:', year, month, day);      console.log('送信データ:', {
        product_name: form.memo || '入力なし',
        price: Number(form.amount),
        year: year,
        month: month,
        day: day,
        category: form.category || 'その他',
        type: form.type       });            const endpoint = form.type === '収入' ? '/data/income' : '/data/purchases';
      
      const response = await fetch(`${config.API_BASE}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          product_name: form.memo || '入力なし',
          price: Number(form.amount),
          year: year,
          month: month,
          day: day,
          category: form.category || 'その他',
          type: form.type         }),
      });

      console.log('レスポンス状態:', response.status);
      const responseText = await response.text();
      console.log('レスポンス内容:', responseText);      if (response.ok) {                setForm({ ...form, amount: '', memo: '', category: 'その他', date: selectedDate });
        await loadUserData();
        alert('✅ 記録を保存しました');
      } else {
        const errorMessage = responseText || `HTTP ${response.status}`;
        throw new Error(errorMessage);
      }    } catch (error) {
      console.error('データ保存エラー:', error);
      alert(`⚠️ 登録に失敗しました: ${error.message}`);
    }
  };  const handleExternalRecordsAdded = async (items) => {
    if (!items || items.length === 0) return;

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        alert('ログインが必要です');
        return;
      }            for (const item of items) {
        const targetDate = item.date || selectedDate || new Date();
        const year = targetDate.getFullYear();
        const month = targetDate.getMonth() + 1;
        const day = targetDate.getDate();
        const endpoint = item.type === '収入' ? '/data/income' : '/data/purchases';
        
        const requestBody = {
          product_name: item.memo || item.product_name || '入力なし',
          price: Number(item.amount || item.price),
          year: year,
          month: month,
          day: day,
          type: item.type || '支出'
        };
        if (item.type !== '収入') {
          requestBody.category = item.category || 'その他';
        }

        const response = await fetch(`${config.API_BASE}${endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          console.error(`アイテム保存エラー: ${response.status}`);
        }
      }
      await loadUserData();
      alert(`${items.length}件のレコードを追加しました！`);
    } catch (error) {
      console.error('外部レコード追加エラー:', error);
      alert(`⚠️ 一部の登録に失敗しました: ${error.message}`);
    }
  };
  const handleEdit = (record) => {
    setEditingRecord(record);
    setEditForm({
      type: record.type,
      amount: record.amount,
      memo: record.memo,
      date: record.date,
      category: record.category
    });
  };
  const handleCancelEdit = () => {
    setEditingRecord(null);
    setEditForm({ type: '支出', amount: '', memo: '', date: new Date(), category: 'その他' });
  };
  const handleSaveEdit = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        alert('認証が必要です');
        return;
      }

      const targetDate = editForm.date || editingRecord.date || selectedDate;
      const year = targetDate.getFullYear();
      const month = targetDate.getMonth() + 1;
      const day = targetDate.getDate();

      const endpoint = editForm.type === '収入' ? '/data/income' : '/data/purchases';
      const response = await fetch(`${config.API_BASE}${endpoint}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },        body: JSON.stringify({
          product_id: editingRecord.id,
          product_name: editForm.memo,
          price: Number(editForm.amount),
          year: year,
          month: month,
          day: day,
          category: editForm.category,
          type: editForm.type
        }),
      });

      if (response.ok) {
        await loadUserData();
        handleCancelEdit();
        alert('✅ 記録を更新しました！');
      } else {
        const errorText = await response.text();
        console.error('編集エラー:', response.status, errorText);
        alert(`❌ 編集に失敗しました: ${errorText}`);
      }
    } catch (error) {
      console.error('編集エラー:', error);
      alert(`❌ 編集に失敗しました: ${error.message}`);
    }
  };
  const handleDelete = async (record) => {
    if (!confirm(`「${record.memo}」を削除しますか？`)) {
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        alert('認証が必要です');
        return;
      }

      const endpoint = record.type === '収入' ? '/data/income' : '/data/purchases';
      const response = await fetch(`${config.API_BASE}${endpoint}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },        body: JSON.stringify({
          product_id: record.id
        }),
      });

      if (response.ok) {
        await loadUserData();
        alert('✅ 記録を削除しました！');
      } else {
        const errorText = await response.text();
        console.error('削除エラー:', response.status, errorText);
        alert(`❌ 削除に失敗しました: ${errorText}`);
      }
    } catch (error) {
      console.error('削除エラー:', error);
      alert(`❌ 削除に失敗しました: ${error.message}`);
    }
  };

  const total = records.reduce((acc, r) => acc + (r.type === '収入' ? r.amount : -r.amount), 0);
  if (!isAuthenticated) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
        fontFamily: 'sans-serif'
      }}>
        <div style={{
          maxWidth: '400px',
          width: '100%',
          padding: '20px',
          textAlign: 'center'
        }}>
          <h1 style={{ 
            fontSize: '2.5em', 
            marginBottom: '20px', 
            color: '#333' 
          }}>
            💰 家計簿アプリ
          </h1>
          <p style={{ 
            fontSize: '1.1em', 
            color: '#666', 
            marginBottom: '30px' 
          }}>
            レシートOCRと定期取引管理で、簡単に家計管理
          </p>
          
          {!showLogin && !showSignUp && (
            <>
              <button
                onClick={() => setShowLogin(true)}
                style={{
                  width: '100%',
                  padding: '15px',
                  marginBottom: '15px',
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1.1em',
                  cursor: 'pointer',
                  transition: 'background-color 0.3s'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#45a049'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#4CAF50'}
              >
                🔓 ログイン
              </button>
              
              <button
                onClick={() => setShowSignUp(true)}
                style={{
                  width: '100%',
                  padding: '15px',
                  backgroundColor: 'transparent',
                  color: '#4CAF50',
                  border: '2px solid #4CAF50',
                  borderRadius: '8px',
                  fontSize: '1.1em',
                  cursor: 'pointer',
                  transition: 'all 0.3s'
                }}
                onMouseOver={(e) => {
                  e.target.style.backgroundColor = '#4CAF50';
                  e.target.style.color = 'white';
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.color = '#4CAF50';
                }}
              >
                ✨ 新規登録
              </button>
            </>
          )}          {showLogin && (
            <LoginComponent
              onLogin={handleLogin}
              onClose={() => setShowLogin(false)}
              onSwitchToSignUp={() => {
                setShowLogin(false);
                setShowSignUp(true);
              }}
            />
          )}
          
          {showSignUp && (
            <SignUpComponent
              onSignUp={handleSignUp}
              onClose={() => setShowSignUp(false)}
              onSwitchToLogin={() => {
                setShowSignUp(false);
                setShowLogin(true);
              }}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`app-container ${themeClass}`} style={{ 
      backgroundColor: currentTheme.background, 
      color: currentTheme.text, 
      fontFamily: 'sans-serif',
      minHeight: '100vh',
      display: 'flex'
    }}>      {/* サイドバー */}
      <div className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`} style={{
        width: sidebarOpen ? '280px' : '60px',
        backgroundColor: currentTheme.secondary,
        borderRight: `2px solid ${currentTheme.border}`,
        padding: sidebarOpen ? '20px' : '10px',
        boxShadow: '2px 0 10px rgba(0,0,0,0.1)',
        overflowY: 'auto',
        position: 'fixed',
        height: '100vh',
        left: 0,
        top: 0,
        transition: 'all 0.3s ease'
      }}>
        {/* ハンバーガーメニューボタン */}
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="hamburger-button"
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            background: currentTheme.primary,
            border: 'none',
            fontSize: '18px',
            cursor: 'pointer',
            color: '#fff',
            padding: '8px',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title={sidebarOpen ? 'サイドバーを閉じる' : 'サイドバーを開く'}
        >
          {sidebarOpen ? '←' : '→'}
        </button>        {/* ヘッダー */}
        <h1 className={`sidebar-title ${themeClass === 'theme-gold' ? 'gold-effect' : ''}`} style={{
          fontSize: sidebarOpen ? '1.3em' : '0.8em',
          marginBottom: '20px',
          textAlign: 'center',
          borderBottom: `2px solid ${currentTheme.border}`,
          paddingBottom: '10px',
          marginTop: '30px'
        }}>
          {sidebarOpen ? '🏠 家計簿' : '🏠'}
        </h1>

        {/* ユーザー情報 */}
        {sidebarOpen && currentUser && (
          <div style={{
            backgroundColor: currentTheme.background,
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '15px',
            fontSize: '0.85em',
            textAlign: 'center',
            border: `1px solid ${currentTheme.border}`
          }}>
            <div style={{ 
              fontSize: '1.2em', 
              marginBottom: '5px' 
            }}>
              👤 {currentUser.name}
            </div>
            <div style={{ 
              fontSize: '0.8em', 
              color: currentTheme.textSecondary,
              marginBottom: '10px'            }}>
              {currentUser.email}
            </div>
            <button
              onClick={handleLogout}
              style={{
                width: '100%',
                padding: '8px',
                backgroundColor: '#F44336',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                fontSize: '0.8em',
                cursor: 'pointer',
                transition: 'background-color 0.3s'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#d32f2f'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#F44336'}
            >
              🚪 ログアウト
            </button>
          </div>
        )}

        {!sidebarOpen && currentUser && (
          <div style={{
            textAlign: 'center',
            marginBottom: '15px',
            fontSize: '0.7em'
          }}>            <div style={{ marginBottom: '5px' }}>👤</div>
            <button
              onClick={handleLogout}
              style={{
                width: '40px',
                height: '30px',
                backgroundColor: '#F44336',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                fontSize: '0.7em',
                cursor: 'pointer'
              }}
              title="ログアウト"
            >
              🚪
            </button>
          </div>
        )}

        {/* 進捗表示 */}
        {budget.targetAmount > 0 && sidebarOpen && (
          <div className="progress-indicator" style={{
            backgroundColor: currentTheme.background,
            padding: '10px',
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '0.85em',
            textAlign: 'center'
          }}>
            📊 進捗: {progressPercentage.toFixed(1)}%<br/>
            テーマ: {currentTheme.name}
          </div>
        )}

        {/* メニューボタン */}
        <div className="sidebar-menu">
          {sidebarOpen && <h3 style={{ fontSize: '1em', marginBottom: '15px' }}>🔧 機能メニュー</h3>}
            <button 
            onClick={() => setShowBudgetSettings(!showBudgetSettings)}
            className="sidebar-button"
            style={{ 
              width: '100%',
              padding: sidebarOpen ? '12px' : '8px',
              marginBottom: '8px',
              backgroundColor: showBudgetSettings ? currentTheme?.primary : 'transparent',
              color: showBudgetSettings ? '#fff' : currentTheme?.text,
              border: `2px solid ${showBudgetSettings ? currentTheme?.primary : currentTheme?.border}`,
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.3s',
              fontSize: sidebarOpen ? '0.9em' : '0.7em',
              textAlign: sidebarOpen ? 'left' : 'center'
            }}
            title={sidebarOpen ? '' : '予算設定'}
          >
            {sidebarOpen ? `💰 予算設定 ${showBudgetSettings ? '▼' : '▶'}` : '💰'}
          </button>
          
          <button 
            onClick={() => setShowBudgetAnalysis(!showBudgetAnalysis)}
            className="sidebar-button"
            style={{ 
              width: '100%',
              padding: sidebarOpen ? '12px' : '8px',
              marginBottom: '8px',
              backgroundColor: showBudgetAnalysis ? currentTheme?.primary : 'transparent',
              color: showBudgetAnalysis ? '#fff' : currentTheme?.text,
              border: `2px solid ${showBudgetAnalysis ? currentTheme?.primary : currentTheme?.border}`,
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.3s',
              fontSize: sidebarOpen ? '0.9em' : '0.7em',
              textAlign: sidebarOpen ? 'left' : 'center'
            }}
            title={sidebarOpen ? '' : '予算分析'}
          >
            {sidebarOpen ? `📊 予算分析 ${showBudgetAnalysis ? '▼' : '▶'}` : '📊'}
          </button>
          
          <button 
            onClick={() => setShowWeatherForecast(!showWeatherForecast)}
            className="sidebar-button"
            style={{ 
              width: '100%',
              padding: sidebarOpen ? '12px' : '8px',
              marginBottom: '8px',
              backgroundColor: showWeatherForecast ? currentTheme?.primary : 'transparent',
              color: showWeatherForecast ? '#fff' : currentTheme?.text,
              border: `2px solid ${showWeatherForecast ? currentTheme?.primary : currentTheme?.border}`,
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.3s',
              fontSize: sidebarOpen ? '0.9em' : '0.7em',
              textAlign: sidebarOpen ? 'left' : 'center'
            }}
            title={sidebarOpen ? '' : '天気予報'}
          >
            {sidebarOpen ? `🌤️ 天気予報 ${showWeatherForecast ? '▼' : '▶'}` : '🌤️'}
          </button>
          
          <button 
            onClick={() => setShowOCR(!showOCR)}
            className="sidebar-button"
            style={{ 
              width: '100%',
              padding: sidebarOpen ? '12px' : '8px',
              marginBottom: '8px',
              backgroundColor: showOCR ? currentTheme?.primary : 'transparent',
              color: showOCR ? '#fff' : currentTheme?.text,
              border: `2px solid ${showOCR ? currentTheme?.primary : currentTheme?.border}`,
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.3s',
              fontSize: sidebarOpen ? '0.9em' : '0.7em',
              textAlign: sidebarOpen ? 'left' : 'center'
            }}
            title={sidebarOpen ? '' : 'レシートOCR'}
          >
            {sidebarOpen ? `📸 レシートOCR ${showOCR ? '▼' : '▶'}` : '📸'}
          </button>
            <button 
            onClick={() => setShowQuickEntry(!showQuickEntry)}
            className="sidebar-button"
            style={{ 
              width: '100%',
              padding: sidebarOpen ? '12px' : '8px',
              marginBottom: '8px',
              backgroundColor: showQuickEntry ? currentTheme?.primary : 'transparent',
              color: showQuickEntry ? '#fff' : currentTheme?.text,
              border: `2px solid ${showQuickEntry ? currentTheme?.primary : currentTheme?.border}`,
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.3s',
              fontSize: sidebarOpen ? '0.9em' : '0.7em',
              textAlign: sidebarOpen ? 'left' : 'center'
            }}
            title={sidebarOpen ? '' : 'よく買うもの'}
          >
            {sidebarOpen ? `⚡ よく買うもの ${showQuickEntry ? '▼' : '▶'}` : '⚡'}
          </button>
          
          <button 
            onClick={() => setShowSubscriptions(!showSubscriptions)}
            className="sidebar-button"
            style={{ 
              width: '100%',
              padding: sidebarOpen ? '12px' : '8px',
              marginBottom: '8px',
              backgroundColor: showSubscriptions ? currentTheme?.primary : 'transparent',
              color: showSubscriptions ? '#fff' : currentTheme?.text,
              border: `2px solid ${showSubscriptions ? currentTheme?.primary : currentTheme?.border}`,
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.3s',
              fontSize: sidebarOpen ? '0.9em' : '0.7em',
              textAlign: sidebarOpen ? 'left' : 'center'
            }}            title={sidebarOpen ? '' : '定期取引'}
          >
            {sidebarOpen ? `💳 定期取引 ${showSubscriptions ? '▼' : '▶'}` : '💳'}
          </button>
        </div>      </div>

      {/* メインコンテンツ */}
      <div className="main-content" style={{
        marginLeft: sidebarOpen ? '280px' : '60px',
        padding: '20px',
        width: sidebarOpen ? 'calc(100% - 280px)' : 'calc(100% - 60px)',
        maxWidth: '1000px',
        transition: 'all 0.3s ease'
      }}>          {/* 今月の定期支払い予定 */}
        {getThisMonthSubscriptions().length > 0 && (
          <div className="subscription-preview" style={{ marginBottom: 20 }}>
            <h3>💳 今月の定期取引予定</h3>
            {getThisMonthSubscriptions().map((sub, index) => (
              <div key={index} className="subscription-item-preview">
                <span>
                  {sub.type === '収入' ? '💰' : '💸'} {sub.name} - {new Date(sub.nextPayment).getDate()}日
                  {sub.daysUntil === 0 && <span style={{ color: '#ffeb3b', fontWeight: 'bold' }}> (今日！)</span>}
                  {sub.daysUntil > 0 && <span> (あと{sub.daysUntil}日)</span>}
                </span>
                <span style={{ color: sub.type === '収入' ? '#4caf50' : '#f44336' }}>
                  {sub.type === '収入' ? '+' : '-'}{formatYen(sub.amount)}
                </span>
              </div>
            ))}
            <div className="subscription-total">
              今月合計: {formatYen(getThisMonthSubscriptions().reduce((sum, sub) => 
                sum + (sub.type === '収入' ? sub.amount : -sub.amount), 0
              ))}
            </div>
          </div>
        )}
        
        {/* 折りたたみ可能なセクション */}
        {showBudgetSettings && (
          <div className={`themed-card collapsible-section ${themeClass === 'theme-gold' ? 'gold-card' : ''}`}>
            <BudgetSettings 
              budget={budget} 
              onBudgetChange={handleBudgetChange} 
              currentTheme={currentTheme} 
              records={records}
            />
          </div>
        )}
        
        {showBudgetAnalysis && (
          <div className={`themed-card collapsible-section ${themeClass === 'theme-gold' ? 'gold-card' : ''}`}>
            <BudgetAnalysis budget={budget} records={records} currentTheme={currentTheme} />
          </div>
        )}
        
        {showWeatherForecast && (
          <div className={`themed-card collapsible-section ${themeClass === 'theme-gold' ? 'gold-card' : ''}`}>
            <SimpleWeatherForecast currentTheme={currentTheme} />
          </div>
        )}
        
        {showOCR && (
          <div className={`themed-card collapsible-section ${themeClass === 'theme-gold' ? 'gold-card' : ''}`}>            <OCRComponent 
              selectedDate={selectedDate}
              onRecordsAdded={handleExternalRecordsAdded} 
              onClose={() => setShowOCR(false)}
            />
          </div>
        )}        {showQuickEntry && (
          <div className={`themed-card collapsible-section ${themeClass === 'theme-gold' ? 'gold-card' : ''}`}>            <QuickEntryComponent 
              selectedDate={selectedDate}
              onRecordsAdded={handleExternalRecordsAdded} 
              onClose={() => setShowQuickEntry(false)}
              onItemsUpdated={() => {
                const savedItems = localStorage.getItem('kakeibo-frequent-items');
                if (savedItems) {
                  setFrequentItems(JSON.parse(savedItems));
                }
              }}
            />
          </div>
        )}
        
        {showSubscriptions && (
          <div className={`themed-card collapsible-section ${themeClass === 'theme-gold' ? 'gold-card' : ''}`}>
            <SubscriptionComponent 
              onClose={() => setShowSubscriptions(false)}
              onSubscriptionsUpdated={() => {
                const savedSubscriptions = localStorage.getItem('kakeibo-subscriptions');
                if (savedSubscriptions) {
                  setSubscriptions(JSON.parse(savedSubscriptions));
                }
              }}
            />
          </div>
        )}
        
        {/* メイン収支記録セクション */}
        <div className={`themed-card ${themeClass === 'theme-gold' ? 'gold-card' : ''}`} style={{ marginTop: 30, marginBottom: 20 }}>
          <h2>📅 収支記録</h2>          <Calendar
            onChange={handleDateChange}
            value={selectedDate}
            locale="ja-JP"
            calendarType="gregory"
            minDetail="month"
            maxDetail="month"            tileClassName={({ date, view }) => {
              if (view === 'month') {
                const isToday = isSameDate(new Date(), date);
                const isSelected = selectedDate && isSameDate(selectedDate, date);
                const hasRecord = records.some(r => r.date && isSameDate(r.date, date));
                return [
                  isToday ? 'react-calendar__tile--now' : '',
                  isSelected ? 'react-calendar__tile--active' : '',
                  hasRecord ? 'react-calendar__tile--hasRecord' : ''
                ].join(' ');
              }
              return '';
            }}            tileContent={({ date, view }) => {
              if (view === 'month') {
                const sum = records
                  .filter(r => r.date && isSameDate(r.date, date))
                  .reduce((acc, r) => acc + (r.type === '収入' ? r.amount : -r.amount), 0);
                return sum !== 0 ? (
                  <div className="calendar-record">{sum > 0 ? '+' : ''}{sum.toLocaleString()}</div>
                ) : null;
              }
              return null;
            }}
          />        </div>
        
        {/* よく買うもののクイックボタン */}
        {frequentItems.length > 0 && (
          <div className={`themed-card ${themeClass === 'theme-gold' ? 'gold-card' : ''}`} style={{ marginTop: 20, marginBottom: 20 }}>
            <h3 style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              ⚡ よく買うもの
              <span style={{ fontSize: '0.8em', opacity: 0.7 }}>({frequentItems.length}件登録済み)</span>
            </h3>            <div className="quick-items-grid">
              {frequentItems.map((item, index) => (
                <div key={index} className="quick-item-card" style={{
                  border: `2px solid ${currentTheme.border}`,
                  borderRadius: '10px',
                  padding: '12px',
                  backgroundColor: currentTheme.secondary,
                  transition: 'all 0.3s ease'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    marginBottom: '8px'
                  }}>
                    <span style={{ fontWeight: 'bold', fontSize: '0.9em' }}>
                      {getCategoryIcon(item.category)} {item.name}
                    </span>
                    <span style={{ 
                      color: currentTheme.primary, 
                      fontWeight: 'bold',
                      fontSize: '0.85em'
                    }}>
                      {formatYen(item.price)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '5px' }}>
                    <button
                      onClick={() => handleQuickAdd(item, 1)}
                      className="themed-button quick-item-button"
                      style={{
                        flex: 1,
                        padding: '6px 8px',
                        fontSize: '0.8em',
                        backgroundColor: currentTheme.primary,
                        color: '#fff'
                      }}
                    >
                      +1
                    </button>
                    <button
                      onClick={() => handleQuickAdd(item, 2)}
                      className="themed-button quick-item-button"
                      style={{
                        flex: 1,
                        padding: '6px 8px',
                        fontSize: '0.8em',
                        backgroundColor: currentTheme.secondary,
                        color: currentTheme.text,
                        border: `1px solid ${currentTheme.border}`
                      }}
                    >
                      +2
                    </button>
                    <button
                      onClick={() => {
                        const qty = prompt('数量を入力してください:', '1');
                        if (qty && !isNaN(qty) && Number(qty) > 0) {
                          handleQuickAdd(item, Number(qty));
                        }
                      }}
                      className="themed-button quick-item-button"
                      style={{
                        flex: 1,
                        padding: '6px 8px',
                        fontSize: '0.8em',
                        backgroundColor: 'transparent',
                        color: currentTheme.text,
                        border: `1px solid ${currentTheme.border}`
                      }}
                    >
                      指定
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ 
              marginTop: '15px', 
              textAlign: 'center',
              fontSize: '0.85em',
              opacity: 0.7 
            }}>
              💡 サイドバーの「よく買うもの」から新しいアイテムを登録できます
            </div>
          </div>
        )}
        
        {/* 新規記録入力フォーム */}
        <div className={`themed-card ${themeClass === 'theme-gold' ? 'gold-card' : ''}`} style={{ marginTop: 20 }}>
          <h3>📝 新規記録</h3>          <form onSubmit={handleSubmit} style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
              {/* 支出/収入トグルスイッチ */}
              <div style={{ display: 'flex', alignItems: 'center', marginRight: '10px' }}>                <button
                  type="button"
                  onClick={() => {
                    const newType = form.type === '支出' ? '収入' : '支出';
                    console.log('=== 収入/支出切り替え ===');
                    console.log('現在のtype:', form.type);
                    console.log('切り替え後のtype:', newType);
                    setForm({ ...form, type: newType });
                  }}
                  style={{
                    padding: '8px 15px',
                    border: 'none',
                    borderRadius: '20px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '0.9em',
                    transition: 'all 0.3s ease',
                    backgroundColor: form.type === '支出' ? '#F44336' : '#4CAF50',
                    color: 'white',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                    minWidth: '80px'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'scale(1)';
                  }}
                >
                  {form.type === '支出' ? '💸 支出' : '💰 収入'}
                </button>
                <span style={{ 
                  fontSize: '0.7em', 
                  marginLeft: '5px', 
                  opacity: 0.7,
                  color: currentTheme.text 
                }}>
                  クリックで切替
                </span>
              </div>
              <input
                name="amount"
                type="number"
                placeholder="金額"
                value={form.amount}
                onChange={handleChange}
                className="themed-input"
                style={{ minWidth: '100px', flex: '1' }}
              />              <input
                name="memo"
                type="text"
                placeholder="メモ"
                value={form.memo}
                onChange={handleChange}
                className="themed-input"
                style={{ minWidth: '150px', flex: '2' }}
              />
              <select
                name="category"
                value={form.category || 'その他'}
                onChange={handleChange}
                className="themed-input"
                style={{ minWidth: '100px' }}
              >
                <option value="食品">🍎 食品</option>
                <option value="娯楽">🎮 娯楽</option>
                <option value="衣類">👕 衣類</option>
                <option value="日用品">🧴 日用品</option>
                <option value="交通費">🚌 交通費</option>
                <option value="光熱費">💡 光熱費</option>
                <option value="医療費">🏥 医療費</option>
                <option value="その他">📦 その他</option>
              </select>
              <input
                name="date"
                type="hidden"
                value={form.date instanceof Date ? form.date.toISOString() : form.date}
              />
              <button type="submit" className="themed-button" style={{ minWidth: '60px' }}>追加</button>
            </div>          </form>
          
          {/* 選択した日の記録表示 */}
          <div style={{ marginBottom: 20 }}>            <h4 style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              📅 {selectedDate ? new Date(selectedDate).toLocaleDateString('ja-JP') : '日付未選択'}の記録
              <span style={{ fontSize: '0.8em', opacity: 0.7 }}>
                ({records.filter(r => r.date && isSameDate(r.date, selectedDate)).length}件)
              </span>
            </h4>
            
            {(() => {
              const selectedDateRecords = records.filter(r => 
                r.date && isSameDate(r.date, selectedDate)
              );
              const selectedDateTotal = selectedDateRecords.reduce((acc, r) => 
                acc + (r.type === '収入' ? r.amount : -r.amount), 0
              );
              
              return (
                <>
                  <div style={{ marginBottom: 15, padding: '10px', backgroundColor: currentTheme.background, borderRadius: '8px' }}>
                    <strong>この日の合計: {formatYen(selectedDateTotal)}</strong>
                    {selectedDateTotal >= 0 ? ' 😊' : ' 😰'}
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table border="1" cellPadding="8" style={{ 
                      width: '100%', 
                      borderCollapse: 'collapse',
                      fontSize: '0.9em',
                      backgroundColor: currentTheme.background
                    }}>
                      <thead>                        <tr style={{ backgroundColor: currentTheme.secondary }}>
                          <th style={{ minWidth: '60px' }}>種別</th>
                          <th style={{ minWidth: '80px', textAlign: 'right' }}>金額</th>
                          <th style={{ minWidth: '120px' }}>メモ</th>
                          <th style={{ minWidth: '100px' }}>操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedDateRecords.length === 0 ? (
                          <tr>
                            <td colSpan="4" style={{ 
                              textAlign: 'center', 
                              padding: '20px',
                              color: currentTheme.textSecondary,
                              fontStyle: 'italic'
                            }}>
                              📝 この日の記録はありません
                            </td>
                          </tr>
                        ) : (                          selectedDateRecords.map(r => (
                            <tr key={r.id} style={{ 
                              backgroundColor: r.type === '収入' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)'
                            }}>
                              <td style={{ 
                                color: r.type === '収入' ? '#4CAF50' : '#F44336',
                                fontWeight: 'bold'
                              }}>
                                {r.type === '収入' ? '💰' : '💸'} {r.type}
                              </td>
                              <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                                {formatYen(r.amount)}
                              </td>
                              <td style={{ maxWidth: '200px', wordWrap: 'break-word' }}>{r.memo}</td>
                              <td style={{ textAlign: 'center' }}>
                                <button
                                  onClick={() => handleEdit(r)}
                                  style={{
                                    backgroundColor: '#2196F3',
                                    color: 'white',
                                    border: 'none',
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    marginRight: '4px',
                                    cursor: 'pointer',
                                    fontSize: '12px'
                                  }}
                                >
                                  ✏️ 編集
                                </button>
                                <button
                                  onClick={() => handleDelete(r)}
                                  style={{
                                    backgroundColor: '#f44336',
                                    color: 'white',
                                    border: 'none',
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '12px'
                                  }}
                                >
                                  🗑️ 削除
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              );
            })()}
          </div>
            {/* 全体の合計情報 */}
          <div style={{ 
            borderTop: `2px solid ${currentTheme.border}`, 
            paddingTop: '15px',
            textAlign: 'center',
            fontSize: '0.9em',
            opacity: 0.8
          }}>
            💡 カレンダーで別の日を選択すると、その日の記録が表示されます<br/>
            <strong>全記録合計: {formatYen(total)}</strong> (全{records.length}件)
          </div>
        </div>
        
        {/* 月全体の記録表示 */}
        <div className={`themed-card ${themeClass === 'theme-gold' ? 'gold-card' : ''}`} style={{ marginTop: 20 }}>
          {(() => {
            const selectedMonth = selectedDate ? new Date(selectedDate) : new Date();
            const monthRecords = records.filter(r => {
              if (!r.date) return false;
              const recordDate = new Date(r.date);
              return recordDate.getMonth() === selectedMonth.getMonth() && 
                     recordDate.getFullYear() === selectedMonth.getFullYear();
            });
            
            const monthIncome = monthRecords
              .filter(r => r.type === '収入')
              .reduce((sum, r) => sum + r.amount, 0);
            
            const monthExpense = monthRecords
              .filter(r => r.type === '支出')
              .reduce((sum, r) => sum + r.amount, 0);
            
            const monthTotal = monthIncome - monthExpense;
            const recordsByDate = monthRecords.reduce((acc, record) => {
              const dateKey = new Date(record.date).toLocaleDateString('ja-JP');
              if (!acc[dateKey]) {
                acc[dateKey] = [];
              }
              acc[dateKey].push(record);
              return acc;
            }, {});
            
            const sortedDates = Object.keys(recordsByDate).sort((a, b) => 
              new Date(b.split('/').reverse().join('-')) - new Date(a.split('/').reverse().join('-'))
            );
            
            return (
              <>
                <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  📊 {selectedMonth.getFullYear()}年{selectedMonth.getMonth() + 1}月の記録
                  <span style={{ fontSize: '0.8em', opacity: 0.7 }}>
                    ({monthRecords.length}件)
                  </span>
                </h3>
                
                {/* 月間サマリー */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                  gap: '15px', 
                  marginBottom: '25px' 
                }}>
                  <div style={{
                    padding: '15px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                    border: '2px solid rgba(76, 175, 80, 0.3)',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '2em' }}>💰</div>
                    <div style={{ fontWeight: 'bold', color: '#4CAF50' }}>収入合計</div>
                    <div style={{ fontSize: '1.2em', fontWeight: 'bold' }}>{formatYen(monthIncome)}</div>
                  </div>
                  
                  <div style={{
                    padding: '15px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(244, 67, 54, 0.1)',
                    border: '2px solid rgba(244, 67, 54, 0.3)',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '2em' }}>💸</div>
                    <div style={{ fontWeight: 'bold', color: '#F44336' }}>支出合計</div>
                    <div style={{ fontSize: '1.2em', fontWeight: 'bold' }}>{formatYen(monthExpense)}</div>
                  </div>
                  
                  <div style={{
                    padding: '15px',
                    borderRadius: '10px',
                    backgroundColor: monthTotal >= 0 ? 'rgba(33, 150, 243, 0.1)' : 'rgba(255, 152, 0, 0.1)',
                    border: `2px solid ${monthTotal >= 0 ? 'rgba(33, 150, 243, 0.3)' : 'rgba(255, 152, 0, 0.3)'}`,
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '2em' }}>{monthTotal >= 0 ? '😊' : '😰'}</div>
                    <div style={{ fontWeight: 'bold', color: monthTotal >= 0 ? '#2196F3' : '#FF9800' }}>差引合計</div>
                    <div style={{ fontSize: '1.2em', fontWeight: 'bold' }}>{formatYen(monthTotal)}</div>
                  </div>
                </div>
                
                {/* 月間記録詳細 */}
                {monthRecords.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '40px',
                    color: currentTheme.textSecondary,
                    fontStyle: 'italic'
                  }}>
                    📝 この月の記録はまだありません
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table border="1" cellPadding="8" style={{ 
                      width: '100%', 
                      borderCollapse: 'collapse',
                      fontSize: '0.9em',
                      backgroundColor: currentTheme.background
                    }}>
                      <thead>
                        <tr style={{ backgroundColor: currentTheme.secondary }}>
                          <th style={{ minWidth: '100px' }}>日付</th>
                          <th style={{ minWidth: '60px' }}>種別</th>
                          <th style={{ minWidth: '80px', textAlign: 'right' }}>金額</th>
                          <th style={{ minWidth: '120px' }}>メモ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedDates.map(dateKey => {
                          const dayRecords = recordsByDate[dateKey];
                          const dayTotal = dayRecords.reduce((sum, r) => 
                            sum + (r.type === '収入' ? r.amount : -r.amount), 0
                          );
                          
                          return dayRecords.map((record, index) => (
                            <tr key={record.id} style={{ 
                              backgroundColor: record.type === '収入' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)',
                              borderTop: index === 0 ? `3px solid ${currentTheme.border}` : undefined
                            }}>
                              <td style={{ 
                                fontWeight: index === 0 ? 'bold' : 'normal',
                                position: 'relative'
                              }}>
                                {index === 0 && (
                                  <>
                                    {dateKey}
                                    <div style={{ 
                                      fontSize: '0.7em', 
                                      color: dayTotal >= 0 ? '#4CAF50' : '#F44336',
                                      fontWeight: 'bold'
                                    }}>
                                      日計: {formatYen(dayTotal)}
                                    </div>
                                  </>
                                )}
                              </td>
                              <td style={{ 
                                color: record.type === '収入' ? '#4CAF50' : '#F44336',
                                fontWeight: 'bold'
                              }}>
                                {record.type === '収入' ? '💰' : '💸'} {record.type}
                              </td>
                              <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                                {formatYen(record.amount)}
                              </td>
                              <td style={{ maxWidth: '200px', wordWrap: 'break-word' }}>
                                {record.memo}
                                {record.isAutomatic && (
                                  <span style={{ 
                                    fontSize: '0.7em', 
                                    color: '#666', 
                                    marginLeft: '5px' 
                                  }}>
                                    [自動]
                                  </span>
                                )}
                              </td>
                            </tr>
                          ));
                        })}
                      </tbody>
                    </table>
                  </div>                )}
              </>
            );
          })()}
        </div>
      </div>
      
      {/* 編集モーダル */}
      {editingRecord && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '8px',
            maxWidth: '400px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px' }}>記録を編集</h3>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>種別:</label>
              <select
                value={editForm.type}
                onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              >
                <option value="支出">💸 支出</option>
                <option value="収入">💰 収入</option>
              </select>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>金額:</label>
              <input
                type="number"
                value={editForm.amount}
                onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
                placeholder="金額を入力"
              />            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>日付:</label>
              <input
                type="date"
                value={editForm.date ? editForm.date.toISOString().split('T')[0] : ''}
                onChange={(e) => {
                  const newDate = e.target.value ? new Date(e.target.value + 'T00:00:00') : new Date();
                  setEditForm({ ...editForm, date: newDate });
                }}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>メモ:</label>
              <input
                type="text"
                value={editForm.memo}
                onChange={(e) => setEditForm({ ...editForm, memo: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
                placeholder="メモを入力"
              />
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>カテゴリ:</label>
              <select
                value={editForm.category}
                onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              >
                <option value="その他">その他</option>
                <option value="食費">食費</option>
                <option value="交通費">交通費</option>
                <option value="エンターテイメント">エンターテイメント</option>
                <option value="ショッピング">ショッピング</option>
                <option value="医療費">医療費</option>
                <option value="公共料金">公共料金</option>
                <option value="給料">給料</option>
                <option value="ボーナス">ボーナス</option>
              </select>
            </div>
            
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={handleCancelEdit}
                style={{
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                キャンセル
              </button>
              <button
                onClick={handleSaveEdit}
                style={{
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
