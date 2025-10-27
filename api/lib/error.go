package lib

import "log"

// HandleError logs and returns error message
func HandleError(err error) string {
	if err != nil {
		log.Printf("ERROR: %s", err.Error())
		return err.Error()
	}
	return ""
}
