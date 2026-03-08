package notifications

import (
	"bytes"
	"context"
	"crypto"
	"crypto/rand"
	"crypto/rsa"
	"crypto/sha256"
	"crypto/x509"
	"encoding/base64"
	"encoding/json"
	"encoding/pem"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
	"time"
)

type serviceAccount struct {
	ProjectID   string `json:"project_id"`
	ClientEmail string `json:"client_email"`
	PrivateKey  string `json:"private_key"`
}

// FCMClient sends push notifications via the FCM v1 REST API.
// It is a no-op when credentials are not configured.
type FCMClient struct {
	sa         *serviceAccount
	httpClient *http.Client
}

// NewFCMClient loads FCM credentials from the environment and returns a client.
// Reads GOOGLE_APPLICATION_CREDENTIALS_JSON (inline JSON) or
// GOOGLE_APPLICATION_CREDENTIALS (path to a JSON key file).
// If neither is set, returns a no-op client that silently skips all sends.
func NewFCMClient() *FCMClient {
	credJSON := os.Getenv("GOOGLE_APPLICATION_CREDENTIALS_JSON")
	if credJSON == "" {
		credFile := os.Getenv("GOOGLE_APPLICATION_CREDENTIALS")
		if credFile != "" {
			data, err := os.ReadFile(credFile)
			if err != nil {
				log.Printf("FCM: failed to read credentials file: %v", err)
				return &FCMClient{}
			}
			credJSON = string(data)
		}
	}

	if credJSON == "" {
		log.Println("FCM: no credentials configured, push notifications disabled")
		return &FCMClient{}
	}

	var sa serviceAccount
	if err := json.Unmarshal([]byte(credJSON), &sa); err != nil {
		log.Printf("FCM: failed to parse credentials JSON: %v", err)
		return &FCMClient{}
	}

	return &FCMClient{
		sa:         &sa,
		httpClient: &http.Client{Timeout: 15 * time.Second},
	}
}

// SendEventNotification sends a push notification to all given tokens.
// Runs each send in a goroutine so it never blocks the caller.
func (f *FCMClient) SendEventNotification(ctx context.Context, tokens []string, groupName, eventTitle string, eventDate time.Time, eventID, groupID string) {
	if f.sa == nil || len(tokens) == 0 {
		return
	}

	token, err := f.getAccessToken(ctx)
	if err != nil {
		log.Printf("FCM: failed to obtain access token: %v", err)
		return
	}

	title := fmt.Sprintf("New event in %s", groupName)
	body := fmt.Sprintf("%s on %s", eventTitle, eventDate.Format("Jan 2, 2006"))
	data := map[string]string{
		"group_name":  groupName,
		"event_title": eventTitle,
		"event_date":  eventDate.Format(time.RFC3339),
		"eventId":     eventID,
		"groupId":     groupID,
	}

	for _, t := range tokens {
		go f.sendOne(token, t, title, body, data)
	}
}

func (f *FCMClient) getAccessToken(ctx context.Context) (string, error) {
	now := time.Now()

	headerJSON, _ := json.Marshal(map[string]string{"alg": "RS256", "typ": "JWT"})
	claimsJSON, _ := json.Marshal(map[string]interface{}{
		"iss":   f.sa.ClientEmail,
		"scope": "https://www.googleapis.com/auth/firebase.messaging",
		"aud":   "https://oauth2.googleapis.com/token",
		"iat":   now.Unix(),
		"exp":   now.Add(time.Hour).Unix(),
	})

	signingInput := base64.RawURLEncoding.EncodeToString(headerJSON) + "." +
		base64.RawURLEncoding.EncodeToString(claimsJSON)

	block, _ := pem.Decode([]byte(f.sa.PrivateKey))
	if block == nil {
		return "", fmt.Errorf("FCM: failed to decode PEM private key")
	}
	key, err := x509.ParsePKCS8PrivateKey(block.Bytes)
	if err != nil {
		return "", fmt.Errorf("FCM: parse private key: %w", err)
	}
	rsaKey, ok := key.(*rsa.PrivateKey)
	if !ok {
		return "", fmt.Errorf("FCM: private key is not RSA")
	}

	h := sha256.New()
	h.Write([]byte(signingInput))
	sig, err := rsa.SignPKCS1v15(rand.Reader, rsaKey, crypto.SHA256, h.Sum(nil))
	if err != nil {
		return "", fmt.Errorf("FCM: sign JWT: %w", err)
	}

	jwt := signingInput + "." + base64.RawURLEncoding.EncodeToString(sig)

	resp, err := f.httpClient.PostForm("https://oauth2.googleapis.com/token", url.Values{
		"grant_type": {"urn:ietf:params:oauth:grant-type:jwt-bearer"},
		"assertion":  {jwt},
	})
	if err != nil {
		return "", fmt.Errorf("FCM: token request: %w", err)
	}
	defer resp.Body.Close()

	var result struct {
		AccessToken string `json:"access_token"`
		Error       string `json:"error"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", fmt.Errorf("FCM: decode token response: %w", err)
	}
	if result.Error != "" {
		return "", fmt.Errorf("FCM: token error: %s", result.Error)
	}
	return result.AccessToken, nil
}

func (f *FCMClient) sendOne(accessToken, deviceToken, title, body string, data map[string]string) {
	payload := map[string]interface{}{
		"message": map[string]interface{}{
			"token": deviceToken,
			"notification": map[string]string{
				"title": title,
				"body":  body,
			},
			"data": data,
		},
	}

	b, err := json.Marshal(payload)
	if err != nil {
		log.Printf("FCM: marshal payload: %v", err)
		return
	}

	req, err := http.NewRequest("POST",
		fmt.Sprintf("https://fcm.googleapis.com/v1/projects/%s/messages:send", f.sa.ProjectID),
		bytes.NewReader(b))
	if err != nil {
		log.Printf("FCM: build request: %v", err)
		return
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+accessToken)

	resp, err := f.httpClient.Do(req)
	if err != nil {
		log.Printf("FCM: send error: %v", err)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		log.Printf("FCM: send failed (status %d): %s", resp.StatusCode, string(body))
	}
}
