package routes

import (
	"database/sql"
	"strconv"
	"time"

	_ "github.com/go-sql-driver/mysql"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/log"
)

func EditSubscription(c *fiber.Ctx) error {
	userID := c.Locals("userID").(uint)
	var infoID int64
	err := db.QueryRow("SELECT id FROM users WHERE id = ?", userID).Scan(&infoID)
	if err != nil {
		return fiber.ErrNotFound
	}
	var input struct {
		ProductID   int    `json:"product_id"`
		ProductName string `json:"product_name"`
		Price       int    `json:"price"`
		Day         int    `json:"day"`
	}
	if err := c.BodyParser(&input); err != nil {
		return fiber.ErrBadRequest
	}
	_, err = db.Exec("UPDATE subscriptions SET product_name = ?, price = ?, day = ?, last_updated_at WHERE user_id = ? AND id = ?", input.ProductName, input.Price, input.Day, int(time.Now().Month()), userID, input.ProductID)
	if err != nil {
		return fiber.ErrInternalServerError
	}
	return c.JSON(fiber.Map{"status": "ok"})
}

func DeleteSubscription(c *fiber.Ctx) error {
	userID := c.Locals("userID").(uint)
	var infoID int64
	err := db.QueryRow("SELECT id FROM users WHERE id = ?", userID).Scan(&infoID)
	if err != nil {
		return fiber.ErrNotFound
	}
	var input struct {
		ProductID int `json:"product_id"`
	}
	if err := c.BodyParser(&input); err != nil {
		return fiber.ErrBadRequest
	}
	_, err = db.Exec("DELETE FROM subscriptions WHERE user_id = ? AND id = ?", infoID, input.ProductID)
	if err != nil {
		return fiber.ErrInternalServerError
	}
	return c.JSON(fiber.Map{"status": "ok"})
}

func AddSubscription(c *fiber.Ctx) error {
	userID := c.Locals("userID").(uint)
	var infoID int64
	err := db.QueryRow("SELECT id FROM users WHERE id = ?", userID).Scan(&infoID)
	if err != nil {
		return fiber.ErrNotFound
	}
	var input struct {
		ProductName string `json:"product_name"`
		Price       int    `json:"price"`
		Day         int    `json:"day"`
	}
	if err := c.BodyParser(&input); err != nil {
		return fiber.ErrBadRequest
	}
	_, err = db.Exec("INSERT INTO subscriptions (user_id, product_name, price, day, last_updated_at) VALUES (?, ?, ?, ?, ?)", infoID, input.ProductName, input.Price, input.Day, int(time.Now().Month()))
	if err != nil {
		log.Error(err)
		return fiber.ErrInternalServerError
	}
	return c.JSON(fiber.Map{"status": "ok"})
}

func GetSubscriptions(c *fiber.Ctx) error {
	userID := c.Locals("userID").(uint)
	var infoID int64
	err := db.QueryRow("SELECT id FROM users WHERE id = ?", userID).Scan(&infoID)
	if err != nil {
		return fiber.ErrNotFound
	}
	day := c.Query("day")
	var (
		rows *sql.Rows
		d    int
	)
	if day == "" {
		rows, err = db.Query("SELECT id, product_name, price, day FROM subscriptions WHERE user_id = ?", userID)
	} else {
		d, err = strconv.Atoi(day)
		if err != nil {
			return fiber.ErrBadRequest
		}
		rows, err = db.Query("SELECT id, product_name, price, day FROM subscriptions WHERE user_id = ? AND day = ?", userID, d)
	}
	if err != nil {
		return fiber.ErrInternalServerError
	}
	defer rows.Close()
	subsc := []fiber.Map{}
	for rows.Next() {
		var (
			id    int
			name  string
			price int
			day   int
		)
		if err := rows.Scan(&id, &name, &price, &day); err != nil {
			continue
		}
		subsc = append(subsc, fiber.Map{
			"product_id":   id,
			"product_name": name,
			"price":        price,
			"day":          day,
		})
	}
	return c.JSON(subsc)
}
