import React, { useState, useEffect } from 'react';

const QuickEntryComponent = ({ onRecordsAdded, onClose, onItemsUpdated, selectedDate }) => {
  const [frequentItems, setFrequentItems] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '',
    category: '食品',
    price: ''
  });
  const [selectedItems, setSelectedItems] = useState({});
  const [error, setError] = useState('');

  const categories = ['食品', '娯楽', '衣類', '日用品', 'その他'];

  // カテゴリーアイコンマッピング
  const getCategoryIcon = (category) => {
    const icons = {
      '食品': '🍎',
      '娯楽': '🎮',
      '衣類': '👕',
      '日用品': '🧴',
      'その他': '📦'
    };
    return icons[category] || '📦';
  };

  // ローカルストレージからデータを読み込み
  useEffect(() => {
    const savedItems = localStorage.getItem('kakeibo-frequent-items');
    if (savedItems) {
      setFrequentItems(JSON.parse(savedItems));
    }
  }, []);
  // ローカルストレージにデータを保存
  const saveFrequentItems = (items) => {
    localStorage.setItem('kakeibo-frequent-items', JSON.stringify(items));
    setFrequentItems(items);
    // 親コンポーネントに更新を通知
    if (onItemsUpdated) {
      onItemsUpdated();
    }
  };

  // 新しいアイテムを追加
  const handleAddItem = (e) => {
    e.preventDefault();
    
    if (!newItem.name.trim() || !newItem.price || isNaN(newItem.price) || Number(newItem.price) <= 0) {
      setError('商品名と正しい価格を入力してください');
      return;
    }

    // 同名の商品があるかチェック
    const existingItem = frequentItems.find(item => 
      item.name.toLowerCase() === newItem.name.trim().toLowerCase()
    );

    if (existingItem) {
      setError('同じ名前の商品が既に登録されています');
      return;
    }

    const item = {
      id: Date.now(),
      name: newItem.name.trim(),
      category: newItem.category,
      price: Number(newItem.price)
    };

    const updatedItems = [...frequentItems, item];
    saveFrequentItems(updatedItems);
    
    setNewItem({ name: '', category: '食品', price: '' });
    setShowAddForm(false);
    setError('');
  };

  // アイテムを削除
  const handleDeleteItem = (id) => {
    if (window.confirm('この商品を削除しますか？')) {
      const updatedItems = frequentItems.filter(item => item.id !== id);
      saveFrequentItems(updatedItems);
    }
  };

  // 数量を変更
  const handleQuantityChange = (itemId, quantity) => {
    setSelectedItems({
      ...selectedItems,
      [itemId]: Math.max(0, quantity)
    });
  };  // 選択した商品を家計簿に追加
  const handleAddToKakeibo = () => {
    const itemsToAdd = [];
    const targetDate = selectedDate || new Date(); // selectedDateを使用

    Object.entries(selectedItems).forEach(([itemId, quantity]) => {
      if (quantity > 0) {
        const item = frequentItems.find(item => item.id === Number(itemId));
        if (item) {
          for (let i = 0; i < quantity; i++) {
            itemsToAdd.push({
              type: '支出',
              amount: item.price,
              memo: `${item.name} [${item.category}]`,
              date: targetDate,
              id: Date.now() + Math.random() + i // 重複を避けるため
            });
          }
        }
      }
    });

    if (itemsToAdd.length === 0) {
      setError('追加する商品の数量を指定してください');
      return;
    }

    // 親コンポーネントに追加
    if (onRecordsAdded) {
      onRecordsAdded(itemsToAdd);
    }

    // 選択をリセット
    setSelectedItems({});
    setError('');
    
    alert(`${itemsToAdd.length}件のレコードを追加しました！`);
  };

  // 選択した商品の合計金額を計算
  const calculateTotal = () => {
    return Object.entries(selectedItems).reduce((total, [itemId, quantity]) => {
      const item = frequentItems.find(item => item.id === Number(itemId));
      return total + (item ? item.price * quantity : 0);
    }, 0);
  };

  return (
    <div className="quick-entry-container">
      <div className="quick-entry-header">
        <h3>⚡ よく買うもの登録</h3>
        <button className="close-btn" onClick={onClose} title="閉じる">×</button>
      </div>

      <div className="quick-entry-content">
        {/* 説明 */}
        <div className="quick-entry-instructions">
          <p>🛒 よく買う商品を事前登録して、数量だけで簡単入力！</p>
          <small>例: ガチャ100円を10回 → 数量10と入力するだけで1000円が記録されます</small>
        </div>

        {/* 新しい商品追加ボタン */}
        <div className="add-item-section">
          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="add-item-btn"
          >
            {showAddForm ? '❌ キャンセル' : '➕ 新しい商品を登録'}
          </button>
        </div>

        {/* 新しい商品追加フォーム */}
        {showAddForm && (
          <div className="add-item-form">
            <h4>📝 新しい商品を登録</h4>
            <form onSubmit={handleAddItem}>
              <div className="form-row">
                <input
                  type="text"
                  placeholder="商品名（例: ガチャ）"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  className="item-input"
                />
                <select
                  value={newItem.category}
                  onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                  className="category-select"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>
                      {getCategoryIcon(cat)} {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-row">
                <input
                  type="number"
                  placeholder="1回あたりの価格（例: 100）"
                  value={newItem.price}
                  onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                  className="price-input"
                  min="1"
                />
                <button type="submit" className="submit-btn">
                  💾 登録
                </button>
              </div>
            </form>
          </div>
        )}

        {/* エラー表示 */}
        {error && (
          <div className="error-message">
            ⚠️ {error}
          </div>
        )}

        {/* 登録済み商品一覧 */}
        {frequentItems.length > 0 ? (
          <div className="frequent-items-list">
            <h4>📋 登録済み商品 ({frequentItems.length}件)</h4>
            <div className="items-grid">
              {frequentItems.map(item => (
                <div key={item.id} className="frequent-item-card">
                  <div className="item-header">
                    <div className="item-info">
                      <span className="item-name">{item.name}</span>
                      <span className="item-category">
                        {getCategoryIcon(item.category)} {item.category}
                      </span>
                    </div>
                    <div className="item-actions">
                      <span className="item-price">¥{item.price}</span>
                      <button 
                        onClick={() => handleDeleteItem(item.id)}
                        className="delete-btn"
                        title="削除"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  
                  <div className="quantity-control">
                    <label>数量:</label>
                    <div className="quantity-input-group">
                      <button
                        onClick={() => handleQuantityChange(item.id, (selectedItems[item.id] || 0) - 1)}
                        className="quantity-btn"
                      >
                        ➖
                      </button>
                      <input
                        type="number"
                        value={selectedItems[item.id] || 0}
                        onChange={(e) => handleQuantityChange(item.id, Number(e.target.value))}
                        className="quantity-input"
                        min="0"
                      />
                      <button
                        onClick={() => handleQuantityChange(item.id, (selectedItems[item.id] || 0) + 1)}
                        className="quantity-btn"
                      >
                        ➕
                      </button>
                    </div>
                    {selectedItems[item.id] > 0 && (
                      <div className="subtotal">
                        小計: ¥{(item.price * selectedItems[item.id]).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* 合計と追加ボタン */}
            {Object.keys(selectedItems).some(id => selectedItems[id] > 0) && (
              <div className="quick-entry-summary">
                <div className="total-amount">
                  💰 合計: ¥{calculateTotal().toLocaleString()}
                </div>
                <button onClick={handleAddToKakeibo} className="add-to-kakeibo-btn">
                  📝 家計簿に追加
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="empty-state">
            <p>📝 まだ商品が登録されていません</p>
            <p>「➕ 新しい商品を登録」から始めましょう！</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuickEntryComponent;
