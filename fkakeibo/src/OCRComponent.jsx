import React, { useState } from 'react';
import config from './config';

const OCRComponent = ({ onRecordsAdded, onClose, selectedDate }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [ocrResults, setOcrResults] = useState([]);
  const [error, setError] = useState('');
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
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('画像ファイルを選択してください（JPG、PNG、WebP対応）');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError('ファイルサイズは10MB以下にしてください');
        return;
      }

      setSelectedFile(file);
      setError('');
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };    const handleOCRProcess = async () => {
    if (!selectedFile) {
      setError('ファイルを選択してください');
      return;
    }

    setIsUploading(true);
    setError('');    try {      const formData = new FormData();      formData.append('image', selectedFile);
      formData.append('auto_register', 'false');

      const token = localStorage.getItem('auth_token');
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${config.API_BASE}/data/ocr/process`, {
        method: 'POST',
        headers: headers,
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.results && data.results.length > 0) {
        const formattedResults = data.results.map(item => ({
          product_name: item.product_name,
          category: item.category,
          price: item.price,
          amount: item.price,           memo: item.product_name         }));
        
        setOcrResults(formattedResults);
        setError('');
        if (onRecordsAdded) {
          onRecordsAdded(formattedResults);
        }
      } else {
        setError(data.error || 'レシートを認識できませんでした。画像がレシートかどうか確認してください。');
      }
    } catch (error) {
      console.error('OCR処理エラー:', error);
      
      let errorMessage = 'OCR処理に失敗しました';
      if (error.message.includes('Failed to fetch')) {
        errorMessage = 'サーバーに接続できません。バックエンドサーバーが起動しているか確認してください。';
      } else if (error.message.includes('0123error')) {
        errorMessage = 'この画像はレシートとして認識できませんでした。';
      } else {
        errorMessage = `${errorMessage}: ${error.message}`;
      }
      
      setError(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };
  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setOcrResults([]);
    setError('');
    const fileInput = document.getElementById('receipt-upload');
    if (fileInput) {
      fileInput.value = '';
    }
  };  const handleBulkRegister = async () => {
    if (ocrResults.length === 0) {
      setError('登録する項目がありません');
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      const formattedResults = ocrResults.map(item => ({
        type: '支出',
        amount: item.price,
        memo: item.product_name,
        category: item.category,
        date: selectedDate || new Date(),
        id: Date.now() + Math.random() + Math.random()       }));
      if (onRecordsAdded) {
        await onRecordsAdded(formattedResults);
        alert(`${ocrResults.length}件の商品を家計簿に登録しました！`);
        if (onClose) {
          onClose();
        }
      } else {
        setError('登録機能が利用できません');
      }
    } catch (error) {
      console.error('一括登録エラー:', error);
      setError(`登録に失敗しました: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="ocr-container">
      <div className="ocr-header">
        <h3>📸 レシートOCR</h3>
        <button className="close-btn" onClick={onClose} title="閉じる">×</button>
      </div>

      <div className="ocr-content">
        {/* 使用方法の説明 */}
        <div className="ocr-instructions">
          <p>📷 レシート画像をアップロードして、自動で家計簿に記録します</p>
          <small>対応形式: JPG, PNG, WebP（最大10MB）</small>
        </div>

        {/* ファイル選択 */}
        <div className="file-upload-section">
          <label htmlFor="receipt-upload" className="upload-label">
            {previewUrl ? '📷 画像を変更' : '📂 レシート画像を選択'}
          </label>
          <input
            id="receipt-upload"
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="file-input"
          />
        </div>

        {/* プレビュー画像 */}
        {previewUrl && (
          <div className="image-preview">
            <img src={previewUrl} alt="レシートプレビュー" className="preview-img" />
            <p className="file-info">
              📁 {selectedFile?.name} ({(selectedFile?.size / 1024 / 1024).toFixed(2)}MB)
            </p>
          </div>
        )}

        {/* エラー表示 */}
        {error && (
          <div className="error-message">
            ⚠️ {error}
          </div>
        )}

        {/* OCR実行ボタン */}
        <div className="ocr-actions">
          <button
            onClick={handleOCRProcess}
            disabled={!selectedFile || isUploading}
            className={`ocr-btn ${isUploading ? 'loading' : ''}`}
          >
            {isUploading ? '🔄 AI処理中...' : '🔍 レシートを読み取る'}
          </button>
          
          {(selectedFile || ocrResults.length > 0) && (
            <button onClick={handleReset} className="reset-btn">
              🗑️ リセット
            </button>
          )}
        </div>        {/* OCR結果表示 */}
        {ocrResults.length > 0 && (
          <div className="ocr-results">
            <h4>✅ 読み取り結果 ({ocrResults.length}件)</h4>
            <div className="results-list">
              {ocrResults.map((item, index) => (
                <div key={index} className="result-item">
                  <div className="item-info">
                    <span className="item-name">{item.product_name}</span>
                    <span className="item-category">
                      {getCategoryIcon(item.category)} {item.category}
                    </span>
                  </div>
                  <div className="item-price">
                    ¥{item.price.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
            <div className="total-amount">
              💰 合計金額: ¥{ocrResults.reduce((sum, item) => sum + item.price, 0).toLocaleString()}
            </div>
            
            {/* 一括登録ボタン */}
            <div className="bulk-register-section">
              <button
                onClick={handleBulkRegister}
                disabled={isUploading}
                className={`bulk-register-btn ${isUploading ? 'loading' : ''}`}
              >
                {isUploading ? '🔄 登録中...' : '📝 家計簿に一括登録'}
              </button>
              <p className="register-note">
                ✨ 上記の商品をまとめて家計簿に登録します
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OCRComponent;
