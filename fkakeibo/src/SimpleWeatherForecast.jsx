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

    loadWeatherData();  }, []);const extractAizuWeatherData = (jsonData) => {
    try {
  
      const todayForecast = jsonData[0];
 
      const weeklyForecast = jsonData[1];
   
      const todayWeather = extractTodayWeather(todayForecast);
      
      // 会津地方の降水確率データ
      const aizuPrecip = weeklyForecast.timeSeries[0]?.areas?.find(
        area => area.area.name === "会津"
      );
      // 会津若松の気温データ
      const aizuTemp = weeklyForecast.timeSeries[1]?.areas?.find(
        area => area.area.name === "若松"
      );

      if (!aizuPrecip || !aizuTemp) return null;
      const dates = weeklyForecast.timeSeries[0].timeDefines;

      const weeklyData = dates.map((dateStr, index) => {
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
      }).filter(day => day.tempMax !== '-');

      return {
        today: todayWeather,
        weekly: weeklyData
      };
    } catch (error) {
      console.error('データ抽出エラー:', error);
      return null;
    }
  };
  // 当日の詳細天気を抽出
  const extractTodayWeather = (todayForecast) => {
    try {
      // 会津地方の天気情報
      const aizuWeather = todayForecast.timeSeries[0]?.areas?.find(
        area => area.area.name === "会津"
      );
      
      // 会津地方の降水確率（時間別）
      const aizuPrecip = todayForecast.timeSeries[1]?.areas?.find(
        area => area.area.name === "会津"
      );
      
      // 若松の気温情報
      const aizuTemp = todayForecast.timeSeries[2]?.areas?.find(
        area => area.area.name === "若松"
      );

      if (!aizuWeather || !aizuTemp) return null;

      // 時間帯別降水確率データ
      const precipTimes = todayForecast.timeSeries[1]?.timeDefines || [];
      const precipRates = aizuPrecip?.pops || [];
      
      // 時間帯ラベルを生成
      const timeLabels = precipTimes.map(timeStr => {
        const date = new Date(timeStr);
        const hour = date.getHours();
        if (hour === 6) return '朝';
        if (hour === 12) return '昼';
        if (hour === 18) return '夕';
        if (hour === 0) return '夜';
        return `${hour}時`;
      });

      return {
        weather: aizuWeather.weathers[0] || '情報なし',
        wind: aizuWeather.winds[0] || '情報なし',
        weatherCode: aizuWeather.weatherCodes[0],
        currentTemp: aizuTemp.temps[0] || '-',
        maxTemp: aizuTemp.temps[1] || '-',
        minTemp: aizuTemp.temps[2] || '-',
        precipitationByTime: precipRates.map((rate, index) => ({
          time: timeLabels[index] || `時間${index + 1}`,
          rate: rate || '0'
        })).slice(0, 3) // 当日分のみ（通常は朝・昼・夕の3つ）
      };
    } catch (error) {
      console.error('当日天気データ抽出エラー:', error);
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
        🌤️ 会津若松 天気予報
      </h3>

      {/* 今日の詳細天気 */}
      {weatherData.today && (
        <div style={{
          backgroundColor: currentTheme?.primaryLight || '#e3f2fd',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '20px',
          border: `2px solid ${currentTheme?.primary || '#2196f3'}`
        }}>
          <h4 style={{
            margin: '0 0 15px 0',
            color: currentTheme?.primary || '#333',
            textAlign: 'center',
            fontSize: '18px'
          }}>
            📅 今日 ({new Date().toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric', weekday: 'short' })})
          </h4>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '15px',
            marginBottom: '15px'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '8px' }}>
                {getWeatherIcon(weatherData.today.weatherCode)}
              </div>
              <div style={{ 
                fontSize: '16px', 
                fontWeight: 'bold',
                color: currentTheme?.text || '#333'
              }}>
                {weatherData.today.currentTemp}°C
              </div>
              <div style={{ 
                fontSize: '12px', 
                color: currentTheme?.textSecondary || '#666'
              }}>
                最高 {weatherData.today.maxTemp}°C
              </div>
            </div>
              <div style={{ fontSize: '14px' }}>
              <div style={{ marginBottom: '8px' }}>
                <strong>天気:</strong> {weatherData.today.weather.substring(0, 20)}
                {weatherData.today.weather.length > 20 && '...'}
              </div>
              <div style={{ marginBottom: '8px' }}>
                <strong>風:</strong> {weatherData.today.wind}
              </div>
              <div>
                <strong>最低気温:</strong> {weatherData.today.minTemp}°C
              </div>
            </div>
          </div>

          {/* 時間帯別降水確率 */}
          {weatherData.today.precipitationByTime && weatherData.today.precipitationByTime.length > 0 && (
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.3)',
              borderRadius: '8px',
              padding: '12px',
              marginTop: '10px'
            }}>
              <div style={{
                fontSize: '14px',
                fontWeight: 'bold',
                marginBottom: '8px',
                color: currentTheme?.text || '#333',
                textAlign: 'center'
              }}>
                ☔ 時間帯別降水確率
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-around',
                fontSize: '13px'
              }}>
                {weatherData.today.precipitationByTime.map((item, index) => (
                  <div key={index} style={{
                    textAlign: 'center',
                    flex: 1
                  }}>
                    <div style={{
                      fontWeight: 'bold',
                      color: currentTheme?.textSecondary || '#666',
                      marginBottom: '4px'
                    }}>
                      {item.time}
                    </div>
                    <div style={{
                      fontSize: '16px',
                      fontWeight: 'bold',
                      color: parseInt(item.rate) > 50 ? '#ef4444' : 
                             parseInt(item.rate) > 30 ? '#f59e0b' : '#3b82f6'
                    }}>
                      {item.rate}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 週間天気予報一覧 */}
      <h4 style={{ 
        color: currentTheme?.text || '#333',
        marginBottom: '15px',
        textAlign: 'center'
      }}>
        📊 週間予報
      </h4>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', 
        gap: '10px',
        marginBottom: '20px'
      }}>
        {weatherData.weekly && weatherData.weekly.map((day, index) => (
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
      </div>      {/* 簡単な統計 */}
      {weatherData.weekly && weatherData.weekly.length > 0 && (
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
              {Math.max(...weatherData.weekly.map(d => parseInt(d.tempMax) || 0))}°
            </div>
            <div style={{ fontSize: '12px', opacity: 0.7 }}>最高気温</div>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 'bold', color: '#3b82f6' }}>
              {Math.min(...weatherData.weekly.map(d => parseInt(d.tempMin) || 100))}°
            </div>
            <div style={{ fontSize: '12px', opacity: 0.7 }}>最低気温</div>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 'bold', color: '#8b5cf6' }}>
              {Math.round(
                weatherData.weekly
                  .map(d => parseInt(d.precipitation) || 0)
                  .reduce((a, b) => a + b, 0) / weatherData.weekly.length
              )}%
            </div>
            <div style={{ fontSize: '12px', opacity: 0.7 }}>平均降水確率</div>
          </div>
        </div>
      )}

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
