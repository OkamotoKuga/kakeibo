import React, { useState, useEffect } from 'react';
import weatherDataJson from './weather.json';

const WeatherWeeklyForecast = ({ currentTheme }) => {
  const [weeklyData, setWeeklyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);  useEffect(() => {
    const loadWeatherData = async () => {
      try {
        setLoading(true);
        const aizuWeatherData = extractAizuData(weatherDataJson);
        setWeeklyData(aizuWeatherData);
        setError(null);
      } catch (err) {
        setError('天気データの読み込みに失敗しました');
        console.error('Weather data load failed:', err);
      } finally {
        setLoading(false);
      }
    };

    loadWeatherData();
  }, []);
  const extractAizuData = (jsonData) => {
    const weeklyForecast = jsonData[1];     
    if (!weeklyForecast || !weeklyForecast.timeSeries) return null;
    const aizuPrecipData = weeklyForecast.timeSeries[0]?.areas?.find(
      area => area.area.name === "会津"
    );
    const aizuTempData = weeklyForecast.timeSeries[1]?.areas?.find(
      area => area.area.name === "若松"
    );

    if (!aizuPrecipData || !aizuTempData) return null;
    const dates = weeklyForecast.timeSeries[0].timeDefines;
    const weeklyData = dates.map((dateStr, index) => {
      const date = new Date(dateStr);
      return {
        date: date,
        dayOfWeek: date.toLocaleDateString('ja-JP', { weekday: 'short' }),
        dateFormatted: date.toLocaleDateString('ja-JP', { month: 'M', day: 'd' }),
        weatherCode: aizuPrecipData.weatherCodes[index],
        precipitationProbability: aizuPrecipData.pops[index] || '0',
        reliability: aizuPrecipData.reliabilities[index] || '',
        tempMin: aizuTempData.tempsMin[index] || '',
        tempMax: aizuTempData.tempsMax[index] || '',
        tempMinUpper: aizuTempData.tempsMinUpper[index] || '',
        tempMinLower: aizuTempData.tempsMinLower[index] || '',
        tempMaxUpper: aizuTempData.tempsMaxUpper[index] || '',
        tempMaxLower: aizuTempData.tempsMaxLower[index] || ''
      };
    }).filter(day => day.tempMax !== ''); 
    return weeklyData;
  };
  const getWeatherEmoji = (code) => {
    const weatherEmojis = {
      100: '☀️', 101: '🌤️', 102: '🌦️', 103: '🌦️', 104: '❄️',
      110: '🌤️', 112: '🌦️', 115: '❄️',
      200: '☁️', 201: '🌤️', 202: '🌦️', 203: '🌦️', 204: '❄️',
      210: '🌦️', 212: '🌦️', 215: '❄️',
      300: '🌧️', 301: '🌦️', 302: '☁️', 303: '🌧️', 308: '🌧️',
      311: '🌦️', 313: '🌦️',
      400: '❄️', 401: '❄️', 402: '❄️', 403: '❄️', 405: '❄️',
      411: '❄️', 413: '❄️'
    };
    return weatherEmojis[code] || '🌫️';
  };

  if (loading) {
    return (
      <div className="themed-card" style={{ 
        backgroundColor: currentTheme?.surface || '#fff',
        border: `1px solid ${currentTheme?.border || '#e1e1e1'}`
      }}>
        <h3 style={{ color: currentTheme?.primary || '#333' }}>🌤️ 会津若松 週間天気予報</h3>
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <div style={{ 
            animation: 'spin 1s linear infinite',
            fontSize: '24px',
            marginBottom: '10px'
          }}>🌀</div>
          <p>天気データを読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error || !weeklyData) {
    return (
      <div className="themed-card" style={{ 
        backgroundColor: currentTheme?.surface || '#fff',
        border: `1px solid ${currentTheme?.border || '#e1e1e1'}`
      }}>
        <h3 style={{ color: currentTheme?.primary || '#333' }}>🌤️ 会津若松 週間天気予報</h3>
        <div style={{ 
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          padding: '16px',
          color: '#dc2626'
        }}>
          ⚠️ {error || '天気データが取得できませんでした'}
        </div>
      </div>
    );
  }

  return (
    <div className="themed-card" style={{ 
      backgroundColor: currentTheme?.surface || '#fff',
      border: `1px solid ${currentTheme?.border || '#e1e1e1'}`
    }}>
      <h3 style={{ color: currentTheme?.primary || '#333', marginBottom: '20px' }}>
        🌤️ 会津若松 週間天気予報
      </h3>

      {/* 一週間の予報表 */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', 
        gap: '12px',
        marginBottom: '20px'
      }}>
        {weeklyData.map((day, index) => {
          const isHot = parseInt(day.tempMax) >= 30;
          const isCool = parseInt(day.tempMax) <= 25;
          
          return (
            <div key={index} style={{
              backgroundColor: currentTheme?.secondary || '#f8fafc',
              border: `2px solid ${currentTheme?.border || '#e1e1e1'}`,
              borderRadius: '12px',
              padding: '12px',
              textAlign: 'center',
              fontSize: '14px'
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: '6px', color: currentTheme?.text || '#333' }}>
                {day.dayOfWeek}
              </div>
              <div style={{ fontSize: '12px', marginBottom: '8px', opacity: 0.7 }}>
                {day.dateFormatted}
              </div>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>
                {getWeatherEmoji(day.weatherCode)}
              </div>
              <div style={{ marginBottom: '6px' }}>
                <div style={{ 
                  fontWeight: 'bold', 
                  fontSize: '16px',
                  color: isHot ? '#ef4444' : isCool ? '#22c55e' : currentTheme?.text || '#333'
                }}>
                  {day.tempMax}°
                </div>
                <div style={{ fontSize: '12px', opacity: 0.7 }}>
                  {day.tempMin}°
                </div>
              </div>
              <div style={{ fontSize: '12px', color: '#3b82f6', marginBottom: '4px' }}>
                ☔ {day.precipitationProbability}%
              </div>
              {day.reliability && (
                <div style={{ fontSize: '10px', opacity: 0.6 }}>
                  信頼度: {day.reliability}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 統計情報 */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
        gap: '12px',
        fontSize: '14px',
        marginBottom: '16px'
      }}>
        <div style={{ 
          backgroundColor: currentTheme?.secondary || '#f8fafc',
          padding: '12px',
          borderRadius: '8px',
          textAlign: 'center',
          border: `1px solid ${currentTheme?.border || '#e1e1e1'}`
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>🌡️ 最高</div>
          <div style={{ fontSize: '18px', color: '#ef4444', fontWeight: 'bold' }}>
            {Math.max(...weeklyData.map(d => parseInt(d.tempMax) || 0))}°
          </div>
        </div>
        <div style={{ 
          backgroundColor: currentTheme?.secondary || '#f8fafc',
          padding: '12px',
          borderRadius: '8px',
          textAlign: 'center',
          border: `1px solid ${currentTheme?.border || '#e1e1e1'}`
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>❄️ 最低</div>
          <div style={{ fontSize: '18px', color: '#3b82f6', fontWeight: 'bold' }}>
            {Math.min(...weeklyData.map(d => parseInt(d.tempMin) || 100))}°
          </div>
        </div>
        <div style={{ 
          backgroundColor: currentTheme?.secondary || '#f8fafc',
          padding: '12px',
          borderRadius: '8px',
          textAlign: 'center',
          border: `1px solid ${currentTheme?.border || '#e1e1e1'}`
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>☔ 平均降水確率</div>
          <div style={{ fontSize: '18px', color: '#3b82f6', fontWeight: 'bold' }}>
            {Math.round(
              weeklyData
                .map(d => parseInt(d.precipitationProbability) || 0)
                .reduce((a, b) => a + b, 0) / weeklyData.length
            )}%
          </div>
        </div>
      </div>

      <div style={{ 
        fontSize: '12px', 
        textAlign: 'center', 
        opacity: 0.6,
        color: currentTheme?.textSecondary || '#666'
      }}>
        データ提供: 気象庁 | 会津若松地方の予報
      </div>
    </div>
  );
};

export default WeatherWeeklyForecast;
