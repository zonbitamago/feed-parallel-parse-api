package lib

import "log"

// Info logs informational messages
func Info(msg string) {
	log.Printf("INFO: %s", msg)
}

// Error logs error messages
func Error(msg string) {
	log.Printf("ERROR: %s", msg)
}
