package usecase

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"math"
	"sync"
	"time"

	"github.com/nats-io/nats.go"
)

// JobStatus represents the current status of a job.
type JobStatus string

const (
	JobStatusPending   JobStatus = "PENDING"
	JobStatusRunning   JobStatus = "RUNNING"
	JobStatusCompleted JobStatus = "COMPLETED"
	JobStatusFailed    JobStatus = "FAILED"
	JobStatusRetrying  JobStatus = "RETRYING"
	JobStatusDead      JobStatus = "DEAD" // Moved to dead-letter queue
)

// Job represents a unit of work in the queue.
type Job struct {
	ID        string            `json:"id"`
	Subject   string            `json:"subject"`
	Payload   json.RawMessage   `json:"payload"`
	Status    JobStatus         `json:"status"`
	Attempt   int               `json:"attempt"`
	MaxRetry  int               `json:"max_retry"`
	Error     string            `json:"error,omitempty"`
	CreatedAt time.Time         `json:"created_at"`
	UpdatedAt time.Time         `json:"updated_at"`
	Metadata  map[string]string `json:"metadata,omitempty"`
}

// JobHandler is a function that processes a job. Returns an error to trigger retry.
type JobHandler func(ctx context.Context, job *Job) error

// RetryPolicy defines how retries should be performed.
type RetryPolicy struct {
	MaxRetries     int           // Maximum number of retry attempts
	InitialDelay   time.Duration // Initial delay before first retry
	MaxDelay       time.Duration // Maximum delay between retries
	BackoffFactor  float64       // Multiplier for exponential backoff
	JitterPercent  int           // Percentage of jitter to add (0-100)
}

// DefaultRetryPolicy returns a sensible default retry policy.
func DefaultRetryPolicy() RetryPolicy {
	return RetryPolicy{
		MaxRetries:    5,
		InitialDelay:  1 * time.Second,
		MaxDelay:      60 * time.Second,
		BackoffFactor: 2.0,
		JitterPercent: 10,
	}
}

// calculateDelay returns the delay for a given attempt using exponential backoff.
func (rp RetryPolicy) calculateDelay(attempt int) time.Duration {
	delay := float64(rp.InitialDelay) * math.Pow(rp.BackoffFactor, float64(attempt-1))
	if delay > float64(rp.MaxDelay) {
		delay = float64(rp.MaxDelay)
	}
	return time.Duration(delay)
}

// JobQueue manages asynchronous job processing with retry logic.
type JobQueue struct {
	nc          *nats.Conn
	js          nats.JetStreamContext
	handlers    map[string]JobHandler
	retryPolicy RetryPolicy
	mu          sync.RWMutex
	streamName  string
	jobs        map[string]*Job // In-memory job tracking
	jobsMu      sync.RWMutex
	ctx         context.Context
	cancel      context.CancelFunc
}

// JobQueueConfig holds configuration for the job queue.
type JobQueueConfig struct {
	StreamName  string
	Subjects    []string
	RetryPolicy RetryPolicy
}

