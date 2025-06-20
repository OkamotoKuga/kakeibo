package routes

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"time"

	_ "github.com/go-sql-driver/mysql"
	"github.com/gofiber/fiber/v2"
)

var (
	db        *sql.DB
	jwtSecret []byte
	location  *time.Location
)

func OpenDB() error {
	var err error
	dsn := fmt.Sprintf("%s:%s@tcp(127.0.0.1:3306)/db?parseTime=true&charset=utf8mb4", os.Getenv("SQL_USERNAME"), os.Getenv("SQL_PASSWORD"))
	db, err = sql.Open("mysql", dsn)
	if err != nil {
		log.Println(err)
		return fiber.ErrInternalServerError
	}
	
	if err := db.Ping(); err != nil {
		log.Println(err)
		return fiber.ErrInternalServerError
	}
	err = createTables()
	if err != nil {
		log.Println("Failed to create tables:", err)
		return err
	}
	
	jwtSecret = []byte(os.Getenv("JWT_SECRET"))
	if len(jwtSecret) == 0 {
		jwtSecret = []byte("default-secret-key")
	}
	location, _ = time.LoadLocation("Asia/Tokyo")
	return nil
}

func createTables() error {
	tables := []string{
		`CREATE TABLE IF NOT EXISTS users (
			id INT AUTO_INCREMENT PRIMARY KEY,
			name VARCHAR(255) NOT NULL,
			email VARCHAR(255) NOT NULL UNIQUE,
			password VARCHAR(255) NOT NULL
		)`,
		`CREATE TABLE IF NOT EXISTS budget (
			id INT AUTO_INCREMENT PRIMARY KEY,
			user_id INT NOT NULL,
			income INT NOT NULL,
			outgo INT NOT NULL,
			date DATE NOT NULL,
			FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
		)`,
		`CREATE TABLE IF NOT EXISTS purchases (
			id INT AUTO_INCREMENT PRIMARY KEY,
			user_id INT NOT NULL,
			product_name VARCHAR(255) NOT NULL,
			price INT NOT NULL,
			date DATE NOT NULL,
			category VARCHAR(50) DEFAULT 'その他',
			FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
		)`,
		`CREATE TABLE IF NOT EXISTS income (
			id INT AUTO_INCREMENT PRIMARY KEY,
			user_id INT NOT NULL,
			product_name VARCHAR(255) NOT NULL,
			price INT NOT NULL,
			date DATE NOT NULL,
			FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
		)`,
		`CREATE TABLE IF NOT EXISTS subscriptions (
			id INT AUTO_INCREMENT PRIMARY KEY,
			user_id INT NOT NULL,
			product_name VARCHAR(255) NOT NULL,
			price INT NOT NULL,
			day INT NOT NULL,
			last_updated_at INT NOT NULL,
			FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
		)`,
	}
	
	for _, table := range tables {
		_, err := db.Exec(table)
		if err != nil {
			return err
		}
	}
	
	return nil
}

func DataRouting(app *fiber.App) {
	app.Post("/data/purchases", AddPurchase)
	app.Put("/data/purchases", EditPurchase)
	app.Delete("/data/purchases", DeletePurchase)
	app.Get("/data/purchases", GetPurchases)
	app.Post("/data/income", AddIncome)
	app.Put("/data/income", EditIncome)
	app.Delete("/data/income", DeleteIncome)
	app.Get("/data/income", GetIncome)
	app.Post("/data/subscriptions", AddSubscription)
	app.Put("/data/subscriptions", EditSubscription)
	app.Delete("/data/subscriptions", DeleteSubscription)
	app.Get("/data/subscriptions", GetSubscriptions)
	app.Get("/data/budget", GetBudget)
	app.Post("/data/ocr/process", ProcessOCR)
}
