package routes

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
)

type OCRResult struct {
	ProductName string `json:"product_name"`
	Category    string `json:"category"`
	Price       int    `json:"price"`
}

type GeminiRequest struct {
	Contents []GeminiContent `json:"contents"`
}

type GeminiContent struct {
	Parts []GeminiPart `json:"parts"`
}

type GeminiPart struct {
	Text       string            `json:"text,omitempty"`
	InlineData *GeminiInlineData `json:"inlineData,omitempty"`
}

type GeminiInlineData struct {
	MimeType string `json:"mimeType"`
	Data     string `json:"data"`
}

type GeminiResponse struct {
	Candidates []GeminiCandidate `json:"candidates"`
}

type GeminiCandidate struct {
	Content GeminiContent `json:"content"`
}

func ProcessOCR(c *fiber.Ctx) error {
	// 認証トークンからユーザーIDを取得
	authHeader := c.Get("Authorization")
	if authHeader == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Authorization header required",
		})
	}

	// Bearerトークンを処理 (実際のJWTトークンの場合)
	// または簡単なトークン形式 "userID:email" を処理
	var userID uint
	if len(authHeader) > 7 && authHeader[:7] == "Bearer " {
		token := authHeader[7:]
		// 簡単なトークン解析 (実際のプロダクションではJWTライブラリを使用)
		parts := strings.Split(token, ":")
		if len(parts) != 2 {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Invalid token format",
			})
		}
		id, err := strconv.ParseUint(parts[0], 10, 32)
		if err != nil {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Invalid user ID in token",
			})
		}
		userID = uint(id)
	} else {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Bearer token required",
		})
	}

	var infoID int64
	err := db.QueryRow("SELECT id FROM users WHERE id = ?", userID).Scan(&infoID)
	if err != nil {
		return fiber.ErrNotFound
	}

	file, err := c.FormFile("image")
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "画像ファイルが必要です"})
	}

	fileContent, err := file.Open()
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "ファイルの読み込みに失敗しました"})
	}
	defer fileContent.Close()

	fileBytes, err := io.ReadAll(fileContent)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "ファイルの読み込みに失敗しました"})
	}

	base64Image := base64.StdEncoding.EncodeToString(fileBytes)

	apiKey := os.Getenv("GEMINI_API_KEY")
	if apiKey == "" {
		return c.Status(500).JSON(fiber.Map{"error": "GEMINI_API_KEY が設定されていません"})
	}

	prompt := `画像のレシートから商品情報を抽出してください。
以下のJSON形式で返してください：
[
  {
    "product_name": "商品名",
    "category": "食品/娯楽/衣類/日用品/その他",
    "price": 価格(数値)
  }
]

カテゴリの判定基準：
- 食品: 食べ物、飲み物、調味料など
- 娯楽: ゲーム、映画、書籍、趣味用品など
- 衣類: 服、靴、アクセサリーなど
- 日用品: 洗剤、化粧品、文房具など
- その他: 上記以外

価格は税込み価格を使用してください。JSONのみを返してください。`

	geminiReq := GeminiRequest{
		Contents: []GeminiContent{
			{
				Parts: []GeminiPart{
					{
						Text: prompt,
					},
					{
						InlineData: &GeminiInlineData{
							MimeType: file.Header.Get("Content-Type"),
							Data:     base64Image,
						},
					},
				},
			},
		},
	}

	jsonData, err := json.Marshal(geminiReq)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "リクエストの作成に失敗しました"})
	}

	url := fmt.Sprintf("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=%s", apiKey)
	resp, err := http.Post(url, "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Gemini APIへのリクエストに失敗しました"})
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		body, _ := io.ReadAll(resp.Body)
		return c.Status(500).JSON(fiber.Map{"error": fmt.Sprintf("Gemini API エラー: %s", string(body))})
	}

	var geminiResp GeminiResponse
	if err := json.NewDecoder(resp.Body).Decode(&geminiResp); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "レスポンスの解析に失敗しました"})
	}

	if len(geminiResp.Candidates) == 0 || len(geminiResp.Candidates[0].Content.Parts) == 0 {
		return c.Status(500).JSON(fiber.Map{"error": "認識結果が取得できませんでした"})
	}

	responseText := geminiResp.Candidates[0].Content.Parts[0].Text
	responseText = strings.TrimSpace(responseText)
	responseText = strings.Trim(responseText, "```json")
	responseText = strings.Trim(responseText, "```")
	responseText = strings.TrimSpace(responseText)

	var results []OCRResult
	if err := json.Unmarshal([]byte(responseText), &results); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "認識結果の解析に失敗しました"})
	}

	autoRegister := c.FormValue("auto_register")
	if autoRegister == "true" {
		for _, result := range results {
			_, err = db.Exec("INSERT INTO purchases (user_id, product_name, price, date, category) VALUES (?, ?, ?, ?, ?)",
				infoID, result.ProductName, result.Price, time.Now().In(location), result.Category)
			if err != nil {
				continue
			}
		}
		return c.JSON(fiber.Map{"status": "ok", "message": fmt.Sprintf("%d件のアイテムを登録しました", len(results))})
	}

	return c.JSON(fiber.Map{"results": results})
}