// NewJobQueue creates a new job queue backed by NATS JetStream.
func NewJobQueue(nc *nats.Conn, config JobQueueConfig) (*JobQueue, error) {
	js, err := nc.JetStream()
	if err != nil {
		return nil, fmt.Errorf("failed to create JetStream context: %w", err)
	}

	// Create or update the stream
	streamConfig := &nats.StreamConfig{
		Name:       config.StreamName,
		Subjects:   config.Subjects,
		Retention:  nats.WorkQueuePolicy,
		MaxAge:     24 * time.Hour, // Messages expire after 24 hours
		Storage:    nats.MemoryStorage,
		Replicas:   1,
		Discard:    nats.DiscardOld,
		MaxMsgs:    10000,
	}

	_, err = js.AddStream(streamConfig)
	if err != nil {
		// Try updating if stream already exists
		_, err = js.UpdateStream(streamConfig)
		if err != nil {
			return nil, fmt.Errorf("failed to create/update stream %s: %w", config.StreamName, err)
		}
	}

	// Create dead-letter stream for failed jobs
	dlqStreamConfig := &nats.StreamConfig{
		Name:       config.StreamName + "_DLQ",
		Subjects:   []string{config.StreamName + ".dlq.>"},
		Retention:  nats.LimitsPolicy,
		MaxAge:     72 * time.Hour,
		Storage:    nats.MemoryStorage,
		Replicas:   1,
		MaxMsgs:    5000,
	}

	_, err = js.AddStream(dlqStreamConfig)
	if err != nil {
		// Try updating if stream already exists
		js.UpdateStream(dlqStreamConfig)
	}

	ctx, cancel := context.WithCancel(context.Background())

	rp := config.RetryPolicy
	if rp.MaxRetries == 0 {
		rp = DefaultRetryPolicy()
	}

	jq := &JobQueue{
		nc:          nc,
		js:          js,
		handlers:    make(map[string]JobHandler),
		retryPolicy: rp,
		streamName:  config.StreamName,
		jobs:        make(map[string]*Job),
		ctx:         ctx,
		cancel:      cancel,
	}

	log.Printf("[JobQueue] Initialized stream=%s subjects=%v maxRetries=%d backoff=%.1fx",
		config.StreamName, config.Subjects, rp.MaxRetries, rp.BackoffFactor)

	return jq, nil
}

// RegisterHandler registers a handler function for a specific subject.
func (jq *JobQueue) RegisterHandler(subject string, handler JobHandler) {
	jq.mu.Lock()
	defer jq.mu.Unlock()
	jq.handlers[subject] = handler
	log.Printf("[JobQueue] Registered handler for subject=%s", subject)
}

// Publish publishes a new job to the queue.
func (jq *JobQueue) Publish(subject string, payload interface{}) (*Job, error) {
	data, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal payload: %w", err)
	}

	job := &Job{
		ID:        fmt.Sprintf("%s-%d", subject, time.Now().UnixNano()),
		Subject:   subject,
		Payload:   data,
		Status:    JobStatusPending,
		Attempt:   0,
		MaxRetry:  jq.retryPolicy.MaxRetries,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
		Metadata:  map[string]string{},
	}

	envelope, err := json.Marshal(job)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal job envelope: %w", err)
	}

	_, err = jq.js.Publish(subject, envelope)
	if err != nil {
		return nil, fmt.Errorf("failed to publish job to %s: %w", subject, err)
	}

	jq.jobsMu.Lock()
	jq.jobs[job.ID] = job
	jq.jobsMu.Unlock()

	log.Printf("[JobQueue] Published job id=%s subject=%s", job.ID, subject)
	return job, nil
}

// Subscribe starts consuming messages from a subject with retry logic.
func (jq *JobQueue) Subscribe(subject string) error {
	jq.mu.RLock()
	handler, ok := jq.handlers[subject]
	jq.mu.RUnlock()

	if !ok {
		return fmt.Errorf("no handler registered for subject=%s", subject)
	}

	consumerName := jq.streamName + "_" + subject + "_consumer"

	// Create a durable consumer with manual ack
	sub, err := jq.js.Subscribe(subject, func(msg *nats.Msg) {
		jq.processMessage(msg, handler)
	}, nats.Durable(consumerName),
		nats.ManualAck(),
		nats.AckWait(30*time.Second),
		nats.MaxDeliver(jq.retryPolicy.MaxRetries+1),
	)
	if err != nil {
		return fmt.Errorf("failed to subscribe to %s: %w", subject, err)
	}

	log.Printf("[JobQueue] Subscribed to subject=%s consumer=%s", subject, consumerName)
	_ = sub
	return nil
}

