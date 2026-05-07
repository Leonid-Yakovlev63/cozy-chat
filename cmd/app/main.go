package main

import (
	"flag"

	"github.com/Leonid-Yakovlev63/cozy-chat-backend/internal/app"
)

func main() {
	enableWeb := flag.Bool("enable-web", false, "enable web templates and static files routes")
	flag.Parse()

	app.Run(*enableWeb)
}
