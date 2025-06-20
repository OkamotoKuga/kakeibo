package routes

import (
	"database/sql"
	"fmt"
	"os"
	"path/filepath"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestGetRegisteredDriver(t *testing.T) {
	assert.Equal(t, []string{"mysql"}, sql.Drivers())
}

func TestDB(t *testing.T) {
	abs, _ := filepath.Abs(".")
	fmt.Printf("カレント: %s\n", abs)
	os.Chdir("..")
	OpenDB("root", "hogehoge") // 適宜変更
	fmt.Println("Opened DB")
	Register(1, 10000, 2000)
	fmt.Println("Inserted DB")
	i, o, err := GetInfo(1)
	if err != nil {
		panic(err)
	}
	fmt.Printf("収入: %d, 支出: %d\n", i, o)
}