// processMessage handles an incoming message with retry logic.
func (jq *JobQueue) processMessage(msg *nats.Msg, handler JobHandler) {
	var job Job
	if err := json.Unmarshal(msg.Data, &job); err != nil {
		log.Printf("[JobQueue] ERROR: Failed to unmarshal job: %v", err)
		msg.Ack() // Ack malformed messages to prevent infinite retry
		return
	}

	job.Attempt++
	job.Status = JobStatusRunning
	job.UpdatedAt = time.Now()

	jq.jobsMu.Lock()
	jq.jobs[job.ID] = &job
	jq.jobsMu.Unlock()

	log.Printf("[JobQueue] Processing job id=%s subject=%s attempt=%d/%d",
		job.ID, job.Subject, job.Attempt, job.MaxRetry+1)

	// Execute the handler with a timeout context
	ctx, cancel := context.WithTimeout(jq.ctx, 25*time.Second)
	defer cancel()

	err := handler(ctx, &job)

	if err == nil {
		// Success
		job.Status = JobStatusCompleted
		job.UpdatedAt = time.Now()
		msg.Ack()

		jq.jobsMu.Lock()
		jq.jobs[job.ID] = &job
		jq.jobsMu.Unlock()

		log.Printf("[JobQueue] ✅ Job completed id=%s subject=%s attempt=%d",
			job.ID, job.Subject, job.Attempt)
		return
	}

	// Failure
	job.Error = err.Error()
	job.UpdatedAt = time.Now()

	if job.Attempt >= job.MaxRetry+1 {
		// Max retries exceeded — move to dead-letter queue
		job.Status = JobStatusDead
		jq.moveToDLQ(&job)
		msg.Ack() // Ack so it doesn't retry again in JetStream

		jq.jobsMu.Lock()
		jq.jobs[job.ID] = &job
		jq.jobsMu.Unlock()

		log.Printf("[JobQueue] ☠️ Job moved to DLQ id=%s subject=%s error=%s attempts=%d",
			job.ID, job.Subject, job.Error, job.Attempt)
		return
	}

	// Schedule retry with exponential backoff
	job.Status = JobStatusRetrying
	delay := jq.retryPolicy.calculateDelay(job.Attempt)

	jq.jobsMu.Lock()
	jq.jobs[job.ID] = &job
	jq.jobsMu.Unlock()

	log.Printf("[JobQueue] 🔄 Job retry scheduled id=%s subject=%s attempt=%d delay=%v error=%s",
		job.ID, job.Subject, job.Attempt, delay, job.Error)

	// NAK with delay tells JetStream to redeliver after the delay
	msg.NakWithDelay(delay)
}

// moveToDLQ publishes a failed job to the dead-letter queue.
func (jq *JobQueue) moveToDLQ(job *Job) {
	dlqSubject := jq.streamName + ".dlq." + job.Subject
	data, err := json.Marshal(job)
	if err != nil {
		log.Printf("[JobQueue] ERROR: Failed to marshal DLQ job: %v", err)
		return
	}
	_, err = jq.js.Publish(dlqSubject, data)
	if err != nil {
		log.Printf("[JobQueue] ERROR: Failed to publish to DLQ: %v", err)
	}
}

// GetJobStatus returns the current status of a job by ID.
func (jq *JobQueue) GetJobStatus(jobID string) (*Job, error) {
	jq.jobsMu.RLock()
	defer jq.jobsMu.RUnlock()

	job, ok := jq.jobs[jobID]
	if !ok {
		return nil, fmt.Errorf("job not found: %s", jobID)
	}
	return job, nil
}

// GetStats returns queue statistics.
func (jq *JobQueue) GetStats() map[string]int {
	jq.jobsMu.RLock()
	defer jq.jobsMu.RUnlock()

	stats := map[string]int{
		"total":     len(jq.jobs),
		"pending":   0,
		"running":   0,
		"completed": 0,
		"failed":    0,
		"retrying":  0,
		"dead":      0,
	}

	for _, job := range jq.jobs {
		switch job.Status {
		case JobStatusPending:
			stats["pending"]++
		case JobStatusRunning:
			stats["running"]++
		case JobStatusCompleted:
			stats["completed"]++
		case JobStatusFailed:
			stats["failed"]++
		case JobStatusRetrying:
			stats["retrying"]++
		case JobStatusDead:
			stats["dead"]++
		}
	}

	return stats
}

// Shutdown gracefully shuts down the job queue.
func (jq *JobQueue) Shutdown() {
	jq.cancel()
	log.Printf("[JobQueue] Shutdown complete for stream=%s", jq.streamName)
}
