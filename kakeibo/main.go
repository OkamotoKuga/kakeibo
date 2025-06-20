package main

import (
	"kakeibo/routes"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
)

type Data struct {
	income  int `json:"income"`
	outcome int `json:"outgo"`
}

func main() {	jst := time.FixedZone("Asia/Tokyo", 9*60*60)
	time.Local = jst
	app := fiber.New()
	
	app.Use(cors.New(cors.Config{
		AllowOrigins:     "http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173",
		AllowMethods:     "GET,POST,PUT,DELETE,OPTIONS",
		AllowHeaders:     "Origin,Content-Type,Accept,Authorization",
		AllowCredentials: true,
	}))
	if err := routes.OpenDB(); err != nil {
		panic("Failed to connect to database: " + err.Error())
	}
	
	app.Static("/", "./kakeibo")
	routes.AccountRouting(app)
	routes.DataRouting(app)
	app.Listen(":8080")
}
