package routes

import (
	"database/sql"
	"fmt"
	"strconv"
	"time"

	_ "github.com/go-sql-driver/mysql"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/log"
)

func UpdateBudget(userID uint, id, increase, decrease int) error {
	var (
		income int
		outgo  int
	)
	err := db.QueryRow("SELECT income, outgo FROM budget WHERE user_id = ? AND id = ?", userID, id).Scan(&income, &outgo)
	if err != nil {
		return fiber.ErrInternalServerError
	}
	if income < 0 {
		_, err = db.Exec("INSERT INTO budget (user_id, income, outgo, date) VALUES (?, ?, ?, ?)", userID, 0, 0, time.Now())
		if err != nil {
			return fiber.ErrInternalServerError
		}
	}
	_, err = db.Exec("UPDATE budget SET income = ?, outgo = ? WHERE user_id = ? AND id = ?", income+increase, outgo+decrease, userID, id)
	if err != nil {
		return fiber.ErrInternalServerError
	}
	return nil
}

func UpdateCurrentBudget(userID uint, increase, decrease int) error {
	var (
		income int
		outgo  int
	)
	now := time.Now()
	err := db.QueryRow("SELECT income, outgo FROM budget WHERE user_id = ? AND DATE_FORMAT(date, '%Y-%m') = ?", userID, fmt.Sprintf("%d-%02d", now.Year(), int(now.Month()))).Scan(&income, &outgo)
	if err != nil {
		_, err = db.Exec("INSERT INTO budget (user_id, income, outgo, date) VALUES (?, ?, ?, ?)", userID, 0, 0, time.Now())
		if err != nil {
			log.Error(err)
			return fiber.ErrInternalServerError
		}
	}
	_, err = db.Exec("UPDATE budget SET income = ?, outgo = ? WHERE user_id = ? ORDER BY id DESC LIMIT 1", income+increase, outgo+decrease, userID)
	if err != nil {
		log.Error(err)
		return fiber.ErrInternalServerError
	}
	return nil
}

func GetBudget(c *fiber.Ctx) error {
	userID := c.Locals("userID").(uint)
	var infoID int64
	err := db.QueryRow("SELECT id FROM users WHERE id = ?", userID).Scan(&infoID)
	if err != nil {
		log.Error(err)
		return fiber.ErrNotFound
	}
	now := time.Now()
	year := c.Query("year")
	month := c.Query("month")
	var (
		y    int
		m    int
		rows *sql.Rows
	)
	if year == "" {
		y = now.Year()
		if month == "" {
			rows, err = db.Query("SELECT id, income, outgo, date FROM budget WHERE id = ? AND DATE_FORMAT(date, '%Y') = ?", userID, y)
			if err != nil {
				log.Error(err)
				return fiber.ErrInternalServerError
			}
		} else {
			m, err = strconv.Atoi(month)
			if err != nil {
				log.Error(err)
				return fiber.ErrBadRequest
			}
		}
	} else {
		y, err = strconv.Atoi(year)
		if err != nil {
			log.Error(err)
			return fiber.ErrBadRequest
		}
		if month == "" {
			m = int(now.Month())
		} else {
			m, err = strconv.Atoi(month)
			if err != nil {
				log.Error(err)
				return fiber.ErrBadRequest
			}
		}
	}
	if rows == nil {
		rows, err = db.Query("SELECT id, income, outgo, date FROM budget WHERE id = ? AND DATE_FORMAT(date, '%Y-%m') = ?", userID, fmt.Sprintf("%d-%02d", y, m))
		if err != nil {
			log.Error(err)
			return fiber.ErrInternalServerError
		}
	}
	defer rows.Close()
	budgets := []fiber.Map{}
	for rows.Next() {
		var (
			id     int
			income int
			outgo  int
			date   *time.Time
		)
		if err := rows.Scan(&id, &income, &outgo, &date); err != nil {
			continue
		}
		budgets = append(budgets, fiber.Map{
			"budget_id": id,
			"income":    income,
			"outgo":     outgo,
			"year":      date.Year(),
			"month":     date.Month(),
		})
	}
	return c.JSON(budgets)
}
