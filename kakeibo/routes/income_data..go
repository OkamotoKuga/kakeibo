package routes

import (
	"database/sql"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
)

func EditIncome(c *fiber.Ctx) error {
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
	}
	if err := c.BodyParser(&input); err != nil {
		fmt.Printf("Error parsing request body: %v\n", err)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}
	var currentPrice int
	err = db.QueryRow("SELECT price FROM income WHERE id = ? AND user_id = ?", input.ProductID, userID).Scan(&currentPrice)
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
	
	_, err = db.Exec("UPDATE income SET product_name = ?, price = ?, date = ? WHERE user_id = ? AND id = ?", input.ProductName, input.Price, updatedDate, userID, input.ProductID)
	if err != nil {
		fmt.Printf("Error updating income: %v\n", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to update record",
		})
	}
	priceDiff := input.Price - currentPrice
	if priceDiff != 0 {
		UpdateCurrentBudget(userID, priceDiff, 0)
	}
	
	return c.JSON(fiber.Map{
		"message": "Record updated successfully",
	})
}

func DeleteIncome(c *fiber.Ctx) error {
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
	err := db.QueryRow("SELECT user_id FROM income WHERE id = ?", input.ProductID).Scan(&ownerID)
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
	_, err = db.Exec("DELETE FROM income WHERE id = ? AND user_id = ?", input.ProductID, userID)
	if err != nil {
		fmt.Printf("Error deleting income: %v\n", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to delete record",
		})
	}

	return c.JSON(fiber.Map{
		"message": "Record deleted successfully",
	})
}

func AddIncome(c *fiber.Ctx) error {
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
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to verify user",
		})
	}
	var input struct {
		ProductName string `json:"product_name"`
		Price       int    `json:"price"`
		Year        int    `json:"year"`
		Month       int    `json:"month"`
		Day         int    `json:"day"`
	}
	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}
	_, err = db.Exec("INSERT INTO income (user_id, product_name, price, date) VALUES (?, ?, ?, ?)", infoID, input.ProductName, input.Price, time.Date(input.Year, time.Month(input.Month), input.Day, 0, 0, 0, 0, time.UTC))
	if err != nil {
		fmt.Printf("Error inserting income: %v\n", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to insert income data",
		})
	}
	UpdateCurrentBudget(userID, input.Price, 0)
	return c.JSON(fiber.Map{"status": "ok"})
}

func GetIncome(c *fiber.Ctx) error {
	userID := c.Locals("userID").(uint)
	var infoID int64
	err := db.QueryRow("SELECT id FROM users WHERE id = ?", userID).Scan(&infoID)
	if err != nil {
		return fiber.ErrNotFound
	}
	year := c.Query("year")
	month := c.Query("month")
	now := time.Now().In(location)
	var rows *sql.Rows
	if year == "" {
		if month == "" {
			rows, err = db.Query("SELECT id, product_name, price, date FROM income WHERE user_id = ?", infoID)
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
			return fiber.ErrBadRequest
		}
		y, err := strconv.Atoi(year)
		if err != nil {
			return fiber.ErrBadRequest
		}
		rows, err = db.Query("SELECT id, product_name, price, date FROM income WHERE user_id = ? AND DATE_FORMAT(date, '%Y-%m') = ?", userID, fmt.Sprintf("%d-%02d", y, m))
		if err != nil {
			return fiber.ErrInternalServerError
		}
	}
	if err != nil {
		return fiber.ErrInternalServerError
	}
	defer rows.Close()
	income := []fiber.Map{}
	for rows.Next() {
		var (
			id    int
			name  string
			price int
			date  *time.Time
		)
		if err := rows.Scan(&id, &name, &price, &date); err != nil {
			continue
		}
		income = append(income, fiber.Map{
			"product_id":   id,
			"product_name": name,
			"price":        price,
			"year":         date.Year(),
			"month":        date.Month(),
			"day":          date.Day(),
		})
	}
	return c.JSON(income)
}
