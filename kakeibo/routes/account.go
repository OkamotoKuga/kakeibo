package routes

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"strconv"

	"github.com/gofiber/fiber/v2"

	_ "github.com/go-sql-driver/mysql"
)

func AccountRouting(app *fiber.App) {
	dsn := fmt.Sprintf("%s:%s@tcp(localhost:3306)/db", os.Getenv("SQL_USERNAME"), os.Getenv("SQL_PASSWORD"))
	app.Post("/account/signin", func(c *fiber.Ctx) error {
		var req struct {
			Email    string `json:"email"`
			Password string `json:"password"`
		}
		
		if err := c.BodyParser(&req); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error":   "Bad Request",
				"message": "Invalid JSON format",
			})
		}
		
		email := req.Email
		password := req.Password

		db, err := sql.Open("mysql", dsn)
		if err != nil {
			log.Println(err)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error":   "Internal Server Error",
				"message": "Database connection failed.",
			})
		}
		defer db.Close()
		var idStr, dbPassword, name string
		err = db.QueryRow("SELECT id, password, name FROM users WHERE email = ?", email).Scan(&idStr, &dbPassword, &name)
		if err != nil {
			if err == sql.ErrNoRows {
				return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
					"error":   "Unauthorized",
					"message": "Invalid credentials. (認証情報が無効です。)",
				})
			}
			log.Println(err)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error":   "Internal Server Error",
				"message": "Failed to query user.",
			})
		}

		if dbPassword != password {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error":   "Unauthorized",
				"message": "Invalid credentials. (認証情報が無効です。)",
			})
		}
		id, err := strconv.ParseUint(idStr, 10, 32)
		if err != nil {
			log.Println(err)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error":   "Internal Server Error",
				"message": "Failed to parse user ID.",
			})
		}
		userID := uint(id)
		c.Locals("userID", userID)

		token := fmt.Sprintf("%d:%s", userID, email)
		return c.JSON(fiber.Map{
			"token": token,
			"user": fiber.Map{
				"id":    userID,
				"name":  name,
				"email": email,
			},
		})
	})
	app.Post("/account/signup", func(c *fiber.Ctx) error {
		var req struct {
			Name     string `json:"name"`
			Email    string `json:"email"`
			Password string `json:"password"`
		}
		
		if err := c.BodyParser(&req); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error":   "Bad Request",
				"message": "Invalid JSON format",
			})
		}
		
		email := req.Email
		password := req.Password
		name := req.Name

		db, err := sql.Open("mysql", dsn)
		if err != nil {
			log.Println(err)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error":   "Internal Server Error",
				"message": "Database connection failed.",
			})
		}
		defer db.Close()
		result, err := db.Exec("INSERT INTO users (name, email, password) VALUES (?, ?, ?)", name, email, password)
		if err != nil {
			log.Println(err)
			return c.Status(fiber.StatusConflict).JSON(fiber.Map{
				"error":   "Conflict",
				"message": "User already exists. (ユーザーは既に存在しています。)",
			})
		}
		userID, err := result.LastInsertId()
		if err != nil {
			log.Println(err)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error":   "Internal Server Error",
				"message": "Failed to get user ID.",
			})
		}

		token := fmt.Sprintf("%d:%s", userID, email)

		return c.JSON(fiber.Map{
			"token": token,
			"user": fiber.Map{
				"id":    uint(userID),
				"name":  name,
				"email": email,
			},
		})
	})
	app.Put("/account/state", func(c *fiber.Ctx) error {
		email := c.FormValue("email")
		password := c.FormValue("password")
		newPassword := c.FormValue("newPassword")

		db, err := sql.Open("mysql", dsn)
		if err != nil {
			log.Println(err)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error":   "Internal Server Error",
				"message": "Database connection failed.",
			})
		}
		defer db.Close()

		result, err := db.Exec("UPDATE users SET password = ? WHERE email = ? AND password = ?", newPassword, email, password)
		if err != nil {
			log.Println(err)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error":   "Internal Server Error",
				"message": "Failed to update user.",
			})
		}

		rowsAffected, err := result.RowsAffected()
		if err != nil {
			log.Println(err)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error":   "Internal Server Error",
				"message": "Failed to check update status.",
			})
		}

		if rowsAffected == 0 {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error":   "Unauthorized",
				"message": "Invalid credentials or no update was necessary.",
			})
		}

		return c.JSON(fiber.Map{
			"message": "User updated successfully.",
		})
	})
}
