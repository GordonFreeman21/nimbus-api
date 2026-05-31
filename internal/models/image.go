package models

// ImageSearchResponse is the JSON envelope returned to the client.
type ImageSearchResponse struct {
	Total   int           `json:"total"`
	Page    int           `json:"page"`
	PerPage int           `json:"per_page"`
	Results []ImageResult `json:"results"`
}

// ImageResult represents a single image in the search results.
type ImageResult struct {
	URL       string `json:"url"`
	Thumbnail string `json:"thumbnail"`
	Credit    string `json:"credit"`
	Author    string `json:"author"`
	AuthorURL string `json:"author_url"`
}

// UnsplashSearchResponse maps the Unsplash /search/photos JSON shape.
type UnsplashSearchResponse struct {
	Total      int `json:"total"`
	TotalPages int `json:"total_pages"`
	Results    []struct {
		URLs struct {
			Raw     string `json:"raw"`
			Full    string `json:"full"`
			Regular string `json:"regular"`
			Small   string `json:"small"`
			Thumb   string `json:"thumb"`
		} `json:"urls"`
		User struct {
			Name      string `json:"name"`
			Username  string `json:"username"`
			Links     struct {
				HTML string `json:"html"`
			} `json:"links"`
		} `json:"user"`
		Description *string `json:"description"`
	} `json:"results"`
}
