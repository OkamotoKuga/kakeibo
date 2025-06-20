package routes

import (
	"database/sql"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
)

func EditPurchase(c *fiber.Ctx) error {
	authHeader := c.Get("Authorization")
	if authHeader == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Authorization header required",
		})
	}

	var userID uint
	if len(authHeader) > 7 && authHeader[:7] == "Bearer " {
		token := authHeader[7:]
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
		})	}

	var infoID int64
	err := db.QueryRow("SELECT id FROM users WHERE id = ?", userID).Scan(&infoID)
	if err != nil {
		fmt.Printf("Error getting user ID: %v\n", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to verify user",
		})
	}
		var input struct {
		ProductID   int    `json:"product_id"`
		ProductName string `json:"product_name"`
		Price       int    `json:"price"`
		Year        int    `json:"year"`
		Month       int    `json:"month"`
		Day         int    `json:"day"`
		Category    string `json:"category"`
	}
	if err := c.BodyParser(&input); err != nil {
		fmt.Printf("Error parsing request body: %v\n", err)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}
	
	var currentPrice int
	err = db.QueryRow("SELECT price FROM purchases WHERE id = ? AND user_id = ?", input.ProductID, userID).Scan(&currentPrice)
	if err != nil {
		if err == sql.ErrNoRows {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Record not found",
			})
		}
		fmt.Printf("Error getting current price: %v\n", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to get current record",
		})
	}
	updatedDate := time.Date(input.Year, time.Month(input.Month), input.Day, 0, 0, 0, 0, time.UTC)
	
	_, err = db.Exec("UPDATE purchases SET product_name = ?, price = ?, date = ?, category = ? WHERE user_id = ? AND id = ?", input.ProductName, input.Price, updatedDate, input.Category, userID, input.ProductID)
	if err != nil {
		fmt.Printf("Error updating purchase: %v\n", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to update record",
		})
	}
	priceDiff := input.Price - currentPrice
	if priceDiff != 0 {
		UpdateCurrentBudget(userID, 0, priceDiff)
	}
	
	return c.JSON(fiber.Map{
		"message": "Record updated successfully",
	})
}

func DeletePurchase(c *fiber.Ctx) error {
	authHeader := c.Get("Authorization")
	if authHeader == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Authorization header required",
		})
	}

	var userID uint
	if len(authHeader) > 7 && authHeader[:7] == "Bearer " {
		token := authHeader[7:]
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
	var input struct {
		ProductID int `json:"product_id"`
	}
	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	if input.ProductID <= 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid product_id",
		})
	}
	var ownerID int
	err := db.QueryRow("SELECT user_id FROM purchases WHERE id = ?", input.ProductID).Scan(&ownerID)
	if err != nil {
		if err == sql.ErrNoRows {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Record not found",
			})
		}
		fmt.Printf("Error checking ownership: %v\n", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to check ownership",
		})
	}

	if uint(ownerID) != userID {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "Access denied",
		})
	}
	_, err = db.Exec("DELETE FROM purchases WHERE id = ? AND user_id = ?", input.ProductID, userID)
	if err != nil {
		fmt.Printf("Error deleting purchase: %v\n", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to delete record",
		})
	}

	return c.JSON(fiber.Map{
		"message": "Record deleted successfully",
	})
}

func AddPurchase(c *fiber.Ctx) error {
	authHeader := c.Get("Authorization")
	if authHeader == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Authorization header required",
		})
	}

	var userID uint
	if len(authHeader) > 7 && authHeader[:7] == "Bearer " {
		token := authHeader[7:]
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
	
	var input struct {
		ProductName string `json:"product_name"`
		Price       int    `json:"price"`
		Year        int    `json:"year"`
		Month       int    `json:"month"`
		Day         int    `json:"day"`
		Category    string `json:"category"`
		Type        string `json:"type"`
	}
	body := c.Body()
	fmt.Printf("=== 受信した生JSONデータ ===\n")
	fmt.Printf("Body: %s\n", string(body))
	
	if err := c.BodyParser(&input); err != nil {
		fmt.Printf("BodyParserエラー: %v\n", err)
		return fiber.ErrBadRequest
	}
	fmt.Printf("=== パース後の値 ===\n")
	fmt.Printf("ProductName: %s\n", input.ProductName)
	fmt.Printf("Price: %d\n", input.Price)
	fmt.Printf("Year: %d\n", input.Year)
	fmt.Printf("Month: %d\n", input.Month)
	fmt.Printf("Day: %d\n", input.Day)
	fmt.Printf("Category: %s\n", input.Category)
	fmt.Printf("Type: '%s' (length: %d)\n", input.Type, len(input.Type))
	
	fmt.Printf("=== AddPurchase デバッグ ===\n")
	fmt.Printf("受信データ: Year=%d, Month=%d, Day=%d, Type=%s\n", input.Year, input.Month, input.Day, input.Type)
	fmt.Printf("time.Month(input.Month): %v\n", time.Month(input.Month))
	createdDate := time.Date(input.Year, time.Month(input.Month), input.Day, 0, 0, 0, 0, time.UTC)
	fmt.Printf("作成された日付(UTC): %v\n", createdDate)
	fmt.Printf("作成された日付の年月日: %d年%d月%d日\n", createdDate.Year(), createdDate.Month(), createdDate.Day())
	fmt.Printf("データベース挿入前の最終確認: Year=%d, Month=%d, Day=%d, Type=%s\n", createdDate.Year(), int(createdDate.Month()), createdDate.Day(), input.Type)
	
	fmt.Printf("受信したType値: '%s'\n", input.Type)
	fmt.Printf("Type値の長さ: %d\n", len(input.Type))
	fmt.Printf("Type == '収入' の判定結果: %t\n", input.Type == "収入")
	
	if input.Type == "収入" {
		fmt.Printf("収入として income テーブルに保存します\n")
		_, err = db.Exec("INSERT INTO income (user_id, product_name, price, date) VALUES (?, ?, ?, ?)", infoID, input.ProductName, input.Price, createdDate)
	} else {
		fmt.Printf("支出として purchases テーブルに保存します\n")
		_, err = db.Exec("INSERT INTO purchases (user_id, product_name, price, date, category) VALUES (?, ?, ?, ?, ?)", infoID, input.ProductName, input.Price, createdDate, input.Category)
	}
	if err != nil {
		fmt.Printf("データベース挿入エラー: %v\n", err)
		return fiber.ErrInternalServerError
	}
	if err != nil {
		return fiber.ErrInternalServerError
	}
	UpdateCurrentBudget(userID, 0, input.Price)
	return c.JSON(fiber.Map{"status": "ok"})
}

