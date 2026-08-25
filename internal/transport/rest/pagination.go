package rest

import (
	"net/http"
	"strconv"
)

func ParseMessagesPagination(r *http.Request) (limit int64, offset int64, err error) {
	limit = 100
	offset = 0

	if rawLimit := r.URL.Query().Get("limit"); rawLimit != "" {
		limit, err = strconv.ParseInt(rawLimit, 10, 64)
		if err != nil {
			return 0, 0, err
		}
	}

	if rawOffset := r.URL.Query().Get("offset"); rawOffset != "" {
		offset, err = strconv.ParseInt(rawOffset, 10, 64)
		if err != nil {
			return 0, 0, err
		}
	}

	return limit, offset, nil
}
