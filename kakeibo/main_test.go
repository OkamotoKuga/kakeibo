package main

import (
	"kakeibo/routes"
	"testing"

	"github.com/gofiber/fiber/v2"
)

func TestMain(m *testing.M) {
	app := fiber.New()
	app.Use(func(c *fiber.Ctx) error {
		c.Locals("userID", uint(1))
		routes.OpenDB()
		return c.Next()
	})
	routes.AccountRouting(app)
	routes.DataRouting(app)
	app.Listen(":8010")
}
