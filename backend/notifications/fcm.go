package notifications

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"time"
)

// PushClient sends push notifications via the Expo Push API.
// It is a no-op when no tokens are provided.
type PushClient struct {
	httpClient *http.Client
}

// NewPushClient returns a client for sending Expo push notifications.
func NewPushClient() *PushClient {
	return &PushClient{
		httpClient: &http.Client{Timeout: 15 * time.Second},
	}
}

type expoPushMessage struct {
	To    string            `json:"to"`
	Title string            `json:"title"`
	Body  string            `json:"body"`
	Data  map[string]string `json:"data,omitempty"`
}

// SendEventNotification sends a push notification to all given Expo push tokens.
// Runs asynchronously so it never blocks the caller.
func (p *PushClient) SendEventNotification(ctx context.Context, tokens []string, groupName, eventTitle string, eventDate time.Time, eventID, groupID string) {
	if len(tokens) == 0 {
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

	messages := make([]expoPushMessage, len(tokens))
	for i, t := range tokens {
		messages[i] = expoPushMessage{
			To:    t,
			Title: title,
			Body:  body,
			Data:  data,
		}
	}

	go p.send(messages)
}

func (p *PushClient) send(messages []expoPushMessage) {
	b, err := json.Marshal(messages)
	if err != nil {
		log.Printf("Expo Push: marshal payload: %v", err)
		return
	}

	req, err := http.NewRequest("POST", "https://exp.host/--/api/v2/push/send", bytes.NewReader(b))
	if err != nil {
		log.Printf("Expo Push: build request: %v", err)
		return
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")

	resp, err := p.httpClient.Do(req)
	if err != nil {
		log.Printf("Expo Push: send error: %v", err)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		log.Printf("Expo Push: send failed (status %d): %s", resp.StatusCode, string(body))
	}
}
