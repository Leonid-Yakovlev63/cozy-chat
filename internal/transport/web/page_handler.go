package web

import (
	"errors"
	"html/template"
	"net/http"
	"path/filepath"
	"strings"
)

type (
	PageHandler interface {
		RegisterRoutes(mux *http.ServeMux)
	}

	pageHandler struct {
		layoutPath    string
		pageTemplates map[string]*template.Template
		staticDir     string
	}

	pageViewData struct {
		Title   string
		Message string
	}
)

func NewPageHandler(templatesDir, staticDir string) (PageHandler, error) {
	templatePaths, err := filepath.Glob(filepath.Join(templatesDir, "*.html"))
	if err != nil {
		return nil, err
	}
	if len(templatePaths) == 0 {
		return nil, errors.New("no html templates found")
	}

	layoutPath := filepath.Join(templatesDir, "layout.html")
	layoutExists := false
	for _, templatePath := range templatePaths {
		if templatePath == layoutPath {
			layoutExists = true
			break
		}
	}
	if !layoutExists {
		return nil, errors.New("layout.html template is required")
	}

	pageTemplates := make(map[string]*template.Template, len(templatePaths))
	for _, templatePath := range templatePaths {
		if templatePath == layoutPath {
			continue
		}

		tpl, parseErr := template.ParseFiles(layoutPath, templatePath)
		if parseErr != nil {
			return nil, parseErr
		}

		templateName := strings.TrimSuffix(filepath.Base(templatePath), filepath.Ext(templatePath))
		pageTemplates[templateName] = tpl
	}

	if _, ok := pageTemplates["index"]; !ok {
		return nil, errors.New("index.html template is required")
	}

	return &pageHandler{
		layoutPath:    layoutPath,
		pageTemplates: pageTemplates,
		staticDir:     staticDir,
	}, nil
}

func (h *pageHandler) RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("GET /", h.Index)
	mux.HandleFunc("GET /{name}", h.Page)
	mux.HandleFunc("GET /go/{name}", h.RedirectToPage)

	staticFiles := http.FileServer(http.Dir(h.staticDir))
	mux.Handle("GET /static/", http.StripPrefix("/static/", staticFiles))
}

func (h *pageHandler) Index(w http.ResponseWriter, _ *http.Request) {
	tpl, ok := h.pageTemplates["index"]
	if !ok {
		http.Error(w, "index template not found", http.StatusInternalServerError)
		return
	}

	h.renderWithTemplate(w, tpl, pageViewData{
		Title:   "Home",
		Message: "Сообщение с сервера: Hello World!",
	})
}

func (h *pageHandler) Page(w http.ResponseWriter, r *http.Request) {
	templateName := r.PathValue("name")
	if strings.Contains(templateName, ".") || strings.Contains(templateName, "/") || strings.Contains(templateName, "\\") {
		http.NotFound(w, r)
		return
	}

	tpl, ok := h.pageTemplates[templateName]
	if !ok {
		http.NotFound(w, r)
		return
	}

	h.renderWithTemplate(w, tpl, pageViewData{
		Title: templateName,
	})
}

func (h *pageHandler) renderWithTemplate(w http.ResponseWriter, tpl *template.Template, data pageViewData) {
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	if err := tpl.ExecuteTemplate(w, "layout", data); err != nil {
		http.Error(w, "template render error", http.StatusInternalServerError)
	}
}

func (h *pageHandler) RedirectToPage(w http.ResponseWriter, r *http.Request) {
	templateName := r.PathValue("name")
	http.Redirect(w, r, "/"+templateName, http.StatusFound)
}
