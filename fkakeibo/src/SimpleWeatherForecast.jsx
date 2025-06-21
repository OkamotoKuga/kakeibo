import React, { useState, useEffect } from 'react';
import weatherDataJson from './weather.json';

const SimpleWeatherForecast = ({ currentTheme }) => {
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const loadWeatherData = async () => {
      try {
        const aizuData = extractAizuWeatherData(weatherDataJson);
        setWeatherData(aizuData);
      } catch (error) {
        console.error('天気データの読み込みに失敗:', error);
      } finally {
        setLoading(false);
      }
    };

    loadWeatherData();
  }, []);
  const extractAizuWeatherData = (jsonData) => {
    try {
      const weeklyForecast = jsonData[1];       const aizuPrecip = weeklyForecast.timeSeries[0]?.areas?.find(
        area => area.area.name === "会津"
      );
      const aizuTemp = weeklyForecast.timeSeries[1]?.areas?.find(
        area => area.area.name === "若松"
      );

      if (!aizuPrecip || !aizuTemp) return null;
      const dates = weeklyForecast.timeSeries[0].timeDefines;

      return dates.map((dateStr, index) => {
        const date = new Date(dateStr);
        return {
          date: date.toLocaleDateString('ja-JP', { 
            month: 'numeric', 
            day: 'numeric', 
            weekday: 'short' 
          }),
          tempMax: aizuTemp.tempsMax[index] || '-',
          tempMin: aizuTemp.tempsMin[index] || '-',
          precipitation: aizuPrecip.pops[index] || '0',
          weatherCode: aizuPrecip.weatherCodes[index]
        };
      }).filter(day => day.tempMax !== '-');     } catch (error) {
      console.error('データ抽出エラー:', error);
      return null;
    }
  };
  const getWeatherIcon = (code) => {
    if (code >= 100 && code <= 104) return '☀️';     if (code >= 200 && code <= 204) return '☁️';     if (code >= 300 && code <= 313) return '🌧️';     if (code >= 400 && code <= 413) return '❄️';     return '🌫️';   };
  if (loading) {
    return (
      <div className="themed-card" style={{ 
        backgroundColor: currentTheme?.surface || '#fff',
        border: `1px solid ${currentTheme?.border || '#e1e1e1'}`,
        padding: '20px',
        textAlign: 'center'
      }}>
        <h3 style={{ color: currentTheme?.primary || '#333' }}>🌤️ 天気予報</h3>
        <p>データを読み込み中...</p>
      </div>
    );
  }
  if (!weatherData) {
    return (
      <div className="themed-card" style={{ 
        backgroundColor: currentTheme?.surface || '#fff',
        border: `1px solid ${currentTheme?.border || '#e1e1e1'}`,
        padding: '20px',
        textAlign: 'center'
      }}>
        <h3 style={{ color: currentTheme?.primary || '#333' }}>🌤️ 天気予報</h3>
        <p>天気データが取得できませんでした</p>
      </div>
    );
  }

  return (
    <div className="themed-card" style={{ 
      backgroundColor: currentTheme?.surface || '#fff',
      border: `1px solid ${currentTheme?.border || '#e1e1e1'}`
    }}>
      <h3 style={{ 
        color: currentTheme?.primary || '#333', 
        marginBottom: '20px',
        textAlign: 'center'
      }}>
        🌤️ 会津若松 週間天気
      </h3>

      {/* 天気予報一覧 */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', 
        gap: '10px',
        marginBottom: '20px'
      }}>
        {weatherData.map((day, index) => (
          <div key={index} style={{
            backgroundColor: currentTheme?.secondary || '#f8fafc',
            borderRadius: '10px',
            padding: '12px',
            textAlign: 'center',
            border: `1px solid ${currentTheme?.border || '#e1e1e1'}`
          }}>
            <div style={{ 
              fontSize: '12px', 
              fontWeight: 'bold', 
              marginBottom: '8px',
              color: currentTheme?.text || '#333'
            }}>
              {day.date}
            </div>
            
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>
              {getWeatherIcon(day.weatherCode)}
            </div>
            
            <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '4px' }}>
              <span style={{ color: '#ef4444' }}>{day.tempMax}°</span>
              <span style={{ margin: '0 4px', color: currentTheme?.textSecondary || '#666' }}>/</span>
              <span style={{ color: '#3b82f6' }}>{day.tempMin}°</span>
            </div>
            
            <div style={{ fontSize: '11px', color: '#3b82f6' }}>
              ☔ {day.precipitation}%
            </div>
          </div>
        ))}
      </div>

      {/* 簡単な統計 */}
      <div style={{ 
        display: 'flex',
        justifyContent: 'space-around',
        backgroundColor: currentTheme?.secondary || '#f8fafc',
        padding: '12px',
        borderRadius: '8px',
        fontSize: '14px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 'bold', color: '#ef4444' }}>
            {Math.max(...weatherData.map(d => parseInt(d.tempMax) || 0))}°
          </div>
          <div style={{ fontSize: '12px', opacity: 0.7 }}>最高気温</div>
        </div>
        
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 'bold', color: '#3b82f6' }}>
            {Math.min(...weatherData.map(d => parseInt(d.tempMin) || 100))}°
          </div>
          <div style={{ fontSize: '12px', opacity: 0.7 }}>最低気温</div>
        </div>
        
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 'bold', color: '#8b5cf6' }}>
            {Math.round(
              weatherData
                .map(d => parseInt(d.precipitation) || 0)
                .reduce((a, b) => a + b, 0) / weatherData.length
            )}%
          </div>
          <div style={{ fontSize: '12px', opacity: 0.7 }}>平均降水確率</div>
        </div>
      </div>

      <div style={{ 
        textAlign: 'center', 
        fontSize: '11px', 
        marginTop: '12px', 
        opacity: 0.6,
        color: currentTheme?.textSecondary || '#666'
      }}>
        データ元: 気象庁
      </div>
    </div>
  );
};

export default SimpleWeatherForecast;