func GetPurchases(c *fiber.Ctx) error {
	authHeader := c.Get("Authorization")
	if authHeader == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Authorization header required",
		})
	}

	var userID uint
	if len(authHeader) > 7 && authHeader[:7] == "Bearer " {
		token := authHeader[7:]
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
	} else {		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Bearer token required",
		})
	}
	var infoID int64
	err := db.QueryRow("SELECT id FROM users WHERE id = ?", userID).Scan(&infoID)
	if err != nil {
		fmt.Printf("Error getting user ID: %v\n", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to verify user",
		})
	}
	year := c.Query("year")
	month := c.Query("month")
	now := time.Now().In(location)
	var rows *sql.Rows
	if year == "" {
		if month == "" {
			rows, err = db.Query("SELECT id, product_name, price, date, category FROM purchases WHERE user_id = ?", infoID)
		} else {
			year = now.Format("2006")
		}
	}
	if rows == nil {
		if month == "" {
			month = now.Format("01")
		}
		m, err := strconv.Atoi(month)
		if err != nil || m < 0 || 12 < m {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Invalid month parameter",
			})
		}
		y, err := strconv.Atoi(year)
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Invalid year parameter",
			})
		}
		rows, err = db.Query("SELECT id, product_name, price, date, category FROM purchases WHERE user_id = ? AND DATE_FORMAT(date, '%Y-%m') = ?", userID, fmt.Sprintf("%d-%02d", y, m))
		if err != nil {
			fmt.Printf("Error querying purchases: %v\n", err)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to query purchases",
			})
		}
	}
	if err != nil {
		fmt.Printf("Error querying purchases: %v\n", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to query purchases",
		})
	}
	defer rows.Close()
	purchases := []fiber.Map{}
	
	for rows.Next() {
		var (
			id       int
			name     string
			price    int
			date     *time.Time
			category string
		)
		if err := rows.Scan(&id, &name, &price, &date, &category); err != nil {
			continue
		}
		fmt.Printf("=== GetPurchases デバッグ ===\n")
		fmt.Printf("データベースから取得した日付: %v\n", date)
		utcDate := date.UTC()
		fmt.Printf("UTC時間として処理: %v\n", utcDate)
		fmt.Printf("返却する年月日: Year=%d, Month=%d, Day=%d\n", utcDate.Year(), utcDate.Month(), utcDate.Day())
		purchases = append(purchases, fiber.Map{
			"product_id":   id,
			"product_name": name,
			"price":        price,
			"year":         utcDate.Year(),
			"month":        utcDate.Month(),
			"day":          utcDate.Day(),
			"category":     category,
			"type":         "支出", 		})
	}
	var incomeRows *sql.Rows
	var incomeErr error
	if year == "" && month == "" {
		incomeRows, incomeErr = db.Query("SELECT id, product_name, price, date FROM income WHERE user_id = ?", infoID)
	} else {
		m, parseErr := strconv.Atoi(month)
		if parseErr != nil || m < 0 || 12 < m {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Invalid month parameter for income",
			})
		}
		y, parseErr := strconv.Atoi(year)
		if parseErr != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Invalid year parameter for income",
			})
		}
		incomeRows, incomeErr = db.Query("SELECT id, product_name, price, date FROM income WHERE user_id = ? AND DATE_FORMAT(date, '%Y-%m') = ?", infoID, fmt.Sprintf("%d-%02d", y, m))
	}
	if incomeErr != nil {
		fmt.Printf("Error querying income: %v\n", incomeErr)
		fmt.Printf("Income table might not exist, returning purchases only\n")
	} else {
		defer incomeRows.Close()
		
		for incomeRows.Next() {
			var (
				id    int
				name  string
				price int
				date  *time.Time
			)
			if err := incomeRows.Scan(&id, &name, &price, &date); err != nil {
				continue
			}
			utcDate := date.UTC()
			fmt.Printf("=== GetIncome デバッグ ===\n")
			fmt.Printf("収入データ: %s, %d円\n", name, price)
			
			purchases = append(purchases, fiber.Map{
				"product_id":   id,
				"product_name": name,
				"price":        price,
				"year":         utcDate.Year(),
				"month":        utcDate.Month(),
				"day":          utcDate.Day(),
				"category":     "収入",
				"type":         "収入",
			})
		}
	}
	
	return c.JSON(fiber.Map{
		"purchases": purchases,
	})
}
