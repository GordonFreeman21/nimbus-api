package models

// Species represents the flat taxonomic hierarchy returned to the user.
type Species struct {
	CommonName     string `json:"common_name"`
	ScientificName string `json:"scientific_name"`
	Kingdom        string `json:"kingdom"`
	Phylum         string `json:"phylum"`
	Class          string `json:"class"`
	Order          string `json:"order"`
	Family         string `json:"family"`
}
